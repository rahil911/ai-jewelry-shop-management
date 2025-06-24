import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { OrderStatus, OrderType } from '@jewelry-shop/shared/types';
import { logger } from '../utils/logger';

// Validation schemas
const orderItemSchema = Joi.object({
  jewelry_item_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  unit_price: Joi.number().positive().required(),
  customization_details: Joi.string().allow('', null)
});

const createOrderSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  staff_id: Joi.number().integer().positive().optional(), // Will be set from auth
  order_type: Joi.string().valid(...Object.values(OrderType)).default(OrderType.SALE),
  items: Joi.array().items(orderItemSchema).min(1).required(),
  special_instructions: Joi.string().allow('', null),
  estimated_completion: Joi.date().iso().optional()
});

const updateOrderSchema = Joi.object({
  special_instructions: Joi.string().allow('', null),
  estimated_completion: Joi.date().iso().optional()
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(OrderStatus)).required(),
  notes: Joi.string().allow('', null)
});

const customizationSchema = Joi.object({
  order_item_id: Joi.number().integer().positive().required(),
  customization_type: Joi.string().required(),
  details: Joi.string().required(),
  additional_cost: Joi.number().min(0).default(0)
});

// Validation middleware functions
export const validateOrderCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = createOrderSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Order creation validation failed:', errorMessages);
    
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
    return;
  }
  
  req.body = value;
  next();
};

export const validateOrderUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = updateOrderSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Order update validation failed:', errorMessages);
    
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
    return;
  }
  
  req.body = value;
  next();
};

export const validateStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = statusUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Status update validation failed:', errorMessages);
    
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
    return;
  }
  
  req.body = value;
  next();
};

export const validateCustomization = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = customizationSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Customization validation failed:', errorMessages);
    
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
    return;
  }
  
  req.body = value;
  next();
};

// Generic validation middleware creator
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      logger.warn('Validation failed:', errorMessages);
      
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
      return;
    }
    
    req.body = value;
    next();
  };
};

// Query parameter validation
export const validateQueryParams = (req: Request, res: Response, next: NextFunction): void => {
  const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid(...Object.values(OrderStatus)).optional(),
    customer_id: Joi.number().integer().positive().optional(),
    staff_id: Joi.number().integer().positive().optional(),
    order_type: Joi.string().valid(...Object.values(OrderType)).optional(),
    date_from: Joi.date().iso().optional(),
    date_to: Joi.date().iso().optional(),
    search: Joi.string().optional()
  });

  const { error, value } = querySchema.validate(req.query, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Query parameter validation failed:', errorMessages);
    
    res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: errorMessages
    });
    return;
  }
  
  req.query = value;
  next();
};