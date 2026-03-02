// 🚀 Hugging Face Local Embeddings - 100% Free
// Model: all-MiniLM-L6-v2 (384 dimensions, fast, production-ready)

import { pipeline } from '@xenova/transformers';

export class HuggingFaceEmbeddings {
  private static instance: HuggingFaceEmbeddings;
  private extractor: any = null;
  private initialized = false;

  private constructor() {}

  static getInstance(): HuggingFaceEmbeddings {
    if (!HuggingFaceEmbeddings.instance) {
      HuggingFaceEmbeddings.instance = new HuggingFaceEmbeddings();
    }
    return HuggingFaceEmbeddings.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🤖 Initializing Hugging Face embeddings (all-MiniLM-L6-v2)...');
      
      // Initialize the feature extraction pipeline
      this.extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );

      this.initialized = true;
      console.log('✅ Hugging Face embeddings initialized successfully!');
      console.log('📊 Model: all-MiniLM-L6-v2 (384 dimensions)');
      console.log('💰 Cost: 100% FREE');
      console.log('⚡ Speed: ~50-200ms per embedding');
    } catch (error) {
      console.error('❌ Failed to initialize Hugging Face embeddings:', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    await this.initialize();

    if (!this.extractor) {
      throw new Error('Hugging Face embeddings not initialized');
    }

    try {
      // Generate embedding with pooling and normalization
      const output = await this.extractor(text, {
        pooling: 'mean',
        normalize: true
      });

      // Convert to array and ensure 384 dimensions
      const embedding = Array.from(output.data) as number[];
      
      if (embedding.length !== 384) {
        console.warn(`⚠️ Expected 384 dimensions, got ${embedding.length}`);
      }

      return embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw error;
    }
  }

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    await this.initialize();

    const embeddings: number[][] = [];
    
    for (const text of texts) {
      try {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      } catch (error) {
        console.error(`❌ Failed to embed text: ${text.substring(0, 50)}...`);
        // Add zero embedding as fallback
        embeddings.push(new Array(384).fill(0));
      }
    }

    return embeddings;
  }

  getDimensions(): number {
    return 384; // all-MiniLM-L6-v2 produces 384-dimensional embeddings
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Performance metrics
  async benchmark(text: string): Promise<{ time: number; dimensions: number }> {
    const start = Date.now();
    const embedding = await this.generateEmbedding(text);
    const time = Date.now() - start;
    
    return {
      time,
      dimensions: embedding.length
    };
  }
}

// Export singleton instance
export const huggingFaceEmbeddings = HuggingFaceEmbeddings.getInstance();
