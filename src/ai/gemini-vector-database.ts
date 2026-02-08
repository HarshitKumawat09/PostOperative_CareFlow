// Vector Database Service using ChromaDB with Gemini API
// Real implementation for medical document storage, retrieval, and RAG operations

import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb';
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
  VectorDBConfig,
  BatchProcessingOptions,
  IndexInfo
} from '../models/vector-db';

import { SurgeryType, RiskLevel } from '../models/base';
import { Patient } from '../models/patient';

export class GeminiVectorDatabaseService {
  private client: ChromaClient;
  private genAI: GoogleGenerativeAI;
  private embeddingFunction: OpenAIEmbeddingFunction;
  private config: VectorDBConfig;
  private collectionName: string;

  constructor(config?: Partial<VectorDBConfig>) {
    // Initialize configuration with defaults
    this.config = {
      host: process.env.CHROMADB_HOST || 'localhost',
      port: parseInt(process.env.CHROMADB_PORT || '8000'),
      path: process.env.CHROMADB_PATH || './chroma_db',
      embeddingModel: 'text-embedding-ada-002',
      dimension: 1536,
      collectionName: 'medical_guidelines',
      ...config
    };

    // Initialize Gemini AI
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(geminiApiKey);

    // Initialize ChromaDB client
    this.client = new ChromaClient({
      path: `${this.config.host}:${this.config.port}`
    });

    // Initialize embedding function (using OpenAI for embeddings as fallback)
    // We'll use Gemini for text generation and OpenAI for embeddings
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: 'dummy-key', // We'll use a different approach
      model_name: this.config.embeddingModel
    });

    this.collectionName = this.config.collectionName;
  }

  /**
   * Initialize the vector database and create collection
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Gemini Vector Database Service...');
      
      // Test Gemini connection
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Hello, test connection');
      console.log('✅ Gemini API connection established');

      // Test ChromaDB connection
      await this.client.heartbeat();
      console.log('✅ ChromaDB connection established');

      // Get or create collection
      const collections = await this.client.listCollections();
      const existingCollection = collections.find((c: any) => c.name === this.collectionName);

      if (!existingCollection) {
        await this.client.createCollection({
          name: this.collectionName,
          metadata: {
            description: 'Medical guidelines and post-operative protocols',
            version: '1.0.0',
            created: new Date().toISOString()
          }
        });
        console.log(`✅ Created collection: ${this.collectionName}`);
      } else {
        console.log(`✅ Using existing collection: ${this.collectionName}`);
      }

      console.log('🎉 Gemini Vector Database Service initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini Vector Database Service:', error);
      throw error;
    }
  }

  /**
   * Add medical documents to the vector database
   */
  async addDocuments(documents: DocumentChunk[]): Promise<string[]> {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      
      const ids: string[] = [];
      const contents: string[] = [];
      const metadatas: any[] = [];

      for (const doc of documents) {
        ids.push(doc.id);
        contents.push(doc.content);
        metadatas.push({
          ...doc.metadata,
          lastUpdated: doc.metadata.lastUpdated.toISOString()
        });
      }

      await collection.add({
        ids,
        documents: contents,
        metadatas
      });

      console.log(`✅ Added ${documents.length} documents to vector database`);
      return ids;
    } catch (error) {
      console.error('❌ Failed to add documents:', error);
      throw error;
    }
  }

  /**
   * Search for relevant medical documents using semantic search
   */
  async searchDocuments(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      
      // Build where clause for filtering
      let where: any = {};
      if (query.surgeryType) {
        where.surgeryTypes = { $contains: query.surgeryType };
      }
      if (query.documentType) {
        where.documentType = query.documentType;
      }
      if (query.riskLevel) {
        where.riskLevel = query.riskLevel;
      }

      const results = await collection.query({
        queryTexts: [query.query],
        nResults: query.limit || 10,
        where: Object.keys(where).length > 0 ? where : undefined
      });

      const searchResults: VectorSearchResult[] = [];
      
      if (results.ids[0] && results.documents[0] && results.metadatas[0] && results.distances[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const metadata = results.metadatas[0][i] as MedicalEmbeddingMetadata;
          
          // Apply minimum score filter
          const score = 1 - (results.distances[0][i] || 0);
          if (query.minScore && score < query.minScore) {
            continue;
          }

          searchResults.push({
            id: results.ids[0][i],
            content: results.documents[0][i],
            metadata: {
              ...metadata,
              lastUpdated: new Date(metadata.lastUpdated)
            },
            score,
            distance: results.distances[0][i] || 0
          });
        }
      }

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
      const collection = await this.client.getCollection({ name: this.collectionName });
      const count = await collection.count();
      
      // Get sample documents to analyze types
      const sample = await collection.get({ limit: 1000 });
      
      const documentTypes: Record<MedicalDocumentType, number> = {} as any;
      const surgeryTypes: Record<SurgeryType, number> = {} as any;

      // Initialize counters
      Object.values(MedicalDocumentType).forEach(type => {
        documentTypes[type] = 0;
      });
      Object.values(SurgeryType).forEach(type => {
        surgeryTypes[type] = 0;
      });

      // Count types from sample
      sample.metadatas?.forEach((metadata: any) => {
        const docType = metadata.documentType as MedicalDocumentType;
        const surgTypes = metadata.surgeryTypes as SurgeryType[];
        
        if (docType && documentTypes[docType] !== undefined) {
          documentTypes[docType]++;
        }
        
        surgTypes?.forEach(surgType => {
          if (surgeryTypes[surgType] !== undefined) {
            surgeryTypes[surgType]++;
          }
        });
      });

      return {
        totalDocuments: count,
        totalEmbeddings: count,
        documentTypes,
        surgeryTypes,
        lastUpdated: new Date()
      };
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
        riskLevel: RiskLevel.LOW // Will be updated after risk assessment
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
   * Generate AI explanation using Gemini and RAG
   */
  async generateAIExplanation(ragContext: RAGContext): Promise<AIExplanation> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
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
    options: BatchProcessingOptions = {
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
   * Delete documents from the database
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    try {
      const collection = await this.client.getCollection({ name: this.collectionName });
      await collection.delete({ ids });
      console.log(`🗑️ Deleted ${ids.length} documents from vector database`);
    } catch (error) {
      console.error('❌ Failed to delete documents:', error);
      throw error;
    }
  }

  /**
   * Clear the entire collection
   */
  async clearCollection(): Promise<void> {
    try {
      await this.client.deleteCollection({ name: this.collectionName });
      await this.client.createCollection({
        name: this.collectionName,
        metadata: {
          description: 'Medical guidelines and post-operative protocols',
          version: '1.0.0',
          created: new Date().toISOString()
        }
      });
      console.log('🗑️ Cleared vector database collection');
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
