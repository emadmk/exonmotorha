import { Response } from 'express';
import { Notification } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Get user's notifications
 */
export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const query: any = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('relatedOrderId', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اعلان‌ها',
    });
  }
};

/**
 * Get unread count
 */
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const count = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تعداد اعلان‌ها',
    });
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'اعلان یافت نشد',
      });
      return;
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در علامت‌گذاری اعلان',
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'همه اعلان‌ها خوانده شدند',
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در علامت‌گذاری اعلان‌ها',
    });
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notificationId } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      res.status(404).json({
        success: false,
        message: 'اعلان یافت نشد',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'اعلان حذف شد',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف اعلان',
    });
  }
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    await Notification.deleteMany({ userId });

    res.status(200).json({
      success: true,
      message: 'همه اعلان‌ها حذف شدند',
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف اعلان‌ها',
    });
  }
};
