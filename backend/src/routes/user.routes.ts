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
// GET /api/users/admin/all - Get all users (Admin only)
router.get('/admin/all', authorize('admin'), userController.getAllUsers);

// GET /api/users/admin/:userId - Get single user (Admin only)
router.get('/admin/:userId', authorize('admin'), userController.getUser);

// PUT /api/users/admin/:userId - Update user (Admin only)
router.put('/admin/:userId', authorize('admin'), userController.updateUser);

// PUT /api/users/admin/:userId/role - Update user role (Admin only)
router.put('/admin/:userId/role', authorize('admin'), userController.updateUserRole);

// PUT /api/users/admin/:userId/block - Block user (Admin only)
router.put('/admin/:userId/block', authorize('admin'), userController.blockUser);

// PUT /api/users/admin/:userId/unblock - Unblock user (Admin only)
router.put('/admin/:userId/unblock', authorize('admin'), userController.unblockUser);

// DELETE /api/users/admin/:userId - Delete user (Admin only)
router.delete('/admin/:userId', authorize('admin'), userController.deleteUser);

// Legacy routes (kept for backwards compatibility)
// GET /api/users - Get all users (Admin only)
router.get('/', authorize('admin'), userController.getAllUsers);

// PUT /api/users/:userId/role - Update user role (Admin only)
router.put('/:userId/role', authorize('admin'), userController.updateUserRole);

export default router;
