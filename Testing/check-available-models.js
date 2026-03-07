const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

async function checkAvailableModels() {
  console.log('🔍 Checking available Gemini models...\n');
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ No Gemini API key found');
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    console.log('📋 Available Models:');
    console.log('====================');
    
    if (data.models) {
      data.models.forEach(model => {
        const supportedMethods = model.supportedGenerationMethods?.join(', ') || 'None';
        console.log(`🔹 ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description}`);
        console.log(`   Methods: ${supportedMethods}`);
        console.log('');
      });
    } else {
      console.log('❌ No models found or error:', data);
    }
    
    const generativeModels = data.models?.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || [];
    
    console.log(`\n✅ Found ${generativeModels.length} models that support generateContent:`);
    generativeModels.forEach(model => {
      console.log(`  - ${model.name} (${model.displayName})`);
    });
    
    const recommendedModel = generativeModels.find(model => 
      model.name.includes('flash') || model.name.includes('pro')
    ) || generativeModels[0];
    
    if (recommendedModel) {
      console.log(`\n🎯 Recommended model: ${recommendedModel.name}`);
      console.log(`   ${recommendedModel.displayName}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking models:', error);
  }
}

async function testModel(modelName) {
  console.log(`\n🧪 Testing model: ${modelName}`);
  console.log('─'.repeat(40));
  
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Hello, can you help with medical questions?');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Model test successful!');
    console.log(`Response: ${text.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    return false;
  }
}

if (require.main === module) {
  checkAvailableModels()
    .then(() => {
      const commonModels = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro'
      ];
      
      console.log('\n🧪 Testing common models...\n');
      
      return Promise.all(
        commonModels.map(model => testModel(model))
      );
    })
    .then(results => {
      console.log('\n📊 Test Results:');
      console.log('================');
      results.forEach((success, index) => {
        const model = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'][index];
        console.log(`${success ? '✅' : '❌'} ${model}`);
      });
    })
    .catch(console.error);
}

module.exports = { checkAvailableModels, testModel };
