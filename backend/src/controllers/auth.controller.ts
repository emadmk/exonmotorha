import { Request, Response } from 'express';
import { User, OTP, UserSettings } from '../models';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { generateOTPCode, formatPhoneNumber, isValidIranianPhone } from '../utils/helpers';
import { smsService } from '../services/sms.service';
import { otpConfig } from '../config';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Send OTP to phone number
 */
export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({
        success: false,
        message: 'شماره موبایل الزامی است',
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);

    if (!isValidIranianPhone(formattedPhone)) {
      res.status(400).json({
        success: false,
        message: 'شماره موبایل نامعتبر است',
      });
      return;
    }

    // Check for existing OTP (cooldown)
    const existingOTP = await OTP.findOne({
      phone: formattedPhone,
      expiresAt: { $gt: new Date() },
    });

    if (existingOTP) {
      const remainingTime = Math.ceil((existingOTP.expiresAt.getTime() - Date.now()) / 1000);
      res.status(429).json({
        success: false,
        message: `لطفاً ${remainingTime} ثانیه صبر کنید`,
        remainingTime,
      });
      return;
    }

    // Generate new OTP
    const code = generateOTPCode();
    const expiresAt = new Date(Date.now() + otpConfig.expiresIn * 1000);

    // Delete any old OTPs for this phone
    await OTP.deleteMany({ phone: formattedPhone });

    // Create new OTP
    await OTP.create({
      phone: formattedPhone,
      code,
      expiresAt,
    });

    // Send SMS
    const smsSent = await smsService.sendOTP(formattedPhone, code);

    if (!smsSent) {
      console.warn('SMS send failed, but continuing...');
    }

    res.status(200).json({
      success: true,
      message: 'کد تایید ارسال شد',
      expiresIn: otpConfig.expiresIn,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال کد تایید',
    });
  }
};

/**
 * Verify OTP and login/register user
 */
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code, name, nationalId } = req.body;

    if (!phone || !code) {
      res.status(400).json({
        success: false,
        message: 'شماره موبایل و کد تایید الزامی است',
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Find OTP
    const otp = await OTP.findOne({
      phone: formattedPhone,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      res.status(400).json({
        success: false,
        message: 'کد تایید منقضی شده یا یافت نشد',
      });
      return;
    }

    // Check attempts
    if (otp.attempts >= otpConfig.maxAttempts) {
      await OTP.deleteOne({ _id: otp._id });
      res.status(429).json({
        success: false,
        message: 'تعداد تلاش‌های مجاز به پایان رسید. لطفاً مجدداً کد دریافت کنید',
      });
      return;
    }

    // Verify code
    if (otp.code !== code) {
      otp.attempts += 1;
      await otp.save();
      res.status(400).json({
        success: false,
        message: 'کد تایید اشتباه است',
        remainingAttempts: otpConfig.maxAttempts - otp.attempts,
      });
      return;
    }

    // Delete OTP
    await OTP.deleteOne({ _id: otp._id });

    // Find or create user
    let user = await User.findOne({ phone: formattedPhone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await User.create({
        phone: formattedPhone,
        name: name || `کاربر ${formattedPhone.slice(-4)}`,
        nationalId: nationalId,
        role: 'customer',
      });

      // Create default settings
      await UserSettings.create({
        userId: user._id,
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: isNewUser ? 'ثبت‌نام با موفقیت انجام شد' : 'ورود موفقیت‌آمیز',
      isNewUser,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تایید کد',
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'توکن بازنشانی الزامی است',
      });
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'توکن نامعتبر یا منقضی شده است',
      });
      return;
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({
        success: false,
        message: 'توکن نامعتبر است',
      });
      return;
    }

    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      ...tokens,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در بازنشانی توکن',
    });
  }
};

/**
 * Logout user
 */
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      req.user.refreshToken = undefined;
      await req.user.save();
    }

    res.status(200).json({
      success: true,
      message: 'خروج موفقیت‌آمیز',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در خروج از حساب',
    });
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'کاربر یافت نشد',
      });
      return;
    }

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
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت اطلاعات کاربر',
    });
  }
};
