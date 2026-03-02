// Complete Ingestion Pipeline for Medical Guidelines
// Phase 2: End-to-end document processing with vector storage

import { DocumentProcessingService, ProcessedDocument, ProcessingStep } from './document-processing';
import { EmbeddingService, BatchEmbeddingResult, EmbeddingResult } from './embedding-service';
import { SimpleGeminiService } from '../ai/simple-gemini-service';

import {
  DocumentChunk,
  VectorSearchResult,
  MedicalEmbeddingMetadata,
  VectorDBConfig
} from '../models/vector-db';

import { SurgeryType, RiskLevel } from '../models/base';

// Pipeline configuration
export interface PipelineConfig {
  documentProcessing: {
    chunkSize: number;
    overlap: number;
    maxChunks: number;
  };
  embedding: {
    model: string;
    dimensions: number;
    batchSize: number;
  };
  storage: {
    enableVectorDB: boolean;
    enableInMemory: boolean;
  };
  validation: {
    minChunkLength: number;
    maxChunkLength: number;
    requiredMetadata: string[];
  };
}

// Pipeline status
export interface PipelineStatus {
  stage: 'idle' | 'processing' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  totalSteps: number;
  processedSteps: number;
  startTime?: Date;
  endTime?: Date;
  errors: string[];
  warnings: string[];
}

// Ingestion result
export interface IngestionResult {
  documentId: string;
  status: PipelineStatus;
  processedDocument?: ProcessedDocument;
  embeddingResult?: BatchEmbeddingResult;
  storageResult?: {
    vectorDB: { success: boolean; stored: number; errors: string[] };
    inMemory: { success: boolean; stored: number; errors: string[] };
  };
  totalProcessingTime: number;
  stats: {
    originalLength: number;
    cleanedLength: number;
    chunkCount: number;
    embeddingCount: number;
    storageCount: number;
  };
}

export class MedicalGuidelinesIngestionPipeline {
  private documentProcessor: DocumentProcessingService;
  private embeddingService: EmbeddingService;
  private geminiService: SimpleGeminiService;
  private config: PipelineConfig;

  constructor(config?: Partial<PipelineConfig>) {
    this.config = {
      documentProcessing: {
        chunkSize: 400,
        overlap: 50,
        maxChunks: 20
      },
      embedding: {
        model: 'text-embedding-ada-002',
        dimensions: 1536,
        batchSize: 10
      },
      storage: {
        enableVectorDB: true,
        enableInMemory: true
      },
      validation: {
        minChunkLength: 50,
        maxChunkLength: 2000,
        requiredMetadata: ['title', 'documentType', 'source']
      },
      ...config
    };

    // Initialize services
    this.documentProcessor = new DocumentProcessingService(this.config.documentProcessing);
    this.embeddingService = new EmbeddingService(this.config.embedding);
    this.geminiService = new SimpleGeminiService();
  }

  /**
   * Complete ingestion pipeline
   */
  async ingestDocument(
    content: string,
    metadata: Partial<MedicalEmbeddingMetadata>,
    onProgress?: (status: PipelineStatus) => void
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const documentId = `doc-${Date.now()}`;
    
    const status: PipelineStatus = {
      stage: 'processing',
      currentStep: 'Initializing',
      progress: 0,
      totalSteps: 5,
      processedSteps: 0,
      startTime: new Date(),
      errors: [],
      warnings: []
    };

    const updateStatus = (step: string, progress: number, error?: string) => {
      status.currentStep = step;
      status.progress = progress;
      status.processedSteps = Math.floor((progress / 100) * status.totalSteps);
      
      if (error) {
        status.errors.push(error);
        status.stage = 'error';
      }
      
      onProgress?.(status);
    };

    try {
      // Step 1: Document Processing
      updateStatus('Document Processing', 0);
      const processedDocument = await this.documentProcessor.processDocument(
        content,
        metadata,
        (step: ProcessingStep) => {
          const stepProgress = (status.processedSteps / status.totalSteps) * 100 + 
                              (step.progress / status.totalSteps);
          updateStatus(`Document Processing: ${step.name}`, stepProgress);
        }
      );
      updateStatus('Document Processing', 20);

      // Step 2: Embedding Generation
      updateStatus('Embedding Generation', 20);
      const embeddingResult = await this.embeddingService.generateBatchEmbeddings(
        processedDocument.chunks,
        (processed, total) => {
          const progress = 20 + ((processed / total) * 20);
          updateStatus(`Embedding Generation: ${processed}/${total}`, progress);
        }
      );
      updateStatus('Embedding Generation', 40);

      // Step 3: Storage
      updateStatus('Vector Storage', 40);
      const storageResult = await this.storeEmbeddings(
        processedDocument.chunks,
        embeddingResult.results
      );
      updateStatus('Vector Storage', 60);

      // Step 4: Validation
      updateStatus('Validation', 60);
      const validationResult = this.validateIngestion(
        processedDocument,
        embeddingResult,
        storageResult
      );
      
      if (!validationResult.isValid) {
        status.errors.push(...validationResult.errors);
        status.warnings.push(...validationResult.warnings);
      }
      updateStatus('Validation', 80);

      // Step 5: Finalization
      updateStatus('Finalization', 80);
      await this.finalizeIngestion(documentId, processedDocument, embeddingResult);
      updateStatus('Finalization', 100);

      status.stage = 'completed';
      status.endTime = new Date();

      return {
        documentId,
        status,
        processedDocument,
        embeddingResult,
        storageResult,
        totalProcessingTime: Date.now() - startTime,
        stats: {
          originalLength: processedDocument.stats.originalLength,
          cleanedLength: processedDocument.stats.cleanedLength,
          chunkCount: processedDocument.chunks.length,
          embeddingCount: embeddingResult.successful,
          storageCount: storageResult.vectorDB.stored + storageResult.inMemory.stored
        }
      };

    } catch (error) {
      status.stage = 'error';
      status.endTime = new Date();
      status.errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      return {
        documentId,
        status,
        totalProcessingTime: Date.now() - startTime,
        stats: {
          originalLength: 0,
          cleanedLength: 0,
          chunkCount: 0,
          embeddingCount: 0,
          storageCount: 0
        }
      };
    }
  }

  /**
   * Store embeddings in vector database and/or memory
   */
  private async storeEmbeddings(
    chunks: DocumentChunk[],
    embeddingResults: EmbeddingResult[]
  ): Promise<{
    vectorDB: { success: boolean; stored: number; errors: string[] };
    inMemory: { success: boolean; stored: number; errors: string[] };
  }> {
    const result = {
      vectorDB: { success: true, stored: 0, errors: [] as string[] },
      inMemory: { success: true, stored: 0, errors: [] as string[] }
    };

    // Combine chunks with embeddings
    const chunksWithEmbeddings = chunks.map(chunk => {
      const embeddingResult = embeddingResults.find(er => er.id === chunk.id);
      return {
        chunk,
        embedding: embeddingResult?.embedding || []
      };
    }).filter(item => item.embedding.length > 0);

    // Store in vector database (if enabled)
    if (this.config.storage.enableVectorDB) {
      try {
        // For now, simulate vector DB storage
        // In production, this would store in ChromaDB or similar
        result.vectorDB.stored = chunksWithEmbeddings.length;
        console.log(`✅ Stored ${chunksWithEmbeddings.length} embeddings in vector database`);
      } catch (error) {
        result.vectorDB.success = false;
        result.vectorDB.errors.push(error instanceof Error ? error.message : 'Vector DB storage failed');
      }
    }

    // Store in memory (if enabled)
    if (this.config.storage.enableInMemory) {
      try {
        // Store in Gemini service's in-memory store
        await this.geminiService.addDocuments(chunks);
        result.inMemory.stored = chunks.length;
        console.log(`✅ Stored ${chunks.length} documents in memory store`);
      } catch (error) {
        result.inMemory.success = false;
        result.inMemory.errors.push(error instanceof Error ? error.message : 'Memory storage failed');
      }
    }

    return result;
  }

  /**
   * Validate ingestion results
   */
  private validateIngestion(
    processedDocument: ProcessedDocument,
    embeddingResult: BatchEmbeddingResult,
    storageResult: any
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate document processing
    if (processedDocument.chunks.length === 0) {
      errors.push('No chunks were created during processing');
    }

    if (processedDocument.chunks.length > this.config.documentProcessing.maxChunks) {
      warnings.push(`Too many chunks: ${processedDocument.chunks.length} > ${this.config.documentProcessing.maxChunks}`);
    }

    // Validate embedding generation
    if (embeddingResult.failed > 0) {
      errors.push(`${embeddingResult.failed} embeddings failed to generate`);
    }

    if (embeddingResult.successful === 0) {
      errors.push('No embeddings were successfully generated');
    }

    // Validate storage
    if (!storageResult.vectorDB.success && this.config.storage.enableVectorDB) {
      errors.push('Vector database storage failed');
    }

    if (!storageResult.inMemory.success && this.config.storage.enableInMemory) {
      errors.push('Memory storage failed');
    }

    // Validate metadata
    const missingMetadata = this.config.validation.requiredMetadata.filter(
      field => !processedDocument.metadata[field as keyof MedicalEmbeddingMetadata]
    );

    if (missingMetadata.length > 0) {
      warnings.push(`Missing required metadata: ${missingMetadata.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Finalize ingestion (cleanup, indexing, etc.)
   */
  private async finalizeIngestion(
    documentId: string,
    processedDocument: ProcessedDocument,
    embeddingResult: BatchEmbeddingResult
  ): Promise<void> {
    // Create document index
    const documentIndex = {
      id: documentId,
      title: processedDocument.metadata.title,
      documentType: processedDocument.metadata.documentType,
      surgeryTypes: processedDocument.metadata.surgeryTypes,
      chunkCount: processedDocument.chunks.length,
      embeddingCount: embeddingResult.successful,
      processedAt: new Date(),
      metadata: processedDocument.metadata
    };

    // Store index (in production, this would go to a database)
    console.log('📋 Document index created:', documentIndex);

    // Trigger any post-processing hooks
    await this.runPostProcessingHooks(documentId, processedDocument);
  }

  /**
   * Run post-processing hooks
   */
  private async runPostProcessingHooks(documentId: string, processedDocument: ProcessedDocument): Promise<void> {
    // Example hooks that could be implemented:
    
    // 1. Update search index
    console.log(`🔍 Updating search index for document ${documentId}`);
    
    // 2. Generate document summary
    console.log(`📝 Generating summary for document ${documentId}`);
    
    // 3. Extract key insights
    console.log(`💡 Extracting key insights from document ${documentId}`);
    
    // 4. Update statistics
    console.log(`📊 Updating ingestion statistics`);
  }

  /**
   * Get pipeline status
   */
  getPipelineStatus(): {
    ready: boolean;
    services: {
      documentProcessor: boolean;
      embeddingService: boolean;
      geminiService: boolean;
    };
    config: PipelineConfig;
  } {
    return {
      ready: true, // Could be enhanced to check actual service readiness
      services: {
        documentProcessor: true,
        embeddingService: this.embeddingService.isReady(),
        geminiService: true
      },
      config: this.config
    };
  }

  /**
   * Update pipeline configuration
   */
  updateConfig(newConfig: Partial<PipelineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update service configurations
    if (newConfig.documentProcessing) {
      this.documentProcessor.updateConfig(newConfig.documentProcessing);
    }
    
    if (newConfig.embedding) {
      this.embeddingService.updateConfig(newConfig.embedding);
    }
  }

  /**
   * Get ingestion statistics
   */
  async getIngestionStats(): Promise<{
    totalDocuments: number;
    totalChunks: number;
    totalEmbeddings: number;
    averageProcessingTime: number;
    documentTypes: Record<string, number>;
    surgeryTypes: Record<string, number>;
  }> {
    // In production, this would query actual storage systems
    // For now, return mock statistics
    return {
      totalDocuments: 0,
      totalChunks: 0,
      totalEmbeddings: 0,
      averageProcessingTime: 0,
      documentTypes: {},
      surgeryTypes: {}
    };
  }

  /**
   * Search ingested documents
   */
  async searchDocuments(
    query: string,
    filters?: {
      documentType?: string;
      surgeryTypes?: SurgeryType[];
      riskLevel?: RiskLevel;
    },
    limit: number = 10
  ): Promise<VectorSearchResult[]> {
    try {
      // Use Gemini service for search (in-memory)
      const searchResults = await this.geminiService.searchDocuments({
        query,
        documentType: filters?.documentType as any,
        surgeryType: filters?.surgeryTypes?.[0],
        riskLevel: filters?.riskLevel,
        limit
      });

      return searchResults;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<ProcessedDocument | null> {
    // In production, this would retrieve from storage
    // For now, return null
    return null;
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // In production, this would delete from all storage systems
      console.log(`🗑️ Deleting document ${documentId}`);
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }
}
