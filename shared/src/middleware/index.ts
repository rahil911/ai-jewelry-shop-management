import { Request, Response, NextFunction } from 'express';
import { ValidationError, createApiResponse } from '../types';
import { logger } from '../utils/logger';
import Joi from 'joi';

// Error handling middleware
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
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

  // Default error response
  return res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
};

// Validation middleware factory
export const validateRequestMiddleware = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }));

      return res.status(400).json(createApiResponse(false, undefined, undefined, 'Validation failed'));
    }

    // Replace the original property with the validated value
    req[property] = value;
    return next();
  };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  return next();
};

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  } else {
    return next();
  }
};