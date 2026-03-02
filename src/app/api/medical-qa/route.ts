// 🤖 PHASE 3 — PATIENT Q&A (RAG CORE)
// LLM answers using ONLY retrieved medical protocols + RECOVERY INTELLIGENCE

import { NextRequest, NextResponse } from 'next/server';
import { medicalVectorDB } from '@/ai/medical-vector-db';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { recoveryIntelligenceService } from '@/ai/recovery-intelligence';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper function to extract surgery context from question and patient context
function extractSurgeryContext(question: string, patientContext?: string): {
  surgeryType: string | null;
  postOpDay: number | null;
  detectedContext: string;
} {
  const combinedText = `${question} ${patientContext || ''}`.toLowerCase();
  
  // Detect surgery type
  let surgeryType: string | null = null;
  if (combinedText.includes('knee') || combinedText.includes('knee replacement')) {
    surgeryType = 'knee_replacement';
  } else if (combinedText.includes('hip') || combinedText.includes('hip replacement')) {
    surgeryType = 'hip_replacement';
  } else if (combinedText.includes('cardiac') || combinedText.includes('heart') || combinedText.includes('bypass')) {
    surgeryType = 'cardiac_surgery';
  }
  
  // Detect post-op day
  let postOpDay: number | null = null;
  const dayMatches = combinedText.match(/day\s*(\d+)|post\s*op\s*day\s*(\d+)|(\d+)\s*days?\s*(?:post|after|since)/i);
  if (dayMatches) {
    postOpDay = parseInt(dayMatches[1] || dayMatches[2] || dayMatches[3]);
  }
  
  // Detect time-related phrases
  if (combinedText.includes('today') || combinedText.includes('now')) {
    // Assume current day if not specified
    postOpDay = postOpDay || null;
  }
  
  const detectedContext = surgeryType ? `Detected: ${surgeryType}${postOpDay ? `, Day ${postOpDay}` : ''}` : 'No surgery context detected';
  
  return { surgeryType, postOpDay, detectedContext };
}

// Helper function to assess clinical risk based on rules
function assessClinicalRisk(
  question: string, 
  postOpDay: number | null, 
  clinicalRules: any[], 
  detectedContext: string
): {
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  reasoning: string;
  appliedRules: string[];
} {
  const questionLower = question.toLowerCase();
  const appliedRules: string[] = [];
  let highestRiskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' = 'Low';
  let reasoning = 'Based on clinical rules assessment';
  
  // Apply relevant clinical rules
  for (const rule of clinicalRules) {
    // Check if rule applies to current day
    if (postOpDay && postOpDay >= rule.appliesToDays[0] && postOpDay <= rule.appliesToDays[1]) {
      // Simple condition matching (in production, this would be more sophisticated)
      if (rule.condition.includes('fever') && questionLower.includes('fever')) {
        appliedRules.push(rule.id);
        if (compareRiskLevels(rule.riskLevel, highestRiskLevel) > 0) {
          highestRiskLevel = rule.riskLevel;
          reasoning = rule.explanation;
        }
      }
      
      if (rule.condition.includes('pain') && questionLower.includes('pain')) {
        appliedRules.push(rule.id);
        if (compareRiskLevels(rule.riskLevel, highestRiskLevel) > 0) {
          highestRiskLevel = rule.riskLevel;
          reasoning = rule.explanation;
        }
      }
      
      if (rule.condition.includes('mobility') && (questionLower.includes('walk') || questionLower.includes('mobility'))) {
        appliedRules.push(rule.id);
        if (compareRiskLevels(rule.riskLevel, highestRiskLevel) > 0) {
          highestRiskLevel = rule.riskLevel;
          reasoning = rule.explanation;
        }
      }
    }
  }
  
  // Default fever rules if no clinical rules matched
  if (appliedRules.length === 0 && questionLower.includes('fever')) {
    if (postOpDay && postOpDay <= 2) {
      highestRiskLevel = 'Low';
      reasoning = 'Low-grade fever is normal in first 48 hours after surgery';
    } else if (postOpDay && postOpDay > 2) {
      highestRiskLevel = 'High';
      reasoning = 'Fever after day 3 could indicate infection';
    }
  }
  
  return {
    riskLevel: highestRiskLevel,
    reasoning,
    appliedRules
  };
}

// Helper function to compare risk levels
function compareRiskLevels(
  risk1: 'Low' | 'Moderate' | 'High' | 'Critical',
  risk2: 'Low' | 'Moderate' | 'High' | 'Critical'
): number {
  const riskLevels = { 'Low': 1, 'Moderate': 2, 'High': 3, 'Critical': 4 };
  return riskLevels[risk1] - riskLevels[risk2];
}

export async function POST(request: NextRequest) {
  try {
    const { question, patientContext } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Initialize Recovery Intelligence
    await recoveryIntelligenceService.initialize();

    // Step 1: Extract surgery type and post-op day from context/question
    const { surgeryType, postOpDay, detectedContext } = extractSurgeryContext(question, patientContext);

    // Step 2: Find relevant hospital protocols
    const relevantProtocols = await medicalVectorDB.search(question.trim(), 3);

    if (relevantProtocols.length === 0) {
      return NextResponse.json({
        success: true,
        answer: "I don't have specific information about this in our hospital guidelines. Please consult your healthcare provider for this specific question.",
        sources: [],
        protocolsUsed: 0,
        riskLevel: "Unknown",
        patientContext: patientContext ? 'Provided' : 'Not provided',
        recoveryIntelligence: null
      });
    }

    // Step 3: Get Recovery Intelligence for detected surgery type
    const recoveryIntelligence = surgeryType ? recoveryIntelligenceService.getRecoveryIntelligence(surgeryType) : null;
    const currentPhase = surgeryType && postOpDay ? recoveryIntelligenceService.getRecoveryPhase(surgeryType, postOpDay) : null;
    const expectedSymptoms = surgeryType && postOpDay ? recoveryIntelligenceService.getExpectedSymptoms(surgeryType, postOpDay) : [];
    const upcomingMilestones = surgeryType && postOpDay ? recoveryIntelligenceService.getUpcomingMilestones(surgeryType, postOpDay) : [];
    const clinicalRules = surgeryType ? recoveryIntelligenceService.getClinicalRules(surgeryType) : [];

    // Step 4: Apply clinical rules for risk assessment
    const clinicalRiskAssessment = assessClinicalRisk(question, postOpDay, clinicalRules, detectedContext);

    // Step 5: Build context-aware prompt with recovery intelligence
    const protocolContext = relevantProtocols.map((protocol, index) => 
      `PROTOCOL ${index + 1}:
TITLE: ${protocol.metadata.title}
DEPARTMENT: ${protocol.metadata.department}
SURGERY TYPE: ${protocol.metadata.surgeryType}
EVIDENCE LEVEL: ${protocol.metadata.evidenceLevel}
CONTENT: ${protocol.content}
RELEVANCE: ${(protocol.relevanceScore * 100).toFixed(1)}%
---`
    ).join('\n');

    const recoveryContextData = recoveryIntelligence ? `
RECOVERY INTELLIGENCE:
SURGERY TYPE: ${recoveryIntelligence.surgeryType}
CURRENT RECOVERY DAY: ${postOpDay || 'Unknown'}
RECOVERY PHASE: ${currentPhase?.phase || 'Unknown'}
PHASE DESCRIPTION: ${currentPhase?.description || 'Unknown'}
EXPECTED SYMPTOMS: ${expectedSymptoms.map(s => s.symptom).join(', ') || 'None'}
UPCOMING MILESTONES: ${upcomingMilestones.map(m => `Day ${m.day}: ${m.milestone}`).join('; ') || 'None'}
CLINICAL RISK ASSESSMENT: ${clinicalRiskAssessment.riskLevel} - ${clinicalRiskAssessment.reasoning}
---` : '';

    const prompt = `You are a medical assistant for this hospital. Answer the patient's question using ONLY the provided hospital protocols and recovery intelligence below.

PATIENT CONTEXT: ${patientContext?.trim() || 'Not provided'}
${recoveryContextData}

RELEVANT HOSPITAL PROTOCOLS:
${protocolContext}

PATIENT QUESTION: ${question.trim()}

CRITICAL RULES:
1. Answer using ONLY the information from the hospital protocols and recovery intelligence above
2. Do NOT use any external medical knowledge or internet information
3. If the protocols don't contain the answer, say "This specific information is not available in our current hospital guidelines"
4. Include which protocol(s) you used in your answer
5. Be medically accurate, clear, and concise
6. Incorporate recovery intelligence context when relevant
7. If appropriate, suggest when to seek immediate medical attention
8. Provide a risk level assessment (Low/Moderate/High/Critical) based on the protocols and clinical rules
9. Consider the current recovery phase and expected symptoms in your answer

Format your response as:
ANSWER: [Your medical answer based on protocols and recovery intelligence]
RISK_LEVEL: [Low/Moderate/High/Critical]
SOURCES_USED: [List of protocol titles used]
RECOVERY_CONTEXT: [Relevant recovery phase information if applicable]
WHEN_TO_CONTACT_DOCTOR: [Specific guidance if needed]

ANSWER:`;

    // Step 6: LLM answers using protocols + recovery intelligence
    let response: string;
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-flash-latest',
        generationConfig: {
          temperature: 0.1, // Low temperature for medical accuracy
          topP: 0.8,
          maxOutputTokens: 1000 // Increased for recovery intelligence
        }
      });

      const result = await model.generateContent(prompt);
      response = await result.response.text();
    } catch (llmError) {
      console.error('❌ Gemini LLM error:', llmError);
      // Fallback response with recovery intelligence
      const protocolContents = relevantProtocols.map(p => p.content).join('\n\n');
      const recoverySummary = recoveryIntelligence ? 
        `\n\nRecovery Information:\nPhase: ${currentPhase?.phase || 'Unknown'}\nExpected: ${expectedSymptoms.map(s => s.symptom).join(', ')}` : '';
      
      return NextResponse.json({
        success: true,
        answer: `Based on our hospital protocols and recovery intelligence, I found relevant information about your question.${recoverySummary}\n\nHere's what the guidelines say:\n\n${protocolContents.substring(0, 500)}...\n\nHowever, I'm currently unable to process a detailed analysis. Please consult your healthcare provider for specific guidance.`,
        sources: relevantProtocols.map(p => p.metadata.title),
        protocolsUsed: relevantProtocols.length,
        riskLevel: clinicalRiskAssessment.riskLevel,
        patientContext: patientContext ? 'Provided' : 'Not provided',
        whenToContactDoctor: "Please contact your healthcare provider for specific medical guidance.",
        recoveryIntelligence: recoveryIntelligence ? {
          surgeryType: recoveryIntelligence.surgeryType,
          currentPhase: currentPhase?.phase || 'Unknown',
          postOpDay: postOpDay || null,
          expectedSymptoms: expectedSymptoms.map(s => s.symptom),
          upcomingMilestones: upcomingMilestones.map(m => ({ day: m.day, milestone: m.milestone }))
        } : null
      });
    }
    
    // Parse the structured response
    const answerMatch = response.match(/ANSWER:\s*(.*?)(?=\n|$)/);
    const riskMatch = response.match(/RISK_LEVEL:\s*(.*?)(?=\n|$)/);
    const sourcesMatch = response.match(/SOURCES_USED:\s*(.*?)(?=\n|$)/);
    const recoveryContextMatch = response.match(/RECOVERY_CONTEXT:\s*(.*?)(?=\n|$)/);
    const contactMatch = response.match(/WHEN_TO_CONTACT_DOCTOR:\s*(.*?)(?=\n|$)/);

    let answer = answerMatch?.[1]?.trim() || "Unable to parse medical answer from protocols.";
    let riskLevel = riskMatch?.[1]?.trim() || clinicalRiskAssessment.riskLevel; // Use clinical assessment as fallback
    const sourcesUsed = sourcesMatch?.[1]?.trim() || "No sources specified";
    const recoveryContext = recoveryContextMatch?.[1]?.trim() || null;
    const whenToContact = contactMatch?.[1]?.trim() || "Contact your healthcare provider if you have concerns.";

    // Override risk level with clinical assessment if more severe
    if (compareRiskLevels(clinicalRiskAssessment.riskLevel, riskLevel as any) > 0) {
      riskLevel = clinicalRiskAssessment.riskLevel;
    }

    console.log(`🏥 Medical Q&A: "${question}" → ${relevantProtocols.length} protocols used + Recovery Intelligence: ${surgeryType || 'None'}`);

    return NextResponse.json({
      success: true,
      answer,
      riskLevel,
      sources: relevantProtocols.map(protocol => ({
        protocolTitle: protocol.metadata.title,
        department: protocol.metadata.department || 'General',
        surgeryType: protocol.metadata.surgeryType || 'General',
        relevanceScore: protocol.relevanceScore || 0.5,
        excerpt: protocol.content.substring(0, 200) + '...'
      })),
      protocolsUsed: relevantProtocols.length,
      patientContext: patientContext ? 'Provided' : 'Not provided',
      whenToContactDoctor: whenToContact,
      searchQuery: question,
      responseTime: new Date().toLocaleTimeString(),
      recoveryIntelligence: recoveryIntelligence ? {
        surgeryType: recoveryIntelligence.surgeryType,
        currentPhase: currentPhase?.phase || 'Unknown',
        postOpDay: postOpDay || null,
        expectedSymptoms: expectedSymptoms.map(s => s.symptom),
        upcomingMilestones: upcomingMilestones.map(m => ({ day: m.day, milestone: m.milestone })),
        recoveryContext: recoveryContext,
        clinicalRiskAssessment: {
          riskLevel: clinicalRiskAssessment.riskLevel,
          reasoning: clinicalRiskAssessment.reasoning,
          appliedRules: clinicalRiskAssessment.appliedRules
        }
      } : null
    });

  } catch (error) {
    console.error('Medical Q&A error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process medical question',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
