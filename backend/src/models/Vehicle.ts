import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  brand: string;
  model: string;
  year: number;
  plateNumber?: string;
  color?: string;
  image?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<IVehicle>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    plateNumber: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ userId: 1, isDefault: 1 });

export const Vehicle = mongoose.model<IVehicle>('Vehicle', vehicleSchema);
