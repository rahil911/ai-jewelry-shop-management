import { Request, Response, NextFunction } from 'express';
import { verifyToken, createApiResponse } from '@jewelry-shop/shared';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(createApiResponse(false, undefined, undefined, 'Access token required'));
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
      next();
    } catch (tokenError) {
      logger.warn('Invalid token:', tokenError);
      return res.status(401).json(createApiResponse(false, undefined, undefined, 'Invalid or expired token'));
    }
    
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(createApiResponse(false, undefined, undefined, 'Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(createApiResponse(false, undefined, undefined, 'Insufficient permissions'));
    }
    
    next();
  };
};