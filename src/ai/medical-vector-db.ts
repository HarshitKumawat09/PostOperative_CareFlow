// 🧱 PHASE 1 — PERSISTENT VECTOR DATABASE
// Real ChromaDB integration with Gemini embeddings + Persistent File Storage

import { ChromaClient } from 'chromadb';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { huggingFaceEmbeddings } from './huggingface-embeddings';
import { persistentStorage } from './persistent-storage';
import { SurgeryType } from '@/lib/types';

export interface ProtocolMetadata {
  title: string;
  source: string;
  surgeryType: SurgeryType;
  department: string;
  version?: string;
  uploadDate: string;
  lastUpdated: string;
  evidenceLevel: 'low' | 'moderate' | 'high' | 'expert_opinion';
  keywords: string[];
}

export interface SearchResult {
  id?: string;
  content: string;
  metadata: ProtocolMetadata;
  relevanceScore: number;
  source: string;
}

export class MedicalVectorDB {
  private client: ChromaClient;
  private collection: any;
  private genAI: GoogleGenerativeAI;
  private initialized = false;
  private usePersistentStorage = false;

  constructor() {
    // Connect to ChromaDB server with default settings
    this.client = new ChromaClient({
      path: "http://localhost:8000"
    });

    // Initialize Gemini for LLM (not embeddings)
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    console.log('🧱 Medical Vector DB initialized with ChromaDB server + HuggingFace embeddings');
  }

  private async initialize() {
    if (this.initialized) return;

    try {
      // Connect to ChromaDB server (default tenant should work)
      this.collection = await this.client.getOrCreateCollection({
        name: 'hospital_guidelines_hf' // New collection for HuggingFace embeddings
      });
      this.initialized = true;
      console.log('✅ ChromaDB server connected successfully');
      
      // Test the connection by getting count
      const count = await this.collection.count();
      console.log(`📊 ChromaDB collection has ${count} documents`);
      
    } catch (error) {
      console.error('❌ ChromaDB server connection failed, using persistent file storage:', error);
      // Use persistent file storage instead of in-memory
      this.usePersistentStorage = true;
      this.initialized = true;
      console.log('💾 Switched to persistent file storage');
    }
  }

  // Generate embeddings using Hugging Face (100% free, local)
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      console.log('🤖 Using HuggingFace embeddings (all-MiniLM-L6-v2)');
      return await huggingFaceEmbeddings.generateEmbedding(text);
    } catch (error) {
      console.error('❌ Failed to generate HuggingFace embedding:', error);
      // Fallback to simple hash-based embedding
      return this.generateFallbackEmbedding(text);
    }
  }

  // Fallback embedding method (384 dimensions to match HuggingFace)
  private generateFallbackEmbedding(text: string): number[] {
    const embedding = new Array(384).fill(0); // HuggingFace embedding dimension
    for (let i = 0; i < text.length; i++) {
      embedding[i % 384] = text.charCodeAt(i) / 255;
    }
    return embedding;
  }

  // Staff uploads hospital protocols
  async addDocument(content: string, metadata: ProtocolMetadata): Promise<string> {
    await this.initialize();

    const id = `protocol-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Try ChromaDB first
      if (this.collection && !this.usePersistentStorage) {
        const embedding = await this.generateEmbedding(content);
        
        await this.collection.add({
          ids: [id],
          documents: [content],
          embeddings: [embedding],
          metadatas: [{
            ...metadata,
            id,
            uploadDate: metadata.uploadDate || new Date().toISOString(),
            lastUpdated: metadata.lastUpdated || new Date().toISOString()
          }]
        });
        
        console.log(`🏥 Protocol stored in ChromaDB: ${metadata.title} (${content.length} chars)`);
      } else {
        // Use persistent file storage
        await persistentStorage.addDocument(id, content, metadata);
        console.log(`💾 Protocol stored in persistent file storage: ${metadata.title} (${content.length} chars)`);
      }
      
      return id;
    } catch (error) {
      console.error('❌ Failed to store protocol:', error);
      
      // Fallback to persistent storage
      try {
        await persistentStorage.addDocument(id, content, metadata);
        console.log(`💾 Fallback: Protocol stored in persistent file storage: ${metadata.title}`);
        return id;
      } catch (fallbackError) {
        console.error('❌ Even fallback storage failed:', fallbackError);
        throw new Error('Failed to store protocol in any storage system');
      }
    }
  }

  // Get all documents for management
  async getAllDocuments(): Promise<Array<{id: string; content: string; metadata: ProtocolMetadata; relevanceScore: number; source: string}>> {
    await this.initialize();

    try {
      if (this.collection && !this.usePersistentStorage) {
        // Get all documents from ChromaDB
        const results = await this.collection.get({
          include: ['documents', 'metadatas']
        });

        if (!results.documents || results.documents.length === 0) {
          return [];
        }

        return results.documents.map((doc: string, index: number) => {
          const metadata = results.metadatas?.[index] || {};
          const id = results.ids?.[index] || `doc-${index}`;

          return {
            id,
            content: doc,
            metadata: metadata as ProtocolMetadata,
            relevanceScore: 1.0,
            source: (metadata as ProtocolMetadata).title || 'Unknown Protocol'
          };
        });
      } else {
        // Get all documents from persistent file storage
        const docs = await persistentStorage.getAllDocuments();
        return docs.map((doc, index) => ({
          id: doc.id || `doc-${index}`,
          content: doc.content,
          metadata: doc.metadata,
          relevanceScore: doc.relevanceScore || 1.0,
          source: doc.source || 'Unknown'
        }));
      }
    } catch (error) {
      console.error('❌ Failed to get all documents:', error);
      // Fallback to persistent storage
      const docs = await persistentStorage.getAllDocuments();
      return docs.map((doc, index) => ({
        id: doc.id || `doc-${index}`,
        content: doc.content,
        metadata: doc.metadata,
        relevanceScore: doc.relevanceScore || 1.0,
        source: doc.source || 'Unknown'
      }));
    }
  }

  // System finds relevant protocols (semantic search)
  async search(query: string, topK: number = 5, surgeryType?: SurgeryType): Promise<SearchResult[]> {
    await this.initialize();

    try {
      if (this.collection && !this.usePersistentStorage) {
        // Use ChromaDB search
        const embedding = await this.generateEmbedding(query);
        
        // Build where clause for surgery type filtering
        const whereClause = surgeryType ? { surgeryType } : {};
        
        const results = await this.collection.query({
          queryEmbeddings: [embedding],
          nResults: topK,
          where: whereClause,
          include: ['documents', 'metadatas', 'distances']
        });

        if (!results.documents[0]) {
          return [];
        }

        return results.documents[0].map((doc: string, index: number) => {
          const metadata = results.metadatas?.[0]?.[index] || {};
          const distance = results.distances?.[0]?.[index] || 1;
          const id = results.ids?.[0]?.[index];

          return {
            id,
            content: doc,
            metadata: metadata as ProtocolMetadata,
            relevanceScore: 1 - distance, // Convert distance to similarity score
            source: (metadata as ProtocolMetadata).title || 'Unknown Protocol'
          };
        });
      } else {
        // Get all documents from persistent file storage
        const allDocuments = await persistentStorage.getAllDocuments();
        
        // Filter by surgery type if specified
        const filteredDocuments = surgeryType 
          ? allDocuments.filter(doc => doc.metadata.surgeryType === surgeryType)
          : allDocuments;
        
        // Simple keyword matching for fallback
        const queryLower = query.toLowerCase();
        const scored = filteredDocuments
          .map(doc => {
            let score = 0;
            const contentLower = doc.content.toLowerCase();
            const titleLower = doc.metadata.title.toLowerCase();
            
            // Keyword matching
            if (contentLower.includes(queryLower)) score += 2;
            if (titleLower.includes(queryLower)) score += 3;
            
            return { ...doc, relevanceScore: score / 5 }; // Normalize to 0-1
          })
          .filter(doc => doc.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, topK);
          
        return scored;
      }
    } catch (error) {
      console.error('❌ Failed to search documents:', error);
      // Fallback to persistent storage
      const allDocuments = await persistentStorage.getAllDocuments();
      const filtered = surgeryType 
        ? allDocuments.filter(doc => doc.metadata.surgeryType === surgeryType).slice(0, topK)
        : allDocuments.slice(0, topK);
      // Ensure proper SearchResult structure
      return filtered.map(doc => ({
        id: doc.id,
        content: doc.content.substring(0, 300) + (doc.content.length > 300 ? '...' : ''),
        metadata: doc.metadata,
        relevanceScore: doc.relevanceScore || 1.0,
        source: doc.metadata.title || 'Unknown Protocol'
      }));
    }
  }

  // Get database statistics
  async getStats() {
    await this.initialize();

    try {
      let count = 0;
      
      if (this.collection && !this.usePersistentStorage) {
        count = await this.collection.count();
        return {
          totalDocuments: count,
          totalEmbeddings: count,
          storageType: 'ChromaDB Server',
          lastUpdated: new Date().toISOString(),
          embeddingModel: 'HuggingFace all-MiniLM-L6-v2 (384-dim)',
          dimensions: 384
        };
      } else {
        const stats = persistentStorage.getStats();
        return stats;
      }
    } catch (error) {
      console.error('❌ Failed to get stats:', error);
      const stats = persistentStorage.getStats();
      return {
        ...stats,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete a protocol by ID
  async deleteDocument(id: string): Promise<boolean> {
    await this.initialize();

    try {
      if (this.collection && !this.usePersistentStorage) {
        await this.collection.delete({
          ids: [id]
        });
      } else {
        await persistentStorage.deleteDocument(id);
      }
      
      console.log(`🗑️ Protocol deleted: ${id}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete protocol:', error);
      return false;
    }
  }

  // Update existing protocol
  async updateDocument(id: string, content: string, metadata: ProtocolMetadata): Promise<boolean> {
    await this.initialize();

    try {
      if (this.collection && !this.usePersistentStorage) {
        const embedding = await this.generateEmbedding(content);
        
        await this.collection.update({
          ids: [id],
          documents: [content],
          embeddings: [embedding],
          metadatas: [{
            ...metadata,
            id,
            lastUpdated: new Date().toISOString()
          }]
        });
      } else {
        await persistentStorage.updateDocument(id, content, metadata);
      }
      
      console.log(`🔄 Protocol updated: ${metadata.title}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update protocol:', error);
      return false;
    }
  }

  // Get document by ID
  async getDocument(id: string): Promise<SearchResult | null> {
    await this.initialize();

    try {
      if (this.collection && !this.usePersistentStorage) {
        const results = await this.collection.get({
          ids: [id],
          include: ['documents', 'metadatas']
        });

        if (!results.documents[0]) {
          return null;
        }

        return {
          content: results.documents[0] as string,
          metadata: results.metadatas[0] as ProtocolMetadata,
          relevanceScore: 1.0,
          source: (results.metadatas[0] as ProtocolMetadata).title || 'Unknown'
        };
      } else {
        return await persistentStorage.getDocument(id);
      }
    } catch (error) {
      console.error('❌ Failed to get document:', error);
      return null;
    }
  }
}

// Singleton instance for the entire application
export const medicalVectorDB = new MedicalVectorDB();
