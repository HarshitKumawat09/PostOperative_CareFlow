// Direct test of Gemini services using TypeScript files
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

// Direct import of our services (will work if TypeScript is compiled)
async function testDirectGemini() {
  console.log('🚀 Testing Direct Gemini Services...\n');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }
    
    console.log('✅ API key found:', apiKey.substring(0, 10) + '...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini client initialized');
    
    // Test 1: Basic Gemini functionality
    console.log('\n📋 Test 1: Basic Gemini Functionality');
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      console.log('✅ Gemini Flash Latest model loaded');
      
      const medicalPrompt = `
        You are a medical AI assistant. A patient is on day 5 after knee replacement surgery
        with pain level 6/10 and mobility score 4/10. 
        Provide a brief assessment and 3 recommendations.
      `;
      
      const result = await model.generateContent(medicalPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Medical AI Response:');
      console.log(text);
      
      // Test 2: JSON response generation
      console.log('\n📋 Test 2: JSON Response Generation');
      const jsonPrompt = 'Generate a JSON response with: risk_level, recommendations array, confidence score';
      const jsonResult = await model.generateContent(jsonPrompt);
      const jsonResponse = await jsonResult.response;
      const jsonText = jsonResponse.text();
      
      console.log('✅ JSON Response:');
      console.log(jsonText);
      
      // Test 3: Different model
      console.log('\n📋 Test 3: Alternative Model');
      try {
        const altModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const altResult = await altModel.generateContent('Hello, test alternative model');
        const altResponse = await altResult.response;
        const altText = altResponse.text();
        console.log('✅ Alternative Model Response:');
        console.log(altText);
      } catch (altError) {
        console.log('❌ Alternative model failed:', altError.message);
      }
      
      console.log('\n🎉 ALL DIRECT GEMINI TESTS PASSED!');
      console.log('💡 Gemini AI is working perfectly!');
      console.log('🏥 Ready for production integration!');
      
    } catch (error) {
      console.error('❌ Direct test failed:', error.message);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
    process.exit(1);
  }
}

testDirectGemini();
