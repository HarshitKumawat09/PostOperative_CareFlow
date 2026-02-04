// Unit Tests for OOP Classes
// Comprehensive testing of the CareFlow OOP architecture

import { 
  MedicalEntity, 
  SurgeryType, 
  RiskLevel, 
  SymptomReport,
  validatePainLevel,
  validateMobilityScore,
  validateTemperature
} from '../base';
import { Patient, PatientProfile } from '../patient';
import { SurgeryProtocol, createKneeReplacementProtocol, createAbdominalSurgeryProtocol } from '../surgery-protocol';
import { RiskAssessmentEngine } from '../risk-assessment';

// Mock data for testing
const createTestPatientProfile = (): PatientProfile => ({
  firstName: 'John',
  lastName: 'Doe',
  age: 65,
  email: 'john.doe@test.com',
  phone: '+1234567890',
  emergencyContact: '+1234567891'
});

const createTestSymptoms = (painLevel: number = 5, dayOffset: number = 0): SymptomReport => ({
  painLevel,
  mobilityScore: 6,
  woundCondition: 'normal',
  temperature: 37.0,
  notes: 'Recovering well',
  reportedAt: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000)
});

describe('Base Classes and Utilities', () => {
  describe('Validation Utilities', () => {
    test('validatePainLevel should accept valid pain levels', () => {
      expect(validatePainLevel(1)).toBe(true);
      expect(validatePainLevel(5)).toBe(true);
      expect(validatePainLevel(10)).toBe(true);
    });

    test('validatePainLevel should reject invalid pain levels', () => {
      expect(validatePainLevel(0)).toBe(false);
      expect(validatePainLevel(11)).toBe(false);
      expect(validatePainLevel(-1)).toBe(false);
      expect(validatePainLevel(NaN)).toBe(false);
    });

    test('validateMobilityScore should accept valid mobility scores', () => {
      expect(validateMobilityScore(1)).toBe(true);
      expect(validateMobilityScore(5)).toBe(true);
      expect(validateMobilityScore(10)).toBe(true);
      expect(validateMobilityScore(undefined)).toBe(true);
    });

    test('validateMobilityScore should reject invalid mobility scores', () => {
      expect(validateMobilityScore(0)).toBe(false);
      expect(validateMobilityScore(11)).toBe(false);
      expect(validateMobilityScore(-1)).toBe(false);
    });

    test('validateTemperature should accept valid temperatures', () => {
      expect(validateTemperature(36.5)).toBe(true);
      expect(validateTemperature(37.0)).toBe(true);
      expect(validateTemperature(38.5)).toBe(true);
      expect(validateTemperature(undefined)).toBe(true);
    });

    test('validateTemperature should reject invalid temperatures', () => {
      expect(validateTemperature(34.0)).toBe(false);
      expect(validateTemperature(43.0)).toBe(false);
    });
  });

  describe('SurgeryType Enum', () => {
    test('should contain all expected surgery types', () => {
      expect(SurgeryType.KNEE_REPLACEMENT).toBeDefined();
      expect(SurgeryType.ABDOMINAL_SURGERY).toBeDefined();
      expect(SurgeryType.CARDIAC_BYPASS).toBeDefined();
      expect(Object.keys(SurgeryType).length).toBeGreaterThan(10);
    });
  });

  describe('RiskLevel Enum', () => {
    test('should contain all expected risk levels', () => {
      expect(RiskLevel.LOW).toBeDefined();
      expect(RiskLevel.MODERATE).toBeDefined();
      expect(RiskLevel.HIGH).toBeDefined();
      expect(RiskLevel.CRITICAL).toBeDefined();
    });
  });
});

describe('Patient Class', () => {
  let patient: Patient;
  let profile: PatientProfile;
  let symptoms: SymptomReport;

  beforeEach(() => {
    profile = createTestPatientProfile();
    symptoms = createTestSymptoms();
    patient = new Patient(
      'patient-001',
      profile,
      SurgeryType.KNEE_REPLACEMENT,
      new Date('2024-01-01'),
      symptoms
    );
  });

  describe('Constructor and Validation', () => {
    test('should create valid patient with correct properties', () => {
      expect(patient.getId()).toBe('patient-001');
      expect(patient.getSurgeryType()).toBe(SurgeryType.KNEE_REPLACEMENT);
      expect(patient.getFullName()).toBe('John Doe');
      expect(patient.getAgeGroup()).toBe('senior');
      expect(patient.validate()).toBe(true);
    });

    test('should throw error with invalid ID', () => {
      expect(() => {
        new Patient('', profile, SurgeryType.KNEE_REPLACEMENT, new Date(), symptoms);
      }).toThrow('Valid ID is required');
    });

    test('should throw error with invalid age', () => {
      const invalidProfile = { ...profile, age: -5 };
      expect(() => {
        new Patient('patient-002', invalidProfile, SurgeryType.KNEE_REPLACEMENT, new Date(), symptoms);
      }).toThrow('Invalid patient data');
    });

    test('should throw error with invalid pain level', () => {
      const invalidSymptoms = { ...symptoms, painLevel: 15 };
      expect(() => {
        new Patient('patient-003', profile, SurgeryType.KNEE_REPLACEMENT, new Date(), invalidSymptoms);
      }).toThrow('Invalid patient data');
    });
  });

  describe('Recovery Day Calculation', () => {
    test('should calculate correct recovery day', () => {
      const surgeryDate = new Date();
      surgeryDate.setDate(surgeryDate.getDate() - 5); // 5 days ago
      const testPatient = new Patient('patient-004', profile, SurgeryType.KNEE_REPLACEMENT, surgeryDate, symptoms);
      expect(testPatient.getRecoveryDay()).toBe(5);
    });

    test('should handle same day surgery', () => {
      const surgeryDate = new Date();
      const testPatient = new Patient('patient-005', profile, SurgeryType.KNEE_REPLACEMENT, surgeryDate, symptoms);
      expect(testPatient.getRecoveryDay()).toBe(0);
    });
  });

  describe('Symptom Management', () => {
    test('should update symptoms correctly', () => {
      const newSymptoms = createTestSymptoms(3, 1); // Lower pain, next day
      patient.updateSymptoms(newSymptoms);
      
      expect(patient.getCurrentSymptoms().painLevel).toBe(3);
      expect(patient.getSymptomHistory().length).toBe(2);
    });

    test('should throw error with invalid symptom update', () => {
      const invalidSymptoms = { ...symptoms, painLevel: 15 };
      expect(() => {
        patient.updateSymptoms(invalidSymptoms);
      }).toThrow('Invalid symptom data');
    });
  });

  describe('Risk Assessment', () => {
    test('should identify high risk factors', () => {
      const highRiskSymptoms = createTestSymptoms(9); // High pain
      patient.updateSymptoms(highRiskSymptoms);
      expect(patient.hasHighRiskFactors()).toBe(true);
    });

    test('should not identify risk factors for normal symptoms', () => {
      expect(patient.hasHighRiskFactors()).toBe(false);
    });

    test('should generate correct risk inputs', () => {
      const riskInputs = patient.getRiskInputs();
      expect(riskInputs.surgeryType).toBe(SurgeryType.KNEE_REPLACEMENT);
      expect(riskInputs.symptoms.painLevel).toBe(5);
      expect(riskInputs.previousSymptoms).toBeDefined();
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize to JSON correctly', () => {
      const json = patient.toJSON() as any;
      expect(json.id).toBe('patient-001');
      expect(json.surgeryType).toBe(SurgeryType.KNEE_REPLACEMENT);
      expect(json.profile.firstName).toBe('John');
      expect(json.currentSymptoms.painLevel).toBe(5);
    });

    test('should deserialize from JSON correctly', () => {
      const json = patient.toJSON();
      const deserializedPatient = Patient.fromJSON(json);
      
      expect(deserializedPatient.getId()).toBe(patient.getId());
      expect(deserializedPatient.getFullName()).toBe(patient.getFullName());
      expect(deserializedPatient.getSurgeryType()).toBe(patient.getSurgeryType());
    });
  });
});

describe('SurgeryProtocol Class', () => {
  let kneeProtocol: SurgeryProtocol;
  let abdominalProtocol: SurgeryProtocol;

  beforeEach(() => {
    kneeProtocol = createKneeReplacementProtocol();
    abdominalProtocol = createAbdominalSurgeryProtocol();
  });

  describe('Protocol Creation', () => {
    test('should create valid knee replacement protocol', () => {
      expect(kneeProtocol.getSurgeryType()).toBe(SurgeryType.KNEE_REPLACEMENT);
      expect(kneeProtocol.validate()).toBe(true);
      expect(kneeProtocol.getMetadata().displayName).toBe('Knee Replacement Surgery');
    });

    test('should create valid abdominal surgery protocol', () => {
      expect(abdominalProtocol.getSurgeryType()).toBe(SurgeryType.ABDOMINAL_SURGERY);
      expect(abdominalProtocol.validate()).toBe(true);
      expect(abdominalProtocol.getMetadata().displayName).toBe('Abdominal Surgery');
    });
  });

  describe('Recovery Curve Analysis', () => {
    test('should get expected recovery for specific days', () => {
      const day1Recovery = kneeProtocol.getExpectedRecovery(1);
      expect(day1Recovery).toBeDefined();
      expect(day1Recovery!.expectedPainRange).toEqual([7, 9]);

      const day7Recovery = kneeProtocol.getExpectedRecovery(7);
      expect(day7Recovery).toBeDefined();
      expect(day7Recovery!.expectedPainRange).toEqual([3, 5]);
    });

    test('should interpolate recovery for non-specified days', () => {
      const day5Recovery = kneeProtocol.getExpectedRecovery(5);
      expect(day5Recovery).toBeDefined();
      expect(day5Recovery!.expectedPainRange[0]).toBeGreaterThan(3);
      expect(day5Recovery!.expectedPainRange[1]).toBeLessThan(7);
    });

    test('should check if pain is within expected range', () => {
      expect(kneeProtocol.isPainWithinExpectedRange(1, 8)).toBe(true);
      expect(kneeProtocol.isPainWithinExpectedRange(1, 10)).toBe(false);
      expect(kneeProtocol.isPainWithinExpectedRange(7, 4)).toBe(true);
      expect(kneeProtocol.isPainWithinExpectedRange(7, 6)).toBe(false);
    });

    test('should calculate pain deviation correctly', () => {
      const deviation = kneeProtocol.getPainDeviation(7, 5);
      expect(deviation).toBe(0); // 5 is within [3,5], expected is 4

      const highDeviation = kneeProtocol.getPainDeviation(7, 7);
      expect(highDeviation).toBeGreaterThan(0);
    });
  });

  describe('Risk Rules', () => {
    test('should get applicable risk rules for specific days', () => {
      const day1Rules = kneeProtocol.getApplicableRiskRules(1);
      expect(day1Rules.length).toBeGreaterThan(0);

      const day10Rules = kneeProtocol.getApplicableRiskRules(10);
      expect(day10Rules.length).toBeGreaterThan(0);
    });

    test('should filter rules by day range', () => {
      const day1Rules = kneeProtocol.getApplicableRiskRules(1);
      const day20Rules = kneeProtocol.getApplicableRiskRules(20);
      
      // Some rules should be day-specific
      expect(day1Rules.some(rule => rule.dayRange)).toBe(true);
    });
  });

  describe('Protocol Management', () => {
    test('should update protocol correctly', () => {
      const newMetadata = {
        displayName: 'Updated Knee Protocol',
        description: 'Updated description'
      };
      
      kneeProtocol.updateProtocol(newMetadata);
      expect(kneeProtocol.getMetadata().displayName).toBe('Updated Knee Protocol');
    });

    test('should activate and deactivate protocol', () => {
      expect(kneeProtocol.isActiveProtocol()).toBe(true);
      
      kneeProtocol.deactivate();
      expect(kneeProtocol.isActiveProtocol()).toBe(false);
      
      kneeProtocol.activate();
      expect(kneeProtocol.isActiveProtocol()).toBe(true);
    });
  });

  describe('JSON Serialization', () => {
    test('should serialize to JSON correctly', () => {
      const json = kneeProtocol.toJSON() as any;
      expect(json.id).toBeDefined();
      expect(json.surgeryType).toBe(SurgeryType.KNEE_REPLACEMENT);
      expect(json.metadata.displayName).toBe('Knee Replacement Surgery');
    });

    test('should deserialize from JSON correctly', () => {
      const json = kneeProtocol.toJSON();
      const deserializedProtocol = SurgeryProtocol.fromJSON(json);
      
      expect(deserializedProtocol.getSurgeryType()).toBe(kneeProtocol.getSurgeryType());
      expect(deserializedProtocol.getMetadata().displayName).toBe(kneeProtocol.getMetadata().displayName);
    });
  });
});

describe('RiskAssessmentEngine', () => {
  let engine: RiskAssessmentEngine;
  let patient: Patient;
  let kneeProtocol: SurgeryProtocol;

  beforeEach(() => {
    engine = new RiskAssessmentEngine();
    kneeProtocol = createKneeReplacementProtocol();
    engine.registerProtocol(kneeProtocol);
    
    patient = new Patient(
      'patient-assessment-001',
      createTestPatientProfile(),
      SurgeryType.KNEE_REPLACEMENT,
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      createTestSymptoms(5)
    );
  });

  describe('Engine Setup', () => {
    test('should register protocols correctly', () => {
      expect(engine.getRegisteredProtocols()).toContain(SurgeryType.KNEE_REPLACEMENT);
    });

    test('should throw error for unregistered surgery type', () => {
      const cardiacPatient = new Patient(
        'patient-cardiac-001',
        createTestPatientProfile(),
        SurgeryType.CARDIAC_BYPASS,
        new Date(),
        createTestSymptoms()
      );
      
      expect(() => {
        engine.assessPatientRisk(cardiacPatient);
      }).toThrow('No protocol found for surgery type');
    });
  });

  describe('Risk Assessment', () => {
    test('should assess normal recovery as low risk', () => {
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.patientId).toBe('patient-assessment-001');
      expect(assessment.surgeryType).toBe(SurgeryType.KNEE_REPLACEMENT);
      expect(assessment.recoveryDay).toBe(5);
      expect(assessment.overallRiskLevel).toBe(RiskLevel.LOW);
      expect(assessment.riskFactors).toBeDefined();
      expect(assessment.recommendations).toBeDefined();
    });

    test('should identify high pain as risk factor', () => {
      patient.updateSymptoms(createTestSymptoms(9)); // High pain
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.overallRiskLevel).toBe(RiskLevel.HIGH);
      expect(assessment.riskFactors.some(rf => rf.type === 'pain' && rf.severity === 'severe')).toBe(true);
    });

    test('should identify fever as risk factor', () => {
      const feverSymptoms = createTestSymptoms(5);
      feverSymptoms.temperature = 39.0; // High fever
      patient.updateSymptoms(feverSymptoms);
      
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.riskFactors.some(rf => rf.type === 'temperature' && rf.severity === 'severe')).toBe(true);
      expect(assessment.urgencyLevel).toBe('high');
    });

    test('should identify wound infection as risk factor', () => {
      const woundSymptoms = createTestSymptoms(5);
      woundSymptoms.woundCondition = 'infection';
      patient.updateSymptoms(woundSymptoms);
      
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.riskFactors.some(rf => rf.type === 'wound' && rf.severity === 'severe')).toBe(true);
    });

    test('should assess mobility issues correctly', () => {
      const mobilitySymptoms = createTestSymptoms(5);
      mobilitySymptoms.mobilityScore = 2; // Low mobility
      patient.updateSymptoms(mobilitySymptoms);
      
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.riskFactors.some(rf => rf.type === 'mobility')).toBe(true);
    });
  });

  describe('Recommendations Generation', () => {
    test('should generate appropriate recommendations for high risk', () => {
      const severeSymptoms = createTestSymptoms(9);
      severeSymptoms.temperature = 39.0;
      severeSymptoms.woundCondition = 'infection';
      patient.updateSymptoms(severeSymptoms);
      
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.recommendations.length).toBeGreaterThan(0);
      expect(assessment.recommendations.some(r => r.includes('immediate'))).toBe(true);
      expect(assessment.recommendations.some(r => r.includes('medical evaluation'))).toBe(true);
    });

    test('should generate minimal recommendations for low risk', () => {
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.recommendations.length).toBeGreaterThan(0);
      expect(assessment.recommendations.some(r => r.includes('continue current recovery'))).toBe(true);
    });
  });

  describe('Assessment History', () => {
    test('should store assessment history', () => {
      engine.assessPatientRisk(patient);
      engine.assessPatientRisk(patient);
      
      const history = engine.getAssessmentHistory(patient.getId());
      expect(history.length).toBe(2);
    });

    test('should limit history to 30 assessments', () => {
      // Simulate 31 assessments
      for (let i = 0; i < 31; i++) {
        patient.updateSymptoms(createTestSymptoms(5 + i));
        engine.assessPatientRisk(patient);
      }
      
      const history = engine.getAssessmentHistory(patient.getId());
      expect(history.length).toBe(30);
    });
  });

  describe('Urgency and Review Time', () => {
    test('should set immediate urgency for critical risk', () => {
      const criticalSymptoms = createTestSymptoms(10);
      criticalSymptoms.temperature = 40.0;
      criticalSymptoms.woundCondition = 'infection';
      patient.updateSymptoms(criticalSymptoms);
      
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.urgencyLevel).toBe('immediate');
      expect(assessment.nextReviewInHours).toBeLessThanOrEqual(2);
    });

    test('should set appropriate review time for low risk', () => {
      const assessment = engine.assessPatientRisk(patient);
      
      expect(assessment.urgencyLevel).toBe('low');
      expect(assessment.nextReviewInHours).toBeGreaterThanOrEqual(24);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle complete patient journey', () => {
    const engine = new RiskAssessmentEngine();
    engine.registerProtocol(createKneeReplacementProtocol());
    
    const patient = new Patient(
      'integration-patient-001',
      createTestPatientProfile(),
      SurgeryType.KNEE_REPLACEMENT,
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createTestSymptoms(7) // High but expected pain for day 3
    );
    
    // Initial assessment
    let assessment = engine.assessPatientRisk(patient);
    expect(assessment.recoveryDay).toBe(3);
    
    // Simulate recovery progression
    for (let day = 4; day <= 10; day++) {
      const symptoms = createTestSymptoms(Math.max(2, 7 - (day - 3)), day - 3);
      patient.updateSymptoms(symptoms);
      assessment = engine.assessPatientRisk(patient);
      
      // Risk should decrease as recovery progresses
      if (day >= 7) {
        expect(assessment.overallRiskLevel).toBe(RiskLevel.LOW);
      }
    }
    
    // Verify history is maintained
    const history = engine.getAssessmentHistory(patient.getId());
    expect(history.length).toBeGreaterThan(5);
  });
});
