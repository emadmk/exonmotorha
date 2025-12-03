import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadImage } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users/profile - Get user profile
router.get('/profile', userController.getProfile);

// PUT /api/users/profile - Update user profile
router.put('/profile', userController.updateProfile);

// POST /api/users/avatar - Upload user avatar
router.post('/avatar', uploadLimiter, uploadImage.single('avatar'), userController.uploadAvatar);

// GET /api/users/settings - Get user settings
router.get('/settings', userController.getSettings);

// PUT /api/users/settings - Update user settings
router.put('/settings', userController.updateSettings);

// Admin routes
// GET /api/users - Get all users (Admin only)
router.get('/', authorize('admin'), userController.getAllUsers);

// PUT /api/users/:userId/role - Update user role (Admin only)
router.put('/:userId/role', authorize('admin'), userController.updateUserRole);

export default router;
