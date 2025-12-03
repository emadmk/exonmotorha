import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/messages/conversations - Get user's conversations
router.get('/conversations', messageController.getConversations);

// POST /api/messages/conversations - Get or create conversation
router.post('/conversations', messageController.getOrCreateConversation);

// GET /api/messages/support - Get support conversation
router.get('/support', messageController.getSupportConversation);

// GET /api/messages/order/:orderId - Get order conversation
router.get('/order/:orderId', messageController.getOrderConversation);

// POST /api/messages/order/:orderId/start - Start order chat
router.post('/order/:orderId/start', messageController.startOrderChat);

// Admin routes - must be before :conversationId routes
// GET /api/messages/admin/conversations - Get all conversations (Admin only)
router.get('/admin/conversations', authorize('admin'), messageController.getAllConversations);

// DELETE /api/messages/admin/:conversationId - Delete conversation (Admin only)
router.delete('/admin/:conversationId', authorize('admin'), messageController.deleteConversation);

// DELETE /api/messages/admin/:conversationId/messages/:messageId - Delete message (Admin only)
router.delete('/admin/:conversationId/messages/:messageId', authorize('admin'), messageController.deleteMessage);

// GET /api/messages/:conversationId - Get messages in conversation
router.get('/:conversationId', messageController.getMessages);

// POST /api/messages/:conversationId - Send message
router.post('/:conversationId', messageController.sendMessage);

// PUT /api/messages/:conversationId/read - Mark messages as read
router.put('/:conversationId/read', messageController.markAsRead);

export default router;
