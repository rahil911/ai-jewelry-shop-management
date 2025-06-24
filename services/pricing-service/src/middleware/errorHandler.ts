import { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  logger.error('Pricing service error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle validation errors
  if (error.code === 'VALIDATION_ERROR') {
    return res.status(400).json(createApiResponse(false, null, null, error.message));
  }

  // Handle custom service errors
  if (error.statusCode) {
    return res.status(error.statusCode).json(createApiResponse(false, null, null, error.message));
  }

  // Handle external API errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return res.status(503).json(createApiResponse(false, null, null, 'External service unavailable'));
  }

  // Handle database errors
  if (error.code === '23505') {
    return res.status(409).json(createApiResponse(false, null, null, 'Resource already exists'));
  }

  if (error.code === '23503') {
    return res.status(400).json(createApiResponse(false, null, null, 'Invalid reference'));
  }

  // Default error response
  res.status(500).json(createApiResponse(false, null, null, 'Internal server error'));
};