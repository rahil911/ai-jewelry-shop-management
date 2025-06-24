import { Request, Response, NextFunction } from 'express';
import { createApiResponse } from '@jewelry-shop/shared';
import Joi from 'joi';

export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type
      }));

      return res.status(400).json(createApiResponse(
        false, 
        null, 
        null, 
        'Validation failed',
        { errors: validationErrors }
      ));
    }

    // Replace the original property with the validated value
    req[property] = value;
    next();
  };
};