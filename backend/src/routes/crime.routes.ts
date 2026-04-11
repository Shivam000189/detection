import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middleware/auth.middleware';
import {
  getAllCrimes,
  getCrimeStats,
  getCrimeById,
  detectCrime,
  createManualCrime,
  saveCrime,
  deleteCrime,
    getCrimeHotspots,
    getCrimeTrends,
    getCrimeAreaRisk,
} from '../controllers/crime.controller';

// ── Multer config for video uploads ──────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/videos/'),
  filename: (req, file, cb) =>
    cb(null, `vid_${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.mp4', '.avi', '.mkv', '.mov'];
    allowed.includes(path.extname(file.originalname).toLowerCase())
      ? cb(null, true)
      : cb(new Error('Only video files allowed: mp4, avi, mkv, mov'));
  },
});

const router = Router();

// Stats — must come BEFORE /:id to avoid route conflict
router.get('/stats',   protect, getCrimeStats);

// Main CRUD
router.get('/',        protect, getAllCrimes);
router.get('/:id',     protect, getCrimeById);

// Detection — police + admin
router.post(
  '/detect',
  protect,
  authorize('admin', 'police'),
  upload.single('video'),
  detectCrime
);

// Manual entry — police + admin
router.post(
  '/manual',
  protect,
  authorize('admin', 'police'),
  createManualCrime
);

router.get('/hotspots', protect, getCrimeHotspots);
router.get('/trends',   protect, getCrimeTrends);
router.get('/hotspots', protect, getCrimeHotspots);


router.get('/area-risk', protect, getCrimeAreaRisk);
router.get('/trends',    protect, getCrimeTrends);
router.get('/hotspots',  protect, getCrimeHotspots);

// Save / unsave as case
router.patch('/:id/save',   protect, authorize('admin', 'police'), saveCrime);
// router.patch('/:id/unsave', protect, authorize('admin', 'police'), unsaveCrime);

// Delete — admin only
router.delete('/:id', protect, authorize('admin'), deleteCrime);

export default router;