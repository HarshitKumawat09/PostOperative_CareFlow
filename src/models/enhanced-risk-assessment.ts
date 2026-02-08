// Enhanced Risk Assessment with Vector Database Integration
// Extends our existing risk assessment with AI-powered insights

import { RiskAssessmentEngine, RiskAssessmentResult } from './risk-assessment';
import { Patient } from './patient';
import { VectorDatabaseService } from '../ai/vector-database';
import { 
  RAGContext, 
  AIExplanation, 
  MedicalDocumentType,
  VectorSearchQuery 
} from './vector-db';
import { SurgeryType, RiskLevel } from './base';

export interface EnhancedRiskAssessmentResult extends RiskAssessmentResult {
  aiExplanation?: AIExplanation;
  ragContext?: RAGContext;
  relevantGuidelines: string[];
  aiConfidence: number;
  vectorSearchResults: number;
}

export interface VectorEnhancedRiskInput {
  patient: Patient;
  includeAIExplanation: boolean;
  searchGuidelines: boolean;
  customQuery?: string;
}

export class EnhancedRiskAssessmentEngine extends RiskAssessmentEngine {
  private vectorDB: VectorDatabaseService;

  constructor(vectorDB?: VectorDatabaseService) {
    super();
    this.vectorDB = vectorDB || new VectorDatabaseService();
  }

  /**
   * Initialize the enhanced assessment engine
   */
  async initialize(): Promise<void> {
    try {
      await this.vectorDB.initialize();
      console.log('✅ Enhanced Risk Assessment Engine initialized with Vector DB');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Risk Assessment Engine:', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive risk assessment with AI insights
   */
  async assessPatientRiskEnhanced(input: VectorEnhancedRiskInput): Promise<EnhancedRiskAssessmentResult> {
    try {
      // Get traditional risk assessment
      const baseAssessment = super.assessPatientRisk(input.patient);
      
      // Initialize enhanced result
      const enhancedResult: EnhancedRiskAssessmentResult = {
        ...baseAssessment,
        relevantGuidelines: [],
        aiConfidence: 0,
        vectorSearchResults: 0
      };

      // Perform vector search if requested
      if (input.searchGuidelines) {
        await this.enhanceWithVectorSearch(enhancedResult, input);
      }

      // Generate AI explanation if requested
      if (input.includeAIExplanation && enhancedResult.ragContext) {
        await this.enhanceWithAIExplanation(enhancedResult);
      }

      return enhancedResult;
    } catch (error) {
      console.error('❌ Failed to perform enhanced risk assessment:', error);
      throw error;
    }
  }

  /**
   * Search for relevant medical guidelines based on patient context
   */
  async searchRelevantGuidelines(
    patient: Patient, 
    query?: string
  ): Promise<string[]> {
    try {
      const searchQuery: VectorSearchQuery = {
        query: query || this.generateContextualQuery(patient),
        surgeryType: patient.getSurgeryType(),
        recoveryDay: patient.getRecoveryDay(),
        limit: 5
      };

      const results = await this.vectorDB.searchDocuments(searchQuery);
      
      return results.map(result => result.content);
    } catch (error) {
      console.error('❌ Failed to search guidelines:', error);
      return [];
    }
  }

  /**
   * Get AI-powered explanation for patient condition
   */
  async getAIExplanation(
    patient: Patient, 
    customQuery?: string
  ): Promise<AIExplanation | null> {
    try {
      const query = customQuery || this.generateContextualQuery(patient);
      const ragContext = await this.vectorDB.createRAGContext(patient, query);
      
      return await this.vectorDB.generateAIExplanation(ragContext);
    } catch (error) {
      console.error('❌ Failed to generate AI explanation:', error);
      return null;
    }
  }

  /**
   * Add medical guidelines to the vector database
   */
  async addMedicalGuidelines(
    guidelines: Array<{
      title: string;
      content: string;
      documentType: MedicalDocumentType;
      surgeryTypes: SurgeryType[];
      keywords: string[];
      source: string;
    }>
  ): Promise<void> {
    try {
      const documents = await Promise.all(
        guidelines.map(async (guideline) => {
          const chunks = await this.vectorDB.processDocument(guideline.content, {
            id: guideline.title,
            title: guideline.title,
            documentType: guideline.documentType,
            surgeryTypes: guideline.surgeryTypes,
            keywords: guideline.keywords,
            source: guideline.source,
            lastUpdated: new Date(),
            evidenceLevel: 'high' as const,
            language: 'en',
            specialty: 'post-operative care'
          });

          return chunks;
        })
      );

      const allChunks = documents.flat();
      await this.vectorDB.addDocuments(allChunks);
      
      console.log(`✅ Added ${guidelines.length} medical guidelines with ${allChunks.length} chunks`);
    } catch (error) {
      console.error('❌ Failed to add medical guidelines:', error);
      throw error;
    }
  }

  /**
   * Get vector database statistics
   */
  async getVectorDBStats() {
    try {
      return await this.vectorDB.getStats();
    } catch (error) {
      console.error('❌ Failed to get vector DB stats:', error);
      return null;
    }
  }

  // Private helper methods

  private async enhanceWithVectorSearch(
    result: EnhancedRiskAssessmentResult, 
    input: VectorEnhancedRiskInput
  ): Promise<void> {
    try {
      const query = input.customQuery || this.generateContextualQuery(input.patient);
      const ragContext = await this.vectorDB.createRAGContext(input.patient, query);
      
      result.ragContext = ragContext;
      result.relevantGuidelines = ragContext.relevantGuidelines;
      result.vectorSearchResults = ragContext.retrievedDocuments.length;
      
      console.log(`🔍 Found ${result.vectorSearchResults} relevant medical documents`);
    } catch (error) {
      console.error('❌ Failed to enhance with vector search:', error);
    }
  }

  private async enhanceWithAIExplanation(result: EnhancedRiskAssessmentResult): Promise<void> {
    try {
      if (!result.ragContext) {
        throw new Error('RAG context is required for AI explanation');
      }

      const aiExplanation = await this.vectorDB.generateAIExplanation(result.ragContext);
      
      result.aiExplanation = aiExplanation;
      result.aiConfidence = aiExplanation.confidence;
      
      console.log(`🤖 Generated AI explanation with ${aiExplanation.confidence} confidence`);
    } catch (error) {
      console.error('❌ Failed to enhance with AI explanation:', error);
    }
  }

  private generateContextualQuery(patient: Patient): string {
    const symptoms = patient.getCurrentSymptoms();
    const recoveryDay = patient.getRecoveryDay();
    const surgeryType = patient.getSurgeryType();

    return `
      Post-operative care for ${surgeryType} on day ${recoveryDay}. 
      Patient reports pain level ${symptoms.painLevel}/10, 
      mobility score ${symptoms.mobilityScore}/10, 
      temperature ${symptoms.temperature}°C, 
      wound condition: ${symptoms.woundCondition}.
      Provide evidence-based recommendations and risk assessment.
    `;
  }

  /**
   * Get personalized recommendations based on patient context
   */
  async getPersonalizedRecommendations(
    patient: Patient, 
    specificConcern?: string
  ): Promise<string[]> {
    try {
      const query = specificConcern || this.generateContextualQuery(patient);
      const aiExplanation = await this.getAIExplanation(patient, query);
      
      return aiExplanation?.recommendations || [];
    } catch (error) {
      console.error('❌ Failed to get personalized recommendations:', error);
      return [];
    }
  }

  /**
   * Check for potential complications based on symptoms and guidelines
   */
  async checkComplications(patient: Patient): Promise<string[]> {
    try {
      const symptoms = patient.getCurrentSymptoms();
      const concerns: string[] = [];

      // Check for fever
      if (symptoms.temperature && symptoms.temperature > 38) {
        const feverGuidelines = await this.searchRelevantGuidelines(
          patient, 
          "fever post-operative complications infection"
        );
        if (feverGuidelines.length > 0) {
          concerns.push("Fever detected - review infection guidelines");
        }
      }

      // Check for severe pain
      if (symptoms.painLevel >= 8) {
        const painGuidelines = await this.searchRelevantGuidelines(
          patient, 
          "severe pain post-operative management"
        );
        if (painGuidelines.length > 0) {
          concerns.push("Severe pain detected - review pain management protocols");
        }
      }

      // Check for wound issues
      if (symptoms.woundCondition && symptoms.woundCondition !== 'normal') {
        const woundGuidelines = await this.searchRelevantGuidelines(
          patient, 
          `wound ${symptoms.woundCondition} post-operative care`
        );
        if (woundGuidelines.length > 0) {
          concerns.push(`Wound ${symptoms.woundCondition} detected - review wound care protocols`);
        }
      }

      return concerns;
    } catch (error) {
      console.error('❌ Failed to check complications:', error);
      return [];
    }
  }

  /**
   * Get recovery milestones and expectations
   */
  async getRecoveryMilestones(patient: Patient): Promise<string[]> {
    try {
      const recoveryDay = patient.getRecoveryDay();
      const milestones = await this.searchRelevantGuidelines(
        patient, 
        `recovery milestones day ${recoveryDay} expectations`
      );
      
      return milestones;
    } catch (error) {
      console.error('❌ Failed to get recovery milestones:', error);
      return [];
    }
  }
}
