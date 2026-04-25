import { Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../middleware/auth.middleware";
import { AppError } from "../middleware/error.middleware";
import CrimeEvent from "../models/crime.model";
import Camera from "../models/camera.model";
import {
  runVideoDetection,
  predictHotspots,
  analyzeTrends,
  getAreaRisk,
} from "../services/aiModel.service";
import { createAlertForCrime } from "../services/alert.service";
import { saveDetectedCrimes } from "../services/crime.service";

// ─────────────────────────────
// GET ALL CRIMES
// ─────────────────────────────
export const getAllCrimes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");

    const skip = (page - 1) * limit;

    const [crimes, total] = await Promise.all([
      CrimeEvent.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
      CrimeEvent.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: crimes,
    });
    return;
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────
// GET CRIME BY ID
// ─────────────────────────────
export const getCrimeById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const crimeId = req.params.id as string;

    const crime = await CrimeEvent.findOne({ crimeId });

    if (!crime) {
      return next(new AppError("Crime not found", 404));
    }

    res.status(200).json({
      success: true,
      data: crime,
    });
    return;
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────
// DETECT CRIME
// ─────────────────────────────
export const detectCrime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cameraId, location } = req.body;
    const file = req.file;

    if (!cameraId || !location) {
      return next(new AppError("cameraId and location required", 400));
    }

    if (!file) {
      return next(new AppError("Video file is required", 400));
    }

    const camera = await Camera.findOne({ cameraId });
    if (!camera) {
      return next(new AppError("Camera not found", 404));
    }

    const detectedEvents = await runVideoDetection(
      file.path,
      cameraId,
      location
    );

    if (!detectedEvents || detectedEvents.length === 0) {
      res.status(200).json({
        success: true,
        message: "No criminal activity detected",
        totalDetected: 0,
        detectedEvents: [],
      });
      return;
    }

    // normalize severity (important for TS)
    const normalizedEvents = detectedEvents.map((event: any) => ({
      ...event,
      severity:
        event.severity === "high"
          ? "high"
          : event.severity === "medium"
          ? "medium"
          : "low",
    }));

    const savedCrimes = await saveDetectedCrimes(
      normalizedEvents,
      cameraId,
      location,
      file
    );

    res.status(200).json({
      success: true,
      message: "Detection complete",
      totalDetected: savedCrimes.length,
      detectedEvents: savedCrimes,
    });
    return;
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────
// MANUAL CRIME
// ─────────────────────────────
export const createManualCrime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cameraId, location, crimeType, severity } = req.body;

    if (!cameraId || !location || !crimeType || !severity) {
      return next(new AppError("Missing required fields", 400));
    }

    const crime = await CrimeEvent.create({
      crimeId: `crm_${uuidv4().split("-")[0]}`,
      cameraId,
      location,
      crimeType,
      severity,
      confidenceScore: 1,
      date: new Date().toISOString().split("T")[0] as string,
      time: new Date().toTimeString().split(" ")[0] as string,
      tags: [crimeType, "manual"],
    } as any);

    await createAlertForCrime({
      crimeId: crime.crimeId,
      cameraId,
      location,
      crimeType,
      severity,
    });

    res.status(201).json({
      success: true,
      message: "Crime created",
      data: crime,
    });
    return;
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────
// DELETE CRIME
// ─────────────────────────────
export const deleteCrime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const crimeId = req.params.id as string;

    const crime = await CrimeEvent.findOneAndDelete({ crimeId });

    if (!crime) {
      return next(new AppError("Crime not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Crime deleted",
    });
    return;
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────
// AI ROUTES
// ─────────────────────────────

export const getCrimeHotspots = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await predictHotspots({
      city: req.query.city as string,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getCrimeTrends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await analyzeTrends({
      city: req.query.city as string,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getCrimeAreaRisk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await getAreaRisk({
      city: req.query.city as string,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};