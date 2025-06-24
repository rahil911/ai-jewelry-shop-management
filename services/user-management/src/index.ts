import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createDatabasePool, createRedisClient, checkDatabaseHealth, checkRedisHealth } from '@jewelry-shop/shared';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database and Redis connections
const db = createDatabasePool();
const redis = createRedisClient();

// Connect to Redis
redis.connect().catch(console.error);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
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
    service: 'user-management',
    status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealth ? 'connected' : 'disconnected',
    redis: redisHealth ? 'connected' : 'disconnected',
    uptime: process.uptime()
  };
  
  res.status(dbHealth && redisHealth ? 200 : 503).json(health);
});

// Make db and redis available to routes
app.locals.db = db;
app.locals.redis = redis;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

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
  logger.info(`User Management Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;