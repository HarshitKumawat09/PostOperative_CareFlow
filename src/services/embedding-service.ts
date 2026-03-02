// Embedding Service for Medical Guidelines
// Phase 2: Vector embedding generation and storage

import { GoogleGenerativeAI } from '@google/generative-ai';

import {
  DocumentChunk,
  VectorSearchResult,
  VectorDBConfig,
  MedicalEmbeddingMetadata
} from '../models/vector-db';

// Embedding configuration
export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
}

// Embedding result
export interface EmbeddingResult {
  id: string;
  embedding: number[];
  metadata: MedicalEmbeddingMetadata;
  processingTime: number;
  success: boolean;
  error?: string;
}

// Batch embedding result
export interface BatchEmbeddingResult {
  results: EmbeddingResult[];
  totalProcessed: number;
  successful: number;
  failed: number;
  totalTime: number;
  errors: string[];
}

export class EmbeddingService {
  private genAI: GoogleGenerativeAI | null = null;
  private config: EmbeddingConfig;

  constructor(config?: Partial<EmbeddingConfig>) {
    this.config = {
      model: 'text-embedding-ada-002',
      dimensions: 1536,
      batchSize: 10,
      maxRetries: 3,
      retryDelay: 1000,
      ...config
    };

    // Initialize Gemini AI for embeddings
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(geminiApiKey);
    } else {
      console.warn('⚠️ Gemini API key not configured. Embedding features will be limited.');
    }
  }

  /**
   * Generate embedding for a single document chunk
   */
  async generateEmbedding(chunk: DocumentChunk): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.genAI) {
        throw new Error('Gemini AI not initialized. Check API key configuration.');
      }

      const embedding = await this.generateEmbeddingWithRetry(chunk.content);
      
      return {
        id: chunk.id,
        embedding,
        metadata: chunk.metadata,
        processingTime: Date.now() - startTime,
        success: true
      };

    } catch (error) {
      return {
        id: chunk.id,
        embedding: [],
        metadata: chunk.metadata,
        processingTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate embeddings for multiple document chunks (batch processing)
   */
  async generateBatchEmbeddings(
    chunks: DocumentChunk[],
    onProgress?: (processed: number, total: number) => void
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    const results: EmbeddingResult[] = [];
    const errors: string[] = [];
    
    let successful = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < chunks.length; i += this.config.batchSize) {
      const batch = chunks.slice(i, i + this.config.batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(chunk => this.generateEmbedding(chunk));
      const batchResults = await Promise.all(batchPromises);
      
      // Collect results
      for (const result of batchResults) {
        results.push(result);
        if (result.success) {
          successful++;
        } else {
          failed++;
          errors.push(`Chunk ${result.id}: ${result.error}`);
        }
      }

      // Report progress
      onProgress?.(i + batch.length, chunks.length);
      
      // Small delay between batches to avoid rate limiting
      if (i + this.config.batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      results,
      totalProcessed: chunks.length,
      successful,
      failed,
      totalTime: Date.now() - startTime,
      errors
    };
  }

  /**
   * Generate embedding with retry logic
   */
  private async generateEmbeddingWithRetry(text: string): Promise<number[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // For now, create a mock embedding since Gemini doesn't have a direct embedding API
        // In production, you would use OpenAI embeddings or a dedicated embedding service
        const embedding = await this.createMockEmbedding(text);
        return embedding;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.maxRetries) {
          console.warn(`Embedding generation attempt ${attempt} failed, retrying...`, error);
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }

    throw lastError || new Error('Failed to generate embedding after all retries');
  }

  /**
   * Create mock embedding (for development/testing)
   * In production, replace this with actual embedding API call
   */
  private async createMockEmbedding(text: string): Promise<number[]> {
    // Create a deterministic mock embedding based on text content
    const embedding: number[] = [];
    const seed = this.hashCode(text);
    
    for (let i = 0; i < this.config.dimensions; i++) {
      // Generate pseudo-random but deterministic values
      const value = Math.sin(seed + i) * 0.5 + 0.5;
      embedding.push(value);
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Simple hash function for deterministic mock embeddings
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimensions');
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      magnitude1 += embedding1[i] * embedding1[i];
      magnitude2 += embedding2[i] * embedding2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Search for similar embeddings
   */
  async searchSimilarEmbeddings(
    queryEmbedding: number[],
    candidateEmbeddings: Array<{ id: string; embedding: number[]; metadata: MedicalEmbeddingMetadata }>,
    limit: number = 10,
    minSimilarity: number = 0.1
  ): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];

    for (const candidate of candidateEmbeddings) {
      const similarity = this.calculateSimilarity(queryEmbedding, candidate.embedding);
      
      if (similarity >= minSimilarity) {
        results.push({
          id: candidate.id,
          content: '', // Content would need to be stored separately
          metadata: candidate.metadata,
          score: similarity,
          distance: 1 - similarity
        });
      }
    }

    // Sort by similarity (descending) and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Validate embedding dimensions
   */
  validateEmbedding(embedding: number[]): boolean {
    return embedding.length === this.config.dimensions &&
           embedding.every(val => typeof val === 'number' && !isNaN(val));
  }

  /**
   * Get embedding statistics
   */
  getEmbeddingStats(embeddings: number[][]): {
    dimensions: number;
    count: number;
    averageMagnitude: number;
    dimensionRanges: Array<{ min: number; max: number; mean: number }>;
  } {
    if (embeddings.length === 0) {
      return {
        dimensions: this.config.dimensions,
        count: 0,
        averageMagnitude: 0,
        dimensionRanges: []
      };
    }

    const magnitudes = embeddings.map(embedding => 
      Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    );

    const averageMagnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;

    // Calculate statistics for each dimension
    const dimensionRanges: Array<{ min: number; max: number; mean: number }> = [];
    
    for (let dim = 0; dim < this.config.dimensions; dim++) {
      const values = embeddings.map(embedding => embedding[dim]);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      dimensionRanges.push({ min, max, mean });
    }

    return {
      dimensions: this.config.dimensions,
      count: embeddings.length,
      averageMagnitude,
      dimensionRanges
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<EmbeddingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.genAI !== null;
  }

  /**
   * Get service status
   */
  getStatus(): {
    ready: boolean;
    model: string;
    dimensions: number;
    apiKeyConfigured: boolean;
  } {
    return {
      ready: this.isReady(),
      model: this.config.model,
      dimensions: this.config.dimensions,
      apiKeyConfigured: this.genAI !== null
    };
  }
}
