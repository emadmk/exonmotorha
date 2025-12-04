import { ActivityLog, IActivityLog } from '../models/ActivityLog';
import mongoose from 'mongoose';

interface LogActivityParams {
  action: string;
  category: IActivityLog['category'];
  description: string;
  performedBy: string | mongoose.Types.ObjectId;
  performerRole: IActivityLog['performerRole'];
  performerName: string;
  targetType?: IActivityLog['targetType'];
  targetId?: string | mongoose.Types.ObjectId;
  targetRef?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

class ActivityLogService {
  /**
   * Log an activity
   */
  async log(params: LogActivityParams): Promise<void> {
    try {
      await ActivityLog.create({
        action: params.action,
        category: params.category,
        description: params.description,
        performedBy: params.performedBy,
        performerRole: params.performerRole,
        performerName: params.performerName,
        targetType: params.targetType,
        targetId: params.targetId,
        targetRef: params.targetRef,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get activity logs with pagination and filters
   */
  async getLogs(params: {
    page?: number;
    limit?: number;
    category?: string;
    performerRole?: string;
    performedBy?: string;
    action?: string;
    search?: string;
    startDate?: Date;
    endDate?: Date;
    targetType?: string;
    targetId?: string;
  }) {
    const {
      page = 1,
      limit = 20,
      category,
      performerRole,
      performedBy,
      action,
      search,
      startDate,
      endDate,
      targetType,
      targetId,
    } = params;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (performerRole) {
      query.performerRole = performerRole;
    }

    if (performedBy) {
      query.performedBy = performedBy;
    }

    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } },
        { performerName: { $regex: search, $options: 'i' } },
        { targetRef: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = startDate;
      }
      if (endDate) {
        query.createdAt.$lte = endDate;
      }
    }

    if (targetType) {
      query.targetType = targetType;
    }

    if (targetId) {
      query.targetId = targetId;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('performedBy', 'name phone')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get activity statistics
   */
  async getStats(startDate?: Date, endDate?: Date) {
    const match: any = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = startDate;
      if (endDate) match.createdAt.$lte = endDate;
    }

    const [byCategory, byRole, byAction, recent] = await Promise.all([
      ActivityLog.aggregate([
        { $match: match },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ActivityLog.aggregate([
        { $match: match },
        { $group: { _id: '$performerRole', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ActivityLog.aggregate([
        { $match: match },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ActivityLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);

    return {
      byCategory,
      byRole,
      topActions: byAction,
      last24Hours: recent,
    };
  }

  // Shorthand methods for common actions

  async logAuth(params: {
    action: 'login' | 'logout' | 'register' | 'otp_request' | 'otp_verify';
    userId: string;
    userName: string;
    userRole: IActivityLog['performerRole'];
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
  }) {
    const actionLabels = {
      login: 'ورود به سیستم',
      logout: 'خروج از سیستم',
      register: 'ثبت‌نام',
      otp_request: 'درخواست کد تایید',
      otp_verify: 'تایید کد',
    };

    await this.log({
      action: params.action,
      category: 'auth',
      description: `${params.userName} - ${actionLabels[params.action]}`,
      performedBy: params.userId,
      performerRole: params.userRole,
      performerName: params.userName,
      metadata: { success: params.success },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  async logOrder(params: {
    action: 'create' | 'update' | 'cancel' | 'assign' | 'status_change' | 'edit';
    orderId: string;
    orderNumber: string;
    userId: string;
    userName: string;
    userRole: IActivityLog['performerRole'];
    description?: string;
    metadata?: Record<string, any>;
  }) {
    const actionLabels = {
      create: 'ایجاد سفارش',
      update: 'بروزرسانی سفارش',
      cancel: 'لغو سفارش',
      assign: 'اختصاص تکنسین',
      status_change: 'تغییر وضعیت',
      edit: 'ویرایش سفارش',
    };

    await this.log({
      action: `order_${params.action}`,
      category: 'order',
      description: params.description || `${actionLabels[params.action]} ${params.orderNumber}`,
      performedBy: params.userId,
      performerRole: params.userRole,
      performerName: params.userName,
      targetType: 'order',
      targetId: params.orderId,
      targetRef: params.orderNumber,
      metadata: params.metadata,
    });
  }

  async logReceipt(params: {
    action: 'create' | 'update' | 'delete';
    receiptId: string;
    receiptNumber: string;
    orderId: string;
    userId: string;
    userName: string;
    userRole: IActivityLog['performerRole'];
    metadata?: Record<string, any>;
  }) {
    const actionLabels = {
      create: 'ایجاد فاکتور',
      update: 'بروزرسانی فاکتور',
      delete: 'حذف فاکتور',
    };

    await this.log({
      action: `receipt_${params.action}`,
      category: 'receipt',
      description: `${actionLabels[params.action]} ${params.receiptNumber}`,
      performedBy: params.userId,
      performerRole: params.userRole,
      performerName: params.userName,
      targetType: 'receipt',
      targetId: params.receiptId,
      targetRef: params.receiptNumber,
      metadata: params.metadata,
    });
  }

  async logMessage(params: {
    orderId: string;
    orderNumber: string;
    userId: string;
    userName: string;
    userRole: IActivityLog['performerRole'];
  }) {
    await this.log({
      action: 'message_send',
      category: 'message',
      description: `ارسال پیام در سفارش ${params.orderNumber}`,
      performedBy: params.userId,
      performerRole: params.userRole,
      performerName: params.userName,
      targetType: 'order',
      targetId: params.orderId,
      targetRef: params.orderNumber,
    });
  }

  async logUser(params: {
    action: 'create' | 'update' | 'delete' | 'role_change';
    targetUserId: string;
    targetUserName: string;
    userId: string;
    userName: string;
    userRole: IActivityLog['performerRole'];
    metadata?: Record<string, any>;
  }) {
    const actionLabels = {
      create: 'ایجاد کاربر',
      update: 'بروزرسانی کاربر',
      delete: 'حذف کاربر',
      role_change: 'تغییر نقش کاربر',
    };

    await this.log({
      action: `user_${params.action}`,
      category: 'user',
      description: `${actionLabels[params.action]}: ${params.targetUserName}`,
      performedBy: params.userId,
      performerRole: params.userRole,
      performerName: params.userName,
      targetType: 'user',
      targetId: params.targetUserId,
      targetRef: params.targetUserName,
      metadata: params.metadata,
    });
  }
}

export const activityLogService = new ActivityLogService();
