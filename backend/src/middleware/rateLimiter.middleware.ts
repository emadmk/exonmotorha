import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP rate limiter (more strict)
export const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: {
    success: false,
    message: 'تعداد درخواست‌های ارسال کد بیش از حد مجاز است. لطفاً یک دقیقه صبر کنید.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً کمی صبر کنید.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    message: 'تعداد آپلود فایل بیش از حد مجاز است.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
