// User types
export type UserRole = 'customer' | 'technician' | 'admin';

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

// Vehicle types
export interface Vehicle {
  _id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  plateNumber?: string;
  color?: string;
  image?: string;
  isDefault: boolean;
  createdAt: string;
}

// Order types
export type OrderStatus = 'planned' | 'in_progress' | 'waiting_for_parts' | 'completed' | 'cancelled';
export type OrderPriority = 'normal' | 'high' | 'urgent';

export interface TimelineStep {
  _id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  completedAt?: string;
  orderIndex: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string | User;
  vehicleId: string | Vehicle;
  technicianId?: string | User;
  status: OrderStatus;
  priority: OrderPriority;
  issues: string[];
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  scheduledDate: string;
  scheduledTime: string;
  timeline: TimelineStep[];
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  finalCost?: number;
  progressPercentage: number;
  notes?: string;
  adminNotes?: string;
  technicianInfo?: TechnicianInfo;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechnicianInfo {
  specialties: string[];
  rating: number;
  totalJobs: number;
}

// Conversation & Message types
export type ConversationType = 'technician' | 'support' | 'parts';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface Conversation {
  _id: string;
  orderId?: string;
  participants: string[];
  type: ConversationType;
  title?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  otherParticipant?: User;
  isActive: boolean;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | User;
  senderType: 'user' | 'technician' | 'admin' | 'system';
  text: string;
  attachments?: string[];
  status: MessageStatus;
  readAt?: string;
  createdAt: string;
}

// Receipt types
export type ReceiptStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'online';

export interface ReceiptItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  orderId: string;
  userId: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: ReceiptStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

// Notification types
export type NotificationType = 'order_update' | 'message' | 'payment' | 'system' | 'reminder';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedOrderId?: string;
  createdAt: string;
}

// Settings types
export interface UserSettings {
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  language: 'fa' | 'en';
  theme: 'light' | 'dark';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Admin Stats types
export interface DashboardStats {
  users: {
    total: number;
    technicians: number;
  };
  orders: {
    total: number;
    today: number;
    planned: number;
    inProgress: number;
    waitingForParts: number;
    completed: number;
    cancelled: number;
  };
  revenue: {
    total: number;
  };
  weeklyActivity: number[];
}

export interface PublicStats {
  totalCustomers: number;
  totalTechnicians: number;
  completedOrders: number;
  satisfactionRate: number;
}

// Issue types for request form
export const ISSUE_TYPES = [
  'تصادف',
  'خرابی موتور',
  'پنچری',
  'باتری',
  'سرویس دوره‌ای',
  'صدای غیرعادی',
  'مشکل برقی',
  'تعمیر بدنه',
] as const;

export type IssueType = typeof ISSUE_TYPES[number];

// Status labels
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  planned: 'برنامه‌ریزی شده',
  in_progress: 'در حال انجام',
  waiting_for_parts: 'در انتظار قطعه',
  completed: 'تکمیل شده',
  cancelled: 'لغو شده',
};

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  pending: 'در انتظار پرداخت',
  paid: 'پرداخت شده',
  cancelled: 'لغو شده',
  refunded: 'مسترد شده',
};
