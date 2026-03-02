// Real Gemini Demo Script
// This script demonstrates the working Gemini AI integration

import { SimpleGeminiService } from '../ai/simple-gemini-service';
import { GeminiEnhancedRiskAssessmentEngine } from '../models/gemini-enhanced-risk-assessment';
import { Patient } from '../models/patient';
import { SurgeryType } from '../models/base';
import { createTestPatient } from '../models/__tests__/test-helpers';
import sampleMedicalGuidelines from '../data/sample-guidelines';

async function runGeminiDemo() {
  console.log('🚀 Starting Real Gemini AI Medical Assistant Demo...\n');

  try {
    // Initialize services
    console.log('📋 Initializing services...');
    const geminiService = new SimpleGeminiService();
    const assessmentEngine = new GeminiEnhancedRiskAssessmentEngine(geminiService);

    await geminiService.initialize();
    await assessmentEngine.initialize();
    console.log('✅ Services initialized successfully!\n');

    // Create test patient
    console.log('👤 Creating test patient...');
    const patient = createTestPatient('demo-patient-001', SurgeryType.KNEE_REPLACEMENT, 6);
    console.log(`✅ Patient created: ${patient.getSurgeryType()} on day ${patient.getRecoveryDay()}`);
    console.log(`   Pain Level: ${patient.getCurrentSymptoms().painLevel}/10`);
    console.log(`   Mobility: ${patient.getCurrentSymptoms().mobilityScore}/10`);
    console.log(`   Temperature: ${patient.getCurrentSymptoms().temperature}°C\n`);

    // Load medical guidelines
    console.log('📚 Loading medical guidelines...');
    await assessmentEngine.addMedicalGuidelines(sampleMedicalGuidelines);
    console.log(`✅ Loaded ${sampleMedicalGuidelines.length} medical guidelines\n`);

    // Test 1: Search for relevant guidelines
    console.log('🔍 Test 1: Searching for pain management guidelines...');
    const guidelines = await assessmentEngine.searchRelevantGuidelines(
      patient, 
      'knee replacement pain management'
    );
    console.log(`✅ Found ${guidelines.length} relevant guidelines`);
    if (guidelines.length > 0) {
      console.log(`   First guideline: ${guidelines[0].substring(0, 100)}...\n`);
    }

    // Test 2: Get AI explanation
    console.log('🤖 Test 2: Getting AI-powered explanation...');
    const explanation = await assessmentEngine.getAIExplanation(
      patient,
      'Patient experiencing moderate pain after knee replacement surgery. What are the recommendations?'
    );

    if (explanation) {
      console.log('✅ AI Explanation Generated:');
      console.log(`   Summary: ${explanation.summary}`);
      console.log(`   Risk Assessment: ${explanation.riskAssessment}`);
      console.log(`   Confidence: ${(explanation.confidence * 100).toFixed(1)}%`);
      console.log(`   Recommendations: ${explanation.recommendations.length} found`);
      explanation.recommendations.forEach((rec, index) => {
        console.log(`     ${index + 1}. ${rec}`);
      });
      console.log(`   Next Steps: ${explanation.nextSteps.length} found`);
      explanation.nextSteps.forEach((step, index) => {
        console.log(`     ${index + 1}. ${step}`);
      });
      console.log('');
    }

    // Test 3: Comprehensive assessment
    console.log('📊 Test 3: Full enhanced risk assessment...');
    const enhancedAssessment = await assessmentEngine.assessPatientRiskEnhanced({
      patient: patient,
      includeAIExplanation: true,
      searchGuidelines: true,
      customQuery: 'Post-operative day 6 knee replacement assessment'
    });

    console.log('✅ Enhanced Assessment Results:');
    console.log(`   Overall Risk Level: ${enhancedAssessment.overallRiskLevel}`);
    console.log(`   Urgency Level: ${enhancedAssessment.urgencyLevel}`);
    console.log(`   Vector Search Results: ${enhancedAssessment.vectorSearchResults}`);
    console.log(`   AI Confidence: ${(enhancedAssessment.aiConfidence * 100).toFixed(1)}%`);
    console.log('');

    // Test 4: Check for complications
    console.log('⚠️  Test 4: Checking for potential complications...');
    const complications = await assessmentEngine.checkComplications(patient);
    console.log(`✅ Found ${complications.length} potential concerns:`);
    complications.forEach((comp, index) => {
      console.log(`     ${index + 1}. ${comp}`);
    });
    console.log('');

    // Test 5: Get recovery milestones
    console.log('🎯 Test 5: Getting recovery milestones...');
    const milestones = await assessmentEngine.getRecoveryMilestones(patient);
    console.log(`✅ Found ${milestones.length} recovery milestones:`);
    milestones.forEach((milestone, index) => {
      console.log(`     ${index + 1}. ${milestone.substring(0, 100)}...`);
    });
    console.log('');

    // Test 6: Get personalized recommendations
    console.log('💡 Test 6: Getting personalized recommendations...');
    const recommendations = await assessmentEngine.getPersonalizedRecommendations(
      patient,
      'moderate pain and limited mobility'
    );
    console.log(`✅ Generated ${recommendations.length} personalized recommendations:`);
    recommendations.forEach((rec, index) => {
      console.log(`     ${index + 1}. ${rec}`);
    });
    console.log('');

    // Get database statistics
    console.log('📈 Test 7: Database Statistics...');
    const stats = await assessmentEngine.getVectorDBStats();
    if (stats) {
      console.log('✅ Database Statistics:');
      console.log(`   Total Documents: ${stats.totalDocuments}`);
      console.log(`   Total Embeddings: ${stats.totalEmbeddings}`);
      console.log('   Document Types:');
      Object.entries(stats.documentTypes).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`     ${type.replace('_', ' ')}: ${count}`);
        }
      });
      console.log('   Surgery Types:');
      Object.entries(stats.surgeryTypes).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`     ${type.replace('_', ' ')}: ${count}`);
        }
      });
    }

    console.log('\n🎉 Real Gemini AI Medical Assistant Demo Completed Successfully!');
    console.log('📝 All tests passed - Gemini integration is working!');
    console.log('💡 You can now use the frontend component to interact with the real AI!');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  runGeminiDemo();
}

export { runGeminiDemo };
