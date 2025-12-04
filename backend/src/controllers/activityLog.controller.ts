import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { activityLogService } from '../services/activityLog.service';

/**
 * Get activity logs with pagination and filters
 */
export const getActivityLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      performerRole,
      performedBy,
      action,
      search,
      startDate,
      endDate,
      targetType,
      targetId,
    } = req.query;

    const result = await activityLogService.getLogs({
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      category: category as string,
      performerRole: performerRole as string,
      performedBy: performedBy as string,
      action: action as string,
      search: search as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      targetType: targetType as string,
      targetId: targetId as string,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error getting activity logs:', error);
    res.status(500).json({ message: 'خطا در دریافت لاگ‌ها' });
  }
};

/**
 * Get activity statistics
 */
export const getActivityStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await activityLogService.getStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(stats);
  } catch (error: any) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({ message: 'خطا در دریافت آمار' });
  }
};
