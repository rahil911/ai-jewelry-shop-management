import { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle validation errors
  if (error.code === 'VALIDATION_ERROR') {
    return res.status(400).json(createApiResponse(false, undefined, undefined, error.message));
  }

  // Handle custom service errors
  if (error.statusCode) {
    return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
  }

  // Handle database errors
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json(createApiResponse(false, undefined, undefined, 'Resource already exists'));
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json(createApiResponse(false, undefined, undefined, 'Invalid reference'));
  }

  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json(createApiResponse(false, undefined, undefined, 'Service temporarily unavailable'));
  }

  // Default error response
  res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
};