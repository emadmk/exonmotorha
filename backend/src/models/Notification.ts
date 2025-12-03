import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'order_update' | 'message' | 'payment' | 'system' | 'reminder';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  relatedOrderId?: mongoose.Types.ObjectId;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['order_update', 'message', 'payment', 'system', 'reminder'],
      default: 'system',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    data: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);
