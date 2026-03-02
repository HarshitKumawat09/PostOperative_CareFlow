// Test Helper Functions
// Shared test utilities for OOP and Vector Database tests

import { PatientProfile, Patient } from '../patient';
import { SurgeryType, SymptomReport } from '../base';

export const createTestPatientProfile = (): PatientProfile => ({
  firstName: 'John',
  lastName: 'Doe',
  age: 65,
  email: 'john.doe@test.com',
  phone: '+1234567890',
  emergencyContact: '+1234567891'
});

export const createTestSymptoms = (painLevel: number = 5, dayOffset: number = 0): SymptomReport => ({
  painLevel,
  mobilityScore: 6,
  woundCondition: 'normal',
  temperature: 37.5,
  notes: `Test symptoms for day ${dayOffset}`,
  reportedAt: new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000)
});

export const createTestPatient = (
  id: string = 'test-patient-001',
  surgeryType: SurgeryType = SurgeryType.KNEE_REPLACEMENT,
  painLevel: number = 5
) => {
  const profile = createTestPatientProfile();
  const symptoms = createTestSymptoms(painLevel);
  const surgeryDate = new Date('2024-01-01');
  
  return new Patient(id, profile, surgeryType, surgeryDate, symptoms);
};

// Vector database test helpers
export const createTestMedicalGuideline = () => ({
  title: 'Test Medical Guideline',
  content: 'This is a comprehensive test medical guideline for post-operative care. It includes detailed instructions for pain management, wound care, and recovery milestones.',
  documentType: 'post_operative_protocol' as const,
  surgeryTypes: [SurgeryType.KNEE_REPLACEMENT],
  keywords: ['test', 'guideline', 'post-operative', 'care'],
  source: 'Test Medical Journal'
});

export const createTestVectorSearchQuery = () => ({
  query: 'knee replacement pain management',
  surgeryType: SurgeryType.KNEE_REPLACEMENT,
  recoveryDay: 5,
  limit: 10
});

// Mock data generators
export const generateMockSearchResults = (count: number = 3) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `result-${index + 1}`,
    content: `Mock search result ${index + 1} content about knee replacement care and pain management protocols.`,
    score: 0.9 - (index * 0.1),
    distance: index * 0.1,
    metadata: {
      id: `doc-${index + 1}`,
      title: `Test Document ${index + 1}`,
      documentType: 'post_operative_protocol' as const,
      surgeryTypes: [SurgeryType.KNEE_REPLACEMENT],
      keywords: ['test', 'knee', 'replacement', 'pain'],
      source: 'Test Source',
      lastUpdated: new Date(),
      evidenceLevel: 'high' as const,
      language: 'en',
      specialty: 'orthopedics'
    }
  }));
};

export const generateMockAIExplanation = () => ({
  summary: 'Based on the patient\'s current symptoms and recovery progress, the knee replacement recovery is proceeding normally within expected parameters.',
  detailedExplanation: 'The patient is on day 5 post-knee replacement surgery with pain levels of 5/10, which is within the expected range for this stage of recovery. Mobility score of 6/10 indicates good progress. Temperature is normal at 37.5°C, and wound condition shows no signs of infection.',
  recommendations: [
    'Continue current pain management regimen',
    'Increase physical therapy exercises gradually',
    'Monitor wound site for any signs of infection',
    'Ensure proper elevation and ice application',
    'Schedule follow-up appointment if pain increases beyond 7/10'
  ],
  riskAssessment: 'Low to moderate risk. Current symptoms are within expected range for post-operative day 5. No immediate concerns identified.',
  nextSteps: [
    'Continue daily physical therapy sessions',
    'Monitor pain levels and adjust medication as needed',
    'Maintain wound care routine',
    'Progress mobility exercises as tolerated',
    'Follow up with surgeon in 1 week'
  ],
  confidence: 0.89,
  sources: ['Test Medical Guidelines', 'Post-Operative Care Protocols']
});

export const generateMockVectorDBStats = () => ({
  totalDocuments: 156,
  totalEmbeddings: 1248,
  documentTypes: {
    'clinical_guideline': 45,
    'post_operative_protocol': 38,
    'pain_management': 22,
    'wound_care': 18,
    'complication_guideline': 15,
    'medication_guideline': 12,
    'recovery_milestone': 6
  },
  surgeryTypes: {
    'KNEE_REPLACEMENT': 28,
    'HIP_REPLACEMENT': 24,
    'CARDIAC_BYPASS': 18,
    'ABDOMINAL_SURGERY': 15,
    'C_SECTION': 12,
    'SPINAL_SURGERY': 10,
    'OTHER': 49
  },
  lastUpdated: new Date()
});
