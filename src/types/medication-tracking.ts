// 💊 MEDICATION MANAGEMENT DATA STRUCTURES
// Comprehensive medication tracking with adherence monitoring and refill management

export interface MedicationEntry {
  id: string;
  patientId: string;
  name: string;
  genericName?: string;
  brandName?: string;
  dosage: MedicationDosage;
  frequency: MedicationFrequency;
  route: MedicationRoute;
  prescriber: PrescriberInfo;
  pharmacy: PharmacyInfo;
  startDate: Date;
  endDate?: Date;
  status: MedicationStatus;
  instructions: string;
  purpose: string;
  sideEffects?: SideEffect[];
  adherence: AdherenceData;
  refills: RefillInfo;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationDosage {
  amount: number;
  unit: 'mg' | 'mcg' | 'g' | 'ml' | 'units' | 'drops' | 'sprays' | 'puffs';
  form: 'tablet' | 'capsule' | 'liquid' | 'injection' | 'patch' | 'cream' | 'ointment' | 'inhaler' | 'spray';
  strength?: number;
  strengthUnit?: string;
}

export interface MedicationFrequency {
  type: 'daily' | 'weekly' | 'monthly' | 'as_needed' | 'prn';
  interval: number; // e.g., every 8 hours, 3 times daily
  specificTimes?: string[]; // e.g., ["08:00", "14:00", "20:00"]
  maxDailyDose?: number;
  prnConditions?: string[]; // For "as needed" medications
}

export interface MedicationRoute {
  method: 'oral' | 'intravenous' | 'intramuscular' | 'subcutaneous' | 'topical' | 'transdermal' | 'inhalation' | 'nasal' | 'ocular' | 'aural' | 'rectal';
  instructions?: string;
}

export interface PrescriberInfo {
  id: string;
  name: string;
  specialty: string;
  contactNumber?: string;
  prescriptionDate: Date;
  deaNumber?: string; // For controlled substances
  licenseNumber?: string;
}

export interface PharmacyInfo {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  faxNumber?: string;
  email?: string;
  website?: string;
  hoursOfOperation?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  preferredPharmacy: boolean;
}

export interface AdherenceData {
  totalDoses: number;
  takenDoses: number;
  missedDoses: number;
  lateDoses: number;
  adherenceRate: number; // percentage
  currentStreak: number; // consecutive days of adherence
  longestStreak: number; // longest consecutive adherence streak
  lastTakenDate?: Date;
  nextDoseTime?: Date;
  weeklyAdherence: WeeklyAdherence[];
  monthlyAdherence: MonthlyAdherence[];
}

export interface WeeklyAdherence {
  week: string; // ISO week string
  startDate: Date;
  endDate: Date;
  totalDoses: number;
  takenDoses: number;
  adherenceRate: number;
  missedDays: number[];
}

export interface MonthlyAdherence {
  month: string; // ISO month string
  startDate: Date;
  endDate: Date;
  totalDoses: number;
  takenDoses: number;
  adherenceRate: number;
  missedDays: number[];
}

export interface SideEffect {
  id: string;
  type: SideEffectType;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  onsetTime: Date;
  duration?: string;
  resolved: boolean;
  resolvedAt?: Date;
  reportedToProvider: boolean;
  notes?: string;
}

export type SideEffectType = 
  | 'nausea'
  | 'vomiting'
  | 'dizziness'
  | 'drowsiness'
  | 'insomnia'
  | 'constipation'
  | 'diarrhea'
  | 'headache'
  | 'rash'
  | 'itching'
  | 'swelling'
  | 'difficulty_breathing'
  | 'chest_pain'
  | 'irregular_heartbeat'
  | 'anxiety'
  | 'depression'
  | 'weight_gain'
  | 'weight_loss'
  | 'dry_mouth'
  | 'blurred_vision'
  | 'urinary_retention'
  | 'sexual_dysfunction'
  | 'muscle_pain'
  | 'joint_pain'
  | 'stomach_upset'
  | 'loss_of_appetite'
  | 'increased_appetite'
  | 'tremors'
  | 'sweating'
  | 'flushing'
  | 'other';

export interface RefillInfo {
  currentSupply: number; // days/units remaining
  totalSupply: number; // total days/units prescribed
  refillDate: Date;
  nextRefillDate: Date;
  refillsRemaining: number;
  autoRefill: boolean;
  pharmacyContacted: boolean;
  reminderSent: boolean;
  lastRefillDate?: Date;
}

export type MedicationStatus = 
  | 'active'
  | 'paused'
  | 'completed'
  | 'discontinued'
  | 'on_hold'
  | 'pending_start';

export interface MedicationReminder {
  id: string;
  medicationId: string;
  patientId: string;
  reminderTime: string; // HH:MM format
  reminderType: 'dose' | 'refill' | 'appointment';
  enabled: boolean;
  notificationMethod: 'push' | 'sms' | 'email' | 'phone_call';
  message: string;
  advanceNotice: number; // minutes before dose time
  recurring: boolean;
  daysOfWeek?: string[]; // For weekly medications
  createdAt: Date;
  lastTriggered?: Date;
}

export interface MedicationInteraction {
  id: string;
  medication1Id: string;
  medication2Id: string;
  interactionType: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  recommendations: string[];
  detectedAt: Date;
  reviewedByProvider: boolean;
}

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  date: Date;
  scheduledTime: string;
  taken: boolean;
  takenAt?: Date;
  skipped: boolean;
  skipReason?: string;
  notes?: string;
  adherenceScore?: number; // 0-100 for this dose
}

export interface MedicationAnalytics {
  period: 'week' | 'month' | 'quarter' | 'year';
  totalMedications: number;
  activeMedications: number;
  adherenceRate: number;
  missedDoses: number;
  sideEffectsReported: number;
  refillsProcessed: number;
  mostMissedMedication?: string;
  bestAdherenceMedication?: string;
  trends: {
    adherenceTrend: 'improving' | 'stable' | 'declining';
    sideEffectTrend: 'increasing' | 'stable' | 'decreasing';
    refillPattern: 'on_time' | 'late' | 'early';
  };
  charts: {
    adherenceChart: { date: string; rate: number }[];
    sideEffectChart: { date: string; count: number }[];
    refillTimeline: { date: string; medication: string; action: string }[];
  };
}

export interface MedicationReport {
  id: string;
  patientId: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalMedications: number;
    averageAdherence: number;
    missedDoses: number;
    sideEffectsCount: number;
    refillsProcessed: number;
    medicationChanges: number;
  };
  medications: MedicationEntry[];
  adherenceBreakdown: {
    excellent: number; // 95-100%
    good: number; // 80-94%
    fair: number; // 60-79%
    poor: number; // <60%
  };
  sideEffects: SideEffect[];
  recommendations: string[];
  generatedAt: Date;
  shareWithProviders: boolean;
  shareWithPharmacy: boolean;
}

export interface MedicationPreferences {
  reminderTimes: {
    morning: string;
    afternoon: string;
    evening: string;
    night: string;
  };
  notifications: {
    enabled: boolean;
    methods: ('push' | 'sms' | 'email')[];
    advanceReminder: number; // minutes before
    refillReminder: boolean;
    missedDoseAlert: boolean;
    sideEffectAlert: boolean;
  };
  privacy: {
    shareWithProviders: boolean;
    shareWithPharmacy: boolean;
    shareWithFamily: boolean;
    familyMembers: string[];
  };
  autoRefill: {
    enabled: boolean;
    daysBefore: number;
    preferredPharmacy: string;
  };
}

// API Response Types
export interface MedicationTrackingResponse {
  success: boolean;
  data?: MedicationEntry | MedicationEntry[];
  reminders?: MedicationReminder[];
  analytics?: MedicationAnalytics;
  interactions?: MedicationInteraction[];
  report?: MedicationReport;
  error?: string;
}

// Integration with Recovery Intelligence
export interface MedicationRecoveryIntegration {
  surgeryType: string;
  postOpDay: number;
  expectedMedications: {
    name: string;
    purpose: string;
    duration: number; // days
    commonSideEffects: SideEffectType[];
    adherenceImportance: 'critical' | 'important' | 'moderate';
  }[];
  medicationAlerts: {
    condition: string;
    severity: 'Low' | 'Moderate' | 'High' | 'Critical';
    action: string;
    appliesToDays: [number, number];
  }[];
}

// Pharmacy Integration
export interface PharmacyIntegration {
  pharmacyId: string;
  supportedFeatures: ('refill_requests' | 'transfer_prescriptions' | 'medication_therapy' | 'vaccinations')[];
  apiEndpoint?: string;
  credentials?: {
    apiKey?: string;
    patientId?: string;
  };
  lastSync?: Date;
  syncStatus: 'connected' | 'disconnected' | 'error';
}

// Smart Medication Features
export interface SmartMedicationFeatures {
  pillRecognition: boolean;
  automaticRefill: boolean;
  interactionChecking: boolean;
  dosageOptimization: boolean;
  adherenceGamification: boolean;
  voiceCommands: boolean;
  wearableIntegration: boolean;
}

// Emergency Medication Information
export interface EmergencyMedicationInfo {
  patientId: string;
  emergencyContacts: {
    name: string;
    relationship: string;
    phoneNumber: string;
    hasMedicationAccess: boolean;
  }[];
  criticalMedications: {
    medicationId: string;
    name: string;
    purpose: string;
    emergencyInstructions: string;
  }[];
  allergies: {
    medication: string;
    reaction: string;
    severity: 'mild' | 'moderate' | 'severe';
  }[];
  bloodType?: string;
  medicalConditions: string[];
  implantedDevices?: string[];
}
