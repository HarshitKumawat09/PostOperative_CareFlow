// Vector Database Service using ChromaDB
// Core service for medical document storage, retrieval, and RAG operations

import { ChromaApi, OpenAIEmbeddingFunction } from 'chromadb';
import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
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

export class VectorDatabaseService {
  private client: ChromaApi;
  private openai: OpenAI | null;
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

    // Initialize OpenAI (only if API key is available)
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    } else {
      console.warn('⚠️ OpenAI API key not configured. AI features will be limited.');
      this.openai = null;
    }

    // Initialize ChromaDB client
    this.client = new ChromaClient({
      path: `${this.config.host}:${this.config.port}`
    });

    // Initialize embedding function
    this.embeddingFunction = new OpenAIEmbeddingFunction({
      openai_api_key: process.env.OPENAI_API_KEY,
      model_name: this.config.embeddingModel
    });

    this.collectionName = this.config.collectionName;
  }

  /**
   * Initialize the vector database and create collection
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Vector Database Service...');
      
      // Test connection
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

      console.log('🎉 Vector Database Service initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize Vector Database Service:', error);
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
   * Search for relevant medical documents
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
   * Generate AI explanation using RAG
   */
  async generateAIExplanation(ragContext: RAGContext): Promise<AIExplanation> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured. Cannot generate AI explanation.');
    }

    try {
      const prompt = this.buildRAGPrompt(ragContext);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert post-operative care assistant. Use the provided medical guidelines and patient context to generate accurate, helpful explanations. Always prioritize patient safety and evidence-based recommendations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from AI model');
      }

      return this.parseAIResponse(response, ragContext);
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
Patient Context:
- Surgery Type: ${patientContext.surgeryType}
- Recovery Day: ${patientContext.recoveryDay}
- Current Symptoms: Pain ${patientContext.currentSymptoms.painLevel}/10, Mobility: ${patientContext.currentSymptoms.mobilityScore}/10
- Temperature: ${patientContext.currentSymptoms.temperature}°C
- Wound Condition: ${patientContext.currentSymptoms.woundCondition}

Relevant Medical Guidelines:
${relevantGuidelines.map(guideline => `- ${guideline}`).join('\n')}

Additional Context:
${retrievedDocuments.slice(0, 3).map(doc => `- ${doc.content.substring(0, 200)}...`).join('\n')}

Please provide:
1. A clear summary of the patient's current status
2. Detailed explanation of relevant medical considerations
3. Specific recommendations for care
4. Risk assessment and concerns
5. Next steps for monitoring and treatment

Focus on evidence-based recommendations and patient safety.
    `;
  }

  private parseAIResponse(response: string, ragContext: RAGContext): AIExplanation {
    // Simple parsing - in production, use more sophisticated parsing
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      summary: lines[0] || 'Patient assessment completed',
      detailedExplanation: response,
      recommendations: this.extractRecommendations(response),
      riskAssessment: this.extractRiskAssessment(response),
      nextSteps: this.extractNextSteps(response),
      confidence: 0.85, // Default confidence
      sources: ragContext.retrievedDocuments.map(doc => doc.metadata.source)
    };
  }

  private extractRecommendations(response: string): string[] {
    const recommendations: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') || 
          line.toLowerCase().includes('should') ||
          line.match(/^\d+\./)) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  private extractRiskAssessment(response: string): string {
    const lines = response.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().includes('risk') || 
          line.toLowerCase().includes('concern')) {
        return line.trim();
      }
    }
    return 'Risk assessment completed based on current symptoms and guidelines';
  }

  private extractNextSteps(response: string): string[] {
    const nextSteps: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('next') || 
          line.toLowerCase().includes('monitor') ||
          line.toLowerCase().includes('follow')) {
        nextSteps.push(line.trim());
      }
    }
    
    return nextSteps.slice(0, 3); // Limit to 3 next steps
  }
}
