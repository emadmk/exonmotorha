import mongoose, { Document, Schema } from 'mongoose';

export type ReceiptStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'online';

export interface IReceiptItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IReceipt extends Document {
  _id: mongoose.Types.ObjectId;
  receiptNumber: string;
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  items: IReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  status: ReceiptStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const receiptItemSchema = new Schema<IReceiptItem>(
  {
    title: { type: String, required: true },
    description: { type: String },
    quantity: { type: Number, required: true, default: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const receiptSchema = new Schema<IReceipt>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [receiptItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online'],
    },
    paymentReference: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

receiptSchema.index({ receiptNumber: 1 });
receiptSchema.index({ userId: 1, status: 1 });

// Generate receipt number before saving
receiptSchema.pre('save', async function (next) {
  if (!this.receiptNumber) {
    const count = await mongoose.model('Receipt').countDocuments();
    this.receiptNumber = `INV-${String(count + 1001).padStart(4, '0')}`;
  }
  next();
});

export const Receipt = mongoose.model<IReceipt>('Receipt', receiptSchema);
