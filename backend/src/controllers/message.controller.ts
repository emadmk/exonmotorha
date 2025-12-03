import { Response } from 'express';
import { Conversation, Message, User, Order } from '../models';
import { AuthRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

/**
 * Get user's conversations
 */
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.find({
      participants: new mongoose.Types.ObjectId(userId),
      isActive: true,
    })
      .populate('orderId', 'orderNumber status')
      .sort({ lastMessageAt: -1 });

    // Get unread counts and other participant info
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id,
          senderId: { $ne: new mongoose.Types.ObjectId(userId) },
          status: { $ne: 'read' },
        });

        // Get other participant info
        const otherParticipantId = conv.participants.find(
          (p) => p.toString() !== userId
        );
        let otherParticipant = null;
        if (otherParticipantId) {
          otherParticipant = await User.findById(otherParticipantId).select(
            'name phone avatar role'
          );
        }

        return {
          ...conv.toObject(),
          unreadCount,
          otherParticipant,
        };
      })
    );

    res.status(200).json({
      success: true,
      conversations: conversationsWithDetails,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت مکالمات',
    });
  }
};

/**
 * Get or create conversation
 */
export const getOrCreateConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { participantId, orderId, type = 'support' } = req.body;

    if (!participantId) {
      res.status(400).json({
        success: false,
        message: 'شناسه مخاطب الزامی است',
      });
      return;
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      participants: { $all: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(participantId)] },
      orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
      isActive: true,
    });

    if (!conversation) {
      // Get participant info for title
      const participant = await User.findById(participantId);
      const title = participant
        ? type === 'technician'
          ? `گفتگو با تکنسین ${participant.name}`
          : `گفتگو با ${participant.name}`
        : 'گفتگوی جدید';

      conversation = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(participantId)],
        orderId: orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
        type,
        title,
      });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد مکالمه',
    });
  }
};

/**
 * Get messages in a conversation
 */
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const { page = 1, limit = 50 } = req.query;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'مکالمه یافت نشد',
      });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .populate('senderId', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Message.countDocuments({ conversationId }),
    ]);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        status: { $ne: 'read' },
      },
      {
        status: 'read',
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت پیام‌ها',
    });
  }
};

/**
 * Send message
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const userRole = req.userRole;
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({
        success: false,
        message: 'متن پیام الزامی است',
      });
      return;
    }

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'مکالمه یافت نشد',
      });
      return;
    }

    // Determine sender type
    let senderType: 'user' | 'technician' | 'admin' = 'user';
    if (userRole === 'technician') senderType = 'technician';
    if (userRole === 'admin') senderType = 'admin';

    const message = await Message.create({
      conversationId,
      senderId: new mongoose.Types.ObjectId(userId),
      senderType,
      text: text.trim(),
      status: 'sent',
    });

    // Update conversation
    conversation.lastMessage = text.trim().substring(0, 100);
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate sender info
    await message.populate('senderId', 'name avatar role');

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال پیام',
    });
  }
};

/**
 * Mark messages as read
 */
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: new mongoose.Types.ObjectId(userId),
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        message: 'مکالمه یافت نشد',
      });
      return;
    }

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        status: { $ne: 'read' },
      },
      {
        status: 'read',
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: 'پیام‌ها خوانده شدند',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در علامت‌گذاری پیام‌ها',
    });
  }
};

/**
 * Get support conversation (creates if not exists)
 */
export const getSupportConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    // Find an admin user
    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      res.status(500).json({
        success: false,
        message: 'پشتیبانی در دسترس نیست',
      });
      return;
    }

    // Find or create support conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [new mongoose.Types.ObjectId(userId), admin._id] },
      type: 'support',
      isActive: true,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [new mongoose.Types.ObjectId(userId), admin._id],
        type: 'support',
        title: 'پشتیبانی اکسون موتور',
      });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Get support conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت مکالمه پشتیبانی',
    });
  }
};

/**
 * Get order conversation (creates if not exists)
 */
export const getOrderConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'سفارش یافت نشد',
      });
      return;
    }

    // Must have technician assigned
    if (!order.technicianId) {
      res.status(400).json({
        success: false,
        message: 'هنوز تکنسینی به این سفارش اختصاص نیافته',
      });
      return;
    }

    // Find or create conversation with technician
    let conversation = await Conversation.findOne({
      orderId: order._id,
      participants: { $all: [new mongoose.Types.ObjectId(userId), order.technicianId] },
      type: 'technician',
      isActive: true,
    });

    if (!conversation) {
      const technician = await User.findById(order.technicianId);
      conversation = await Conversation.create({
        orderId: order._id,
        participants: [new mongoose.Types.ObjectId(userId), order.technicianId],
        type: 'technician',
        title: `گفتگو با تکنسین ${technician?.name || ''} - سفارش ${order.orderNumber}`,
      });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error('Get order conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت مکالمه',
    });
  }
};
