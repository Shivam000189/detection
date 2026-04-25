import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware';
import { uploadVideo } from "../middleware/upload.middleware";
import {
  getAllCrimes,
  getCrimeById,
  detectCrime,
  createManualCrime,
  deleteCrime,
    getCrimeHotspots,
    getCrimeTrends,
    getCrimeAreaRisk,
} from '../controllers/crime.controller';

// ── Multer config for video uploads ──────────────────

const router = Router();

// ── All specific named routes FIRST ────────────────

// Stats
// router.get('/stats', protect, getCrimeStats);

// AI analysis routes
router.get('/hotspots', protect, getCrimeHotspots);
router.get('/trends', protect, getCrimeTrends);
router.get('/area-risk', protect, getCrimeAreaRisk);

// Detection & manual entry
router.post(
  "/detect",
  protect,
  authorize("admin", "police"),
  uploadVideo.single("video"), // ✅ use shared middleware
  detectCrime
);

router.post(
  '/manual',
  protect,
  authorize('admin', 'police'),
  createManualCrime
);

// ── Generic routes AFTER named routes ──────────────
router.get('/', protect, getAllCrimes);
router.get('/:id', protect, getCrimeById); // ✅ now safe

// ── Sub-resource routes ────────────────────────────
// router.patch('/:id/save', protect, authorize('admin', 'police'), saveCrime);
router.delete('/:id', protect, authorize('admin'), deleteCrime);



export default router;