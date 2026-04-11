import { v4 as uuidv4 } from 'uuid';
import Alert, { IAlert } from '../models/alert.model';
import { generateAlertMessage } from './aiModel.service';   // ← real AI call now

export const createAlertForCrime = async (crimeData: {
  crimeId:   string;
  cameraId:  string;
  location:  string;
  crimeType: string;
  severity:  'low' | 'medium' | 'high';
  aiSummary?: string;
}): Promise<IAlert | null> => {

  if (crimeData.severity === 'low') return null;

  const alertId = `alt_${uuidv4().split('-')[0]}`;

  // ── REAL AI call now — no more mock ──────────────────────────
  const message = await generateAlertMessage({
    crimeType: crimeData.crimeType,
    severity:  crimeData.severity,
    location:  crimeData.location,
    cameraId:  crimeData.cameraId,
  });
  // ─────────────────────────────────────────────────────────────

  const alert = await Alert.create({
    alertId,
    crimeId:   crimeData.crimeId,
    cameraId:  crimeData.cameraId,
    location:  crimeData.location,
    crimeType: crimeData.crimeType,
    severity:  crimeData.severity,
    status:    'active',
    sentVia:   ['websocket'],
    message,
  });

  return alert;
};