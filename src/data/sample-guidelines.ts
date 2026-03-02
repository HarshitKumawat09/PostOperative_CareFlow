// Sample Medical Guidelines for Testing Vector Database
// This file contains sample post-operative care guidelines

import { SurgeryType } from '../models/base';
import { MedicalDocumentType } from '../models/vector-db';

export const sampleMedicalGuidelines = [
  {
    title: "Knee Replacement Post-Operative Care Guidelines",
    content: `
Knee replacement surgery requires comprehensive post-operative care to ensure optimal recovery and prevent complications. 
Patients should follow a structured rehabilitation program focusing on pain management, wound care, and gradual mobility improvement.

Pain Management:
- Monitor pain levels regularly (expected 3-7/10 in first week)
- Use prescribed analgesics as scheduled
- Implement non-pharmacological pain relief (ice, elevation)
- Report pain exceeding 8/10 or sudden increase

Wound Care:
- Keep incision site clean and dry
- Monitor for signs of infection (redness, swelling, discharge)
- Change dressings as instructed by healthcare team
- Avoid soaking the wound until cleared by surgeon

Mobility and Rehabilitation:
- Begin assisted walking within 24 hours post-surgery
- Progress to independent ambulation as tolerated
- Perform prescribed physical therapy exercises daily
- Use assistive devices (walker, crutches) as needed

Recovery Timeline:
- Week 1: Focus on pain control and basic mobility
- Week 2-4: Increase range of motion and strength
- Week 6-8: Progress to independent activities
- Week 12: Return to most normal activities

Warning Signs Requiring Immediate Attention:
- Fever above 38°C (100.4°F)
- Severe pain uncontrolled by medication
- Wound drainage or increased redness
- Sudden swelling or calf pain
- Difficulty breathing
    `,
    documentType: MedicalDocumentType.POST_OPERATIVE_PROTOCOL,
    surgeryTypes: [SurgeryType.KNEE_REPLACEMENT],
    keywords: ['knee replacement', 'post-operative care', 'pain management', 'rehabilitation', 'wound care'],
    source: 'American Academy of Orthopaedic Surgeons'
  },
  {
    title: "Post-Operative Pain Management Protocol",
    content: `
Effective pain management is crucial for patient comfort and recovery after surgery. 
This protocol outlines evidence-based approaches to pain control.

Assessment Guidelines:
- Assess pain using 0-10 numeric rating scale
- Evaluate pain location, character, and intensity
- Document pain scores every 4 hours
- Consider patient's pain history and preferences

Pharmacological Management:
- Start with scheduled non-opioid analgesics (acetaminophen, NSAIDs)
- Add opioids for breakthrough pain (tramadol, oxycodone)
- Consider nerve blocks or regional anesthesia for severe pain
- Taper opioids gradually as pain improves

Non-Pharmacological Interventions:
- Apply ice packs to surgical site (20 minutes on, 20 minutes off)
- Elevate affected limb to reduce swelling
- Use relaxation techniques and distraction
- Ensure proper positioning and comfort

Special Considerations:
- Elderly patients may require lower medication doses
- Monitor for side effects (nausea, constipation, sedation)
- Assess for risk of opioid dependence
- Coordinate with pain management specialists for complex cases

Transition to Oral Medications:
- Switch from IV to oral analgesics when patient can tolerate oral intake
- Maintain around-the-clock dosing schedule
- Provide rescue doses for breakthrough pain
- Educate patients on proper medication use
    `,
    documentType: MedicalDocumentType.PAIN_MANAGEMENT,
    surgeryTypes: Object.values(SurgeryType),
    keywords: ['pain management', 'analgesics', 'opioids', 'non-pharmacological', 'assessment'],
    source: 'American Pain Society'
  },
  {
    title: "Surgical Wound Care and Infection Prevention",
    content: `
Proper wound care is essential to prevent surgical site infections and promote healing. 
Follow these evidence-based guidelines for optimal wound management.

Initial Wound Care (First 48 Hours):
- Keep incision site clean and dry
- Change dressings using sterile technique
- Monitor for bleeding or hematoma formation
- Apply gentle pressure if bleeding occurs

Signs of Normal Healing:
- Minimal redness at incision edges
- Slight swelling that decreases over time
- Clear or slightly yellow drainage (serous)
- Gradual approximation of wound edges

Warning Signs of Infection:
- Increasing redness or warmth around incision
- Purulent or foul-smelling drainage
- Fever above 38°C (100.4°F)
- Increased pain or tenderness
- Wound separation or dehiscence

Infection Prevention Measures:
- Perform hand hygiene before wound care
- Use sterile supplies and technique
- Change dressings regularly or when soiled
- Avoid submerging wound in water

Patient Education:
- Teach proper hand washing technique
- Instruct on signs and symptoms of infection
- Provide written wound care instructions
- Establish follow-up appointment schedule

When to Seek Medical Care:
- Fever over 38°C with wound concerns
- Increasing pain or redness
- Pus or foul drainage from wound
- Wound edges pulling apart
- Any sudden changes in wound appearance
    `,
    documentType: MedicalDocumentType.WOUND_CARE,
    surgeryTypes: Object.values(SurgeryType),
    keywords: ['wound care', 'infection prevention', 'surgical site', 'dressing changes', 'patient education'],
    source: 'Centers for Disease Control and Prevention'
  },
  {
    title: "Post-Operative Fever Evaluation and Management",
    content: `
Fever after surgery requires systematic evaluation to determine the cause and appropriate management. 
This guideline outlines the approach to post-operative fever assessment.

Common Causes of Post-Operative Fever:
- Atelectasis and pulmonary complications (Day 1-2)
- Urinary tract infection (Day 2-4)
- Surgical site infection (Day 3-7)
- Deep vein thrombosis or pulmonary embolism (Day 4-10)
- Drug reactions or transfusion reactions

Initial Assessment:
- Take temperature using reliable method
- Assess vital signs and oxygen saturation
- Review surgical procedure and anesthesia
- Examine surgical sites and drains
- Evaluate respiratory status

Diagnostic Workup:
- Complete blood count with differential
- Blood cultures if temperature >38.5°C
- Urinalysis and urine culture if indicated
- Chest X-ray for respiratory symptoms
- Wound cultures if drainage present

Management Principles:
- Treat underlying cause specifically
- Provide antipyretics for patient comfort
- Maintain adequate hydration and rest
- Continue post-operative antibiotics as prescribed
- Consider infectious disease consultation for complex cases

Red Flag Symptoms:
- Temperature >39°C (102.2°F)
- Hypotension or tachycardia
- Altered mental status
- Respiratory distress
- Signs of septic shock

Prevention Strategies:
- Encourage early mobilization and deep breathing
- Maintain strict sterile technique for procedures
- Ensure proper catheter and drain care
- Administer prophylactic antibiotics as indicated
- Monitor for early signs of complications
    `,
    documentType: MedicalDocumentType.COMPLICATION_GUIDELINE,
    surgeryTypes: Object.values(SurgeryType),
    keywords: ['fever', 'post-operative complications', 'infection', 'evaluation', 'management'],
    source: 'Surgical Infection Society'
  },
  {
    title: "Cardiac Bypass Surgery Recovery Protocol",
    content: `
Recovery after coronary artery bypass graft (CABG) surgery requires specialized care 
to ensure optimal cardiac function and prevent complications.

Immediate Post-Operative Period (ICU):
- Continuous cardiac monitoring
- Hemodynamic support with medications as needed
- Mechanical ventilation until stable
- Chest tube management and drainage monitoring
- Strict fluid balance monitoring

Ward Care Transition:
- Progressive ambulation starting day 2-3
- Cardiac rehabilitation exercises
- Medication adjustment and optimization
- Nutritional support and education
- Psychological support and counseling

Activity Progression:
- Day 1-2: Bed rest with passive exercises
- Day 3-4: Sitting up, assisted walking
- Day 5-7: Independent ambulation, stairs
- Week 2-4: Increased endurance training
- Week 6-8: Return to light activities

Medication Management:
- Antiplatelet therapy (aspirin, clopidogrel)
- Beta blockers for heart rate control
- Statins for cholesterol management
- ACE inhibitors for cardiac protection
- Pain management with cardiac-safe analgesics

Wound Care Specifics:
- Sternum and leg incision care
- Monitor for sternal instability
- Leg wound elevation and compression
- Sign infection monitoring
- Activity restrictions to protect sternum

Warning Signs Requiring Attention:
- Chest pain similar to pre-surgery symptoms
- Shortness of breath at rest
- Irregular heartbeats or palpitations
- Fever or signs of infection
- Sudden leg swelling or pain

Long-Term Follow-up:
- Cardiac rehabilitation program completion
- Regular cardiology appointments
- Stress testing at 6-12 weeks
- Lifestyle modification counseling
- Secondary prevention optimization
    `,
    documentType: MedicalDocumentType.POST_OPERATIVE_PROTOCOL,
    surgeryTypes: [SurgeryType.CARDIAC_BYPASS],
    keywords: ['cardiac bypass', 'CABG recovery', 'cardiac rehabilitation', 'sternum care', 'heart surgery'],
    source: 'American Heart Association'
  },
  {
    title: "Emergency Post-Operative Complications Management",
    content: `
Recognition and management of emergency post-operative complications is critical 
for patient safety and optimal outcomes. This guideline provides rapid response protocols.

Life-Threatening Emergencies:
1. Massive Bleeding
   - Immediate pressure application
   - Activate massive transfusion protocol
   - Surgical emergency consultation
   - Maintain airway and circulation

2. Anaphylaxis
   - Administer epinephrine 0.3mg IM immediately
   - Secure airway, prepare intubation
   - Give IV fluids and antihistamines
   - Monitor for biphasic reaction

3. Cardiac Arrest
   - Start CPR immediately
   - Call code team/resuscitation
   - Advanced cardiac life support protocols
   - Consider reversible causes (4 H's and 4 T's)

4. Pulmonary Embolism
   - High-flow oxygen administration
   - Anticoagulation if not contraindicated
   - Consider thrombolytic therapy for massive PE
   - Prepare for cardiopulmonary support

Urgent but Not Immediately Life-Threatening:
1. Acute Pain Crisis
   - Assess pain level and characteristics
   - Administer rapid-acting analgesics
   - Evaluate for surgical complications
   - Consider pain management consultation

2. Acute Confusion/Delirium
   - Assess for hypoxia, infection, metabolic causes
   - Ensure patient safety and orientation
   - Consider haloperidol for severe agitation
   - Search for underlying reversible causes

3. Acute Urinary Retention
   - Perform bladder scan
   - Place urinary catheter if needed
   - Monitor for urinary tract infection
   - Consider urology consultation

Response Team Activation:
- Know emergency call numbers and protocols
- Prepare necessary equipment and medications
- Assign roles during emergency response
- Document events and interventions accurately

Quality Improvement:
- Review all emergency responses
- Identify system improvements
- Conduct regular emergency drills
- Maintain emergency medication and equipment checks
    `,
    documentType: MedicalDocumentType.EMERGENCY_PROTOCOL,
    surgeryTypes: Object.values(SurgeryType),
    keywords: ['emergency', 'complications', 'rapid response', 'life-threatening', 'code blue'],
    source: 'Association of Perioperative Registered Nurses'
  }
];

export default sampleMedicalGuidelines;
