// Check available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function checkModels() {
  console.log('🔍 Checking available Gemini models...');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names
    const models = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro-vision',
      'text-bison-001',
      'chat-bison-001'
    ];
    
    for (const modelName of models) {
      try {
        console.log(`\n📋 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, test');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ ${modelName} works: ${text.substring(0, 50)}...`);
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Model check failed:', error.message);
  }
}

checkModels();
