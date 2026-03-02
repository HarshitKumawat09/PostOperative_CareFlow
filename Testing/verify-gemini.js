// Verify Gemini API is working
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function verifyGemini() {
  console.log('🔍 Verifying Gemini API connection...');
  
  try {
    // Check if API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }
    
    console.log('✅ API key found');
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini client initialized');
    
    // Test connection with a simple request
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    console.log('✅ Gemini model loaded');
    
    const prompt = 'Hello! Please respond with a simple confirmation that you are working.';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API Response:');
    console.log(`   ${text}`);
    
    // Test medical context
    console.log('\n🏥 Testing medical context...');
    const medicalPrompt = `
      You are a medical AI assistant. A patient is on day 5 after knee replacement surgery
      with pain level 6/10 and mobility score 4/10. Provide a brief assessment.
    `;
    
    const medicalResult = await model.generateContent(medicalPrompt);
    const medicalResponse = await medicalResult.response;
    const medicalText = medicalResponse.text();
    
    console.log('✅ Medical AI Response:');
    console.log(`   ${medicalText}`);
    
    console.log('\n🎉 Gemini API is working correctly!');
    console.log('💡 Ready for medical AI integration!');
    
  } catch (error) {
    console.error('❌ Gemini verification failed:', error.message);
    process.exit(1);
  }
}

verifyGemini();
