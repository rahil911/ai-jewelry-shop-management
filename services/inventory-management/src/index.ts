import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { createDatabasePool, createRedisClient, checkDatabaseHealth, checkRedisHealth } from '@jewelry-shop/shared';
import { inventoryRoutes } from './routes/inventory';
import { categoryRoutes } from './routes/categories';
import { barcodeRoutes } from './routes/barcodes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Initialize database and Redis connections
const db = createDatabasePool();
const redis = createRedisClient();

// Connect to Redis
redis.connect().catch(console.error);

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'text/csv', 'application/vnd.ms-excel'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Higher limit for inventory operations
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
  
  // Get inventory summary
  let inventorySummary = {};
  try {
    const inventoryCount = await db.query('SELECT COUNT(*) as total FROM jewelry_items WHERE is_available = true');
    const lowStockCount = await db.query('SELECT COUNT(*) as low_stock FROM jewelry_items WHERE stock_quantity <= min_stock_level AND is_available = true');
    
    inventorySummary = {
      totalItems: parseInt(inventoryCount.rows[0].total),
      lowStockItems: parseInt(lowStockCount.rows[0].low_stock)
    };
  } catch (error) {
    inventorySummary = { error: 'Could not fetch inventory summary' };
  }
  
  const health = {
    service: 'inventory-management',
    status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealth ? 'connected' : 'disconnected',
    redis: redisHealth ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    inventory: inventorySummary
  };
  
  res.status(dbHealth && redisHealth ? 200 : 503).json(health);
});

// Make services available to routes
app.locals.db = db;
app.locals.redis = redis;
app.locals.upload = upload;

// Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/barcodes', barcodeRoutes);

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
  logger.info(`Inventory Management Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;