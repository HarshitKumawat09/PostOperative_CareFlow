// 🧠 RECOVERY INTELLIGENCE TRAINING
// Clinical decision modeling for post-surgery recovery
// RULE + DATA driven approach (not NLP)

export interface SymptomProgression {
  symptom: string;
  expectedPattern: 'increasing' | 'decreasing' | 'peak_then_decrease' | 'stable';
  dayRange: [number, number]; // When this symptom is expected
  severityRange: 'mild' | 'moderate' | 'severe';
  normalVariance: number; // ± days from expected timeline
}

export interface RecoveryMilestone {
  day: number;
  milestone: string;
  description: string;
  expectedStatus: 'achieved' | 'partial' | 'not_expected';
  varianceRange: number; // ± days
}

export interface VarianceRange {
  parameter: string;
  normalRange: [number, number];
  warningRange: [number, number];
  criticalRange: [number, number];
  unit: string;
}

export interface RiskThreshold {
  id: string;
  parameter: string;
  normalThreshold: number;
  warningThreshold: number;
  criticalThreshold: number;
  unit: string;
  timeWindow: [number, number]; // Post-op days when this applies
}

export interface AlertWindow {
  id: string;
  surgeryType: string;
  dayRange: [number, number];
  symptom: string;
  condition: string; // "fever > 38°C AND day > 3"
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  action: string;
  explanation: string;
  urgency: 'routine' | 'urgent' | 'emergency';
}

export interface ClinicalRule {
  id: string;
  surgeryType: string;
  condition: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  action: string;
  explanation: string;
  evidenceLevel: 'low' | 'moderate' | 'high' | 'expert_opinion';
  appliesToDays: [number, number];
}

export interface RecoveryCurve {
  surgeryType: string;
  totalRecoveryDays: number;
  phases: RecoveryPhase[];
  expectedSymptoms: SymptomProgression[];
  milestones: RecoveryMilestone[];
  varianceRanges: VarianceRange[];
  riskThresholds: RiskThreshold[];
}

export interface RecoveryPhase {
  phase: string;
  dayRange: [number, number];
  description: string;
  keyActivities: string[];
  warningSigns: string[];
  expectedPainLevel: [number, number]; // 0-10 scale
  mobilityLevel: 'bed_rest' | 'assisted' | 'independent' | 'normal';
}

export interface RecoveryIntelligence {
  surgeryType: string;
  recoveryCurve: RecoveryCurve;
  alertWindows: AlertWindow[];
  clinicalRules: ClinicalRule[];
  lastUpdated: string;
  version: string;
}

export class RecoveryIntelligenceService {
  private static instance: RecoveryIntelligenceService;
  private recoveryData: Map<string, RecoveryIntelligence> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): RecoveryIntelligenceService {
    if (!RecoveryIntelligenceService.instance) {
      RecoveryIntelligenceService.instance = new RecoveryIntelligenceService();
    }
    return RecoveryIntelligenceService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🧠 Initializing Recovery Intelligence Service...');
      
      // Load recovery data for common surgeries
      await this.loadRecoveryData();
      
      this.initialized = true;
      console.log('✅ Recovery Intelligence Service initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Recovery Intelligence Service:', error);
      throw error;
    }
  }

  private async loadRecoveryData(): Promise<void> {
    // Load predefined recovery curves for common surgeries
    const kneeReplacementData = this.getKneeReplacementRecoveryData();
    const hipReplacementData = this.getHipReplacementRecoveryData();
    const cardiacSurgeryData = this.getCardiacSurgeryRecoveryData();

    this.recoveryData.set('knee_replacement', kneeReplacementData);
    this.recoveryData.set('hip_replacement', hipReplacementData);
    this.recoveryData.set('cardiac_surgery', cardiacSurgeryData);

    console.log(`📊 Loaded recovery data for ${this.recoveryData.size} surgery types`);
  }

  private getKneeReplacementRecoveryData(): RecoveryIntelligence {
    const recoveryCurve: RecoveryCurve = {
      surgeryType: 'knee_replacement',
      totalRecoveryDays: 90,
      phases: [
        {
          phase: 'Immediate Post-Op',
          dayRange: [0, 3],
          description: 'Hospital recovery and initial pain management',
          keyActivities: ['Pain control', 'Wound care', 'Basic mobility'],
          warningSigns: ['Severe pain', 'Excessive bleeding', 'High fever'],
          expectedPainLevel: [7, 9],
          mobilityLevel: 'bed_rest'
        },
        {
          phase: 'Early Recovery',
          dayRange: [4, 14],
          description: 'Home recovery with increasing mobility',
          keyActivities: ['Walking with assistance', 'Physical therapy', 'Wound care'],
          warningSigns: ['Fever > 38°C', 'Increased swelling', 'Redness around wound'],
          expectedPainLevel: [4, 7],
          mobilityLevel: 'assisted'
        },
        {
          phase: 'Intermediate Recovery',
          dayRange: [15, 42],
          description: 'Building strength and independence',
          keyActivities: ['Independent walking', 'Exercise program', 'Driving preparation'],
          warningSigns: ['Persistent swelling', 'Limited range of motion', 'Pain not improving'],
          expectedPainLevel: [2, 5],
          mobilityLevel: 'independent'
        },
        {
          phase: 'Advanced Recovery',
          dayRange: [43, 90],
          description: 'Returning to normal activities',
          keyActivities: ['Sports activities', 'Full range of motion', 'Strength building'],
          warningSigns: ['Joint instability', 'Persistent pain', 'Swelling after activity'],
          expectedPainLevel: [0, 3],
          mobilityLevel: 'normal'
        }
      ],
      expectedSymptoms: [
        {
          symptom: 'pain',
          expectedPattern: 'decreasing',
          dayRange: [0, 21],
          severityRange: 'severe',
          normalVariance: 3
        },
        {
          symptom: 'swelling',
          expectedPattern: 'peak_then_decrease',
          dayRange: [1, 14],
          severityRange: 'moderate',
          normalVariance: 2
        },
        {
          symptom: 'fever',
          expectedPattern: 'stable',
          dayRange: [0, 2],
          severityRange: 'mild',
          normalVariance: 1
        },
        {
          symptom: 'stiffness',
          expectedPattern: 'decreasing',
          dayRange: [3, 28],
          severityRange: 'moderate',
          normalVariance: 4
        }
      ],
      milestones: [
        {
          day: 1,
          milestone: 'Stand with assistance',
          description: 'Patient able to stand with walker/crutches',
          expectedStatus: 'achieved',
          varianceRange: 1
        },
        {
          day: 3,
          milestone: 'Discharge from hospital',
          description: 'Patient medically cleared for home recovery',
          expectedStatus: 'achieved',
          varianceRange: 2
        },
        {
          day: 7,
          milestone: 'Walk independently indoors',
          description: 'Patient able to walk without assistance inside home',
          expectedStatus: 'partial',
          varianceRange: 3
        },
        {
          day: 14,
          milestone: 'Drive (if right leg)',
          description: 'Patient cleared for driving (right leg surgery)',
          expectedStatus: 'partial',
          varianceRange: 7
        },
        {
          day: 21,
          milestone: 'Return to sedentary work',
          description: 'Patient able to return to desk job',
          expectedStatus: 'partial',
          varianceRange: 7
        },
        {
          day: 42,
          milestone: 'Light recreational activities',
          description: 'Patient able to engage in light sports (swimming, cycling)',
          expectedStatus: 'partial',
          varianceRange: 14
        },
        {
          day: 90,
          milestone: 'Full activity clearance',
          description: 'Patient cleared for all activities',
          expectedStatus: 'achieved',
          varianceRange: 30
        }
      ],
      varianceRanges: [
        {
          parameter: 'pain_level',
          normalRange: [0, 8],
          warningRange: [8, 9],
          criticalRange: [9, 10],
          unit: 'scale_0_10'
        },
        {
          parameter: 'temperature',
          normalRange: [36.5, 38.0],
          warningRange: [38.0, 38.5],
          criticalRange: [38.5, 42.0],
          unit: 'celsius'
        },
        {
          parameter: 'wound_drainage',
          normalRange: [0, 5],
          warningRange: [5, 20],
          criticalRange: [20, 100],
          unit: 'ml_per_day'
        }
      ],
      riskThresholds: [
        {
          id: 'fever_risk',
          parameter: 'temperature',
          normalThreshold: 38.0,
          warningThreshold: 38.5,
          criticalThreshold: 39.0,
          unit: 'celsius',
          timeWindow: [0, 14]
        },
        {
          id: 'pain_risk',
          parameter: 'pain_level',
          normalThreshold: 6,
          warningThreshold: 8,
          criticalThreshold: 9,
          unit: 'scale_0_10',
          timeWindow: [3, 21]
        },
        {
          id: 'mobility_risk',
          parameter: 'mobility_score',
          normalThreshold: 3,
          warningThreshold: 2,
          criticalThreshold: 1,
          unit: 'scale_1_5',
          timeWindow: [1, 14]
        }
      ]
    };

    const alertWindows: AlertWindow[] = [
      {
        id: 'fever_day_3_plus',
        surgeryType: 'knee_replacement',
        dayRange: [3, 14],
        symptom: 'fever',
        condition: 'temperature > 38°C AND day > 2',
        riskLevel: 'High',
        action: 'Contact doctor immediately - may indicate infection',
        explanation: 'Fever after day 3 could indicate surgical site infection',
        urgency: 'urgent'
      },
      {
        id: 'severe_pain_day_5_plus',
        surgeryType: 'knee_replacement',
        dayRange: [5, 21],
        symptom: 'pain',
        condition: 'pain_level > 7 AND day > 4',
        riskLevel: 'Moderate',
        action: 'Contact healthcare provider for pain management',
        explanation: 'Severe pain after day 5 may indicate complications',
        urgency: 'routine'
      },
      {
        id: 'increased_swelling',
        surgeryType: 'knee_replacement',
        dayRange: [7, 21],
        symptom: 'swelling',
        condition: 'swelling_increasing AND day > 6',
        riskLevel: 'Moderate',
        action: 'Monitor and contact provider if worsening',
        explanation: 'Increasing swelling after week 1 needs evaluation',
        urgency: 'routine'
      },
      {
        id: 'infection_signs',
        surgeryType: 'knee_replacement',
        dayRange: [3, 30],
        symptom: 'wound_issues',
        condition: 'redness OR drainage OR warmth AND day > 2',
        riskLevel: 'High',
        action: 'Immediate medical evaluation required',
        explanation: 'Signs of infection require urgent attention',
        urgency: 'urgent'
      }
    ];

    const clinicalRules: ClinicalRule[] = [
      {
        id: 'fever_rule_knee',
        surgeryType: 'knee_replacement',
        condition: 'temperature <= 38°C AND day <= 2',
        riskLevel: 'Low',
        action: 'Monitor temperature, rest, hydrate',
        explanation: 'Low-grade fever is normal in first 48 hours after surgery',
        evidenceLevel: 'high',
        appliesToDays: [0, 2]
      },
      {
        id: 'mobility_milestone',
        surgeryType: 'knee_replacement',
        condition: 'day >= 1 AND NOT able_to_stand',
        riskLevel: 'Moderate',
        action: 'Contact physical therapy, assess complications',
        explanation: 'Should be able to stand with assistance by day 1',
        evidenceLevel: 'high',
        appliesToDays: [1, 3]
      },
      {
        id: 'pain_management',
        surgeryType: 'knee_replacement',
        condition: 'pain_level > 8 AND day >= 3',
        riskLevel: 'Moderate',
        action: 'Review pain medication, contact provider',
        explanation: 'Pain should be controlled by day 3 with proper medication',
        evidenceLevel: 'moderate',
        appliesToDays: [3, 14]
      },
      {
        id: 'wound_care',
        surgeryType: 'knee_replacement',
        condition: 'wound_drainage > 20ml OR signs_of_infection',
        riskLevel: 'High',
        action: 'Immediate medical evaluation',
        explanation: 'Excessive drainage or infection signs require urgent care',
        evidenceLevel: 'high',
        appliesToDays: [0, 30]
      }
    ];

    return {
      surgeryType: 'knee_replacement',
      recoveryCurve,
      alertWindows,
      clinicalRules,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  private getHipReplacementRecoveryData(): RecoveryIntelligence {
    // Similar structure for hip replacement with different timelines and milestones
    const recoveryCurve: RecoveryCurve = {
      surgeryType: 'hip_replacement',
      totalRecoveryDays: 120,
      phases: [
        {
          phase: 'Immediate Post-Op',
          dayRange: [0, 4],
          description: 'Hospital recovery with strict hip precautions',
          keyActivities: ['Hip precautions', 'Pain control', 'Basic mobility'],
          warningSigns: ['Dislocation symptoms', 'Severe pain', 'Leg shortening'],
          expectedPainLevel: [7, 9],
          mobilityLevel: 'bed_rest'
        },
        {
          phase: 'Early Recovery',
          dayRange: [5, 21],
          description: 'Home recovery with hip precautions',
          keyActivities: ['Walker use', 'Hip precautions', 'Physical therapy'],
          warningSigns: ['Hip dislocation', 'Infection signs', 'Blood clots'],
          expectedPainLevel: [4, 7],
          mobilityLevel: 'assisted'
        },
        {
          phase: 'Intermediate Recovery',
          dayRange: [22, 56],
          description: 'Gradual increase in activities',
          keyActivities: ['Crutch use', 'Driving preparation', 'Strengthening'],
          warningSigns: ['Persistent pain', 'Limited motion', 'Swelling'],
          expectedPainLevel: [2, 5],
          mobilityLevel: 'independent'
        },
        {
          phase: 'Advanced Recovery',
          dayRange: [57, 120],
          description: 'Return to most activities',
          keyActivities: ['Low impact sports', 'Full activities', 'Strength building'],
          warningSigns: ['Hip pain', 'Instability', 'Limping'],
          expectedPainLevel: [0, 3],
          mobilityLevel: 'normal'
        }
      ],
      expectedSymptoms: [
        {
          symptom: 'pain',
          expectedPattern: 'decreasing',
          dayRange: [0, 28],
          severityRange: 'severe',
          normalVariance: 4
        },
        {
          symptom: 'swelling',
          expectedPattern: 'peak_then_decrease',
          dayRange: [1, 21],
          severityRange: 'moderate',
          normalVariance: 3
        },
        {
          symptom: 'stiffness',
          expectedPattern: 'decreasing',
          dayRange: [7, 42],
          severityRange: 'moderate',
          normalVariance: 5
        }
      ],
      milestones: [
        {
          day: 2,
          milestone: 'Sit at edge of bed',
          description: 'Patient able to sit with assistance',
          expectedStatus: 'achieved',
          varianceRange: 1
        },
        {
          day: 4,
          milestone: 'Stand with walker',
          description: 'Patient able to stand with walker and hip precautions',
          expectedStatus: 'achieved',
          varianceRange: 2
        },
        {
          day: 14,
          milestone: 'Walk with crutches',
          description: 'Patient progresses to crutches from walker',
          expectedStatus: 'partial',
          varianceRange: 7
        },
        {
          day: 28,
          milestone: 'Drive (if right leg)',
          description: 'Patient cleared for driving (right leg surgery)',
          expectedStatus: 'partial',
          varianceRange: 14
        },
        {
          day: 56,
          milestone: 'Return to sedentary work',
          description: 'Patient able to return to desk job',
          expectedStatus: 'partial',
          varianceRange: 14
        },
        {
          day: 90,
          milestone: 'Light recreational activities',
          description: 'Patient cleared for low-impact activities',
          expectedStatus: 'partial',
          varianceRange: 30
        },
        {
          day: 120,
          milestone: 'Full activity clearance',
          description: 'Patient cleared for most activities',
          expectedStatus: 'achieved',
          varianceRange: 60
        }
      ],
      varianceRanges: [
        {
          parameter: 'pain_level',
          normalRange: [0, 7],
          warningRange: [7, 9],
          criticalRange: [9, 10],
          unit: 'scale_0_10'
        },
        {
          parameter: 'temperature',
          normalRange: [36.5, 38.0],
          warningRange: [38.0, 38.5],
          criticalRange: [38.5, 42.0],
          unit: 'celsius'
        }
      ],
      riskThresholds: [
        {
          id: 'dislocation_risk',
          parameter: 'hip_stability',
          normalThreshold: 4,
          warningThreshold: 3,
          criticalThreshold: 2,
          unit: 'scale_1_5',
          timeWindow: [0, 90]
        },
        {
          id: 'infection_risk',
          parameter: 'temperature',
          normalThreshold: 38.0,
          warningThreshold: 38.5,
          criticalThreshold: 39.0,
          unit: 'celsius',
          timeWindow: [0, 30]
        }
      ]
    };

    const alertWindows: AlertWindow[] = [
      {
        id: 'dislocation_risk',
        surgeryType: 'hip_replacement',
        dayRange: [0, 90],
        symptom: 'hip_instability',
        condition: 'leg_shortening OR severe_pain OR inability_to_move_leg',
        riskLevel: 'Critical',
        action: 'EMERGENCY - Call ambulance immediately',
        explanation: 'Hip dislocation is a medical emergency',
        urgency: 'emergency'
      },
      {
        id: 'infection_hip',
        surgeryType: 'hip_replacement',
        dayRange: [3, 30],
        symptom: 'infection_signs',
        condition: 'fever > 38°C AND day > 2 OR wound_drainage OR redness',
        riskLevel: 'High',
        action: 'Urgent medical evaluation',
        explanation: 'Infection can lead to serious complications',
        urgency: 'urgent'
      }
    ];

    const clinicalRules: ClinicalRule[] = [
      {
        id: 'hip_precautions',
        surgeryType: 'hip_replacement',
        condition: 'day <= 90 AND hip_precautions_not_followed',
        riskLevel: 'High',
        action: 'Reinforce hip precautions immediately',
        explanation: 'Hip dislocation risk is highest in first 3 months',
        evidenceLevel: 'high',
        appliesToDays: [0, 90]
      },
      {
        id: 'blood_clot_prevention',
        surgeryType: 'hip_replacement',
        condition: 'leg_swelling OR calf_pain AND day <= 21',
        riskLevel: 'High',
        action: 'Immediate evaluation for blood clots',
        explanation: 'Blood clots are serious complication after hip surgery',
        evidenceLevel: 'high',
        appliesToDays: [0, 21]
      }
    ];

    return {
      surgeryType: 'hip_replacement',
      recoveryCurve,
      alertWindows,
      clinicalRules,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  private getCardiacSurgeryRecoveryData(): RecoveryIntelligence {
    // Cardiac surgery has different risk profile and longer recovery
    const recoveryCurve: RecoveryCurve = {
      surgeryType: 'cardiac_surgery',
      totalRecoveryDays: 180,
      phases: [
        {
          phase: 'ICU Recovery',
          dayRange: [0, 3],
          description: 'Intensive care monitoring',
          keyActivities: ['Ventilator weaning', 'Hemodynamic monitoring', 'Chest tube management'],
          warningSigns: ['Arrhythmias', 'Low blood pressure', 'Chest bleeding'],
          expectedPainLevel: [6, 8],
          mobilityLevel: 'bed_rest'
        },
        {
          phase: 'Ward Recovery',
          dayRange: [4, 7],
          description: 'Cardiac ward monitoring',
          keyActivities: ['Mobilization', 'Wound care', 'Medication adjustment'],
          warningSigns: ['Fever', 'Wound infection', 'Fluid buildup'],
          expectedPainLevel: [4, 6],
          mobilityLevel: 'assisted'
        },
        {
          phase: 'Early Home Recovery',
          dayRange: [8, 28],
          description: 'Home recovery with restrictions',
          keyActivities: ['Walking program', 'Wound care', 'Activity restrictions'],
          warningSigns: ['Chest pain', 'Shortness of breath', 'Fever'],
          expectedPainLevel: [2, 4],
          mobilityLevel: 'independent'
        },
        {
          phase: 'Cardiac Rehabilitation',
          dayRange: [29, 90],
          description: 'Structured cardiac rehab program',
          keyActivities: ['Supervised exercise', 'Education', 'Risk factor management'],
          warningSigns: ['Exercise intolerance', 'Chest symptoms', 'Weight gain'],
          expectedPainLevel: [1, 3],
          mobilityLevel: 'normal'
        },
        {
          phase: 'Long-term Recovery',
          dayRange: [91, 180],
          description: 'Return to normal activities',
          keyActivities: ['Gradual activity increase', 'Medication optimization', 'Lifestyle changes'],
          warningSigns: ['New symptoms', 'Medication side effects', 'Depression'],
          expectedPainLevel: [0, 2],
          mobilityLevel: 'normal'
        }
      ],
      expectedSymptoms: [
        {
          symptom: 'chest_incision_pain',
          expectedPattern: 'decreasing',
          dayRange: [0, 21],
          severityRange: 'moderate',
          normalVariance: 3
        },
        {
          symptom: 'fatigue',
          expectedPattern: 'peak_then_decrease',
          dayRange: [3, 42],
          severityRange: 'moderate',
          normalVariance: 7
        },
        {
          symptom: 'shortness_of_breath',
          expectedPattern: 'decreasing',
          dayRange: [0, 14],
          severityRange: 'moderate',
          normalVariance: 2
        }
      ],
      milestones: [
        {
          day: 2,
          milestone: 'Sit in chair',
          description: 'Patient able to sit in chair for short periods',
          expectedStatus: 'achieved',
          varianceRange: 1
        },
        {
          day: 4,
          milestone: 'Walk to bathroom',
          description: 'Patient able to walk to bathroom with assistance',
          expectedStatus: 'achieved',
          varianceRange: 2
        },
        {
          day: 7,
          milestone: 'Discharge home',
          description: 'Patient medically cleared for home recovery',
          expectedStatus: 'achieved',
          varianceRange: 3
        },
        {
          day: 14,
          milestone: 'Walk 10 minutes',
          description: 'Patient able to walk continuously for 10 minutes',
          expectedStatus: 'partial',
          varianceRange: 7
        },
        {
          day: 28,
          milestone: 'Drive (if cleared)',
          description: 'Patient cleared for driving after cardiac evaluation',
          expectedStatus: 'partial',
          varianceRange: 14
        },
        {
          day: 42,
          milestone: 'Return to light work',
          description: 'Patient able to return to light duty work',
          expectedStatus: 'partial',
          varianceRange: 14
        },
        {
          day: 90,
          milestone: 'Cardiac rehab completion',
          description: 'Patient completes formal cardiac rehabilitation',
          expectedStatus: 'partial',
          varianceRange: 30
        },
        {
          day: 180,
          milestone: 'Full activity return',
          description: 'Patient cleared for most normal activities',
          expectedStatus: 'achieved',
          varianceRange: 60
        }
      ],
      varianceRanges: [
        {
          parameter: 'heart_rate',
          normalRange: [60, 100],
          warningRange: [100, 120],
          criticalRange: [120, 200],
          unit: 'bpm'
        },
        {
          parameter: 'blood_pressure_systolic',
          normalRange: [90, 140],
          warningRange: [140, 160],
          criticalRange: [160, 200],
          unit: 'mmHg'
        },
        {
          parameter: 'temperature',
          normalRange: [36.5, 37.5],
          warningRange: [37.5, 38.5],
          criticalRange: [38.5, 42.0],
          unit: 'celsius'
        }
      ],
      riskThresholds: [
        {
          id: 'cardiac_complication',
          parameter: 'chest_pain',
          normalThreshold: 2,
          warningThreshold: 4,
          criticalThreshold: 7,
          unit: 'scale_0_10',
          timeWindow: [0, 90]
        },
        {
          id: 'infection_cardiac',
          parameter: 'temperature',
          normalThreshold: 37.5,
          warningThreshold: 38.0,
          criticalThreshold: 38.5,
          unit: 'celsius',
          timeWindow: [0, 30]
        }
      ]
    };

    const alertWindows: AlertWindow[] = [
      {
        id: 'chest_pain_emergency',
        surgeryType: 'cardiac_surgery',
        dayRange: [0, 180],
        symptom: 'chest_pain',
        condition: 'chest_pain > 5 OR chest_pain_with_shortness_of_breath',
        riskLevel: 'Critical',
        action: 'EMERGENCY - Call ambulance immediately',
        explanation: 'Chest pain after cardiac surgery is always an emergency',
        urgency: 'emergency'
      },
      {
        id: 'fever_cardiac',
        surgeryType: 'cardiac_surgery',
        dayRange: [2, 30],
        symptom: 'fever',
        condition: 'temperature > 38°C AND day > 1',
        riskLevel: 'High',
        action: 'Urgent medical evaluation',
        explanation: 'Fever could indicate wound infection or endocarditis',
        urgency: 'urgent'
      },
      {
        id: 'arrhythmia_risk',
        surgeryType: 'cardiac_surgery',
        dayRange: [0, 14],
        symptom: 'heart_rhythm',
        condition: 'irregular_heartbeat OR palpitations OR heart_rate > 120',
        riskLevel: 'High',
        action: 'Immediate cardiac evaluation',
        explanation: 'Arrhythmias are common but require immediate attention',
        urgency: 'urgent'
      }
    ];

    const clinicalRules: ClinicalRule[] = [
      {
        id: 'activity_restrictions',
        surgeryType: 'cardiac_surgery',
        condition: 'day <= 42 AND lifting > 10lbs OR strenuous_activity',
        riskLevel: 'High',
        action: 'Stop activity and rest, contact cardiac team',
        explanation: 'Activity restrictions prevent sternal wound complications',
        evidenceLevel: 'high',
        appliesToDays: [0, 42]
      },
      {
        id: 'medication_adherence',
        surgeryType: 'cardiac_surgery',
        condition: 'missed_cardiac_medications',
        riskLevel: 'Moderate',
        action: 'Take missed doses and contact cardiac team',
        explanation: 'Cardiac medications are critical for recovery',
        evidenceLevel: 'high',
        appliesToDays: [0, 180]
      },
      {
        id: 'wound_care_cardiac',
        surgeryType: 'cardiac_surgery',
        condition: 'sternal_wound_drainage OR redness OR separation',
        riskLevel: 'High',
        action: 'Immediate medical evaluation',
        explanation: 'Sternal wound complications are serious',
        evidenceLevel: 'high',
        appliesToDays: [0, 30]
      }
    ];

    return {
      surgeryType: 'cardiac_surgery',
      recoveryCurve,
      alertWindows,
      clinicalRules,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  // Public methods for accessing recovery intelligence
  getRecoveryIntelligence(surgeryType: string): RecoveryIntelligence | null {
    return this.recoveryData.get(surgeryType) || null;
  }

  getRecoveryCurve(surgeryType: string): RecoveryCurve | null {
    const intelligence = this.recoveryData.get(surgeryType);
    return intelligence?.recoveryCurve || null;
  }

  getAlertWindows(surgeryType: string): AlertWindow[] {
    const intelligence = this.recoveryData.get(surgeryType);
    return intelligence?.alertWindows || [];
  }

  getClinicalRules(surgeryType: string): ClinicalRule[] {
    const intelligence = this.recoveryData.get(surgeryType);
    return intelligence?.clinicalRules || [];
  }

  getRecoveryPhase(surgeryType: string, postOpDay: number): RecoveryPhase | null {
    const curve = this.getRecoveryCurve(surgeryType);
    if (!curve) return null;

    return curve.phases.find(phase => 
      postOpDay >= phase.dayRange[0] && postOpDay <= phase.dayRange[1]
    ) || null;
  }

  getExpectedSymptoms(surgeryType: string, postOpDay: number): SymptomProgression[] {
    const curve = this.getRecoveryCurve(surgeryType);
    if (!curve) return [];

    return curve.expectedSymptoms.filter(symptom => 
      postOpDay >= symptom.dayRange[0] && postOpDay <= symptom.dayRange[1]
    );
  }

  getUpcomingMilestones(surgeryType: string, postOpDay: number, daysAhead: number = 7): RecoveryMilestone[] {
    const curve = this.getRecoveryCurve(surgeryType);
    if (!curve) return [];

    return curve.milestones.filter(milestone => 
      milestone.day > postOpDay && milestone.day <= postOpDay + daysAhead
    );
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getSupportedSurgeryTypes(): string[] {
    return Array.from(this.recoveryData.keys());
  }
}

// Export singleton instance
export const recoveryIntelligenceService = RecoveryIntelligenceService.getInstance();
