export type ClinicalKnowledgeItem = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

// Phase 1: small built-in knowledge base. Later you can move this to Firestore.
export const clinicalKnowledge: ClinicalKnowledgeItem[] = [
  {
    id: 'wound-care-basics',
    title: 'Post-operative wound care basics',
    tags: ['wound', 'infection', 'redness', 'swelling', 'discharge', 'pain'],
    content:
      'Monitor surgical wounds daily for increased redness, warmth, swelling, foul-smelling discharge, or rapidly increasing pain. ' +
      'Patients with concerning changes should be evaluated within 24 hours. Educate patients to keep the area clean and dry and avoid tight clothing or pressure on the wound.',
  },
  {
    id: 'pain-management-escalation',
    title: 'Pain management and escalation',
    tags: ['pain', 'analgesia', 'opioid', 'escalation'],
    content:
      'Persistent pain scores above 7/10 for more than 24 hours despite prescribed analgesia warrant review of the pain regimen and possible adjustment. ' +
      'Assess for red-flag symptoms (shortness of breath, chest pain, confusion) before simply increasing opioids.',
  },
  {
    id: 'task-adherence-and-function',
    title: 'Task adherence and functional status',
    tags: ['mobility', 'exercise', 'adherence', 'tasks'],
    content:
      'Reduced completion of prescribed daily tasks or exercises over several days may indicate declining functional status, inadequate pain control, or low mood. ' +
      'Consider contacting the patient to explore barriers and adjust the care plan or involve physiotherapy/mental health support as needed.',
  },
];
