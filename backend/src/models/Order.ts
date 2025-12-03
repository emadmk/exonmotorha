import mongoose, { Document, Schema } from 'mongoose';

export type OrderStatus = 'pending' | 'planned' | 'in_progress' | 'waiting_for_parts' | 'completed' | 'cancelled';
export type OrderPriority = 'normal' | 'high' | 'urgent';

export interface ITimelineStep {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming';
  completedAt?: Date;
  orderIndex: number;
}

export interface ILocation {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type PhotoType = 'vehicle' | 'license_plate' | 'vin' | 'invoice' | 'document' | 'other';

export interface IOrderPhoto {
  _id?: mongoose.Types.ObjectId;
  url: string;
  type: PhotoType;
  caption?: string;
  uploadedAt: Date;
  uploadedBy: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  userId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  technicianId?: mongoose.Types.ObjectId;
  status: OrderStatus;
  priority: OrderPriority;
  issues: string[];
  description?: string;
  location?: ILocation;
  scheduledDate?: Date;
  scheduledTime?: string;
  timeline: ITimelineStep[];
  estimatedCostMin?: number;
  estimatedCostMax?: number;
  finalCost?: number;
  progressPercentage: number;
  notes?: string;
  adminNotes?: string;
  photos: IOrderPhoto[];
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const timelineStepSchema = new Schema<ITimelineStep>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['completed', 'current', 'upcoming'],
      default: 'upcoming',
    },
    completedAt: { type: Date },
    orderIndex: { type: Number, required: true },
  },
  { _id: true }
);

const orderPhotoSchema = new Schema<IOrderPhoto>(
  {
    url: { type: String, required: true },
    type: {
      type: String,
      enum: ['vehicle', 'license_plate', 'vin', 'invoice', 'document', 'other'],
      default: 'other',
    },
    caption: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: true }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    technicianId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'planned', 'in_progress', 'waiting_for_parts', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['normal', 'high', 'urgent'],
      default: 'normal',
    },
    issues: [{
      type: String,
      required: true,
    }],
    description: {
      type: String,
    },
    location: {
      address: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      type: String,
    },
    timeline: [timelineStepSchema],
    estimatedCostMin: {
      type: Number,
    },
    estimatedCostMax: {
      type: Number,
    },
    finalCost: {
      type: Number,
    },
    progressPercentage: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
    adminNotes: {
      type: String,
    },
    photos: {
      type: [orderPhotoSchema],
      default: [],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ technicianId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `CR-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

// Default timeline steps
export const defaultTimelineSteps: Omit<ITimelineStep, '_id'>[] = [
  { title: 'ثبت درخواست', description: 'درخواست شما با موفقیت ثبت شد', status: 'completed', orderIndex: 1 },
  { title: 'تایید و بررسی', description: 'درخواست در حال بررسی توسط تیم پشتیبانی', status: 'upcoming', orderIndex: 2 },
  { title: 'اختصاص تکنسین', description: 'تکنسین به سفارش شما اختصاص داده شد', status: 'upcoming', orderIndex: 3 },
  { title: 'تشخیص و برآورد', description: 'بررسی کامل خودرو و اعلام هزینه', status: 'upcoming', orderIndex: 4 },
  { title: 'انجام تعمیرات', description: 'در حال انجام تعمیرات', status: 'upcoming', orderIndex: 5 },
  { title: 'تکمیل و تحویل', description: 'خودرو آماده تحویل است', status: 'upcoming', orderIndex: 6 },
];

export const Order = mongoose.model<IOrder>('Order', orderSchema);
