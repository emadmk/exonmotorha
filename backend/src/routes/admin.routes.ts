import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Public route
// GET /api/admin/stats/public - Get public statistics (for landing)
router.get('/stats/public', adminController.getPublicStats);

// All other routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', adminController.getDashboardStats);

// Technician management
// GET /api/admin/technicians - Get all technicians
router.get('/technicians', adminController.getTechnicians);

// POST /api/admin/technicians - Create new technician
router.post('/technicians', adminController.createTechnician);

// PUT /api/admin/technicians/:technicianId - Update technician
router.put('/technicians/:technicianId', adminController.updateTechnician);

// DELETE /api/admin/technicians/:technicianId - Delete technician
router.delete('/technicians/:technicianId', adminController.deleteTechnician);

// Broadcast
// POST /api/admin/broadcast - Send broadcast notification
router.post('/broadcast', adminController.sendBroadcast);

export default router;
