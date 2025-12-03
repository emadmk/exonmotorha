import mongoose, { Document, Schema } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailNotifications: boolean;
  language: 'fa' | 'en';
  theme: 'light' | 'dark';
  createdAt: Date;
  updatedAt: Date;
}

const userSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: true,
    },
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    language: {
      type: String,
      enum: ['fa', 'en'],
      default: 'fa',
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
  },
  {
    timestamps: true,
  }
);

userSettingsSchema.index({ userId: 1 });

export const UserSettings = mongoose.model<IUserSettings>('UserSettings', userSettingsSchema);
