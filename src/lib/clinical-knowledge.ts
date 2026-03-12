export type ClinicalKnowledgeItem = {
  id: string;
  title: string;
  content: string;
  tags: string[];
};

// Enhanced clinical knowledge base with comprehensive post-operative guidelines
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
  {
    id: 'fever-post-operative',
    title: 'Fever after surgery - guidelines and assessment',
    tags: ['fever', 'temperature', 'infection', 'post-operative', 'days', 'assessment'],
    content:
      'Low-grade fever (up to 38°C or 100.4°F) is common during the first 48-72 hours after surgery due to the inflammatory response. ' +
      'Fever higher than 38°C or persisting beyond day 3 should raise suspicion for infection. ' +
      'Assess for surgical site infection, pneumonia, urinary tract infection, or deep vein thrombosis. ' +
      'Contact surgical team if fever exceeds 38.5°C (101.3°F) or persists beyond post-op day 3.',
  },
  {
    id: 'infection-signs-symptoms',
    title: 'Post-operative infection signs and symptoms',
    tags: ['infection', 'signs', 'symptoms', 'wound', 'systemic', 'fever'],
    content:
      'Signs of surgical site infection include increasing pain, redness spreading from wound edges, purulent discharge, warmth, and wound dehiscence. ' +
      'Systemic signs include fever >38°C, chills, malaise, and elevated white blood cell count. ' +
      'Any combination of local and systemic signs warrants immediate surgical evaluation.',
  },
  {
    id: 'knee-replacement-specific',
    title: 'Knee replacement post-operative care',
    tags: ['knee', 'replacement', 'arthroplasty', 'fever', 'swelling', 'mobility'],
    content:
      'After knee replacement, mild fever (<38°C) may occur for 2-3 days due to tissue inflammation. ' +
      'Knee swelling is expected for 5-7 days. Start passive range of motion on day 1, active assisted on day 2. ' +
      'Fever >38°C after day 3 or increasing knee swelling/redness requires evaluation for possible infection or DVT.',
  },
  {
    id: 'temperature-monitoring',
    title: 'Post-operative temperature monitoring protocol',
    tags: ['temperature', 'monitoring', 'fever', 'protocol', 'frequency'],
    content:
      'Monitor temperature every 4 hours for the first 48 hours post-surgery, then every 8 hours until discharge. ' +
      'Document any temperature >37.5°C (99.5°F). Persistent elevation requires complete physical examination and basic labs including CBC and inflammatory markers.',
  },
  {
    id: 'emergency-warning-signs',
    title: 'Emergency warning signs after surgery',
    tags: ['emergency', 'warning', 'urgent', 'complication', 'fever'],
    content:
      'Seek immediate medical attention for: fever >39°C (102.2°F), chest pain or shortness of breath, severe headache with stiff neck, ' +
      'confusion or altered mental status, severe abdominal pain, or uncontrollable bleeding from incision sites. ' +
      'These may indicate life-threatening complications requiring emergency intervention.',
  }
];
