import mongoose, { Document, Schema } from 'mongoose';

export interface ITechnician extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  specialties: string[];
  rating: number;
  totalJobs: number;
  completedJobs: number;
  isAvailable: boolean;
  workingHours?: {
    start: string;
    end: string;
  };
  serviceAreas?: string[];
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const technicianSchema = new Schema<ITechnician>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialties: [{
      type: String,
    }],
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    totalJobs: {
      type: Number,
      default: 0,
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    workingHours: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '20:00' },
    },
    serviceAreas: [{
      type: String,
    }],
    bio: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

technicianSchema.index({ userId: 1 });
technicianSchema.index({ isAvailable: 1 });

export const Technician = mongoose.model<ITechnician>('Technician', technicianSchema);
