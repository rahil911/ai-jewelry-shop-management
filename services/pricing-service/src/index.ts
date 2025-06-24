import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';
import { createDatabasePool, createRedisClient, checkDatabaseHealth, checkRedisHealth } from '@jewelry-shop/shared';
import { goldRateRoutes } from './routes/goldRates';
import { makingChargesRoutes } from './routes/makingCharges';
import { pricingRoutes } from './routes/pricing';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { GoldRateService } from './services/GoldRateService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Initialize database and Redis connections
const db = createDatabasePool();
const redis = createRedisClient();

// Connect to Redis
redis.connect().catch(console.error);

// Initialize services
const goldRateService = new GoldRateService(db, redis);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for pricing service as it's frequently accessed
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth(db);
  const redisHealth = await checkRedisHealth(redis);
  
  const health = {
    service: 'pricing-service',
    status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealth ? 'connected' : 'disconnected',
    redis: redisHealth ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    lastGoldRateUpdate: await goldRateService.getLastUpdateTime()
  };
  
  res.status(dbHealth && redisHealth ? 200 : 503).json(health);
});

// Make services available to routes
app.locals.db = db;
app.locals.redis = redis;
app.locals.goldRateService = goldRateService;

// Routes
app.use('/api/gold-rates', goldRateRoutes);
app.use('/api/making-charges', makingChargesRoutes);
app.use('/api/pricing', pricingRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `${req.method} ${req.originalUrl} not found`
  });
});

// Schedule gold rate updates every 5 minutes during business hours (9 AM to 6 PM IST)
cron.schedule('*/5 9-18 * * 1-6', async () => {
  try {
    logger.info('Starting scheduled gold rate update');
    await goldRateService.updateGoldRates();
    logger.info('Scheduled gold rate update completed');
  } catch (error) {
    logger.error('Scheduled gold rate update failed:', error);
  }
});

// Update gold rates on service startup
goldRateService.updateGoldRates().catch((error) => {
  logger.error('Initial gold rate update failed:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await db.end();
    await redis.quit();
    logger.info('Connections closed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

app.listen(PORT, () => {
  logger.info(`Pricing Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Gold rate updates scheduled every 5 minutes during business hours');
});

export default app;