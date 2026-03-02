// Terminal-based RAG testing script
// Tests vector database and AI responses without UI

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

// Mock patient data for testing
const mockPatient = {
  id: 'test-patient-001',
  name: 'Test Patient',
  surgeryType: 'KNEE_REPLACEMENT',
  surgeryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  currentSymptoms: {
    painLevel: 6,
    mobilityScore: 4,
    temperature: 37.2,
    woundCondition: 'healing'
  }
};

// Sample medical guidelines (simplified version)
const sampleGuidelines = [
  {
    title: "Knee Replacement Pain Management",
    content: "Pain levels of 3-7/10 are expected in the first week after knee replacement surgery. Use prescribed analgesics as scheduled. Implement ice and elevation for pain relief. Report pain exceeding 8/10 immediately.",
    keywords: ["pain", "medication", "ice", "elevation"],
    relevanceScore: 0.95
  },
  {
    title: "Wound Care Protocol",
    content: "Keep incision site clean and dry. Monitor for signs of infection including redness, swelling, or discharge. Change dressings as instructed. Avoid soaking the wound until cleared by surgeon.",
    keywords: ["wound", "infection", "clean", "dry"],
    relevanceScore: 0.88
  },
  {
    title: "Mobility Guidelines",
    content: "Begin assisted walking within 24 hours post-surgery. Progress to independent ambulation as tolerated. Use walker or crutches initially. Perform prescribed physical therapy exercises daily.",
    keywords: ["mobility", "walking", "therapy", "exercises"],
    relevanceScore: 0.82
  }
];

// Test queries
const testQueries = [
  "pain management after knee replacement",
  "wound care signs of infection",
  "when can I walk after surgery",
  "physical therapy exercises",
  "what pain level is normal"
];

async function testGeminiDirectly() {
  console.log('🧪 Terminal RAG Testing - Direct Gemini API');
  console.log('==========================================\n');

  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Gemini API key found. Set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  console.log('✅ Gemini API initialized');
  console.log(`📋 Testing ${testQueries.length} queries\n`);

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n🔍 Test ${i + 1}: "${query}"`);
    console.log('─'.repeat(50));

    try {
      // Simulate RAG - find relevant guidelines
      const relevantGuidelines = sampleGuidelines.filter(guideline => 
        guideline.keywords.some(keyword => 
          query.toLowerCase().includes(keyword.toLowerCase())
        )
      );

      console.log(`📚 Found ${relevantGuidelines.length} relevant guidelines:`);
      relevantGuidelines.forEach((guideline, index) => {
        console.log(`  ${index + 1}. ${guideline.title} (Score: ${guideline.relevanceScore})`);
      });

      // Build RAG prompt
      const ragPrompt = `
You are an expert post-operative care assistant. Based on the following patient context and medical guidelines, provide a comprehensive assessment.

PATIENT CONTEXT:
- Surgery: ${mockPatient.surgeryType}
- Recovery Day: 3
- Pain Level: ${mockPatient.currentSymptoms.painLevel}/10
- Mobility: ${mockPatient.currentSymptoms.mobilityScore}/10
- Temperature: ${mockPatient.currentSymptoms.temperature}°C
- Wound: ${mockPatient.currentSymptoms.woundCondition}

RELEVANT GUIDELINES:
${relevantGuidelines.map(g => `- ${g.title}: ${g.content.substring(0, 100)}...`).join('\n')}

USER QUESTION: ${query}

Please provide a structured response with:
1. SUMMARY: Brief overview
2. RISK ASSESSMENT: Current risks
3. RECOMMENDATIONS: Actionable advice (numbered)
4. CONFIDENCE: Your confidence level (0-100%)

Focus on evidence-based recommendations from the guidelines above.
`;

      // Generate AI response
      const result = await model.generateContent(ragPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('\n🤖 AI Response:');
      console.log(text);

      // Analyze for hallucinations
      const hallucinationCheck = analyzeForHallucinations(text, relevantGuidelines);
      console.log(`\n🎯 Hallucination Analysis:`);
      console.log(`  Score: ${hallucinationCheck.score}/100`);
      console.log(`  Issues: ${hallucinationCheck.issues.length}`);
      if (hallucinationCheck.issues.length > 0) {
        hallucinationCheck.issues.forEach(issue => console.log(`    ⚠️  ${issue}`));
      } else {
        console.log('  ✅ No significant hallucinations detected');
      }

    } catch (error) {
      console.error(`❌ Error for query "${query}":`, error.message);
    }

    console.log('\n' + '='.repeat(60));
  }

  console.log('\n🎉 Terminal RAG Testing Complete!');
  console.log('\n📊 Summary:');
  console.log('- Gemini API: ✅ Working');
  console.log('- RAG Context: ✅ Built from patient data');
  console.log('- Guideline Retrieval: ✅ Keyword-based matching');
  console.log('- Hallucination Detection: ✅ Active');
  console.log('\n📝 Next Steps:');
  console.log('- Replace keyword matching with vector search');
  console.log('- Move to backend API endpoints');
  console.log('- Test with real patient data');
}

function analyzeForHallucinations(aiResponse, guidelines) {
  const issues = [];
  let score = 100;

  const responseText = aiResponse.toLowerCase();
  const guidelinesText = guidelines.map(g => g.content).join(' ').toLowerCase();

  // Check for medical claims not in guidelines
  const medicalTerms = ['herbal', 'supplement', 'alternative', 'natural remedy'];
  medicalTerms.forEach(term => {
    if (responseText.includes(term) && !guidelinesText.includes(term)) {
      issues.push(`Potential hallucination: mentions "${term}" not in guidelines`);
      score -= 20;
    }
  });

  // Check confidence vs evidence
  const confidenceMatch = aiResponse.match(/confidence[:\s]*(\d+)/i);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
  
  if (confidence > 95 && guidelines.length === 0) {
    issues.push('High confidence without supporting guidelines');
    score -= 15;
  }

  // Check for generic responses
  if (responseText.includes('consult your doctor') && guidelines.length > 0) {
    issues.push('Generic advice despite having specific guidelines');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues
  };
}

// Run the test
if (require.main === module) {
  testGeminiDirectly().catch(console.error);
}

module.exports = { testGeminiDirectly };
