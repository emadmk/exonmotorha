import { otpConfig } from '../config';

/**
 * Generate random OTP code
 */
export const generateOTPCode = (): string => {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < otpConfig.length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
};

/**
 * Format phone number to standard format (09XXXXXXXXX)
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');

  // Handle +98 prefix
  if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Handle 98 prefix without +
  if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  }

  // Ensure starts with 0
  if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
};

/**
 * Validate Iranian phone number
 */
export const isValidIranianPhone = (phone: string): boolean => {
  const formatted = formatPhoneNumber(phone);
  return /^09[0-9]{9}$/.test(formatted);
};

/**
 * Convert English digits to Persian
 */
export const toPersianDigits = (str: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

/**
 * Convert Persian digits to English
 */
export const toEnglishDigits = (str: string): string => {
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
};

/**
 * Format currency to Persian format
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fa-IR').format(amount);
};

/**
 * Generate unique ID
 */
export const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

/**
 * Calculate progress percentage based on timeline
 */
export const calculateProgress = (timeline: { status: string }[]): number => {
  if (!timeline || timeline.length === 0) return 0;
  const completed = timeline.filter(step => step.status === 'completed').length;
  return Math.round((completed / timeline.length) * 100);
};

/**
 * Sleep function for delays
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
