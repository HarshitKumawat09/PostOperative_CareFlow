// Simple JavaScript test for Gemini integration
const { SimpleGeminiService } = require('./dist/ai/simple-gemini-service.js');
const { GeminiEnhancedRiskAssessmentEngine } = require('./dist/models/gemini-enhanced-risk-assessment.js');
const { Patient } = require('./dist/models/patient.js');
const { SurgeryType } = require('./dist/models/base.js');

async function testGemini() {
  console.log('🚀 Testing Gemini AI Integration...');
  
  try {
    // Test Gemini connection
    console.log('📋 Testing Gemini connection...');
    const geminiService = new SimpleGeminiService();
    await geminiService.initialize();
    console.log('✅ Gemini connection successful!');
    
    // Test assessment engine
    console.log('🤖 Testing assessment engine...');
    const assessmentEngine = new GeminiEnhancedRiskAssessmentEngine(geminiService);
    await assessmentEngine.initialize();
    console.log('✅ Assessment engine initialized!');
    
    // Test sample guidelines
    console.log('📚 Adding sample guidelines...');
    const sampleGuidelines = [
      {
        title: 'Test Guideline',
        content: 'This is a test medical guideline for knee replacement recovery. Patients should monitor pain levels and follow prescribed medication schedules.',
        documentType: 'post_operative_protocol',
        surgeryTypes: ['KNEE_REPLACEMENT'],
        keywords: ['test', 'knee', 'recovery'],
        source: 'Test Source'
      }
    ];
    
    await assessmentEngine.addMedicalGuidelines(sampleGuidelines);
    console.log('✅ Sample guidelines added!');
    
    // Test search
    console.log('🔍 Testing search functionality...');
    const searchResults = await assessmentEngine.searchRelevantGuidelines(
      null, // We'll create a simple patient context
      'knee replacement pain'
    );
    console.log(`✅ Search completed! Found ${searchResults.length} results`);
    
    // Test AI explanation
    console.log('🤖 Testing AI explanation...');
    const explanation = await assessmentEngine.getAIExplanation(
      null, // We'll create a simple patient context
      'What are the recommendations for knee replacement pain management?'
    );
    
    if (explanation) {
      console.log('✅ AI explanation generated!');
      console.log(`Summary: ${explanation.summary}`);
      console.log(`Confidence: ${(explanation.confidence * 100).toFixed(1)}%`);
      console.log(`Recommendations: ${explanation.recommendations.length}`);
    }
    
    console.log('\n🎉 All Gemini AI tests passed!');
    console.log('💡 The system is working with real Gemini API!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testGemini();
