import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
  action: string;
  category: 'order' | 'user' | 'vehicle' | 'receipt' | 'message' | 'auth' | 'system';
  description: string;
  performedBy: mongoose.Types.ObjectId;
  performerRole: 'customer' | 'technician' | 'admin';
  performerName: string;
  targetType?: 'order' | 'user' | 'vehicle' | 'receipt' | 'message';
  targetId?: mongoose.Types.ObjectId;
  targetRef?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['order', 'user', 'vehicle', 'receipt', 'message', 'auth', 'system'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    performerRole: {
      type: String,
      enum: ['customer', 'technician', 'admin'],
      required: true,
      index: true,
    },
    performerName: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ['order', 'user', 'vehicle', 'receipt', 'message'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    targetRef: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ performerRole: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
