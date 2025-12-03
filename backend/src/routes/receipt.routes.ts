import { Router } from 'express';
import * as receiptController from '../controllers/receipt.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
// GET /api/receipts - Get user's receipts
router.get('/', receiptController.getReceipts);

// GET /api/receipts/:receiptId - Get single receipt
router.get('/:receiptId', receiptController.getReceipt);

// GET /api/receipts/order/:orderId - Get receipts for order
router.get('/order/:orderId', receiptController.getOrderReceipts);

// POST /api/receipts/:receiptId/pay - Initialize payment
router.post('/:receiptId/pay', receiptController.initPayment);

// GET /api/receipts/:receiptId/verify - Verify payment
router.get('/:receiptId/verify', receiptController.verifyPayment);

// Admin routes
// POST /api/receipts - Create receipt
router.post('/', authorize('admin'), receiptController.createReceipt);

// PUT /api/receipts/:receiptId - Update receipt
router.put('/:receiptId', authorize('admin'), receiptController.updateReceipt);

// PUT /api/receipts/:receiptId/paid - Mark as paid manually
router.put('/:receiptId/paid', authorize('admin'), receiptController.markAsPaid);

export default router;
