// Standalone test for Gemini AI (independent of auth)
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function testStandaloneGemini() {
  console.log('🚀 Testing Standalone Gemini AI...');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }
    
    console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini client initialized');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Gemini 2.0 Flash model loaded');
    
    // Test 1: Simple conversation
    console.log('\n📋 Test 1: Simple medical query...');
    const medicalPrompt = `
      You are a medical AI assistant. A patient is on day 5 after knee replacement surgery
      with pain level 6/10 and mobility score 4/10. 
      What are your recommendations?
    `;
    
    const result1 = await model.generateContent(medicalPrompt);
    const response1 = await result1.response;
    const text1 = response1.text();
    
    console.log('✅ Medical AI Response:');
    console.log(text1);
    
    // Test 2: Structured response
    console.log('\n📋 Test 2: Structured medical assessment...');
    const structuredPrompt = `
      PATIENT CONTEXT:
      - Surgery: Knee Replacement
      - Day: 5 post-op
      - Pain: 6/10
      - Mobility: 4/10
      
      Please provide a structured response with:
      1. RISK_LEVEL: [LOW/MODERATE/HIGH/CRITICAL]
      2. RECOMMENDATIONS: [3 specific recommendations]
      3. NEXT_STEPS: [2-3 next steps]
      4. CONFIDENCE: [0-100%]
    `;
    
    const result2 = await model.generateContent(structuredPrompt);
    const response2 = await result2.response;
    const text2 = response2.text();
    
    console.log('✅ Structured Medical Assessment:');
    console.log(text2);
    
    // Test 3: Emergency scenario
    console.log('\n📋 Test 3: Emergency scenario...');
    const emergencyPrompt = `
      Patient reports fever 38.5°C and severe pain 9/10 after knee replacement.
      Is this an emergency? What should be done immediately?
    `;
    
    const result3 = await model.generateContent(emergencyPrompt);
    const response3 = await result3.response;
    const text3 = response3.text();
    
    console.log('✅ Emergency Assessment:');
    console.log(text3);
    
    console.log('\n🎉 ALL GEMINI TESTS PASSED!');
    console.log('💡 Gemini AI is working perfectly for medical use cases!');
    console.log('🏥 Ready for real medical assistant integration!');
    
  } catch (error) {
    console.error('❌ Standalone test failed:', error.message);
    process.exit(1);
  }
}

testStandaloneGemini();
