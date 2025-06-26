import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import { createClient } from 'redis';
import { errorHandler } from './middleware/errorHandler';
import { validateAuth } from './middleware/auth';
import { initializeOrderRoutes } from './routes/orders';
import { initializeRepairRoutes } from './routes/repairs';
import { initializeReturnRoutes } from './routes/returns';
import { initializeNotificationRoutes } from './routes/notifications';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3004;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection with graceful fallback
export const db = process.env.DATABASE_URL 
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : {
      query: () => Promise.resolve({ rows: [] }),
      end: () => Promise.resolve()
    } as any;

// Redis connection with graceful fallback
export const redis = process.env.REDIS_URL 
  ? createClient({ url: process.env.REDIS_URL })
  : {
      ping: () => Promise.resolve('PONG'),
      quit: () => Promise.resolve(),
      on: () => {},
      connect: () => Promise.resolve()
    } as any;

// Connect to Redis only if configured
if (process.env.REDIS_URL) {
  redis.on('error', (err: any) => logger.error('Redis Client Error', err));
  redis.connect().catch(() => logger.warn('Redis connection failed, using fallback'));
} else {
  logger.info('Redis not configured, using fallback implementation');
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    let dbStatus = 'fallback';
    let redisStatus = 'fallback';
    
    // Check database connection
    if (process.env.DATABASE_URL) {
      try {
        await db.query('SELECT 1');
        dbStatus = 'connected';
      } catch (error) {
        dbStatus = 'error';
      }
    }
    
    // Check Redis connection
    if (process.env.REDIS_URL) {
      try {
        await redis.ping();
        redisStatus = 'connected';
      } catch (error) {
        redisStatus = 'error';
      }
    }
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'order-management',
      version: '2.0.0',
      dependencies: {
        database: dbStatus,
        redis: redisStatus
      },
      mode: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'order-management',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Authentication middleware for protected routes
app.use('/api', validateAuth);

// Routes - with explicit error handling and logging
let orderRoutes, repairRoutes, returnRoutes, notificationRoutes;

try {
  logger.info('Initializing order routes...');
  orderRoutes = initializeOrderRoutes(db);
  logger.info('✅ Order routes initialized successfully');
} catch (error) {
  logger.error('❌ Failed to initialize order routes:', error);
  throw error;
}

try {
  logger.info('Initializing repair routes...');
  repairRoutes = initializeRepairRoutes(db);
  logger.info('✅ Repair routes initialized successfully');
} catch (error) {
  logger.error('❌ Failed to initialize repair routes:', error);
  throw error;
}

try {
  logger.info('Initializing return routes...');
  returnRoutes = initializeReturnRoutes(db);
  logger.info('✅ Return routes initialized successfully');
} catch (error) {
  logger.error('❌ Failed to initialize return routes:', error);
  throw error;
}

try {
  logger.info('Initializing notification routes...');
  notificationRoutes = initializeNotificationRoutes(db);
  logger.info('✅ Notification routes initialized successfully');
} catch (error) {
  logger.error('❌ Failed to initialize notification routes:', error);
  throw error;
}

app.use('/api/orders', orderRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/notifications', notificationRoutes);

logger.info('🚀 All routes registered successfully');

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  await db.end();
  
  // Close Redis connection
  await redis.quit();
  
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Order Management Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  logger.info(`Redis: ${process.env.REDIS_URL ? 'Connected' : 'Not configured'}`);
});

export default app;
