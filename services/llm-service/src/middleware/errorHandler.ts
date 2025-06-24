import { Request, Response, NextFunction } from 'express';
import { ServiceError, createApiResponse } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (error instanceof ServiceError) {
    res.status(error.statusCode).json(
      createApiResponse(false, null, null, error.message)
    );
    return;
  }

  // AI service specific errors
  if (error.message.includes('API key')) {
    res.status(401).json(
      createApiResponse(false, null, null, 'AI service authentication failed')
    );
    return;
  }

  if (error.message.includes('rate limit')) {
    res.status(429).json(
      createApiResponse(false, null, null, 'AI service rate limit exceeded')
    );
    return;
  }

  if (error.message.includes('quota')) {
    res.status(403).json(
      createApiResponse(false, null, null, 'AI service quota exceeded')
    );
    return;
  }

  // Default error response
  res.status(500).json(
    createApiResponse(false, null, null, 'Internal server error')
  );
};