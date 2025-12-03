import { Response } from 'express';
import { Receipt, Order, Notification } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import { paymentService } from '../services/payment.service';
import { config } from '../config';
import mongoose from 'mongoose';

/**
 * Get user's receipts
 */
export const getReceipts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { status, page = 1, limit = 20 } = req.query;

    const query: any = { userId };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [receipts, total] = await Promise.all([
      Receipt.find(query)
        .populate('orderId', 'orderNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Receipt.countDocuments(query),
    ]);

    // Calculate totals
    const allReceipts = await Receipt.find({ userId });
    const totalAmount = allReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const paidAmount = allReceipts
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.totalAmount, 0);
    const pendingAmount = allReceipts
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    res.status(200).json({
      success: true,
      receipts,
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت رسیدها',
    });
  }
};

/**
 * Get single receipt
 */
export const getReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiptId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const query: any = { _id: receiptId };
    if (userRole === 'customer') {
      query.userId = userId;
    }

    const receipt = await Receipt.findOne(query)
      .populate('orderId', 'orderNumber status')
      .populate('userId', 'name phone');

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'رسید یافت نشد',
      });
      return;
    }

    res.status(200).json({
      success: true,
      receipt,
    });
  } catch (error) {
    console.error('Get receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت رسید',
    });
  }
};

/**
 * Create receipt (Admin only)
 */
export const createReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, items, tax = 0, discount = 0, notes } = req.body;

    if (!orderId || !items || !items.length) {
      res.status(400).json({
        success: false,
        message: 'اطلاعات ناقص است',
      });
      return;
    }

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalAmount = subtotal + tax - discount;

    // Process items
    const processedItems = items.map((item: any) => ({
      title: item.title,
      description: item.description,
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice,
      totalPrice: (item.quantity || 1) * item.unitPrice,
    }));

    const receipt = await Receipt.create({
      orderId,
      userId: order.userId,
      items: processedItems,
      subtotal,
      tax,
      discount,
      totalAmount,
      notes,
    });

    // Notify customer
    await Notification.create({
      userId: order.userId,
      title: 'فاکتور جدید',
      message: `فاکتور ${receipt.receiptNumber} به مبلغ ${totalAmount.toLocaleString('fa-IR')} تومان صادر شد`,
      type: 'payment',
      relatedOrderId: orderId,
    });

    res.status(201).json({
      success: true,
      message: 'رسید ایجاد شد',
      receipt,
    });
  } catch (error) {
    console.error('Create receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد رسید',
    });
  }
};

/**
 * Update receipt (Admin only)
 */
export const updateReceipt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiptId } = req.params;
    const { items, tax, discount, notes, status } = req.body;

    const receipt = await Receipt.findById(receiptId);

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'رسید یافت نشد',
      });
      return;
    }

    if (receipt.status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'امکان ویرایش رسید پرداخت شده وجود ندارد',
      });
      return;
    }

    if (items) {
      const processedItems = items.map((item: any) => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        totalPrice: (item.quantity || 1) * item.unitPrice,
      }));
      receipt.items = processedItems;
      receipt.subtotal = processedItems.reduce(
        (sum: number, item: any) => sum + item.totalPrice,
        0
      );
    }

    if (tax !== undefined) receipt.tax = tax;
    if (discount !== undefined) receipt.discount = discount;
    if (notes !== undefined) receipt.notes = notes;
    if (status) receipt.status = status;

    receipt.totalAmount = receipt.subtotal + receipt.tax - receipt.discount;

    await receipt.save();

    res.status(200).json({
      success: true,
      message: 'رسید به‌روزرسانی شد',
      receipt,
    });
  } catch (error) {
    console.error('Update receipt error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در به‌روزرسانی رسید',
    });
  }
};

/**
 * Initialize payment for receipt
 */
export const initPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiptId } = req.params;
    const userId = req.userId;
    const user = req.user;

    const receipt = await Receipt.findOne({ _id: receiptId, userId });

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'رسید یافت نشد',
      });
      return;
    }

    if (receipt.status === 'paid') {
      res.status(400).json({
        success: false,
        message: 'این رسید قبلاً پرداخت شده است',
      });
      return;
    }

    const callbackUrl = `${config.frontendUrl}/payment/callback?receiptId=${receiptId}`;

    const result = await paymentService.createPayment(
      receipt.totalAmount,
      `پرداخت فاکتور ${receipt.receiptNumber}`,
      callbackUrl,
      user?.email,
      user?.phone
    );

    if (!result.success) {
      res.status(500).json({
        success: false,
        message: result.error || 'خطا در ایجاد لینک پرداخت',
      });
      return;
    }

    // Save authority for verification
    receipt.paymentReference = result.authority;
    await receipt.save();

    res.status(200).json({
      success: true,
      paymentUrl: result.paymentUrl,
      authority: result.authority,
    });
  } catch (error) {
    console.error('Init payment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد لینک پرداخت',
    });
  }
};

/**
 * Verify payment callback
 */
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { Authority, Status } = req.query;
    const { receiptId } = req.params;

    if (Status !== 'OK') {
      res.status(400).json({
        success: false,
        message: 'پرداخت لغو شد',
      });
      return;
    }

    const receipt = await Receipt.findById(receiptId);

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'رسید یافت نشد',
      });
      return;
    }

    if (receipt.status === 'paid') {
      res.status(200).json({
        success: true,
        message: 'پرداخت قبلاً تایید شده است',
        receipt,
      });
      return;
    }

    const result = await paymentService.verifyPayment(
      Authority as string,
      receipt.totalAmount
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.error || 'تایید پرداخت ناموفق',
      });
      return;
    }

    receipt.status = 'paid';
    receipt.paymentMethod = 'online';
    receipt.paymentReference = String(result.refId);
    receipt.paidAt = new Date();
    await receipt.save();

    // Notify
    await Notification.create({
      userId: receipt.userId,
      title: 'پرداخت موفق',
      message: `پرداخت فاکتور ${receipt.receiptNumber} با موفقیت انجام شد`,
      type: 'payment',
      relatedOrderId: receipt.orderId,
    });

    res.status(200).json({
      success: true,
      message: 'پرداخت با موفقیت انجام شد',
      receipt,
      refId: result.refId,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تایید پرداخت',
    });
  }
};

/**
 * Mark receipt as paid manually (Admin)
 */
export const markAsPaid = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { receiptId } = req.params;
    const { paymentMethod = 'cash', paymentReference } = req.body;

    const receipt = await Receipt.findById(receiptId);

    if (!receipt) {
      res.status(404).json({
        success: false,
        message: 'رسید یافت نشد',
      });
      return;
    }

    receipt.status = 'paid';
    receipt.paymentMethod = paymentMethod;
    receipt.paymentReference = paymentReference;
    receipt.paidAt = new Date();
    await receipt.save();

    // Notify
    await Notification.create({
      userId: receipt.userId,
      title: 'پرداخت ثبت شد',
      message: `پرداخت فاکتور ${receipt.receiptNumber} ثبت شد`,
      type: 'payment',
      relatedOrderId: receipt.orderId,
    });

    res.status(200).json({
      success: true,
      message: 'پرداخت ثبت شد',
      receipt,
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ثبت پرداخت',
    });
  }
};

/**
 * Get receipts for order
 */
export const getOrderReceipts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;

    const query: any = { orderId };
    if (userRole === 'customer') {
      query.userId = userId;
    }

    const receipts = await Receipt.find(query).sort({ createdAt: -1 });

    const totalAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const paidAmount = receipts
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.totalAmount, 0);

    res.status(200).json({
      success: true,
      receipts,
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
      },
    });
  } catch (error) {
    console.error('Get order receipts error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت رسیدها',
    });
  }
};
