import { Response } from 'express';
import { User, UserSettings, Vehicle } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { getFileUrl } from '../middleware/upload.middleware';

/**
 * Get user profile
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
      });
      return;
    }

    const settings = await UserSettings.findOne({ userId: user._id });
    const vehicles = await Vehicle.find({ userId: user._id });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
      settings: settings || {},
      vehiclesCount: vehicles.length,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت پروفایل',
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { name, email } = req.body;

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
      });
      return;
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'پروفایل با موفقیت به‌روزرسانی شد',
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی پروفایل',
    });
  }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'فایل تصویر یافت نشد',
      });
      return;
    }

    const avatarUrl = getFileUrl(req.file.filename, 'avatars');
    user.avatar = avatarUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'تصویر پروفایل با موفقیت آپلود شد',
      avatar: avatarUrl,
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در آپلود تصویر',
    });
  }
};

/**
 * Get user settings
 */
export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      settings = await UserSettings.create({ userId });
    }

    res.status(200).json({
      success: true,
      settings: {
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
        emailNotifications: settings.emailNotifications,
        language: settings.language,
        theme: settings.theme,
      },
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تنظیمات',
    });
  }
};

/**
 * Update user settings
 */
export const updateSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { pushNotifications, smsNotifications, emailNotifications, language, theme } = req.body;

    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      settings = new UserSettings({ userId });
    }

    if (typeof pushNotifications === 'boolean') settings.pushNotifications = pushNotifications;
    if (typeof smsNotifications === 'boolean') settings.smsNotifications = smsNotifications;
    if (typeof emailNotifications === 'boolean') settings.emailNotifications = emailNotifications;
    if (language) settings.language = language;
    if (theme) settings.theme = theme;

    await settings.save();

    res.status(200).json({
      success: true,
      message: 'تنظیمات با موفقیت به‌روزرسانی شد',
      settings: {
        pushNotifications: settings.pushNotifications,
        smsNotifications: settings.smsNotifications,
        emailNotifications: settings.emailNotifications,
        language: settings.language,
        theme: settings.theme,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی تنظیمات',
    });
  }
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const query: any = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت لیست کاربران',
    });
  }
};

/**
 * Update user role (Admin only)
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['customer', 'technician', 'admin'].includes(role)) {
      res.status(400).json({
        success: false,
        message: 'نقش نامعتبر است',
      });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'کاربر یافت نشد',
      });
      return;
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'نقش کاربر با موفقیت تغییر کرد',
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تغییر نقش کاربر',
    });
  }
};
