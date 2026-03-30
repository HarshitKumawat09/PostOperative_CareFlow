// Test query dataset for evaluating embedding quality and retrieval performance
// Each query is tagged with expected relevant surgery types for sensitivity/specificity calculation

import { SurgeryType } from './types';

export interface TestQuery {
  id: string;
  query: string;
  expectedSurgeryTypes: SurgeryType[];  // Which surgery types should retrieve this
  category: 'symptoms' | 'medication' | 'recovery' | 'complications' | 'exercise' | 'diet';
  difficulty: 'easy' | 'medium' | 'hard';  // How specific is the query
}

// Comprehensive test queries covering all surgery types
export const EMBEDDING_TEST_QUERIES: TestQuery[] = [
  // === KNEE REPLACEMENT QUERIES ===
  {
    id: 'knee-1',
    query: 'How long does swelling last after knee replacement surgery?',
    expectedSurgeryTypes: [SurgeryType.KNEE_REPLACEMENT],
    category: 'symptoms',
    difficulty: 'easy'
  },
  {
    id: 'knee-2',
    query: 'What painkillers are safe to take after knee surgery?',
    expectedSurgeryTypes: [SurgeryType.KNEE_REPLACEMENT],
    category: 'medication',
    difficulty: 'easy'
  },
  {
    id: 'knee-3',
    query: 'When can I start walking without crutches after knee replacement?',
    expectedSurgeryTypes: [SurgeryType.KNEE_REPLACEMENT],
    category: 'recovery',
    difficulty: 'medium'
  },
  {
    id: 'knee-4',
    query: 'Signs of infection after knee surgery',
    expectedSurgeryTypes: [SurgeryType.KNEE_REPLACEMENT],
    category: 'complications',
    difficulty: 'easy'
  },
  {
    id: 'knee-5',
    query: 'Physical therapy exercises for knee replacement recovery',
    expectedSurgeryTypes: [SurgeryType.KNEE_REPLACEMENT],
    category: 'exercise',
    difficulty: 'easy'
  },

  // === HIP REPLACEMENT QUERIES ===
  {
    id: 'hip-1',
    query: 'Hip replacement recovery timeline and milestones',
    expectedSurgeryTypes: [SurgeryType.HIP_REPLACEMENT],
    category: 'recovery',
    difficulty: 'easy'
  },
  {
    id: 'hip-2',
    query: 'How to prevent hip dislocation after surgery?',
    expectedSurgeryTypes: [SurgeryType.HIP_REPLACEMENT],
    category: 'complications',
    difficulty: 'medium'
  },
  {
    id: 'hip-3',
    query: 'When can I drive after hip replacement?',
    expectedSurgeryTypes: [SurgeryType.HIP_REPLACEMENT],
    category: 'recovery',
    difficulty: 'easy'
  },
  {
    id: 'hip-4',
    query: 'Hip precautions and movement restrictions',
    expectedSurgeryTypes: [SurgeryType.HIP_REPLACEMENT],
    category: 'recovery',
    difficulty: 'medium'
  },

  // === CARDIAC SURGERY QUERIES ===
  {
    id: 'cardiac-1',
    query: 'Heart bypass surgery recovery diet recommendations',
    expectedSurgeryTypes: [SurgeryType.CARDIAC_SURGERY],
    category: 'diet',
    difficulty: 'easy'
  },
  {
    id: 'cardiac-2',
    query: 'When can I resume exercise after heart surgery?',
    expectedSurgeryTypes: [SurgeryType.CARDIAC_SURGERY],
    category: 'exercise',
    difficulty: 'medium'
  },
  {
    id: 'cardiac-3',
    query: 'Signs of heart infection after cardiac surgery',
    expectedSurgeryTypes: [SurgeryType.CARDIAC_SURGERY],
    category: 'complications',
    difficulty: 'easy'
  },
  {
    id: 'cardiac-4',
    query: 'Blood thinner management after heart surgery',
    expectedSurgeryTypes: [SurgeryType.CARDIAC_SURGERY],
    category: 'medication',
    difficulty: 'hard'
  },

  // === ABDOMINAL SURGERY QUERIES ===
  {
    id: 'abdominal-1',
    query: 'How to care for surgical incision after abdominal surgery?',
    expectedSurgeryTypes: [SurgeryType.ABDOMINAL_SURGERY, SurgeryType.APPENDECTOMY],
    category: 'recovery',
    difficulty: 'easy'
  },
  {
    id: 'abdominal-2',
    query: 'When can I eat solid food after abdominal surgery?',
    expectedSurgeryTypes: [SurgeryType.ABDOMINAL_SURGERY],
    category: 'diet',
    difficulty: 'easy'
  },
  {
    id: 'abdominal-3',
    query: 'Managing constipation after abdominal surgery',
    expectedSurgeryTypes: [SurgeryType.ABDOMINAL_SURGERY],
    category: 'symptoms',
    difficulty: 'easy'
  },

  // === SPINAL SURGERY QUERIES ===
  {
    id: 'spine-1',
    query: 'Spinal fusion recovery timeline',
    expectedSurgeryTypes: [SurgeryType.SPINAL_SURGERY],
    category: 'recovery',
    difficulty: 'easy'
  },
  {
    id: 'spine-2',
    query: 'When is numbness normal after back surgery?',
    expectedSurgeryTypes: [SurgeryType.SPINAL_SURGERY],
    category: 'symptoms',
    difficulty: 'medium'
  },
  {
    id: 'spine-3',
    query: 'Lifting restrictions after spinal surgery',
    expectedSurgeryTypes: [SurgeryType.SPINAL_SURGERY],
    category: 'recovery',
    difficulty: 'easy'
  },

  // === C-SECTION QUERIES ===
  {
    id: 'csection-1',
    query: 'C-section incision care and healing',
    expectedSurgeryTypes: [SurgeryType.CESAREAN_SECTION],
    category: 'recovery',
    difficulty: 'easy'
  },
  {
    id: 'csection-2',
    query: 'When can I exercise after C-section?',
    expectedSurgeryTypes: [SurgeryType.CESAREAN_SECTION],
    category: 'exercise',
    difficulty: 'medium'
  },
  {
    id: 'csection-3',
    query: 'Postpartum pain management after C-section',
    expectedSurgeryTypes: [SurgeryType.CESAREAN_SECTION],
    category: 'medication',
    difficulty: 'medium'
  },

  // === SHOULDER SURGERY QUERIES ===
  {
    id: 'shoulder-1',
    query: 'Rotator cuff surgery recovery exercises',
    expectedSurgeryTypes: [SurgeryType.SHOULDER_SURGERY],
    category: 'exercise',
    difficulty: 'easy'
  },
  {
    id: 'shoulder-2',
    query: 'When can I lift my arm after shoulder surgery?',
    expectedSurgeryTypes: [SurgeryType.SHOULDER_SURGERY],
    category: 'recovery',
    difficulty: 'medium'
  },

  // === GALLBLADDER QUERIES ===
  {
    id: 'gallbladder-1',
    query: 'Diet after gallbladder removal surgery',
    expectedSurgeryTypes: [SurgeryType.GALLBLADDER_SURGERY],
    category: 'diet',
    difficulty: 'easy'
  },
  {
    id: 'gallbladder-2',
    query: 'Recovery time for laparoscopic gallbladder surgery',
    expectedSurgeryTypes: [SurgeryType.GALLBLADDER_SURGERY],
    category: 'recovery',
    difficulty: 'easy'
  },

  // === PROSTATE SURGERY QUERIES ===
  {
    id: 'prostate-1',
    query: 'Prostate surgery recovery and incontinence',
    expectedSurgeryTypes: [SurgeryType.PROSTATE_SURGERY],
    category: 'symptoms',
    difficulty: 'medium'
  },
  {
    id: 'prostate-2',
    query: 'When can I resume sexual activity after prostate surgery?',
    expectedSurgeryTypes: [SurgeryType.PROSTATE_SURGERY],
    category: 'recovery',
    difficulty: 'hard'
  },

  // === CROSS-SURGERY QUERIES (for specificity testing) ===
  // These should NOT match specific surgery types (testing specificity)
  {
    id: 'cross-1',
    query: 'General anesthesia side effects',
    expectedSurgeryTypes: [],  // Generic, applies to all
    category: 'symptoms',
    difficulty: 'easy'
  },
  {
    id: 'cross-2',
    query: 'Hospital discharge planning',
    expectedSurgeryTypes: [],  // Generic
    category: 'recovery',
    difficulty: 'easy'
  },
  {
    id: 'cross-3',
    query: 'How to change surgical dressing',
    expectedSurgeryTypes: [],  // Generic wound care
    category: 'recovery',
    difficulty: 'easy'
  },
  {
    id: 'knee-cardiac-cross',
    query: 'Blood clot prevention after surgery',
    expectedSurgeryTypes: [SurgeryType.KNEE_REPLACEMENT, SurgeryType.HIP_REPLACEMENT, SurgeryType.CARDIAC_SURGERY],
    category: 'complications',
    difficulty: 'hard'
  }
];

// Get test queries for a specific surgery type
export function getTestQueriesForSurgeryType(surgeryType: SurgeryType): TestQuery[] {
  return EMBEDDING_TEST_QUERIES.filter(
    q => q.expectedSurgeryTypes.includes(surgeryType)
  );
}

// Get negative test queries (should NOT match this surgery type)
export function getNegativeTestQueriesForSurgeryType(surgeryType: SurgeryType): TestQuery[] {
  return EMBEDDING_TEST_QUERIES.filter(
    q => q.expectedSurgeryTypes.length === 0 || !q.expectedSurgeryTypes.includes(surgeryType)
  );
}

// Get queries by category
export function getTestQueriesByCategory(category: TestQuery['category']): TestQuery[] {
  return EMBEDDING_TEST_QUERIES.filter(q => q.category === category);
}

// Get queries by difficulty
export function getTestQueriesByDifficulty(difficulty: TestQuery['difficulty']): TestQuery[] {
  return EMBEDDING_TEST_QUERIES.filter(q => q.difficulty === difficulty);
}
