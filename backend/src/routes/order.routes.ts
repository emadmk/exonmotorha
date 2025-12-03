import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { uploadImage } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
// POST /api/orders - Create new order
router.post('/', orderController.createOrder);

// GET /api/orders/my - Get current user's orders
router.get('/my', orderController.getMyOrders);

// GET /api/orders/current - Get current active order
router.get('/current', orderController.getCurrentOrder);

// GET /api/orders/:orderId - Get single order
router.get('/:orderId', orderController.getOrder);

// PUT /api/orders/:orderId/cancel - Cancel order
router.put('/:orderId/cancel', orderController.cancelOrder);

// Technician routes
// GET /api/orders/assigned - Get assigned orders
router.get('/technician/assigned', authorize('technician', 'admin'), orderController.getAssignedOrders);

// PUT /api/orders/technician/:orderId - Update order (technician)
router.put('/technician/:orderId', authorize('technician', 'admin'), orderController.technicianUpdateOrder);

// POST /api/orders/technician/:orderId/photo - Upload photo (technician)
router.post(
  '/technician/:orderId/photo',
  authorize('technician', 'admin'),
  uploadImage.single('photo'),
  orderController.uploadOrderPhoto
);

// DELETE /api/orders/technician/:orderId/photo/:photoId - Delete photo (technician)
router.delete(
  '/technician/:orderId/photo/:photoId',
  authorize('technician', 'admin'),
  orderController.deleteOrderPhoto
);

// Admin routes
// GET /api/orders/admin/all - Get all orders
router.get('/admin/all', authorize('admin'), orderController.getAllOrders);

// PUT /api/orders/:orderId/status - Update order status
router.put('/:orderId/status', authorize('admin'), orderController.updateOrderStatus);

// PUT /api/orders/:orderId/assign - Assign technician
router.put('/:orderId/assign', authorize('admin'), orderController.assignTechnician);

// PUT /api/orders/:orderId/timeline/:stepId - Update timeline step
router.put('/:orderId/timeline/:stepId', authorize('admin', 'technician'), orderController.updateTimelineStep);

// PUT /api/orders/:orderId/cost - Update cost estimate
router.put('/:orderId/cost', authorize('admin'), orderController.updateCostEstimate);

export default router;
