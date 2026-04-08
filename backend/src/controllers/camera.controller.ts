import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import Camera from '../models/camera.model';

// ─── GET /cameras ────────────────────────────────────────────────
export const getAllCameras = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, location, page = '1', limit = '10' } = req.query;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: 'i' };

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [cameras, total] = await Promise.all([
      Camera.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Camera.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: cameras,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /cameras/:id ────────────────────────────────────────────
export const getCameraById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cameraId = req.params.id as string;
    const camera = await Camera.findOne({ cameraId });

    if (!camera) {
      return next(new AppError(`Camera '${req.params.id}' not found`, 404));
    }

    res.status(200).json({ success: true, data: camera });
  } catch (error) {
    next(error);
  }
};

// ─── POST /cameras ───────────────────────────────────────────────
export const createCamera = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cameraId, location, ipAddress, installationDate } = req.body;

    // Check duplicate cameraId or ipAddress
    const existing = await Camera.findOne({
      $or: [{ cameraId }, { ipAddress }],
    });

    if (existing) {
      return next(
        new AppError(
          existing.cameraId === cameraId
            ? `Camera ID '${cameraId}' already exists`
            : `IP address '${ipAddress}' already registered`,
          409
        )
      );
    }

    const camera = await Camera.create({
      cameraId,
      location,
      ipAddress,
      installationDate,
      status: 'active',
      lastActive: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Camera registered successfully',
      data: camera,
    });
  } catch (error: any) {
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return next(new AppError(messages.join(', '), 400));
    }
    next(error);
  }
};

// ─── PATCH /cameras/:id/status ───────────────────────────────────
export const updateCameraStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return next(new AppError("Status must be 'active' or 'inactive'", 400));
    }

    const cameraId = req.params.id as string;

    const camera = await Camera.findOneAndUpdate(
      { cameraId },
      {
        status,
        ...(status === 'active' && { lastActive: new Date() }),
      },
      { new: true }
    );

    if (!camera) {
      return next(new AppError(`Camera '${req.params.id}' not found`, 404));
    }

    res.status(200).json({
      success: true,
      message: `Camera marked as ${status}`,
      data: camera,
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /cameras/:id ──────────────────────────────────────────
export const updateCamera = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const allowedUpdates = ['location', 'ipAddress', 'installationDate'];
    const updates: Record<string, any> = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (Object.keys(updates).length === 0) {
      return next(new AppError('No valid fields provided to update', 400));
    }

    const cameraId = req.params.id as string;

    const camera = await Camera.findOneAndUpdate(
      { cameraId },
      updates,
      { new: true, runValidators: true }
    );

    if (!camera) {
      return next(new AppError(`Camera '${req.params.id}' not found`, 404));
    }

    res.status(200).json({
      success: true,
      message: 'Camera updated successfully',
      data: camera,
    });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /cameras/:id ─────────────────────────────────────────
export const deleteCamera = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cameraId = req.params.id as string;
    const camera = await Camera.findOneAndDelete({ cameraId });

    if (!camera) {
      return next(new AppError(`Camera '${req.params.id}' not found`, 404));
    }

    res.status(200).json({
      success: true,
      message: `Camera '${req.params.id}' removed successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /cameras/stats ──────────────────────────────────────────
export const getCameraStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [total, active, inactive] = await Promise.all([
      Camera.countDocuments(),
      Camera.countDocuments({ status: 'active' }),
      Camera.countDocuments({ status: 'inactive' }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, active, inactive },
    });
  } catch (error) {
    next(error);
  }
};