import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { Message, Conversation, User } from '../models';
import mongoose from 'mongoose';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

let io: Server;

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join conversation room
    socket.on('join:conversation', async (conversationId: string) => {
      try {
        // Verify user is participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: new mongoose.Types.ObjectId(socket.userId),
        });

        if (conversation) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${socket.userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Join conversation error:', error);
      }
    });

    // Leave conversation room
    socket.on('leave:conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Send message
    socket.on('message:send', async (data: { conversationId: string; text: string }) => {
      try {
        const { conversationId, text } = data;

        if (!text?.trim()) return;

        // Verify user is participant
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: new mongoose.Types.ObjectId(socket.userId),
        });

        if (!conversation) return;

        // Determine sender type
        const user = await User.findById(socket.userId);
        let senderType: 'user' | 'technician' | 'admin' = 'user';
        if (user?.role === 'technician') senderType = 'technician';
        if (user?.role === 'admin') senderType = 'admin';

        // Create message
        const message = await Message.create({
          conversationId,
          senderId: new mongoose.Types.ObjectId(socket.userId),
          senderType,
          text: text.trim(),
          status: 'sent',
        });

        // Update conversation
        conversation.lastMessage = text.trim().substring(0, 100);
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Populate sender
        await message.populate('senderId', 'name avatar role');

        // Emit to conversation room
        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Notify other participants
        conversation.participants.forEach((participantId) => {
          if (participantId.toString() !== socket.userId) {
            io.to(`user:${participantId}`).emit('conversation:updated', {
              conversationId,
              lastMessage: text.trim().substring(0, 100),
              lastMessageAt: new Date(),
            });
          }
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing:start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: socket.userId,
      });
    });

    // Mark messages as read
    socket.on('messages:read', async (conversationId: string) => {
      try {
        await Message.updateMany(
          {
            conversationId,
            senderId: { $ne: new mongoose.Types.ObjectId(socket.userId) },
            status: { $ne: 'read' },
          },
          {
            status: 'read',
            readAt: new Date(),
          }
        );

        socket.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          readBy: socket.userId,
        });
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

// Helper functions to emit events from controllers
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToConversation = (conversationId: string, event: string, data: any): void => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};

export const emitOrderUpdate = (userId: string, orderId: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit('order:updated', { orderId, ...data });
  }
};

export const emitNotification = (userId: string, notification: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
};

export const getIO = (): Server => io;
