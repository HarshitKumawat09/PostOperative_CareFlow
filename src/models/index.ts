// Main exports for CareFlow OOP Models
// This file provides a clean import interface for all OOP classes

// Base classes and enums
export {
  MedicalEntity,
  validatePainLevel,
  validateMobilityScore,
  validateTemperature
} from './base';

export type {
  SurgeryType,
  RiskLevel,
  SymptomReport,
  RecoveryCurve,
  RiskRule,
  RiskInput
} from './base';

// Patient classes
export {
  Patient
} from './patient';

export type {
  PatientProfile,
  MedicalHistory
} from './patient';

// Surgery protocol classes
export {
  SurgeryProtocol,
  createKneeReplacementProtocol,
  createAbdominalSurgeryProtocol
} from './surgery-protocol';

export type {
  SurgeryMetadata,
  ProtocolValidation
} from './surgery-protocol';

// Risk assessment classes
export {
  RiskAssessmentEngine
} from './risk-assessment';

export type {
  RiskAssessmentResult,
  RiskFactor,
  Recommendation
} from './risk-assessment';

// Factory functions for easy setup
export const createDefaultProtocols = () => {
  return {
    kneeReplacement: createKneeReplacementProtocol(),
    abdominalSurgery: createAbdominalSurgeryProtocol()
  };
};

export const createRiskAssessmentEngine = () => {
  const engine = new RiskAssessmentEngine();
  const protocols = createDefaultProtocols();
  
  // Register all default protocols
  Object.values(protocols).forEach(protocol => {
    engine.registerProtocol(protocol);
  });
  
  return engine;
};
