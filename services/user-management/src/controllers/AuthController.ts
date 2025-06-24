import { Request, Response } from 'express';

// Extend Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  verifyToken,
  generateId,
  createApiResponse,
  ServiceError,
  queries
} from '@jewelry-shop/shared';
import { logger } from '../utils/logger';
import { generateOTP, sendOTPEmail, sendOTPSMS } from '../services/otpService';

export class AuthController {
  async register(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    const redis: RedisClientType = req.app.locals.redis;
    
    try {
      const { email, password, firstName, lastName, phone, role, preferredLanguage } = req.body;
      
      // Check if user already exists
      const existingUser = await db.query(queries.findUserByEmail, [email]);
      if (existingUser.rows.length > 0) {
        throw new ServiceError('User already exists with this email', 'USER_EXISTS', 409);
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Create user
      const userResult = await db.query(queries.createUser, [
        email,
        passwordHash,
        firstName,
        lastName,
        role || 'customer',
        preferredLanguage || 'en',
        phone
      ]);
      
      const user = userResult.rows[0];
      
      // If customer, create customer record
      if (user.role === 'customer') {
        await db.query(
          'INSERT INTO customers (user_id) VALUES ($1)',
          [user.id]
        );
      }
      
      // Generate tokens
      const accessToken = generateToken({ userId: user.id, role: user.role }, '24h');
      const refreshToken = generateToken({ userId: user.id, type: 'refresh' }, '7d');
      
      // Store refresh token in Redis
      await redis.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);
      
      // Remove password hash from response
      delete user.password_hash;
      
      logger.info(`User registered successfully: ${email}`);
      
      res.status(201).json(createApiResponse(true, {
        user,
        accessToken,
        refreshToken
      }, 'User registered successfully'));
      
    } catch (error) {
      logger.error('Registration error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async login(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    const redis: RedisClientType = req.app.locals.redis;
    
    try {
      const { email, password } = req.body;
      
      // Find user
      const userResult = await db.query(queries.findUserByEmail, [email]);
      if (userResult.rows.length === 0) {
        throw new ServiceError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
      }
      
      const user = userResult.rows[0];
      
      // Verify password
      const isValidPassword = await comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new ServiceError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
      }
      
      // Update last login
      await db.query(queries.updateUserLastLogin, [user.id]);
      
      // Generate tokens
      const accessToken = generateToken({ userId: user.id, role: user.role }, '24h');
      const refreshToken = generateToken({ userId: user.id, type: 'refresh' }, '7d');
      
      // Store refresh token in Redis
      await redis.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, refreshToken);
      
      // Remove password hash from response
      delete user.password_hash;
      
      logger.info(`User logged in successfully: ${email}`);
      
      res.json(createApiResponse(true, {
        user,
        accessToken,
        refreshToken
      }, 'Login successful'));
      
    } catch (error) {
      logger.error('Login error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async logout(req: Request, res: Response) {
    const redis: RedisClientType = req.app.locals.redis;
    
    try {
      const refreshToken = req.body.refreshToken;
      
      if (refreshToken) {
        try {
          const decoded = verifyToken(refreshToken);
          await redis.del(`refresh_token:${decoded.userId}`);
        } catch (error) {
          // Invalid token, but still logout
        }
      }
      
      res.json(createApiResponse(true, undefined, 'Logout successful'));
      
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async refreshToken(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    const redis: RedisClientType = req.app.locals.redis;
    
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ServiceError('Refresh token required', 'TOKEN_REQUIRED', 401);
      }
      
      // Verify refresh token
      const decoded = verifyToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new ServiceError('Invalid token type', 'INVALID_TOKEN', 401);
      }
      
      // Check if token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        throw new ServiceError('Invalid refresh token', 'INVALID_TOKEN', 401);
      }
      
      // Get user
      const userResult = await db.query(queries.findUserById, [decoded.userId]);
      if (userResult.rows.length === 0) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      const user = userResult.rows[0];
      
      // Generate new tokens
      const newAccessToken = generateToken({ userId: user.id, role: user.role }, '24h');
      const newRefreshToken = generateToken({ userId: user.id, type: 'refresh' }, '7d');
      
      // Update refresh token in Redis
      await redis.setEx(`refresh_token:${user.id}`, 7 * 24 * 60 * 60, newRefreshToken);
      
      res.json(createApiResponse(true, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }, 'Token refreshed successfully'));
      
    } catch (error) {
      logger.error('Token refresh error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async getMe(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const userId = req.user?.userId;
      
      const userResult = await db.query(queries.findUserById, [userId]);
      if (userResult.rows.length === 0) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      const user = userResult.rows[0];
      delete user.password_hash;
      
      res.json(createApiResponse(true, user));
      
    } catch (error) {
      logger.error('Get user error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async updateProfile(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const userId = req.user?.userId;
      const { firstName, lastName, phone, preferredLanguage, address } = req.body;
      
      const updateResult = await db.query(
        `UPDATE users SET 
         first_name = COALESCE($1, first_name),
         last_name = COALESCE($2, last_name),
         phone = COALESCE($3, phone),
         preferred_language = COALESCE($4, preferred_language),
         address = COALESCE($5, address),
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $6
         RETURNING *`,
        [firstName, lastName, phone, preferredLanguage, address, userId]
      );
      
      if (updateResult.rows.length === 0) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      const user = updateResult.rows[0];
      delete user.password_hash;
      
      logger.info(`User profile updated: ${user.email}`);
      
      res.json(createApiResponse(true, user, 'Profile updated successfully'));
      
    } catch (error) {
      logger.error('Update profile error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async changePassword(req: Request, res: Response) {
    const db: Pool = req.app.locals.db;
    
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;
      
      // Get current user
      const userResult = await db.query(queries.findUserById, [userId]);
      if (userResult.rows.length === 0) {
        throw new ServiceError('User not found', 'USER_NOT_FOUND', 404);
      }
      
      const user = userResult.rows[0];
      
      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password_hash);
      if (!isValidPassword) {
        throw new ServiceError('Current password is incorrect', 'INVALID_PASSWORD', 401);
      }
      
      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);
      
      // Update password
      await db.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, userId]
      );
      
      logger.info(`Password changed for user: ${user.email}`);
      
      res.json(createApiResponse(true, undefined, 'Password changed successfully'));
      
    } catch (error) {
      logger.error('Change password error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async sendOTP(req: Request, res: Response) {
    const redis: RedisClientType = req.app.locals.redis;
    
    try {
      const { email, phone, type } = req.body; // type: 'email' | 'sms'
      
      if (!email && !phone) {
        throw new ServiceError('Email or phone number required', 'CONTACT_REQUIRED', 400);
      }
      
      const otp = generateOTP();
      const otpKey = `otp:${email || phone}`;
      
      // Store OTP in Redis with 5 minutes expiry
      await redis.setEx(otpKey, 5 * 60, otp);
      
      // Send OTP
      if (type === 'email' && email) {
        await sendOTPEmail(email, otp);
      } else if (type === 'sms' && phone) {
        await sendOTPSMS(phone, otp);
      } else {
        throw new ServiceError('Invalid OTP type or missing contact info', 'INVALID_OTP_TYPE', 400);
      }
      
      logger.info(`OTP sent via ${type} to ${email || phone}`);
      
      res.json(createApiResponse(true, undefined, 'OTP sent successfully'));
      
    } catch (error) {
      logger.error('Send OTP error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async verifyOTP(req: Request, res: Response) {
    const redis: RedisClientType = req.app.locals.redis;
    
    try {
      const { email, phone, otp } = req.body;
      
      if (!email && !phone) {
        throw new ServiceError('Email or phone number required', 'CONTACT_REQUIRED', 400);
      }
      
      const otpKey = `otp:${email || phone}`;
      const storedOTP = await redis.get(otpKey);
      
      if (!storedOTP) {
        throw new ServiceError('OTP expired or not found', 'OTP_EXPIRED', 400);
      }
      
      if (storedOTP !== otp) {
        throw new ServiceError('Invalid OTP', 'INVALID_OTP', 400);
      }
      
      // Delete OTP after successful verification
      await redis.del(otpKey);
      
      logger.info(`OTP verified successfully for ${email || phone}`);
      
      res.json(createApiResponse(true, undefined, 'OTP verified successfully'));
      
    } catch (error) {
      logger.error('Verify OTP error:', error);
      
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json(createApiResponse(false, undefined, undefined, error.message));
      }
      
      res.status(500).json(createApiResponse(false, undefined, undefined, 'Internal server error'));
    }
  }
  
  async forgotPassword(req: Request, res: Response) {
    // TODO: Implement forgot password functionality
    res.status(501).json(createApiResponse(false, undefined, undefined, 'Not implemented yet'));
  }
  
  async resetPassword(req: Request, res: Response) {
    // TODO: Implement reset password functionality
    res.status(501).json(createApiResponse(false, undefined, undefined, 'Not implemented yet'));
  }
}