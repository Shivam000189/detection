import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getAllCameras,
  getCameraById,
  createCamera,
  updateCameraStatus,
  updateCamera,
  deleteCamera,
  getCameraStats,
} from '../controllers/camera.controller';

const router = Router();

// Public-ish (any authenticated user)
router.get('/stats', protect, getCameraStats);
router.get('/', protect, getAllCameras);
router.get('/:id', protect, getCameraById);

// Admin only
router.post('/', protect, authorize('admin'), createCamera);
router.patch('/:id/status', protect, authorize('admin'), updateCameraStatus);
router.patch('/:id', protect, authorize('admin'), updateCamera);
router.delete('/:id', protect, authorize('admin'), deleteCamera);

export default router;