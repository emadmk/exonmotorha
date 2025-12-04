import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import vehicleRoutes from './vehicle.routes';
import orderRoutes from './order.routes';
import messageRoutes from './message.routes';
import receiptRoutes from './receipt.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import activityLogRoutes from './activityLog.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/orders', orderRoutes);
router.use('/messages', messageRoutes);
router.use('/receipts', receiptRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/activity-logs', activityLogRoutes);

export default router;
