import { Response } from 'express';
import { Order, Vehicle, User, Technician, Notification, defaultTimelineSteps } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateProgress } from '../utils/helpers';
import { smsService } from '../services/sms.service';
import { orderStatuses } from '../config';
import mongoose from 'mongoose';

/**
 * Create new order
 */
export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const {
      vehicleId,
      issues,
      description,
      location,
      scheduledDate,
      scheduledTime,
    } = req.body;

    // Validation
    if (!vehicleId || !issues || !issues.length) {
      res.status(400).json({
        success: false,
        message: 'اطلاعات ناقص است',
      });
      return;
    }

    // Verify vehicle belongs to user
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId });
    if (!vehicle) {
      res.status(404).json({
        success: false,
        message: 'خودرو یافت نشد',
      });
      return;
    }

    // Create timeline with first step completed
    const timeline = defaultTimelineSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'completed' as const : 'upcoming' as const,
      completedAt: index === 0 ? new Date() : undefined,
    }));

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `CR-${String(orderCount + 1001).padStart(4, '0')}`;

    // Build order data
    const orderData: any = {
      orderNumber,
      userId,
      vehicleId,
      issues,
      description,
      timeline,
      progressPercentage: calculateProgress(timeline),
    };

    // Handle location - support both new format (object) and legacy format (string)
    if (location) {
      if (typeof location === 'object') {
        orderData.location = {
          address: location.address || '',
          coordinates: location.coordinates ? {
            lat: location.coordinates.lat,
            lng: location.coordinates.lng,
          } : undefined,
        };
      } else {
        // Legacy string format
        orderData.location = { address: location };
      }
    }

    // Optional scheduled date/time
    if (scheduledDate) {
      orderData.scheduledDate = new Date(scheduledDate);
    }
    if (scheduledTime) {
      orderData.scheduledTime = scheduledTime;
    }

    const order = await Order.create(orderData);

    // Create notification for admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: 'سفارش جدید',
        message: `سفارش جدید ${order.orderNumber} ثبت شد`,
        type: 'order_update',
        relatedOrderId: order._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'سفارش با موفقیت ثبت شد',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت سفارش',
    });
  }
};

/**
 * Get orders for current user
 */
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('vehicleId', 'brand model year plateNumber image')
        .populate('technicianId', 'name phone avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارش‌ها',
    });
  }
};

/**
 * Get single order
 */
export const getOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const query: any = { _id: orderId };

    // Customers can only see their own orders
    if (userRole === 'customer') {
      query.userId = userId;
    }

    // Technicians can only see assigned orders
    if (userRole === 'technician') {
      query.technicianId = userId;
    }

    const order = await Order.findOne(query)
      .populate('userId', 'name phone email')
      .populate('vehicleId', 'brand model year plateNumber image color')
      .populate('technicianId', 'name phone avatar');

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    // Get technician extra info if exists
    let technicianInfo = null;
    if (order.technicianId) {
      const tech = await Technician.findOne({ userId: order.technicianId._id });
      if (tech) {
        technicianInfo = {
          specialties: tech.specialties,
          rating: tech.rating,
          totalJobs: tech.totalJobs,
        };
      }
    }

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        technicianInfo,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارش',
    });
  }
};

/**
 * Get current/active order for user
 */
export const getCurrentOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const order = await Order.findOne({
      userId,
      status: { $nin: ['completed', 'cancelled'] },
    })
      .populate('vehicleId', 'brand model year plateNumber image')
      .populate('technicianId', 'name phone avatar')
      .sort({ createdAt: -1 });

    if (!order) {
      res.status(200).json({
        success: true,
        order: null,
        message: 'سفارش فعالی وجود ندارد',
      });
      return;
    }

    // Get technician extra info
    let technicianInfo = null;
    if (order.technicianId) {
      const tech = await Technician.findOne({ userId: order.technicianId._id });
      if (tech) {
        technicianInfo = {
          specialties: tech.specialties,
          rating: tech.rating,
          totalJobs: tech.totalJobs,
        };
      }
    }

    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        technicianInfo,
      },
    });
  } catch (error) {
    console.error('Get current order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارش فعال',
    });
  }
};

/**
 * Cancel order (by customer)
 */
export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: 'امکان لغو این سفارش وجود ندارد',
      });
      return;
    }

    order.status = 'cancelled';
    order.notes = reason || 'لغو توسط مشتری';
    await order.save();

    // Notify admin
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        title: 'لغو سفارش',
        message: `سفارش ${order.orderNumber} توسط مشتری لغو شد`,
        type: 'order_update',
        relatedOrderId: order._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'سفارش لغو شد',
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در لغو سفارش',
    });
  }
};

// ============ ADMIN FUNCTIONS ============

/**
 * Get all orders (Admin)
 */
export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, priority, technicianId, page = 1, limit = 20, search } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (technicianId) query.technicianId = technicianId;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name phone')
        .populate('vehicleId', 'brand model year plateNumber')
        .populate('technicianId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارش‌ها',
    });
  }
};

/**
 * Update order status (Admin)
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['planned', 'in_progress', 'waiting_for_parts', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'وضعیت نامعتبر است',
      });
      return;
    }

    const order = await Order.findById(orderId).populate('userId', 'phone');

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    order.status = status;
    if (adminNotes) order.adminNotes = adminNotes;
    if (status === 'completed') order.completedAt = new Date();

    await order.save();

    // Notify customer
    const customer = order.userId as any;
    if (customer?.phone) {
      await smsService.sendOrderUpdate(
        customer.phone,
        order.orderNumber,
        orderStatuses[status as keyof typeof orderStatuses]
      );
    }

    // Create notification
    await Notification.create({
      userId: order.userId,
      title: 'به‌روزرسانی سفارش',
      message: `وضعیت سفارش ${order.orderNumber}: ${orderStatuses[status as keyof typeof orderStatuses]}`,
      type: 'order_update',
      relatedOrderId: order._id,
    });

    res.status(200).json({
      success: true,
      message: 'وضعیت سفارش به‌روزرسانی شد',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی وضعیت',
    });
  }
};

/**
 * Assign technician to order (Admin)
 */
export const assignTechnician = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { technicianId } = req.body;

    const order = await Order.findById(orderId).populate('userId', 'phone');

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    const technician = await User.findOne({ _id: technicianId, role: 'technician' });

    if (!technician) {
      res.status(404).json({
        success: false,
        message: 'تکنسین یافت نشد',
      });
      return;
    }

    order.technicianId = new mongoose.Types.ObjectId(technicianId);

    // Update timeline
    const assignStepIndex = order.timeline.findIndex(s => s.title === 'اختصاص تکنسین');
    if (assignStepIndex > -1) {
      // Complete previous steps
      for (let i = 0; i < assignStepIndex; i++) {
        if (order.timeline[i].status !== 'completed') {
          order.timeline[i].status = 'completed';
          order.timeline[i].completedAt = new Date();
        }
      }
      order.timeline[assignStepIndex].status = 'completed';
      order.timeline[assignStepIndex].completedAt = new Date();
      order.timeline[assignStepIndex].description = `تکنسین ${technician.name} اختصاص یافت`;

      // Set next step as current
      if (assignStepIndex + 1 < order.timeline.length) {
        order.timeline[assignStepIndex + 1].status = 'current';
      }
    }

    order.progressPercentage = calculateProgress(order.timeline);
    if (order.status === 'planned') {
      order.status = 'in_progress';
    }

    await order.save();

    // Notify customer
    const customer = order.userId as any;
    if (customer?.phone) {
      await smsService.sendTechnicianAssigned(customer.phone, order.orderNumber, technician.name);
    }

    // Notify technician
    await Notification.create({
      userId: technicianId,
      title: 'سفارش جدید',
      message: `سفارش ${order.orderNumber} به شما اختصاص یافت`,
      type: 'order_update',
      relatedOrderId: order._id,
    });

    // Notify customer
    await Notification.create({
      userId: order.userId,
      title: 'اختصاص تکنسین',
      message: `تکنسین ${technician.name} به سفارش شما اختصاص یافت`,
      type: 'order_update',
      relatedOrderId: order._id,
    });

    res.status(200).json({
      success: true,
      message: 'تکنسین به سفارش اختصاص یافت',
      order,
    });
  } catch (error) {
    console.error('Assign technician error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در اختصاص تکنسین',
    });
  }
};

/**
 * Update order timeline step (Admin)
 */
export const updateTimelineStep = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, stepId } = req.params;
    const { status, description } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    const stepIndex = order.timeline.findIndex(s => s._id?.toString() === stepId);

    if (stepIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'مرحله یافت نشد',
      });
      return;
    }

    if (status) {
      order.timeline[stepIndex].status = status;
      if (status === 'completed') {
        order.timeline[stepIndex].completedAt = new Date();

        // Set next step as current
        if (stepIndex + 1 < order.timeline.length && order.timeline[stepIndex + 1].status === 'upcoming') {
          order.timeline[stepIndex + 1].status = 'current';
        }
      }
    }

    if (description) {
      order.timeline[stepIndex].description = description;
    }

    order.progressPercentage = calculateProgress(order.timeline);

    // Check if all steps completed
    const allCompleted = order.timeline.every(s => s.status === 'completed');
    if (allCompleted && order.status !== 'completed') {
      order.status = 'completed';
      order.completedAt = new Date();
    }

    await order.save();

    // Notify customer
    await Notification.create({
      userId: order.userId,
      title: 'به‌روزرسانی سفارش',
      message: `مرحله "${order.timeline[stepIndex].title}" ${status === 'completed' ? 'تکمیل شد' : 'در حال انجام است'}`,
      type: 'order_update',
      relatedOrderId: order._id,
    });

    res.status(200).json({
      success: true,
      message: 'مرحله به‌روزرسانی شد',
      order,
    });
  } catch (error) {
    console.error('Update timeline step error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی مرحله',
    });
  }
};

/**
 * Update order cost estimate (Admin)
 */
export const updateCostEstimate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { estimatedCostMin, estimatedCostMax, finalCost } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    if (estimatedCostMin !== undefined) order.estimatedCostMin = estimatedCostMin;
    if (estimatedCostMax !== undefined) order.estimatedCostMax = estimatedCostMax;
    if (finalCost !== undefined) order.finalCost = finalCost;

    await order.save();

    // Notify customer about cost estimate
    if (estimatedCostMin || estimatedCostMax) {
      await Notification.create({
        userId: order.userId,
        title: 'برآورد هزینه',
        message: `هزینه تخمینی سفارش ${order.orderNumber}: ${estimatedCostMin?.toLocaleString('fa-IR')} - ${estimatedCostMax?.toLocaleString('fa-IR')} تومان`,
        type: 'order_update',
        relatedOrderId: order._id,
      });
    }

    res.status(200).json({
      success: true,
      message: 'هزینه به‌روزرسانی شد',
      order,
    });
  } catch (error) {
    console.error('Update cost estimate error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی هزینه',
    });
  }
};

// ============ TECHNICIAN FUNCTIONS ============

/**
 * Get assigned orders (Technician)
 */
export const getAssignedOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const technicianId = req.userId;
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { technicianId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('userId', 'name phone')
        .populate('vehicleId', 'brand model year plateNumber image')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get assigned orders error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت سفارش‌ها',
    });
  }
};

/**
 * Update order by technician
 */
export const technicianUpdateOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const technicianId = req.userId;
    const { notes, stepId, stepStatus } = req.body;

    const order = await Order.findOne({ _id: orderId, technicianId });

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    if (notes) order.notes = notes;

    // Update timeline step if provided
    if (stepId && stepStatus) {
      const stepIndex = order.timeline.findIndex(s => s._id?.toString() === stepId);
      if (stepIndex > -1) {
        order.timeline[stepIndex].status = stepStatus;
        if (stepStatus === 'completed') {
          order.timeline[stepIndex].completedAt = new Date();
          if (stepIndex + 1 < order.timeline.length) {
            order.timeline[stepIndex + 1].status = 'current';
          }
        }
        order.progressPercentage = calculateProgress(order.timeline);
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'سفارش به‌روزرسانی شد',
      order,
    });
  } catch (error) {
    console.error('Technician update order error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی سفارش',
    });
  }
};
