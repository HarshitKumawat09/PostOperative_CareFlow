// 💾 PERSISTENT FILE STORAGE FOR MEDICAL DOCUMENTS
// Fallback when ChromaDB server is not available

import { ProtocolMetadata, SearchResult } from './medical-vector-db';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface StoredDocument {
  id: string;
  content: string;
  metadata: ProtocolMetadata;
  createdAt: string;
  updatedAt: string;
}

export class PersistentStorage {
  private storagePath: string;
  private documents: Map<string, StoredDocument> = new Map();

  constructor() {
    // Store in a data directory in the project root
    this.storagePath = join(process.cwd(), 'data', 'medical-documents');
    
    // Ensure directory exists
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
    
    this.loadDocuments();
    console.log(`💾 Persistent storage initialized at: ${this.storagePath}`);
  }

  private getDocumentPath(id: string): string {
    return join(this.storagePath, `${id}.json`);
  }

  private loadDocuments(): void {
    try {
      const files = require('fs').readdirSync(this.storagePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const id = file.replace('.json', '');
          const filePath = this.getDocumentPath(id);
          
          try {
            const data = readFileSync(filePath, 'utf-8');
            const document: StoredDocument = JSON.parse(data);
            this.documents.set(id, document);
          } catch (error) {
            console.error(`❌ Failed to load document ${file}:`, error);
          }
        }
      }
      
      console.log(`💾 Loaded ${this.documents.size} documents from persistent storage`);
    } catch (error) {
      console.error('❌ Failed to load documents:', error);
    }
  }

  async addDocument(id: string, content: string, metadata: ProtocolMetadata): Promise<void> {
    const document: StoredDocument = {
      id,
      content,
      metadata: { ...metadata, id },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in memory
    this.documents.set(id, document);

    // Persist to file
    try {
      const filePath = this.getDocumentPath(id);
      writeFileSync(filePath, JSON.stringify(document, null, 2));
      console.log(`💾 Document persisted: ${id} (${content.length} chars)`);
    } catch (error) {
      console.error(`❌ Failed to persist document ${id}:`, error);
    }
  }

  async getAllDocuments(): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const [id, doc] of this.documents.entries()) {
      results.push({
        content: doc.content,
        metadata: doc.metadata,
        relevanceScore: 1.0,
        source: doc.metadata.title || 'Unknown Protocol'
      });
    }

    return results;
  }

  async getDocument(id: string): Promise<SearchResult | null> {
    const doc = this.documents.get(id);
    if (!doc) return null;

    return {
      content: doc.content,
      metadata: doc.metadata,
      relevanceScore: 1.0,
      source: doc.metadata.title || 'Unknown Protocol'
    };
  }

  async updateDocument(id: string, content: string, metadata: ProtocolMetadata): Promise<boolean> {
    const existingDoc = this.documents.get(id);
    if (!existingDoc) return false;

    const updatedDoc: StoredDocument = {
      ...existingDoc,
      content,
      metadata: { ...metadata, id },
      updatedAt: new Date().toISOString()
    };

    this.documents.set(id, updatedDoc);

    try {
      const filePath = this.getDocumentPath(id);
      writeFileSync(filePath, JSON.stringify(updatedDoc, null, 2));
      console.log(`💾 Document updated: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update document ${id}:`, error);
      return false;
    }
  }

  async deleteDocument(id: string): Promise<boolean> {
    const doc = this.documents.get(id);
    if (!doc) return false;

    // Remove from memory
    this.documents.delete(id);

    // Remove from file system
    try {
      const filePath = this.getDocumentPath(id);
      if (existsSync(filePath)) {
        require('fs').unlinkSync(filePath);
      }
      console.log(`💾 Document deleted: ${id}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete document ${id}:`, error);
      return false;
    }
  }

  async searchDocuments(query: string, topK: number = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const queryWords = query.toLowerCase().split(' ');

    for (const [id, doc] of this.documents.entries()) {
      const content = doc.content.toLowerCase();
      const title = doc.metadata.title.toLowerCase();
      
      let score = 0;
      queryWords.forEach(word => {
        if (content.includes(word)) score += 0.3;
        if (title.includes(word)) score += 0.5;
      });

      if (score > 0) {
        results.push({
          content: doc.content.substring(0, 300) + '...',
          metadata: doc.metadata,
          relevanceScore: Math.min(score / queryWords.length, 1),
          source: doc.metadata.title
        });
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);
  }

  getStats(): any {
    return {
      totalDocuments: this.documents.size,
      totalEmbeddings: this.documents.size,
      storageType: 'Persistent File Storage',
      lastUpdated: new Date().toISOString(),
      embeddingModel: 'N/A (File-based storage)',
      dimensions: 0,
      storagePath: this.storagePath
    };
  }
}

// Singleton instance
export const persistentStorage = new PersistentStorage();
