import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { userRegistrationSchema, userLoginSchema } from '@jewelry-shop/shared';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', validateRequest(userRegistrationSchema), authController.register);
router.post('/login', validateRequest(userLoginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/otp/send', authController.sendOTP);
router.post('/otp/verify', authController.verifyOTP);

// Protected routes
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, authController.updateProfile);
router.post('/change-password', authMiddleware, authController.changePassword);

export { router as authRoutes };