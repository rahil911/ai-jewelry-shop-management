import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { OrderStatus, OrderType, RepairStatus, RepairType, ReturnStatus, ReturnType, NotificationType, NotificationChannel } from '@jewelry-shop/shared';
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

// Repair validation schemas
const createRepairSchema = Joi.object({
  order_id: Joi.number().integer().positive().required(),
  item_description: Joi.string().required(),
  problem_description: Joi.string().required(),
  repair_type: Joi.string().valid(...Object.values(RepairType)).required(),
  estimated_cost: Joi.number().min(0).required(),
  estimated_completion: Joi.date().iso().optional(),
  customer_approval_required: Joi.boolean().default(false),
  technician_id: Joi.number().integer().positive().optional()
});

const updateRepairSchema = Joi.object({
  repair_type: Joi.string().valid(...Object.values(RepairType)).optional(),
  estimated_cost: Joi.number().min(0).optional(),
  estimated_completion: Joi.date().iso().optional(),
  actual_cost: Joi.number().min(0).optional(),
  repair_notes: Joi.string().allow('', null).optional(),
  customer_approved: Joi.boolean().optional(),
  technician_id: Joi.number().integer().positive().optional()
});

const repairStatusUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(RepairStatus)).required(),
  notes: Joi.string().allow('', null).optional()
});

// Return validation schemas
const returnItemSchema = Joi.object({
  order_item_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  reason: Joi.string().optional()
});

const exchangeItemSchema = Joi.object({
  jewelry_item_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  unit_price: Joi.number().positive().required()
});

const createReturnSchema = Joi.object({
  order_id: Joi.number().integer().positive().required(),
  return_type: Joi.string().valid(...Object.values(ReturnType)).required(),
  reason: Joi.string().required(),
  reason_details: Joi.string().allow('', null).optional(),
  items_to_return: Joi.array().items(returnItemSchema).min(1).required(),
  exchange_items: Joi.array().items(exchangeItemSchema).optional()
});

const returnStatusUpdateSchema = Joi.object({
  status: Joi.string().valid(...Object.values(ReturnStatus)).required(),
  notes: Joi.string().allow('', null).optional()
});

// Notification validation schemas
const notificationRequestSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  order_id: Joi.number().integer().positive().optional(),
  message: Joi.string().required(),
  channels: Joi.array().items(Joi.string().valid(...Object.values(NotificationChannel))).min(1).required()
});

// Repair validation middleware
export const validateRepairCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = createRepairSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Repair creation validation failed:', errorMessages);
    
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

export const validateRepairUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = updateRepairSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Repair update validation failed:', errorMessages);
    
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

export const validateRepairStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = repairStatusUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Repair status update validation failed:', errorMessages);
    
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

// Return validation middleware
export const validateReturnCreation = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = createReturnSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Return creation validation failed:', errorMessages);
    
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

export const validateReturnStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = returnStatusUpdateSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Return status update validation failed:', errorMessages);
    
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

// Notification validation middleware
export const validateNotificationRequest = (req: Request, res: Response, next: NextFunction): void => {
  const { error, value } = notificationRequestSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    logger.warn('Notification request validation failed:', errorMessages);
    
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