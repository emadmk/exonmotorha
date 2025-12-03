import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user's notifications
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread - Get unread count
router.get('/unread', notificationController.getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark as read
router.put('/:notificationId/read', notificationController.markAsRead);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

// DELETE /api/notifications - Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

export default router;
