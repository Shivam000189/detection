import axios from 'axios';

const AI_URL = process.env.AI_MODEL_URL || 'http://localhost:5001';

// ─────────────────────────────────────────────────────────────────
//  All functions in this file are the ONLY place that talks
//  to the Python AI model. Backend controllers just call these.
// ─────────────────────────────────────────────────────────────────

export interface PredictionResult {
  predicted_crime: string;
  probability:     number;
  risk_level:      'LOW' | 'MEDIUM' | 'HIGH';
  recommendation:  string;
  aiSummary:       string;
  input_summary: {
    location:    string;
    time:        string;
    weapon_used: string;
  };
}

export interface DetectionResult {
  crimeType:        string;
  severity:         string;
  confidenceScore:  number;
  timestampInVideo: string;
  thumbnailUrl?:    string;
  aiSummary?:       string;
    recommendation?: string;
}



export interface HotspotResult {
  success:       boolean;
  cityFilter:    string;
  totalHotspots: number;
  aiSummary?:    string;
  hotspots: {
    area:             string;
    riskScore:        number;
    riskLevel:        'LOW' | 'MEDIUM' | 'HIGH';
    totalCrimes:      number;
    mostCommonCrime:  string;
    topCrimeTypes:    string[];
    peakTime:         string;
    recommendation:   string;
  }[];
  summary: {
    totalCrimesAnalyzed: number;
    mostDangerousArea:   string;
    mostCommonCrime:     string;
    topN:                number;
  };
}


export interface TrendResult {
  success: boolean;
  filters: {
    groupBy:    string;
    city:       string;
    crimeType:  string;
    startDate:  string;
    endDate:    string;
  };
  summary: {
    totalCrimes:       number;
    mostCommonCrime:   string;
    trendDirection:    'increasing' | 'decreasing' | 'stable';
    peakPeriod:        string;
    leastActivePeriod: string;
    mostDangerousTime: string;
    mostDangerousDay:  string;
  };
  aiSummary:          string;
  trends:             Record<string, any>[];
  crimeDistribution:  { crimeType: string; count: number }[];
  timeSlotAnalysis:   { timeSlot:  string; totalCrimes: number }[];
  weekdayAnalysis:    { weekday:   string; totalCrimes: number }[];
  weaponStats:        { weapon:    string; count: number }[];
  cityBreakdown:      { city:      string; totalCrimes: number }[];
}


export interface AreaRiskResult {
  success:    boolean;
  city:       string;
  timeFilter: string;
  riskScore:  number;
  riskLevel:  'VERY LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskColor:  string;
  aiSummary:  string;
  scoreBreakdown: {
    crimeVolume: number;
    severity:    number;
    recency:     number;
    timePattern: number;
  };
  summary: {
    totalCrimes:       number;
    mostCommonCrime:   string;
    topCrimes:         string[];
    mostDangerousTime: string;
    safestTime:        string;
    recommendation:    string;
  };
  crimeBreakdown:   { crimeType: string; count: number; percentage: number }[];
  timeBreakdown:    { timeSlot:  string; count: number; percentage: number }[];
  weekdayBreakdown: { weekday:   string; count: number }[];
  monthlyTrend:     { month:     string; totalCrimes: number }[];
  weaponStats:      { weapon:    string; count: number }[];
}

// ── POST /predict-crime ───────────────────────────────────────────
export const predictCrime = async (payload: {
  location:         string;
  time:             string;
  victim_age?:      number;
  victim_gender?:   string;
  weapon_used?:     string;
  crime_domain?:    string;
  police_deployed?: number;
}): Promise<PredictionResult> => {
  try {
    const response = await axios.post(
      `${AI_URL}/predict-crime`,
      payload,
      { timeout: 30000 }
    );
    return response.data;
  } catch (error: any) {
    console.error('[AI Model - predictCrime]:', error.message);
    throw new Error(
      error.response?.data?.error || 'AI prediction service unavailable'
    );
  }
};

// ── POST /detect ──────────────────────────────────────────────────
export const runVideoDetection = async (
  videoPath: string,
  cameraId:  string,
  location:  string
): Promise<DetectionResult[]> => {
  try {
    const response = await axios.post(
      `${AI_URL}/detect`,
      { videoPath, cameraId, location },
      { timeout: 120000 }
    );
    return response.data.detectedEvents || [];
  } catch (error: any) {
    console.error('[AI Model - runVideoDetection]:', error.message);
    throw new Error(
      error.response?.data?.error || 'AI detection service unavailable'
    );
  }
};

// ── POST /generate-alert ──────────────────────────────────────────
export const generateAlertMessage = async (crimeData: {
  crimeType: string;
  severity:  string;
  location:  string;
  cameraId:  string;
}): Promise<string> => {
  try {
    const response = await axios.post(
      `${AI_URL}/generate-alert`,
      crimeData,
      { timeout: 15000 }
    );
    return response.data.message;
  } catch (error: any) {
    console.error('[AI Model - generateAlertMessage]:', error.message);
    // Fallback message — backend still works even if AI is down
    return (
      `${crimeData.severity.toUpperCase()} severity ` +
      `${crimeData.crimeType} detected at ${crimeData.location}. ` +
      `Immediate attention required.`
    );
  }
};


export const predictHotspots = async (payload: {
  city?:  string;
  topN?:  number;
}): Promise<HotspotResult> => {
  try {
    const response = await axios.post(
      `${AI_URL}/predict-hotspot`,
      payload,
      { timeout: 30000 }
    );
    return response.data;
  } catch (error: any) {
    console.error('[AI Model - predictHotspots]:', error.message);
    throw new Error(
      error.response?.data?.error || 'Hotspot prediction service unavailable'
    );
  }
};


export const analyzeTrends = async (payload: {
  groupBy?:   string;
  city?:      string;
  crimeType?: string;
  startDate?: string;
  endDate?:   string;
}): Promise<TrendResult> => {
  try {
    const response = await axios.post(
      `${AI_URL}/analyze-trends`,
      payload,
      { timeout: 30000 }
    );
    return response.data;
  } catch (error: any) {
    console.error('[AI Model - analyzeTrends]:', error.message);
    throw new Error(
      error.response?.data?.error || 'Trend analysis service unavailable'
    );
  }
};


export const getAreaRisk = async (payload: {
  city:        string;
  timeOfDay?:  string;
}): Promise<AreaRiskResult> => {
  try {
    const response = await axios.post(
      `${AI_URL}/area-risk`,
      payload,
      { timeout: 30000 }
    );
    return response.data;
  } catch (error: any) {
    console.error('[AI Model - getAreaRisk]:', error.message);
    throw new Error(
      error.response?.data?.error || 'Area risk service unavailable'
    );
  }
};