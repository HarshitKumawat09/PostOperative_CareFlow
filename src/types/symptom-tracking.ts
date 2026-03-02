// 📊 SYMPTOM TRACKING DATA STRUCTURES
// Integrates with Recovery Intelligence for post-surgery monitoring

export interface SymptomEntry {
  id: string;
  timestamp: Date;
  patientId: string;
  surgeryType?: string;
  postOpDay?: number;
  symptoms: SymptomData[];
  medications: MedicationEntry[];
  notes?: string;
  mood?: MoodLevel;
  overallWellbeing?: number; // 1-10 scale
  createdAt: Date;
  updatedAt: Date;
}

export interface SymptomData {
  id: string;
  symptomType: SymptomType;
  severity: number; // 0-10 scale
  description?: string;
  location?: string; // e.g., "left knee", "incision site"
  duration?: string; // e.g., "2 hours", "constant"
  triggers?: string[]; // e.g., ["walking", "stairs"]
  relief?: string[]; // e.g., ["rest", "medication"]
  measurements?: SymptomMeasurements;
}

export interface SymptomMeasurements {
  temperature?: number; // Celsius
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number; // BPM
  oxygenSaturation?: number; // %
  weight?: number; // kg
  swelling?: {
    measurement: number; // cm
    unit: string;
  };
  rangeOfMotion?: {
    flexion: number; // degrees
    extension: number; // degrees
  };
}

export interface MedicationEntry {
  id: string;
  name: string;
  dosage: string;
  timeTaken: Date;
  takenAsPrescribed: boolean;
  sideEffects?: string[];
  effectiveness?: number; // 1-10 scale
}

export type SymptomType = 
  | 'pain'
  | 'fever'
  | 'swelling'
  | 'stiffness'
  | 'fatigue'
  | 'nausea'
  | 'dizziness'
  | 'shortness_of_breath'
  | 'chest_pain'
  | 'wound_drainage'
  | 'numbness'
  | 'weakness'
  | 'insomnia'
  | 'constipation'
  | 'diarrhea'
  | 'headache'
  | 'muscle_spasms'
  | 'redness'
  | 'warmth'
  | 'other';

export type MoodLevel = 'very_poor' | 'poor' | 'fair' | 'good' | 'very_good';

export interface SymptomTrend {
  symptomType: SymptomType;
  entries: TrendEntry[];
  trend: 'improving' | 'stable' | 'worsening';
  averageSeverity: number;
  changeRate: number; // change per day
  expectedRange?: {
    min: number;
    max: number;
    basedOnRecoveryIntelligence: boolean;
  };
}

export interface TrendEntry {
  date: Date;
  value: number;
  postOpDay?: number;
  expectedValue?: number; // from recovery intelligence
}

export interface RiskAlert {
  id: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  type: 'symptom_trend' | 'threshold_breach' | 'medication_issue' | 'recovery_deviation';
  title: string;
  description: string;
  recommendations: string[];
  detectedAt: Date;
  acknowledged: boolean;
  reviewedByStaff?: boolean;
  reviewedAt?: Date;
  reviewedBy?: string;
  staffRemark?: string;
  requiresMedicalAttention: boolean;
  relatedSymptoms?: SymptomType[];
  clinicalRules?: string[]; // IDs of recovery intelligence rules triggered
}

export interface RecoveryProgress {
  surgeryType: string;
  postOpDay: number;
  currentPhase: string;
  overallProgress: number; // 0-100%
  milestones: MilestoneProgress[];
  symptomComparison: SymptomComparison[];
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  nextMilestone?: {
    day: number;
    milestone: string;
    daysUntil: number;
  };
}

export interface MilestoneProgress {
  day: number;
  milestone: string;
  expectedStatus: 'achieved' | 'partial' | 'not_expected';
  actualStatus?: 'achieved' | 'partial' | 'not_achieved';
  achievedDate?: Date;
  notes?: string;
}

export interface SymptomComparison {
  symptomType: SymptomType;
  currentSeverity: number;
  expectedSeverity: number;
  status: 'better' | 'as_expected' | 'worse';
  deviation: number;
}

export interface SymptomReport {
  id: string;
  patientId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalEntries: number;
    averagePain: number;
    peakSymptoms: SymptomType[];
    improvementAreas: SymptomType[];
    concernAreas: SymptomType[];
  };
  trends: SymptomTrend[];
  alerts: RiskAlert[];
  recommendations: string[];
  generatedAt: Date;
  shareWithProviders: boolean;
  shareWithFamily: boolean;
}

export interface SymptomGoals {
  id: string;
  symptomType: SymptomType;
  targetSeverity: number;
  targetDate: Date;
  currentProgress: number; // 0-100%
  achieved: boolean;
  achievedDate?: Date;
}

export interface SymptomTrackingPreferences {
  reminderTimes: string[]; // e.g., ["09:00", "14:00", "20:00"]
  trackSymptoms: SymptomType[];
  alertThresholds: {
    [key in SymptomType]?: {
      severity: number;
      consecutiveDays: number;
    };
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  sharing: {
    withProviders: boolean;
    withFamily: boolean;
    familyMembers: string[];
  };
}

// Integration with Recovery Intelligence
export interface RecoveryIntelligenceIntegration {
  surgeryType: string;
  postOpDay: number;
  expectedSymptoms: {
    symptomType: SymptomType;
    expectedPattern: string;
    severityRange: [number, number];
    normalVariance: number;
  }[];
  currentPhase: {
    phase: string;
    dayRange: [number, number];
    expectedPainLevel: [number, number];
    mobilityLevel: string;
  };
  upcomingMilestones: {
    day: number;
    milestone: string;
    expectedStatus: string;
  }[];
  clinicalAlerts: {
    condition: string;
    riskLevel: string;
    action: string;
    appliesToDays: [number, number];
  }[];
}

// API Response Types
export interface SymptomTrackingResponse {
  success: boolean;
  data?: SymptomEntry | SymptomEntry[];
  trends?: SymptomTrend[];
  alerts?: RiskAlert[];
  progress?: RecoveryProgress;
  error?: string;
}

export interface SymptomAnalytics {
  period: 'week' | 'month' | 'recovery';
  metrics: {
    averagePain: number;
    painDistribution: { [key: number]: number }; // severity -> count
    symptomFrequency: { [key in SymptomType]?: number };
    improvementRate: number;
    complianceRate: number; // medication adherence
  };
  charts: {
    painChart: TrendEntry[];
    symptomHeatmap: { day: number; symptoms: SymptomType[] }[];
    recoveryProgress: { day: number; expected: number; actual: number }[];
  };
}
