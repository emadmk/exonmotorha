import { Response } from 'express';
import { User, Order, Receipt, Technician, Vehicle, Notification, ITechnician } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Count statistics
    const [
      totalUsers,
      totalTechnicians,
      totalOrders,
      todayOrders,
      inProgressOrders,
      waitingForPartsOrders,
      completedOrders,
      cancelledOrders,
      plannedOrders,
      totalRevenue,
      weeklyOrders,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'technician' }),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'in_progress' }),
      Order.countDocuments({ status: 'waiting_for_parts' }),
      Order.countDocuments({ status: 'completed' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.countDocuments({ status: 'planned' }),
      Receipt.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $dayOfWeek: '$createdAt' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id': 1 } },
      ]),
    ]);

    // Process weekly data (fill missing days with 0)
    const weeklyActivity = Array(7).fill(0);
    weeklyOrders.forEach((day: any) => {
      // MongoDB dayOfWeek: 1 = Sunday, 7 = Saturday
      // We want: 0 = Saturday, 6 = Friday (Persian week)
      const index = day._id === 7 ? 0 : day._id;
      weeklyActivity[index] = day.count;
    });

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          technicians: totalTechnicians,
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          planned: plannedOrders,
          inProgress: inProgressOrders,
          waitingForParts: waitingForPartsOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
        },
        weeklyActivity,
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار',
    });
  }
};

/**
 * Get all technicians
 */
export const getTechnicians = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, available } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Get technician users
    const technicianUsers = await User.find({ role: 'technician' })
      .select('-refreshToken')
      .skip(skip)
      .limit(Number(limit));

    // Get technician details
    const techniciansWithDetails = await Promise.all(
      technicianUsers.map(async (user) => {
        const techInfo = await Technician.findOne({ userId: user._id });
        const activeOrders = await Order.countDocuments({
          technicianId: user._id,
          status: { $in: ['in_progress', 'waiting_for_parts'] },
        });

        return {
          ...user.toObject(),
          technicianInfo: techInfo as ITechnician | null,
          activeOrders,
        };
      })
    );

    // Filter by availability if requested
    let filtered = techniciansWithDetails;
    if (available === 'true') {
      filtered = techniciansWithDetails.filter(
        (t) => t.technicianInfo?.isAvailable
      );
    }

    const total = await User.countDocuments({ role: 'technician' });

    res.status(200).json({
      success: true,
      technicians: filtered,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get technicians error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست تکنسین‌ها',
    });
  }
};

/**
 * Create new technician
 */
export const createTechnician = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { phone, name, email, specialties, bio, serviceAreas } = req.body;

    if (!phone || !name) {
      res.status(400).json({
        success: false,
        message: 'نام و شماره موبایل الزامی است',
      });
      return;
    }

    // Check if user exists
    let user = await User.findOne({ phone });

    if (user) {
      if (user.role === 'technician') {
        res.status(400).json({
          success: false,
          message: 'این شماره قبلاً به عنوان تکنسین ثبت شده',
        });
        return;
      }
      // Update role to technician
      user.role = 'technician';
      user.name = name;
      if (email) user.email = email;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        phone,
        name,
        email,
        role: 'technician',
      });
    }

    // Create technician profile
    const technician = await Technician.create({
      userId: user._id,
      specialties: specialties || [],
      bio,
      serviceAreas: serviceAreas || [],
    });

    res.status(201).json({
      success: true,
      message: 'تکنسین با موفقیت ایجاد شد',
      user: {
        ...user.toObject(),
        technicianInfo: technician,
      },
    });
  } catch (error) {
    console.error('Create technician error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد تکنسین',
    });
  }
};

/**
 * Update technician
 */
export const updateTechnician = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { technicianId } = req.params;
    const { name, email, specialties, bio, serviceAreas, isAvailable, workingHours } = req.body;

    const user = await User.findOne({ _id: technicianId, role: 'technician' });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'تکنسین یافت نشد',
      });
      return;
    }

    // Update user info
    if (name) user.name = name;
    if (email !== undefined) user.email = email;
    await user.save();

    // Update technician info
    let technician = await Technician.findOne({ userId: technicianId });
    if (!technician) {
      technician = new Technician({ userId: technicianId });
    }

    if (specialties) technician.specialties = specialties;
    if (bio !== undefined) technician.bio = bio;
    if (serviceAreas) technician.serviceAreas = serviceAreas;
    if (typeof isAvailable === 'boolean') technician.isAvailable = isAvailable;
    if (workingHours) technician.workingHours = workingHours;

    await technician.save();

    res.status(200).json({
      success: true,
      message: 'اطلاعات تکنسین به‌روزرسانی شد',
      user: {
        ...user.toObject(),
        technicianInfo: technician,
      },
    });
  } catch (error) {
    console.error('Update technician error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی تکنسین',
    });
  }
};

/**
 * Delete technician (set inactive)
 */
export const deleteTechnician = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { technicianId } = req.params;

    const user = await User.findOne({ _id: technicianId, role: 'technician' });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'تکنسین یافت نشد',
      });
      return;
    }

    // Check for active orders
    const activeOrders = await Order.countDocuments({
      technicianId,
      status: { $in: ['in_progress', 'waiting_for_parts'] },
    });

    if (activeOrders > 0) {
      res.status(400).json({
        success: false,
        message: `این تکنسین ${activeOrders} سفارش فعال دارد`,
      });
      return;
    }

    // Deactivate instead of delete
    user.isActive = false;
    await user.save();

    const technician = await Technician.findOne({ userId: technicianId });
    if (technician) {
      technician.isAvailable = false;
      await technician.save();
    }

    res.status(200).json({
      success: true,
      message: 'تکنسین غیرفعال شد',
    });
  } catch (error) {
    console.error('Delete technician error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در حذف تکنسین',
    });
  }
};

/**
 * Get public statistics (for landing page)
 */
export const getPublicStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalCustomers, totalTechnicians, completedOrders] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'technician' }),
      Order.countDocuments({ status: 'completed' }),
    ]);

    // Calculate satisfaction rate (mock for now, could be based on ratings)
    const satisfactionRate = 98;

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers: totalCustomers + 1200, // Add base for new site
        totalTechnicians: totalTechnicians + 80,
        completedOrders: completedOrders + 500,
        satisfactionRate,
      },
    });
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار',
    });
  }
};

/**
 * Send broadcast notification
 */
export const sendBroadcast = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, type = 'system', targetRole } = req.body;

    if (!title || !message) {
      res.status(400).json({
        success: false,
        message: 'عنوان و متن الزامی است',
      });
      return;
    }

    const userQuery: any = { isActive: true };
    if (targetRole) {
      userQuery.role = targetRole;
    }

    const users = await User.find(userQuery).select('_id');

    const notifications = users.map((user) => ({
      userId: user._id,
      title,
      message,
      type,
    }));

    await Notification.insertMany(notifications);

    res.status(200).json({
      success: true,
      message: `اعلان به ${users.length} کاربر ارسال شد`,
      count: users.length,
    });
  } catch (error) {
    console.error('Send broadcast error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال اعلان',
    });
  }
};
