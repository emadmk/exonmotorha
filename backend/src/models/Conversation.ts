import mongoose, { Document, Schema } from 'mongoose';

export type ConversationType = 'technician' | 'support' | 'parts';

export interface IConversation extends Document {
  _id: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  type: ConversationType;
  title?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    type: {
      type: String,
      enum: ['technician', 'support', 'parts'],
      default: 'support',
    },
    title: {
      type: String,
    },
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);
