import { Router } from 'express';
import * as activityLogController from '../controllers/activityLog.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/activity-logs - Get activity logs with pagination and filters
router.get('/', activityLogController.getActivityLogs);

// GET /api/activity-logs/stats - Get activity statistics
router.get('/stats', activityLogController.getActivityStats);

export default router;
