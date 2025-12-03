import { Router } from 'express';
import * as messageController from '../controllers/message.controller';
import { authenticate } from '../middleware/auth.middleware';

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

// GET /api/messages/:conversationId - Get messages in conversation
router.get('/:conversationId', messageController.getMessages);

// POST /api/messages/:conversationId - Send message
router.post('/:conversationId', messageController.sendMessage);

// PUT /api/messages/:conversationId/read - Mark messages as read
router.put('/:conversationId/read', messageController.markAsRead);

export default router;
