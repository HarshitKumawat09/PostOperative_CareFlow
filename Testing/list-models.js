// List available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  console.log('🔍 Listing available Gemini models...');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found');
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the list of models
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    console.log('✅ Available models:');
    data.models.forEach(model => {
      console.log(`   - ${model.name} (${model.displayName})`);
      console.log(`     Supported methods: ${model.supportedGenerationMethods?.join(', ') || 'None'}`);
    });
    
  } catch (error) {
    console.error('❌ Model listing failed:', error.message);
  }
}

listModels();
