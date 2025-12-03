import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadImage } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/vehicles - Get all vehicles for current user
router.get('/', vehicleController.getVehicles);

// GET /api/vehicles/:vehicleId - Get single vehicle
router.get('/:vehicleId', vehicleController.getVehicle);

// POST /api/vehicles - Create new vehicle
router.post('/', vehicleController.createVehicle);

// PUT /api/vehicles/:vehicleId - Update vehicle
router.put('/:vehicleId', vehicleController.updateVehicle);

// DELETE /api/vehicles/:vehicleId - Delete vehicle
router.delete('/:vehicleId', vehicleController.deleteVehicle);

// POST /api/vehicles/:vehicleId/image - Upload vehicle image
router.post(
  '/:vehicleId/image',
  uploadLimiter,
  uploadImage.single('image'),
  vehicleController.uploadVehicleImage
);

// PUT /api/vehicles/:vehicleId/default - Set vehicle as default
router.put('/:vehicleId/default', vehicleController.setDefaultVehicle);

export default router;
