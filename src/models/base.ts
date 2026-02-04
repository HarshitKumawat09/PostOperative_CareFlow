// Base OOP Classes for CareFlow Medical System
// This is the foundation of our medical entity hierarchy

export enum SurgeryType {
  KNEE_REPLACEMENT = 'KNEE_REPLACEMENT',
  HIP_REPLACEMENT = 'HIP_REPLACEMENT',
  ABDOMINAL_SURGERY = 'ABDOMINAL_SURGERY',
  CARDIAC_BYPASS = 'CARDIAC_BYPASS',
  APPENDECTOMY = 'APPENDECTOMY',
  HERNIA_REPAIR = 'HERNIA_REPAIR',
  SPINAL_SURGERY = 'SPINAL_SURGERY',
  GALLBLADDER_REMOVAL = 'GALLBLADDER_REMOVAL',
  C_SECTION = 'C_SECTION',
  PROSTATE_SURGERY = 'PROSTATE_SURGERY',
  BREAST_SURGERY = 'BREAST_SURGERY',
  ENT_SURGERY = 'ENT_SURGERY',
  EYE_SURGERY = 'EYE_SURGERY',
  DENTAL_SURGERY = 'DENTAL_SURGERY',
  MINOR_ORTHOPEDIC = 'MINOR_ORTHOPEDIC'
}

export enum RiskLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Interface for symptom reporting
export interface SymptomReport {
  painLevel: number; // 1-10 scale
  mobilityScore?: number; // 1-10 scale
  woundCondition?: 'normal' | 'redness' | 'swelling' | 'discharge' | 'infection';
  temperature?: number; // Celsius
  notes?: string;
  reportedAt: Date;
}

// Recovery curve for expected symptoms per day
export interface RecoveryCurve {
  day: number;
  expectedPainRange: [number, number]; // [min, max]
  expectedMobilityRange?: [number, number];
  warningSigns: string[];
  complications: string[];
}

// Risk rules for assessment
export interface RiskRule {
  id: string;
  condition: string; // Rule description
  riskLevel: RiskLevel;
  action: string;
  dayRange?: [number, number]; // When this rule applies
}

// Input for risk assessment
export interface RiskInput {
  surgeryType: SurgeryType;
  recoveryDay: number;
  symptoms: SymptomReport;
  previousSymptoms?: SymptomReport[];
}

// Abstract Base Class - The foundation of our OOP hierarchy
export abstract class MedicalEntity {
  protected id: string;
  protected createdAt: Date;
  protected updatedAt: Date;

  constructor(id: string) {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Valid ID is required for MedicalEntity');
    }
    
    this.id = id;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Abstract method that MUST be implemented by all subclasses
  // This ensures every medical entity has validation logic
  abstract validate(): boolean;

  // Abstract method for JSON serialization
  abstract toJSON(): object;

  // Common methods available to all subclasses
  getId(): string {
    return this.id;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  protected updateTimestamp(): void {
    this.updatedAt = new Date();
  }

  // Common validation helper
  protected isValidId(id: string): boolean {
    return id && typeof id === 'string' && id.length > 0;
  }

  // Common validation for dates
  protected isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }
}

// Utility functions for validation
export const validatePainLevel = (painLevel: number): boolean => {
  return typeof painLevel === 'number' && painLevel >= 1 && painLevel <= 10;
};

export const validateMobilityScore = (mobilityScore?: number): boolean => {
  return mobilityScore === undefined || (typeof mobilityScore === 'number' && mobilityScore >= 1 && mobilityScore <= 10);
};

export const validateTemperature = (temperature?: number): boolean => {
  return temperature === undefined || (typeof temperature === 'number' && temperature >= 35 && temperature <= 42);
};
