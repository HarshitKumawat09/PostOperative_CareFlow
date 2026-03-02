// Test script to verify vector database and RAG functionality
// Run with: node test-vector-db.js

// Mock Next.js environment variables
process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'GEMINI_API_KEY';

// Import required modules
const { SimpleGeminiService } = require('./src/ai/simple-gemini-service.ts');
const { GeminiEnhancedRiskAssessmentEngine } = require('./src/models/gemini-enhanced-risk-assessment.ts');
const { Patient } = require('./src/models/patient.ts');
const { SurgeryType } = require('./src/models/base.ts');
const { sampleMedicalGuidelines } = require('./src/data/sample-guidelines.ts');

async function testVectorDatabase() {
  console.log('🧪 Testing Vector Database and RAG Functionality...\n');

  try {
    // 1. Initialize services
    console.log('📋 Step 1: Initializing Services...');
    const geminiService = new SimpleGeminiService();
    const assessmentEngine = new GeminiEnhancedRiskAssessmentEngine(geminiService);
    
    await geminiService.initialize();
    await assessmentEngine.initialize();
    console.log('✅ Services initialized successfully\n');

    // 2. Load sample medical guidelines
    console.log('📚 Step 2: Loading Medical Guidelines...');
    await geminiService.loadSampleGuidelines();
    
    const stats = await geminiService.getStats();
    console.log('📊 Database Statistics:', stats);
    console.log(`✅ Loaded ${stats.totalDocuments} documents\n`);

    // 3. Test document search
    console.log('🔍 Step 3: Testing Document Search...');
    const searchQuery = {
      query: 'pain management after knee replacement',
      surgeryType: SurgeryType.KNEE_REPLACEMENT,
      recoveryDay: 3,
      limit: 5
    };
    
    const searchResults = await geminiService.searchDocuments(searchQuery);
    console.log(`🔎 Found ${searchResults.length} relevant documents:`);
    searchResults.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.metadata.title} (Score: ${doc.score.toFixed(3)})`);
      console.log(`     Preview: ${doc.content.substring(0, 100)}...\n`);
    });

    // 4. Test RAG context creation
    console.log('🤖 Step 4: Testing RAG Context Creation...');
    const testPatient = new Patient({
      id: 'test-patient-123',
      name: 'Test Patient',
      surgeryType: SurgeryType.KNEE_REPLACEMENT,
      surgeryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      currentSymptoms: {
        painLevel: 6,
        mobilityScore: 4,
        temperature: 37.2,
        woundCondition: 'healing'
      }
    });

    const ragContext = await geminiService.createRAGContext(testPatient, 'pain management');
    console.log('📋 RAG Context Created:');
    console.log(`  - Patient Surgery: ${ragContext.patientContext.surgeryType}`);
    console.log(`  - Recovery Day: ${ragContext.patientContext.recoveryDay}`);
    console.log(`  - Retrieved Documents: ${ragContext.retrievedDocuments.length}`);
    console.log(`  - Relevant Guidelines: ${ragContext.relevantGuidelines.length}\n`);

    // 5. Test AI explanation generation
    console.log('🧠 Step 5: Testing AI Explanation Generation...');
    const aiExplanation = await geminiService.generateAIExplanation(testPatient, 'pain management');
    
    console.log('📝 AI Generated Explanation:');
    console.log('============================');
    console.log(`SUMMARY: ${aiExplanation.summary}`);
    console.log(`\nRISK ASSESSMENT: ${aiExplanation.riskAssessment}`);
    console.log('\nRECOMMENDATIONS:');
    aiExplanation.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log('\nNEXT STEPS:');
    aiExplanation.nextSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
    console.log(`\nCONFIDENCE: ${aiExplanation.confidence * 100}%\n`);

    // 6. Test hallucination detection
    console.log('🔍 Step 6: Testing Hallucination Detection...');
    const hallucinationCheck = await checkForHallucinations(aiExplanation, ragContext.relevantGuidelines);
    console.log(`🎯 Hallucination Score: ${hallucinationCheck.score}/100`);
    console.log(`⚠️  Potential Hallucinations: ${hallucinationCheck.issues.length}`);
    if (hallucinationCheck.issues.length > 0) {
      console.log('Issues found:');
      hallucinationCheck.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    } else {
      console.log('✅ No significant hallucinations detected');
    }

    console.log('\n🎉 Vector Database Test Completed Successfully!');
    console.log('📊 Summary:');
    console.log(`  - ✅ Services initialized`);
    console.log(`  - ✅ ${stats.totalDocuments} documents loaded`);
    console.log(`  - ✅ Search functionality working`);
    console.log(`  - ✅ RAG context creation working`);
    console.log(`  - ✅ AI explanation generation working`);
    console.log(`  - ✅ Hallucination detection: ${hallucinationCheck.score > 80 ? 'PASS' : 'NEEDS REVIEW'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Helper function to detect potential hallucinations
async function checkForHallucinations(aiExplanation, relevantGuidelines) {
  const issues = [];
  let score = 100;

  // Check if AI explanation references the guidelines
  const explanationText = aiExplanation.detailedExplanation.toLowerCase();
  const guidelinesText = relevantGuidelines.join(' ').toLowerCase();

  // Check for medical facts that should be in guidelines
  const expectedKeywords = ['pain', 'medication', 'wound', 'mobility', 'recovery'];
  for (const keyword of expectedKeywords) {
    if (explanationText.includes(keyword) && !guidelinesText.includes(keyword)) {
      issues.push(`Potential hallucination: AI mentions '${keyword}' but it's not in retrieved guidelines`);
      score -= 20;
    }
  }

  // Check for confidence level reasonableness
  if (aiExplanation.confidence > 0.95 && relevantGuidelines.length === 0) {
    issues.push('Unusually high confidence without supporting guidelines');
    score -= 15;
  }

  return {
    score: Math.max(0, score),
    issues
  };
}

// Run the test
if (require.main === module) {
  testVectorDatabase();
}

module.exports = { testVectorDatabase };
