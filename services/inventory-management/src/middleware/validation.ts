import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createApiResponse } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation failed:', {
        url: req.url,
        method: req.method,
        errors: validationErrors
      });

      return res.status(400).json(
        createApiResponse(false, undefined, validationErrors, 'Validation failed')
      );
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Query validation failed:', {
        url: req.url,
        method: req.method,
        errors: validationErrors
      });

      return res.status(400).json(
        createApiResponse(false, undefined, validationErrors, 'Query validation failed')
      );
    }

    // Replace request query with validated data
    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Params validation failed:', {
        url: req.url,
        method: req.method,
        errors: validationErrors
      });

      return res.status(400).json(
        createApiResponse(false, undefined, validationErrors, 'Parameter validation failed')
      );
    }

    req.params = value;
    next();
  };
};

// Custom validation schemas for inventory-specific operations
export const stockUpdateSchema = Joi.object({
  quantity: Joi.number().min(0).required(),
  operation: Joi.string().valid('add', 'subtract', 'set').required(),
  reason: Joi.string().max(200).optional()
});

export const barcodeGenerationSchema = Joi.object({
  itemIds: Joi.array().items(Joi.string().uuid()).min(1).max(100).required()
});

export const inventoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  category: Joi.string().uuid().optional(),
  metalType: Joi.string().uuid().optional(),
  purity: Joi.string().uuid().optional(),
  isAvailable: Joi.boolean().optional(),
  lowStock: Joi.boolean().optional(),
  sortBy: Joi.string().valid('name', 'sku', 'created_at', 'selling_price', 'stock_quantity').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const categoryUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  nameHi: Joi.string().max(100).optional(),
  nameKn: Joi.string().max(100).optional(),
  description: Joi.string().max(500).optional(),
  parentId: Joi.string().uuid().allow(null).optional(),
  makingChargePercentage: Joi.number().min(0).max(100).optional(),
  sortOrder: Joi.number().integer().min(0).optional()
});

export const barcodeValidationSchema = Joi.object({
  barcode: Joi.string().pattern(/^[A-Z0-9-]{10,}$/).required()
});

export const printLabelsSchema = Joi.object({
  itemIds: Joi.array().items(Joi.string().uuid()).min(1).max(50).required(),
  format: Joi.string().valid('standard', 'small', 'large').default('standard')
});