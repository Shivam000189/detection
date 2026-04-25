import { v4 as uuidv4 } from "uuid";
import CrimeEvent from "../models/crime.model";
import Camera from "../models/camera.model";
import { createAlertForCrime } from "./alert.service";

interface DetectedEvent {
  crimeType: string;
  severity: "low" | "medium" | "high";
  confidenceScore: number;
  timestampInVideo?: string;
  thumbnailUrl?: string;
  aiSummary?: string;
}

export const saveDetectedCrimes = async (
  detectedEvents: DetectedEvent[],
  cameraId: string,
  location: string,
  file: Express.Multer.File
): Promise<any[]> => {
  const today = new Date();

  const dateStr = today.toISOString().split("T")[0] as string;
  const timeStr = today.toTimeString().split(" ")[0] as string;

  const savedCrimes = await Promise.all(
    detectedEvents.map(async (event) => {
      const crime = await CrimeEvent.create({
        crimeId: `crm_${uuidv4().split("-")[0]}`,
        cameraId,
        location,
        crimeType: event.crimeType,
        severity: event.severity,
        confidenceScore: event.confidenceScore,
        date: dateStr,
        time: event.timestampInVideo || timeStr,
        videoClipUrl: `/uploads/videos/${file.filename}`,
        thumbnailUrl: event.thumbnailUrl,
        aiSummary: event.aiSummary,
        tags: [event.crimeType, "auto-detected"],
      } as any); // mongoose typing workaround

      await createAlertForCrime({
            crimeId: crime.crimeId,
            cameraId,
            location,
            crimeType: crime.crimeType,
            severity: crime.severity,
            ...(crime.aiSummary ? { aiSummary: crime.aiSummary } : {}),
            });

      return crime;
    })
  );

  await Camera.findOneAndUpdate(
    { cameraId },
    { lastActive: new Date() }
  );

  return savedCrimes;
};