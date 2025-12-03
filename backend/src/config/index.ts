import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/exonmotor',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  kavenegar: {
    apiKey: process.env.KAVENEGAR_API_KEY || '',
  },

  zarinpal: {
    merchantId: process.env.ZARINPAL_MERCHANT_ID || '',
    sandbox: process.env.ZARINPAL_SANDBOX === 'true',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  },
};

export const otpConfig = {
  length: 5,
  expiresIn: 120, // seconds
  maxAttempts: 3,
  cooldown: 60, // seconds between resends
};

export const issueTypes = [
  'تصادف',
  'خرابی موتور',
  'پنچری',
  'باتری',
  'سرویس دوره‌ای',
  'صدای غیرعادی',
  'مشکل برقی',
  'تعمیر بدنه',
];

export const orderStatuses = {
  planned: 'برنامه‌ریزی شده',
  in_progress: 'در حال انجام',
  waiting_for_parts: 'در انتظار قطعه',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
};
