// Surgery Protocol Class
// Defines expected recovery patterns and risk rules for each surgery type

import { MedicalEntity, SurgeryType, RecoveryCurve, RiskRule, RiskLevel } from './base';

export interface SurgeryMetadata {
  displayName: string;
  description: string;
  typicalDuration: number; // days
  commonComplications: string[];
  warningSigns: string[];
}

export interface ProtocolValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SurgeryProtocol extends MedicalEntity {
  private surgeryType: SurgeryType;
  private metadata: SurgeryMetadata;
  private recoveryCurve: RecoveryCurve[];
  private riskRules: RiskRule[];
  private isActive: boolean;
  private version: string;
  private lastUpdated: Date;

  constructor(
    id: string,
    surgeryType: SurgeryType,
    metadata: SurgeryMetadata,
    recoveryCurve: RecoveryCurve[],
    riskRules: RiskRule[],
    version: string = '1.0'
  ) {
    super(id);
    this.surgeryType = surgeryType;
    this.metadata = metadata;
    this.recoveryCurve = recoveryCurve;
    this.riskRules = riskRules;
    this.isActive = true;
    this.version = version;
    this.lastUpdated = new Date();

    // Validate protocol data
    const validation = this.performValidation();
    if (!validation.isValid) {
      throw new Error(`Invalid surgery protocol: ${validation.errors.join(', ')}`);
    }
  }

  // Implementation of abstract validate method
  validate(): boolean {
    const validation = this.performValidation();
    return validation.isValid;
  }

  // Additional validation method that returns detailed results
  performValidation(): ProtocolValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate surgery type
    if (!Object.values(SurgeryType).includes(this.surgeryType)) {
      errors.push('Invalid surgery type');
    }

    // Validate metadata
    if (!this.metadata.displayName || typeof this.metadata.displayName !== 'string') {
      errors.push('Display name is required');
    }
    if (!this.metadata.description || typeof this.metadata.description !== 'string') {
      errors.push('Description is required');
    }
    if (!this.metadata.typicalDuration || this.metadata.typicalDuration <= 0) {
      errors.push('Typical duration must be positive');
    }

    // Validate recovery curve
    if (!this.recoveryCurve || this.recoveryCurve.length === 0) {
      errors.push('Recovery curve cannot be empty');
    } else {
      // Check for gaps in recovery curve
      const sortedDays = this.recoveryCurve.map(rc => rc.day).sort((a, b) => a - b);
      for (let i = 1; i < sortedDays.length; i++) {
        if (sortedDays[i] - sortedDays[i-1] > 7) {
          warnings.push(`Large gap in recovery curve between day ${sortedDays[i-1]} and ${sortedDays[i]}`);
        }
      }

      // Validate each recovery curve point
      this.recoveryCurve.forEach((rc, index) => {
        if (rc.day < 0) {
          errors.push(`Recovery curve day ${rc.day} cannot be negative`);
        }
        if (!rc.expectedPainRange || rc.expectedPainRange.length !== 2) {
          errors.push(`Recovery curve point ${index} must have valid pain range`);
        }
        if (rc.expectedPainRange[0] < 0 || rc.expectedPainRange[1] > 10) {
          errors.push(`Pain range must be between 0-10 for day ${rc.day}`);
        }
        if (rc.expectedPainRange[0] > rc.expectedPainRange[1]) {
          errors.push(`Min pain cannot be greater than max pain for day ${rc.day}`);
        }
      });
    }

    // Validate risk rules
    if (!this.riskRules || this.riskRules.length === 0) {
      warnings.push('No risk rules defined');
    } else {
      this.riskRules.forEach((rule, index) => {
        if (!rule.id || typeof rule.id !== 'string') {
          errors.push(`Risk rule ${index} must have valid ID`);
        }
        if (!rule.condition || typeof rule.condition !== 'string') {
          errors.push(`Risk rule ${index} must have condition`);
        }
        if (!Object.values(RiskLevel).includes(rule.riskLevel)) {
          errors.push(`Risk rule ${index} has invalid risk level`);
        }
        if (!rule.action || typeof rule.action !== 'string') {
          errors.push(`Risk rule ${index} must have action`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Implementation of abstract toJSON method
  toJSON(): object {
    return {
      id: this.id,
      surgeryType: this.surgeryType,
      metadata: this.metadata,
      recoveryCurve: this.recoveryCurve,
      riskRules: this.riskRules,
      isActive: this.isActive,
      version: this.version,
      lastUpdated: this.lastUpdated.toISOString(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  // Getters
  getSurgeryType(): SurgeryType {
    return this.surgeryType;
  }

  getMetadata(): SurgeryMetadata {
    return { ...this.metadata };
  }

  getRecoveryCurve(): RecoveryCurve[] {
    return [...this.recoveryCurve];
  }

  getRiskRules(): RiskRule[] {
    return [...this.riskRules];
  }

  isActiveProtocol(): boolean {
    return this.isActive;
  }

  getVersion(): string {
    return this.version;
  }

  // Get expected recovery for a specific day
  getExpectedRecovery(day: number): RecoveryCurve | null {
    // Find exact match
    const exact = this.recoveryCurve.find(rc => rc.day === day);
    if (exact) return exact;

    // Interpolate between nearest points
    const sorted = [...this.recoveryCurve].sort((a, b) => a.day - b.day);
    const lower = sorted.filter(rc => rc.day < day).pop();
    const upper = sorted.find(rc => rc.day > day);

    if (lower && upper) {
      // Linear interpolation for pain range
      const ratio = (day - lower.day) / (upper.day - lower.day);
      const minPain = Math.round(lower.expectedPainRange[0] + ratio * (upper.expectedPainRange[0] - lower.expectedPainRange[0]));
      const maxPain = Math.round(lower.expectedPainRange[1] + ratio * (upper.expectedPainRange[1] - lower.expectedPainRange[1]));

      return {
        day,
        expectedPainRange: [minPain, maxPain],
        expectedMobilityRange: lower.expectedMobilityRange && upper.expectedMobilityRange ? [
          Math.round(lower.expectedMobilityRange[0] + ratio * (upper.expectedMobilityRange[0] - lower.expectedMobilityRange[0])),
          Math.round(lower.expectedMobilityRange[1] + ratio * (upper.expectedMobilityRange[1] - lower.expectedMobilityRange[1]))
        ] : undefined,
        warningSigns: [...lower.warningSigns, ...upper.warningSigns],
        complications: [...lower.complications, ...upper.complications]
      };
    }

    // Return closest day if no interpolation possible
    const closest = sorted.reduce((prev, curr) => 
      Math.abs(curr.day - day) < Math.abs(prev.day - day) ? curr : prev
    );
    return closest;
  }

  // Get risk rules applicable for a specific day
  getApplicableRiskRules(day: number): RiskRule[] {
    return this.riskRules.filter(rule => {
      if (!rule.dayRange) return true; // Rule applies to all days
      const [minDay, maxDay] = rule.dayRange;
      return day >= minDay && day <= maxDay;
    });
  }

  // Check if pain level is within expected range
  isPainWithinExpectedRange(day: number, painLevel: number): boolean {
    const expected = this.getExpectedRecovery(day);
    if (!expected) return true; // No data available
    const [minPain, maxPain] = expected.expectedPainRange;
    return painLevel >= minPain && painLevel <= maxPain;
  }

  // Get expected pain range for a specific day
  getExpectedPain(day: number): [number, number] {
    const expected = this.getExpectedRecovery(day);
    if (!expected) return [0, 10]; // Default range if no data available
    return expected.expectedPainRange;
  }

  // Calculate pain deviation from expected recovery curve
  getPainDeviation(day: number, painLevel: number): number {
    const expectedPain = this.getExpectedPain(day);
    const [minPain, maxPain] = expectedPain;
    
    // Clinical threshold: 0 if within expected range, positive deviation only if outside range
    if (painLevel >= minPain && painLevel <= maxPain) {
      return 0;
    }
    if (painLevel < minPain) {
      return minPain - painLevel;
    }
    return painLevel - maxPain;
  }

  // Update protocol
  updateProtocol(
    metadata?: Partial<SurgeryMetadata>,
    recoveryCurve?: RecoveryCurve[],
    riskRules?: RiskRule[]
  ): void {
    if (metadata) {
      this.metadata = { ...this.metadata, ...metadata };
    }
    if (recoveryCurve) {
      this.recoveryCurve = [...recoveryCurve];
    }
    if (riskRules) {
      this.riskRules = [...riskRules];
    }

    const validation = this.performValidation();
    if (!validation.isValid) {
      throw new Error(`Invalid protocol update: ${validation.errors.join(', ')}`);
    }

    this.updateTimestamp();
    this.lastUpdated = new Date();
  }

  // Deactivate protocol
  deactivate(): void {
    this.isActive = false;
    this.updateTimestamp();
  }

  // Activate protocol
  activate(): void {
    this.isActive = true;
    this.updateTimestamp();
  }

  // Static method to create protocol from JSON
  static fromJSON(json: any): SurgeryProtocol {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      
      return new SurgeryProtocol(
        data.id,
        data.surgeryType,
        data.metadata,
        data.recoveryCurve,
        data.riskRules,
        data.version
      );
    } catch (error) {
      throw new Error(`Failed to create SurgeryProtocol from JSON: ${error}`);
    }
  }
}

// Predefined surgery protocols for the two initial surgery types
export const createKneeReplacementProtocol = (): SurgeryProtocol => {
  const metadata: SurgeryMetadata = {
    displayName: 'Knee Replacement Surgery',
    description: 'Total knee arthroplasty recovery protocol',
    typicalDuration: 90,
    commonComplications: ['infection', 'blood clots', 'stiffness', 'pain'],
    warningSigns: ['fever', 'severe swelling', 'inability to move', 'chest pain']
  };

  const recoveryCurve: RecoveryCurve[] = [
    {
      day: 1,
      expectedPainRange: [7, 9],
      expectedMobilityRange: [1, 3],
      warningSigns: ['excessive swelling', 'fever > 38°C', 'severe pain > 8'],
      complications: ['infection', 'blood clots']
    },
    {
      day: 3,
      expectedPainRange: [5, 7],
      expectedMobilityRange: [2, 4],
      warningSigns: ['increasing pain', 'wound discharge', 'fever'],
      complications: ['infection', 'stiffness']
    },
    {
      day: 7,
      expectedPainRange: [3, 5],
      expectedMobilityRange: [4, 6],
      warningSigns: ['pain > 6', 'persistent swelling', 'redness'],
      complications: ['stiffness', 'slow recovery']
    },
    {
      day: 14,
      expectedPainRange: [2, 4],
      expectedMobilityRange: [6, 8],
      warningSigns: ['sudden increase in pain', 'difficulty bearing weight'],
      complications: ['adhesion formation']
    },
    {
      day: 30,
      expectedPainRange: [1, 3],
      expectedMobilityRange: [7, 9],
      warningSigns: ['persistent pain > 4', 'limited range of motion'],
      complications: ['arthrofibrosis']
    }
  ];

  const riskRules: RiskRule[] = [
    {
      id: 'knee-high-pain-early',
      condition: 'Pain level > 7 after day 5',
      riskLevel: RiskLevel.MODERATE,
      action: 'Consider pain management adjustment and evaluation',
      dayRange: [5, 14]
    },
    {
      id: 'knee-fever',
      condition: 'Temperature > 38°C',
      riskLevel: RiskLevel.HIGH,
      action: 'Immediate medical evaluation for infection',
      dayRange: [1, 30]
    },
    {
      id: 'knee-immobility',
      condition: 'Mobility score < 3 after day 7',
      riskLevel: RiskLevel.MODERATE,
      action: 'Physical therapy consultation',
      dayRange: [7, 21]
    }
  ];

  return new SurgeryProtocol(
    'knee-replacement-v1',
    SurgeryType.KNEE_REPLACEMENT,
    metadata,
    recoveryCurve,
    riskRules,
    '1.0'
  );
};

export const createAbdominalSurgeryProtocol = (): SurgeryProtocol => {
  const metadata: SurgeryMetadata = {
    displayName: 'Abdominal Surgery',
    description: 'General abdominal surgery recovery protocol',
    typicalDuration: 60,
    commonComplications: ['infection', 'bowel obstruction', 'hernia', 'bleeding'],
    warningSigns: ['fever', 'severe abdominal pain', 'vomiting', 'wound issues']
  };

  const recoveryCurve: RecoveryCurve[] = [
    {
      day: 1,
      expectedPainRange: [6, 8],
      expectedMobilityRange: [1, 2],
      warningSigns: ['fever > 38°C', 'severe abdominal pain', 'vomiting'],
      complications: ['infection', 'bleeding']
    },
    {
      day: 3,
      expectedPainRange: [4, 6],
      expectedMobilityRange: [2, 4],
      warningSigns: ['persistent fever', 'abdominal distension', 'no bowel movement'],
      complications: ['ileus', 'infection']
    },
    {
      day: 7,
      expectedPainRange: [2, 4],
      expectedMobilityRange: [4, 6],
      warningSigns: ['wound separation', 'persistent pain', 'nausea'],
      complications: ['wound infection', 'hernia']
    },
    {
      day: 14,
      expectedPainRange: [1, 3],
      expectedMobilityRange: [6, 8],
      warningSigns: ['incisional hernia signs', 'persistent bloating'],
      complications: ['incisional hernia']
    },
    {
      day: 30,
      expectedPainRange: [0, 2],
      expectedMobilityRange: [8, 10],
      warningSigns: ['chronic pain', 'activity limitation'],
      complications: ['adhesions']
    }
  ];

  const riskRules: RiskRule[] = [
    {
      id: 'abdominal-fever',
      condition: 'Temperature > 38°C',
      riskLevel: RiskLevel.HIGH,
      action: 'Immediate evaluation for intra-abdominal infection',
      dayRange: [1, 21]
    },
    {
      id: 'abdominal-obstruction',
      condition: 'Vomiting or abdominal distension after day 3',
      riskLevel: RiskLevel.HIGH,
      action: 'Emergency evaluation for bowel obstruction',
      dayRange: [3, 30]
    },
    {
      id: 'abdominal-wound-issues',
      condition: 'Wound redness, discharge or separation',
      riskLevel: RiskLevel.MODERATE,
      action: 'Wound evaluation and possible intervention',
      dayRange: [5, 21]
    }
  ];

  return new SurgeryProtocol(
    'abdominal-surgery-v1',
    SurgeryType.ABDOMINAL_SURGERY,
    metadata,
    recoveryCurve,
    riskRules,
    '1.0'
  );
};
