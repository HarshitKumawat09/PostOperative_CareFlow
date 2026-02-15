// Simple Vector Database Service for Server-Side Only
// Avoids ChromaDB import issues by using a simple in-memory store

import { MedicalDocumentType } from '../models/vector-db';
import { SurgeryType, RiskLevel } from '../models/base';

interface SimpleDocument {
  id: string;
  content: string;
  metadata: {
    title: string;
    source: string;
    documentType: MedicalDocumentType;
    surgeryTypes: SurgeryType[];
    riskLevel: RiskLevel;
    keywords: string[];
    lastUpdated: Date;
    evidenceLevel: 'low' | 'moderate' | 'high' | 'expert_opinion';
    language: string;
    specialty: string;
  };
  embedding?: number[];
}

interface SearchResult {
  content: string;
  score: number;
  metadata: any;
}

// Simple in-memory vector database
class SimpleVectorDatabase {
  private documents: SimpleDocument[] = [];
  private nextId = 1;

  // Add document (simulates embedding generation)
  async addDocument(content: string, metadata: any): Promise<string> {
    const id = `doc-${this.nextId++}`;
    
    // Simulate embedding generation (in real app, this would call OpenAI)
    const embedding = this.generateMockEmbedding(content);
    
    const document: SimpleDocument = {
      id,
      content,
      metadata: {
        id,
        title: metadata.title,
        source: metadata.source,
        documentType: metadata.documentType,
        surgeryTypes: metadata.surgeryTypes,
        riskLevel: metadata.riskLevel,
        keywords: metadata.keywords,
        lastUpdated: new Date(),
        evidenceLevel: 'moderate',
        language: 'en',
        specialty: 'general'
      },
      embedding
    };
    
    this.documents.push(document);
    console.log(`✅ Document added: ${metadata.title} (${content.length} chars)`);
    
    return id;
  }

  // Search documents (simulates vector similarity search)
  async searchDocuments(query: string, limit: number = 5): Promise<SearchResult[]> {
    console.log(`🔍 Searching for: "${query}"`);
    
    // Simple keyword matching (in real app, this would be vector similarity)
    const queryWords = query.toLowerCase().split(' ');
    
    const results = this.documents
      .map(doc => {
        const contentWords = doc.content.toLowerCase().split(' ');
        const titleWords = doc.metadata.title.toLowerCase().split(' ');
        const keywords = doc.metadata.keywords.map(k => k.toLowerCase());
        
        // Calculate simple relevance score
        let score = 0;
        queryWords.forEach(queryWord => {
          if (contentWords.some(word => word.includes(queryWord))) score += 0.3;
          if (titleWords.some(word => word.includes(queryWord))) score += 0.5;
          if (keywords.some(keyword => keyword.includes(queryWord))) score += 0.2;
        });
        
        return {
          content: doc.content.substring(0, 300) + '...', // Truncate for display
          score: Math.min(score / queryWords.length, 1), // Normalize to 0-1
          metadata: doc.metadata
        };
      })
      .filter(result => result.score > 0.1) // Filter out irrelevant results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    console.log(`📊 Found ${results.length} results`);
    return results;
  }

  // Get database statistics
  getStats() {
    return {
      totalDocuments: this.documents.length,
      totalEmbeddings: this.documents.length,
      documentTypes: this.getDocumentTypeStats(),
      surgeryTypes: this.getSurgeryTypeStats(),
      lastUpdated: new Date()
    };
  }

  // Generate mock embedding (simulates OpenAI embedding)
  private generateMockEmbedding(text: string): number[] {
    // Simple hash-based embedding (in real app, this would be OpenAI API call)
    const embedding = new Array(1536).fill(0);
    for (let i = 0; i < text.length; i++) {
      embedding[i % 1536] = text.charCodeAt(i) / 255;
    }
    return embedding;
  }

  private getDocumentTypeStats() {
    const stats: Record<string, number> = {};
    this.documents.forEach(doc => {
      const type = doc.metadata.documentType;
      stats[type] = (stats[type] || 0) + 1;
    });
    return stats as any;
  }

  private getSurgeryTypeStats() {
    const stats: Record<string, number> = {};
    this.documents.forEach(doc => {
      doc.metadata.surgeryTypes.forEach(surgery => {
        stats[surgery] = (stats[surgery] || 0) + 1;
      });
    });
    return stats as any;
  }
}

// Export singleton instance
export const SimpleVectorDB = new SimpleVectorDatabase();
