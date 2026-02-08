// Simple Gemini-based Medical Guidelines Service
// Real implementation using Gemini API for medical document analysis and recommendations

import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

import {
  MedicalDocumentType,
  MedicalEmbeddingMetadata,
  VectorSearchQuery,
  VectorSearchResult,
  DocumentChunk,
  VectorDatabaseStats,
  RAGContext,
  AIExplanation,
  VectorDBConfig
} from '../models/vector-db';

import { SurgeryType, RiskLevel } from '../models/base';
import { Patient } from '../models/patient';

// In-memory storage for documents (for demo purposes)
class InMemoryDocumentStore {
  private documents: Map<string, DocumentChunk> = new Map();
  private metadata: Map<string, MedicalEmbeddingMetadata> = new Map();

  addDocument(doc: DocumentChunk): void {
    this.documents.set(doc.id, doc);
    this.metadata.set(doc.id, doc.metadata);
  }

  searchDocuments(query: string, filters?: any): DocumentChunk[] {
    const results: DocumentChunk[] = [];
    
    for (const [id, doc] of this.documents) {
      // Simple keyword matching for now
      const content = doc.content.toLowerCase();
      const queryLower = query.toLowerCase();
      
      let matches = content.includes(queryLower);
      
      // Apply filters
      if (filters && matches) {
        if (filters.surgeryType && !doc.metadata.surgeryTypes.includes(filters.surgeryType)) {
          matches = false;
        }
        if (filters.documentType && doc.metadata.documentType !== filters.documentType) {
          matches = false;
        }
      }
      
      if (matches) {
        results.push(doc);
      }
    }
    
    // Sort by relevance (simple keyword count for now)
    return results.sort((a, b) => {
      const aCount = (a.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length;
      const bCount = (b.content.toLowerCase().match(new RegExp(query.toLowerCase(), 'g')) || []).length;
      return bCount - aCount;
    });
  }

  getStats(): VectorDatabaseStats {
    const documentTypes: Record<MedicalDocumentType, number> = {} as any;
    const surgeryTypes: Record<SurgeryType, number> = {} as any;

    // Initialize counters
    Object.values(MedicalDocumentType).forEach(type => {
      documentTypes[type] = 0;
    });
    Object.values(SurgeryType).forEach(type => {
      surgeryTypes[type] = 0;
    });

    // Count types
    for (const metadata of this.metadata.values()) {
      const docType = metadata.documentType;
      const surgTypes = metadata.surgeryTypes;
      
      if (docType && documentTypes[docType] !== undefined) {
        documentTypes[docType]++;
      }
      
      surgTypes?.forEach(surgType => {
        if (surgeryTypes[surgType] !== undefined) {
          surgeryTypes[surgType]++;
        }
      });
    }

    return {
      totalDocuments: this.documents.size,
      totalEmbeddings: this.documents.size,
      documentTypes,
      surgeryTypes,
      lastUpdated: new Date()
    };
  }

  clear(): void {
    this.documents.clear();
    this.metadata.clear();
  }
}

export class SimpleGeminiService {
  private genAI: GoogleGenerativeAI;
  private documentStore: InMemoryDocumentStore;
  private config: VectorDBConfig;

  constructor(config?: Partial<VectorDBConfig>) {
    // Initialize configuration
    this.config = {
      host: process.env.CHROMADB_HOST || 'localhost',
      port: parseInt(process.env.CHROMADB_PORT || '8000'),
      path: process.env.CHROMADB_PATH || './chroma_db',
      embeddingModel: 'gemini-flash-latest',
      dimension: 768,
      collectionName: 'medical_guidelines',
      ...config
    };

    // Initialize Gemini AI
    // For client-side usage, Next.js only exposes vars prefixed with NEXT_PUBLIC_
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Missing Gemini API key. Set GEMINI_API_KEY (server) or NEXT_PUBLIC_GEMINI_API_KEY (client) in .env.local');
    }

    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.documentStore = new InMemoryDocumentStore();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Simple Gemini Service...');
      
      // Test Gemini connection
      const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const result = await model.generateContent('Hello, test connection');
      console.log('✅ Gemini API connection established');

      console.log('🎉 Simple Gemini Service initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Simple Gemini Service:', error);
      throw error;
    }
  }

  /**
   * Add medical documents to the store
   */
  async addDocuments(documents: DocumentChunk[]): Promise<string[]> {
    try {
      const ids: string[] = [];

      for (const doc of documents) {
        this.documentStore.addDocument(doc);
        ids.push(doc.id);
      }

      console.log(`✅ Added ${documents.length} documents to medical guidelines store`);
      return ids;
    } catch (error) {
      console.error('❌ Failed to add documents:', error);
      throw error;
    }
  }

  /**
   * Search for relevant medical documents
   */
  async searchDocuments(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    try {
      const filters: any = {};
      if (query.surgeryType) filters.surgeryType = query.surgeryType;
      if (query.documentType) filters.documentType = query.documentType;
      if (query.riskLevel) filters.riskLevel = query.riskLevel;

      const results = this.documentStore.searchDocuments(query.query, filters);
      
      const searchResults: VectorSearchResult[] = results.slice(0, query.limit || 10).map((doc, index) => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata,
        score: Math.max(0.1, 1 - (index * 0.1)), // Simple scoring
        distance: index * 0.1
      }));

      console.log(`🔍 Found ${searchResults.length} relevant documents for query: "${query.query}"`);
      return searchResults;
    } catch (error) {
      console.error('❌ Failed to search documents:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<VectorDatabaseStats> {
    try {
      return this.documentStore.getStats();
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Create RAG context for patient-specific queries
   */
  async createRAGContext(patient: Patient, query: string): Promise<RAGContext> {
    try {
      const patientContext = {
        surgeryType: patient.getSurgeryType(),
        recoveryDay: patient.getRecoveryDay(),
        currentSymptoms: patient.getCurrentSymptoms(),
        riskLevel: RiskLevel.LOW
      };

      // Search for relevant documents
      const searchQuery: VectorSearchQuery = {
        query,
        surgeryType: patientContext.surgeryType,
        recoveryDay: patientContext.recoveryDay,
        limit: 5
      };

      const retrievedDocuments = await this.searchDocuments(searchQuery);
      
      // Extract relevant guidelines
      const relevantGuidelines = retrievedDocuments
        .filter(doc => doc.metadata.documentType === MedicalDocumentType.CLINICAL_GUIDELINE)
        .map(doc => doc.content);

      // Generate contextual insights
      const contextualInsights = this.generateContextualInsights(
        patientContext,
        retrievedDocuments
      );

      return {
        patientContext,
        retrievedDocuments,
        relevantGuidelines,
        contextualInsights
      };
    } catch (error) {
      console.error('❌ Failed to create RAG context:', error);
      throw error;
    }
  }

  /**
   * Generate AI explanation using Gemini
   */
  async generateAIExplanation(ragContext: RAGContext): Promise<AIExplanation> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const prompt = this.buildRAGPrompt(ragContext);
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('No response from Gemini model');
      }

      return this.parseAIResponse(text, ragContext);
    } catch (error) {
      console.error('❌ Failed to generate AI explanation:', error);
      throw error;
    }
  }

  /**
   * Process and chunk large documents
   */
  async processDocument(
    content: string,
    metadata: MedicalEmbeddingMetadata,
    options: any = {
      chunkSize: 500,
      overlap: 50,
      maxChunks: 10,
      includeMetadata: true
    }
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const words = content.split(' ');
    
    for (let i = 0; i < words.length; i += options.chunkSize - options.overlap) {
      if (chunks.length >= options.maxChunks) break;
      
      const chunkWords = words.slice(i, i + options.chunkSize);
      const chunkContent = chunkWords.join(' ');
      
      chunks.push({
        id: uuidv4(),
        content: chunkContent,
        metadata: {
          ...metadata,
          id: uuidv4(),
          title: `${metadata.title} - Chunk ${chunks.length + 1}`
        }
      });
    }

    return chunks;
  }

  /**
   * Clear the document store
   */
  async clearCollection(): Promise<void> {
    try {
      this.documentStore.clear();
      console.log('🗑️ Cleared medical guidelines store');
    } catch (error) {
      console.error('❌ Failed to clear collection:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateContextualInsights(
    patientContext: any,
    retrievedDocuments: VectorSearchResult[]
  ): string[] {
    const insights: string[] = [];
    
    // Analyze pain patterns
    const painDocs = retrievedDocuments.filter(doc => 
      doc.content.toLowerCase().includes('pain') || 
      doc.metadata.keywords.includes('pain')
    );
    
    if (painDocs.length > 0) {
      insights.push(`Found ${painDocs.length} relevant pain management guidelines`);
    }

    // Analyze wound care
    const woundDocs = retrievedDocuments.filter(doc => 
      doc.content.toLowerCase().includes('wound') || 
      doc.metadata.keywords.includes('wound')
    );
    
    if (woundDocs.length > 0) {
      insights.push(`Found ${woundDocs.length} relevant wound care protocols`);
    }

    // Recovery day specific insights
    if (patientContext.recoveryDay <= 3) {
      insights.push('Early post-operative period - increased monitoring required');
    } else if (patientContext.recoveryDay >= 7) {
      insights.push('Recovery progression - focus on mobility and independence');
    }

    return insights;
  }

  private buildRAGPrompt(ragContext: RAGContext): string {
    const { patientContext, retrievedDocuments, relevantGuidelines } = ragContext;
    
    return `
You are an expert post-operative care assistant with deep knowledge of medical guidelines and patient care. Based on the following patient context and retrieved medical guidelines, provide a comprehensive assessment and recommendations.

PATIENT CONTEXT:
- Surgery Type: ${patientContext.surgeryType}
- Recovery Day: ${patientContext.recoveryDay}
- Current Symptoms: 
  * Pain Level: ${patientContext.currentSymptoms.painLevel}/10
  * Mobility Score: ${patientContext.currentSymptoms.mobilityScore}/10
  * Temperature: ${patientContext.currentSymptoms.temperature}°C
  * Wound Condition: ${patientContext.currentSymptoms.woundCondition}

RELEVANT MEDICAL GUIDELINES:
${relevantGuidelines.map((guideline, index) => `${index + 1}. ${guideline.substring(0, 300)}...`).join('\n')}

ADDITIONAL CONTEXT:
${retrievedDocuments.slice(0, 3).map(doc => `- ${doc.content.substring(0, 200)}...`).join('\n')}

Please provide a structured response with the following sections:
1. SUMMARY: Brief overview of patient's current status
2. RISK ASSESSMENT: Current risk level and concerns
3. RECOMMENDATIONS: Specific, actionable recommendations (numbered list)
4. NEXT STEPS: What to monitor and do next (numbered list)
5. CONFIDENCE: Your confidence level in this assessment (0-100%)

Focus on evidence-based recommendations and patient safety. Be specific and practical in your advice.
    `;
  }

  private parseAIResponse(response: string, ragContext: RAGContext): AIExplanation {
    // Parse the structured response from Gemini
    const lines = response.split('\n').filter(line => line.trim());
    
    let summary = '';
    let riskAssessment = '';
    const recommendations: string[] = [];
    const nextSteps: string[] = [];
    let confidence = 0.8; // Default confidence

    // Extract sections from the response
    let currentSection = '';
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.toUpperCase().includes('SUMMARY:')) {
        currentSection = 'summary';
        summary = trimmedLine.replace('SUMMARY:', '').trim();
      } else if (trimmedLine.toUpperCase().includes('RISK ASSESSMENT:')) {
        currentSection = 'risk';
        riskAssessment = trimmedLine.replace('RISK ASSESSMENT:', '').trim();
      } else if (trimmedLine.toUpperCase().includes('RECOMMENDATIONS:')) {
        currentSection = 'recommendations';
      } else if (trimmedLine.toUpperCase().includes('NEXT STEPS:')) {
        currentSection = 'nextSteps';
      } else if (trimmedLine.toUpperCase().includes('CONFIDENCE:')) {
        const confidenceStr = trimmedLine.replace('CONFIDENCE:', '').trim();
        confidence = parseInt(confidenceStr) / 100 || 0.8;
      } else if (trimmedLine.match(/^\d+\./)) {
        // Numbered list item
        const item = trimmedLine.replace(/^\d+\.\s*/, '');
        if (currentSection === 'recommendations') {
          recommendations.push(item);
        } else if (currentSection === 'nextSteps') {
          nextSteps.push(item);
        }
      } else if (currentSection === 'summary' && summary) {
        summary += ' ' + trimmedLine;
      } else if (currentSection === 'risk' && riskAssessment) {
        riskAssessment += ' ' + trimmedLine;
      }
    }

    return {
      summary: summary || 'Patient assessment completed based on current symptoms and medical guidelines',
      detailedExplanation: response,
      recommendations: recommendations.length > 0 ? recommendations : [
        'Continue current post-operative care routine',
        'Monitor symptoms regularly',
        'Follow medical team instructions',
        'Contact healthcare provider if symptoms worsen'
      ],
      riskAssessment: riskAssessment || 'Risk assessment completed based on current symptoms and guidelines',
      nextSteps: nextSteps.length > 0 ? nextSteps : [
        'Continue monitoring vital signs',
        'Maintain medication schedule',
        'Follow up with healthcare provider as scheduled'
      ],
      confidence,
      sources: ragContext.retrievedDocuments.map(doc => doc.metadata.source)
    };
  }
}
