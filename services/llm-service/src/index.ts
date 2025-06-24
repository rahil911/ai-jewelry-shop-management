import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { createDatabasePool, createRedisClient, checkDatabaseHealth, checkRedisHealth } from '@jewelry-shop/shared';
import { chatRoutes } from './routes/chat';
import { voiceRoutes } from './routes/voice';
import { configRoutes } from './routes/config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { LLMService } from './services/LLMService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3007;

// Initialize database and Redis connections
const db = createDatabasePool();
const redis = createRedisClient();

// Connect to Redis
redis.connect().catch(console.error);

// Initialize LLM service
const llmService = new LLMService();

// Configure multer for voice file uploads
const upload = multer({
  dest: 'temp-uploads/',
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit for voice files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg'];
    cb(null, allowedTypes.includes(file.mimetype));
  }
});

// Rate limiting - more restrictive for AI service
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Lower limit for expensive AI operations
  message: 'Too many AI requests from this IP, please try again later.',
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
  
  // Check AI service availability
  let aiStatus = {};
  try {
    aiStatus = await llmService.checkModelAvailability();
  } catch (error) {
    aiStatus = { error: 'AI services unavailable' };
  }
  
  const health = {
    service: 'llm-service',
    status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: dbHealth ? 'connected' : 'disconnected',
    redis: redisHealth ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    ai_models: aiStatus
  };
  
  res.status(dbHealth && redisHealth ? 200 : 503).json(health);
});

// Make services available to routes
app.locals.db = db;
app.locals.redis = redis;
app.locals.llmService = llmService;
app.locals.upload = upload;

// Routes
app.use('/api/llm/chat', chatRoutes);
app.use('/api/llm/voice', voiceRoutes);
app.use('/api/llm/config', configRoutes);

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
  logger.info(`LLM Service running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('AI models: OpenAI GPT-4, Google Gemini available');
});

export default app;