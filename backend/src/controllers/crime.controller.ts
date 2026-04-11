import { Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import CrimeEvent from '../models/crime.model';
import Camera from '../models/camera.model';
import { predictCrime, runVideoDetection, predictHotspots, analyzeTrends, getAreaRisk } from '../services/aiModel.service';
import { createAlertForCrime } from '../services/alert.service';

const getSeverityFromScore = (score: number): 'low' | 'medium' | 'high' => {
  if (score >= 0.85) return 'high';
  if (score >= 0.60) return 'medium';
  return 'low';
};

// GET /crimes 
export const getAllCrimes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      page = '1', limit = '20',
      crimeType, severity, cameraId,
      location, isSaved, startDate, endDate,
      sortBy = 'createdAt', order = 'desc',
    } = req.query;

    const filter: Record<string, any> = {};
    if (crimeType)  filter.crimeType = crimeType;
    if (severity)   filter.severity = severity;
    if (cameraId)   filter.cameraId = cameraId;
    if (isSaved !== undefined) filter.isSaved = isSaved === 'true';
    if (location)   filter.location = { $regex: location, $options: 'i' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate)   filter.date.$lte = endDate;
    }

    const pageNum  = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip     = (pageNum - 1) * limitNum;

    const [crimes, total] = await Promise.all([
      CrimeEvent.find(filter)
        .sort({ [sortBy as string]: order === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limitNum),
      CrimeEvent.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: crimes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /crimes/stats
export const getCrimeStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0] as string;

    const [total, todayCount, bySeverity, byType, saved] = await Promise.all([
      CrimeEvent.countDocuments(),
      CrimeEvent.countDocuments({ date: today }),
      CrimeEvent.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
      CrimeEvent.aggregate([{ $group: { _id: '$crimeType', count: { $sum: 1 } } }]),
      CrimeEvent.countDocuments({ isSaved: true }),
    ]);

    const severityMap: Record<string, number> = {};
    bySeverity.forEach((s) => (severityMap[s._id] = s.count));

    const typeMap: Record<string, number> = {};
    byType.forEach((t) => (typeMap[t._id] = t.count));

    res.status(200).json({
      success: true,
      data: {
        totalCrimes: total,
        todayCrimes: todayCount,
        savedCases: saved,
        bySeverity: {
          low:    severityMap['low']    || 0,
          medium: severityMap['medium'] || 0,
          high:   severityMap['high']   || 0,
        },
        byType: typeMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /crimes/:id
export const getCrimeById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const crimeId = req.params.id as string;
    const crime = await CrimeEvent.findOne({ crimeId });
    if (!crime) return next(new AppError(`Crime '${req.params.id}' not found`, 404));
    res.status(200).json({ success: true, data: crime });
  } catch (error) {
    next(error);
  }
};

// ─── POST /crimes/detect (video upload)
export const detectCrime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cameraId, location } = req.body;
    const  file  = req.file;

    const camera = await Camera.findOne({ cameraId });
    if (!camera) return next(new AppError(`Camera '${cameraId}' not found`, 404));
    if (!file)   return next(new AppError('Video file is required', 400));

    const today   = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const timeStr = today.toTimeString().split(' ')[0];

    // ── Call Python AI model
    const detectedEvents = await runVideoDetection(file.path, cameraId, location);

    if (detectedEvents.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No criminal activity detected',
        detectedEvents: [],
        totalDetected: 0,
      });
      return;
    }

    // Save each event returned from Python
    const savedCrimes = await Promise.all(
      detectedEvents.map(async (event) => {
        return CrimeEvent.create({
          crimeId:         `crm_${uuidv4().split('-')[0]}`,
          cameraId,
          location,
          crimeType:       event.crimeType,
          severity:        event.severity || getSeverityFromScore(event.confidenceScore),
          confidenceScore: event.confidenceScore,
          date:            dateStr,
          time:            event.timestampInVideo || timeStr,
          videoClipUrl:    `/uploads/videos/${file.filename}`,
          thumbnailUrl:    event.thumbnailUrl,
          aiSummary:       event.aiSummary,        // ← came from Python/Gemini
          recommendation:  event.recommendation,   // ← came from Python
          tags: [event.crimeType, 'auto-detected', location.split(',')[0].trim()],
        } as any);
      })
    );

    // Update camera lastActive
    await Camera.findOneAndUpdate({ cameraId }, { lastActive: new Date() });

    res.status(200).json({
      success: true,
      message: 'Detection complete',
      totalDetected: savedCrimes.length,
      detectedEvents: savedCrimes,
    });
  } catch (error) {
    next(error);
  }
};

//  POST /crimes/predict 
// Predict crime risk for a location+time without a video
export const predictCrimeRisk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      location, time,
      victim_age, victim_gender,
      weapon_used, crime_domain, police_deployed,
    } = req.body;

    if (!location || !time) {
      return next(new AppError('location and time are required', 400));
    }

    // ── Call your Python /predict-crime endpoint
    const result = await predictCrime({
      location, time,
      victim_age, victim_gender,
      weapon_used, crime_domain, police_deployed,
    });

    res.status(200).json({
      success: true,
      data: result,
      // result already has: predicted_crime, probability,
      // risk_level, recommendation, input_summary
    });
  } catch (error) {
    next(error);
  }
};

// ─── POST /crimes/manual 
export const createManualCrime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      cameraId, location, crimeType,
      severity, date, time, description,
    } = req.body;

    const camera = await Camera.findOne({ cameraId });
    if (!camera) return next(new AppError(`Camera '${cameraId}' not found`, 404));

    const crime = await CrimeEvent.create({
      crimeId:     `crm_${uuidv4().split('-')[0]}`,
      cameraId,
      location,
      crimeType,
      severity,
      confidenceScore: 1.0,
      date,
      time,
      aiSummary:   description,
      tags:        [crimeType, severity, 'manual-entry'],
    });


    await createAlertForCrime({
        crimeId: crime.crimeId,
        cameraId: crime.cameraId,
        location: crime.location,
        crimeType: crime.crimeType,
        severity: crime.severity,
        ...(crime.aiSummary && { aiSummary: crime.aiSummary }),
        });

    res.status(201).json({
      success: true,
      message: 'Crime logged manually',
      data: crime,
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e: any) => e.message);
      return next(new AppError(messages.join(', '), 400));
    }
    next(error);
  }
};

// ─── PATCH /crimes/:id/save
export const saveCrime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { remarks, tags } = req.body;
    const crimeId = req.params.id as string;
    const crime = await CrimeEvent.findOneAndUpdate(
      { crimeId },
      {
        isSaved:      true,
        savedBy:      req.user?.userId,
        savedRemarks: remarks,
        ...(tags && { $addToSet: { tags: { $each: tags } } }),
      },
      { new: true }
    );
    if (!crime) return next(new AppError(`Crime '${req.params.id}' not found`, 404));
    res.status(200).json({ success: true, message: 'Saved as case', data: crime });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /crimes/:id 
export const deleteCrime = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const crimeId = req.params.id as string;
    const crime = await CrimeEvent.findOneAndDelete({ crimeId });
    if (!crime) return next(new AppError(`Crime '${req.params.id}' not found`, 404));



    res.status(200).json({ success: true, message: `Crime deleted` });
  } catch (error) {
    next(error);
  }
};

// crime/hotspots?city=Mathura?topN=5
export const getCrimeHotspots = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const city  = req.query.city  as string | undefined;
    const topN  = req.query.topN  ? parseInt(req.query.topN as string) : 5;

    // ── Call Python /predict-hotspot ──────────────────────────────
    const result = await predictHotspots({ city:city as string , topN });

    res.status(200).json({
      success: true,
      data:    result,
    });
  } catch (error) {
    next(error);
  }
};


// ── ADD controller ────────────────────────────────────────────────
// GET /crimes/trends?groupBy=month&city=Mathura&crimeType=theft
export const getCrimeTrends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      groupBy,
      city,
      crimeType,
      startDate,
      endDate,
    } = req.query;

    const result = await analyzeTrends({
      groupBy:   groupBy   as string,
      city:      city      as string,
      crimeType: crimeType as string,
      startDate: startDate as string,
      endDate:   endDate   as string,
    });

    res.status(200).json({
      success: true,
      data:    result,
    });
  } catch (error) {
    next(error);
  }
};


export const getCrimeAreaRisk = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { city, timeOfDay } = req.query;

    if (!city) {
      return next(new AppError('city query param is required', 400));
    }

    const result = await getAreaRisk({
      city:       city      as string,
      timeOfDay:  timeOfDay as string,
    });

    res.status(200).json({
      success: true,
      data:    result,
    });
  } catch (error) {
    next(error);
  }
};