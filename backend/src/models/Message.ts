import mongoose, { Document, Schema } from 'mongoose';

export type MessageStatus = 'sent' | 'delivered' | 'read';
export type SenderType = 'user' | 'technician' | 'admin' | 'system';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderType: SenderType;
  text: string;
  attachments?: string[];
  status: MessageStatus;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderType: {
      type: String,
      enum: ['user', 'technician', 'admin', 'system'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    attachments: [{
      type: String,
    }],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);
