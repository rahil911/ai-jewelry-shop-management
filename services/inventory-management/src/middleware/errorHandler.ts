import { Request, Response, NextFunction } from 'express';
import { ServiceError, createApiResponse } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Error in Inventory Management Service:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle custom ServiceError
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json(
      createApiResponse(false, undefined, null, error.message)
    );
  }

  // Handle database errors
  if (error.name === 'QueryError' || error.code) {
    switch (error.code) {
      case '23505': // Unique constraint violation
        return res.status(409).json(
          createApiResponse(false, undefined, null, 'Duplicate entry found')
        );
      case '23503': // Foreign key constraint violation
        return res.status(400).json(
          createApiResponse(false, undefined, null, 'Invalid reference - related record not found')
        );
      case '23502': // Not null constraint violation
        return res.status(400).json(
          createApiResponse(false, undefined, null, 'Required field is missing')
        );
      case '42P01': // Undefined table
        return res.status(500).json(
          createApiResponse(false, undefined, null, 'Database configuration error')
        );
      default:
        return res.status(500).json(
          createApiResponse(false, undefined, null, 'Database operation failed')
        );
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json(
      createApiResponse(false, undefined, null, error.message)
    );
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json(
      createApiResponse(false, undefined, null, 'Invalid JSON in request body')
    );
  }

  // Handle multer errors (file upload)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json(
      createApiResponse(false, undefined, null, 'File size too large')
    );
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json(
      createApiResponse(false, undefined, null, 'Too many files uploaded')
    );
  }

  // Default error response
  return res.status(500).json(
    createApiResponse(false, undefined, null, 'Internal server error occurred')
  );
};