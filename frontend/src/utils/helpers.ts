import { format, formatDistanceToNow } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

// Persian digits mapping
const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Convert English digits to Persian
 */
export const toPersianDigits = (str: string | number): string => {
  return String(str).replace(/[0-9]/g, (d) => persianDigits[parseInt(d)]);
};

/**
 * Convert Persian digits to English
 */
export const toEnglishDigits = (str: string): string => {
  return str.replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)));
};

/**
 * Format phone number for display
 */
export const formatPhoneDisplay = (phone: string): string => {
  const cleaned = toEnglishDigits(phone).replace(/\D/g, '');
  if (cleaned.length === 11) {
    return toPersianDigits(`${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`);
  }
  return toPersianDigits(phone);
};

/**
 * Format currency to Persian format with Toman
 */
export const formatCurrency = (amount: number): string => {
  return toPersianDigits(amount.toLocaleString('fa-IR')) + ' تومان';
};

/**
 * Format number with Persian digits
 */
export const formatNumber = (num: number): string => {
  return toPersianDigits(num.toLocaleString('fa-IR'));
};

/**
 * Format date to Persian (Jalali)
 */
export const formatDate = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'yyyy/MM/dd', { locale: faIR });
  } catch {
    return '';
  }
};

/**
 * Format date with day name
 */
export const formatDateLong = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'EEEE، d MMMM yyyy', { locale: faIR });
  } catch {
    return '';
  }
};

/**
 * Format time
 */
export const formatTime = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'HH:mm', { locale: faIR });
  } catch {
    return '';
  }
};

/**
 * Format datetime
 */
export const formatDateTime = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, 'd MMMM yyyy، ساعت HH:mm', { locale: faIR });
  } catch {
    return '';
  }
};

/**
 * Format relative time (e.g., "۲ دقیقه پیش")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: faIR });
  } catch {
    return '';
  }
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

/**
 * Format date for display (shows "امروز" if today)
 */
export const formatDateSmart = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    if (isToday(date)) {
      return 'امروز، ' + formatTime(date);
    }
    return formatDate(date);
  } catch {
    return '';
  }
};

/**
 * Validate Iranian phone number
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = toEnglishDigits(phone).replace(/\D/g, '');
  return /^09[0-9]{9}$/.test(cleaned);
};

/**
 * Format phone for API (convert to 09XXXXXXXXX format)
 */
export const formatPhoneForAPI = (phone: string): string => {
  let cleaned = toEnglishDigits(phone).replace(/\D/g, '');

  if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  }

  if (!cleaned.startsWith('0') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Generate initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2);
};

/**
 * Classname merger (clsx + tailwind-merge)
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
