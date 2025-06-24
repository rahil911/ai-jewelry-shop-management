import { Router } from 'express';
import { authMiddleware, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { UserController } from '../controllers/UserController';
import { userUpdateSchema } from '@jewelry-shop/shared';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authMiddleware);

// Get all users (admin/manager only)
router.get('/', authorize(['owner', 'manager']), userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user (admin/manager only, or own profile)
router.put('/:id', validateRequest(userUpdateSchema), userController.updateUser);

// Deactivate user (admin/manager only)
router.delete('/:id', authorize(['owner', 'manager']), userController.deactivateUser);

// Get user's customers (staff and above)
router.get('/:id/customers', authorize(['owner', 'manager', 'staff']), userController.getUserCustomers);

export { router as userRoutes };