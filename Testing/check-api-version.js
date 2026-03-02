// Check correct Gemini API version
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function checkAPIVersion() {
  console.log('🔍 Checking Gemini API versions...');
  
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try v1 API
    console.log('\n📋 Trying v1 API...');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      const data = await response.json();
      console.log('✅ v1 API works!');
      console.log('Available models:');
      data.models.forEach(model => {
        console.log(`   - ${model.name} (${model.displayName})`);
      });
    } catch (v1Error) {
      console.log('❌ v1 API failed:', v1Error.message);
    }
    
    // Try v1beta API
    console.log('\n📋 Trying v1beta API...');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      console.log('✅ v1beta API works!');
      console.log('Available models:');
      data.models.forEach(model => {
        console.log(`   - ${model.name} (${model.displayName})`);
      });
    } catch (v1betaError) {
      console.log('❌ v1beta API failed:', v1betaError.message);
    }
    
  } catch (error) {
    console.error('❌ API version check failed:', error.message);
  }
}

checkAPIVersion();
