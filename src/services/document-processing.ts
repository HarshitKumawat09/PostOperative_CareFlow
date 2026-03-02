// Document Processing Service for Medical Guidelines Ingestion
// Phase 2: Core pipeline for PDF/text processing and chunking

import { v4 as uuidv4 } from 'uuid';

import {
  MedicalDocumentType,
  MedicalEmbeddingMetadata,
  DocumentChunk,
  VectorDBConfig
} from '../models/vector-db';

import { SurgeryType, RiskLevel } from '../models/base';

// Document processing configuration
export interface ProcessingConfig {
  chunkSize: number;
  overlap: number;
  maxChunks: number;
  embeddingModel: string;
  cleaningOptions: {
    removePageNumbers: boolean;
    removeHeadersFooters: boolean;
    removeReferences: boolean;
    normalizeWhitespace: boolean;
  };
}

// Processing step interface
export interface ProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  details?: string;
  startTime?: Date;
  endTime?: Date;
}

// Processed document result
export interface ProcessedDocument {
  id: string;
  originalContent: string;
  cleanedContent: string;
  chunks: DocumentChunk[];
  metadata: MedicalEmbeddingMetadata;
  processingSteps: ProcessingStep[];
  processingTime: number;
  stats: {
    originalLength: number;
    cleanedLength: number;
    chunkCount: number;
    averageChunkLength: number;
  };
}

export class DocumentProcessingService {
  private config: ProcessingConfig;

  constructor(config?: Partial<ProcessingConfig>) {
    this.config = {
      chunkSize: 400,
      overlap: 50,
      maxChunks: 20,
      embeddingModel: 'text-embedding-ada-002',
      cleaningOptions: {
        removePageNumbers: true,
        removeHeadersFooters: true,
        removeReferences: true,
        normalizeWhitespace: true
      },
      ...config
    };
  }

  /**
   * Process medical document through complete pipeline
   */
  async processDocument(
    content: string,
    metadata: Partial<MedicalEmbeddingMetadata>,
    onProgress?: (step: ProcessingStep) => void
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    const documentId = uuidv4();
    
    const processingSteps: ProcessingStep[] = [
      { name: 'Text Cleaning', status: 'pending', progress: 0 },
      { name: 'Content Analysis', status: 'pending', progress: 0 },
      { name: 'Chunking', status: 'pending', progress: 0 },
      { name: 'Metadata Enrichment', status: 'pending', progress: 0 },
      { name: 'Validation', status: 'pending', progress: 0 }
    ];

    const updateStep = (stepName: string, status: ProcessingStep['status'], progress: number, details?: string) => {
      const stepIndex = processingSteps.findIndex(s => s.name === stepName);
      if (stepIndex !== -1) {
        const step = processingSteps[stepIndex];
        step.status = status;
        step.progress = progress;
        step.details = details;
        if (status === 'processing' && !step.startTime) {
          step.startTime = new Date();
        }
        if (status === 'completed' || status === 'error') {
          step.endTime = new Date();
        }
        onProgress?.(step);
      }
    };

    try {
      // Step 1: Text Cleaning
      updateStep('Text Cleaning', 'processing', 0, 'Cleaning and preprocessing text...');
      const cleanedContent = this.cleanText(content);
      updateStep('Text Cleaning', 'completed', 100, `Cleaned: ${cleanedContent.length} characters`);

      // Step 2: Content Analysis
      updateStep('Content Analysis', 'processing', 0, 'Analyzing document structure...');
      const analysis = this.analyzeContent(cleanedContent);
      updateStep('Content Analysis', 'completed', 100, 
        `Sections: ${analysis.sections.length}, Keywords: ${analysis.extractedKeywords.length}`);

      // Step 3: Chunking
      updateStep('Chunking', 'processing', 0, 'Creating semantic chunks...');
      const chunks = this.createChunks(cleanedContent, metadata);
      updateStep('Chunking', 'completed', 100, `Created ${chunks.length} chunks`);

      // Step 4: Metadata Enrichment
      updateStep('Metadata Enrichment', 'processing', 0, 'Enriching metadata...');
      const enrichedMetadata = this.enrichMetadata(metadata, analysis, chunks);
      updateStep('Metadata Enrichment', 'completed', 100, 'Metadata enriched successfully');

      // Step 5: Validation
      updateStep('Validation', 'processing', 0, 'Validating processed document...');
      const validation = this.validateProcessedDocument(chunks, enrichedMetadata);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      updateStep('Validation', 'completed', 100, '✅ All validations passed');

      const processingTime = Date.now() - startTime;

      return {
        id: documentId,
        originalContent: content,
        cleanedContent,
        chunks,
        metadata: enrichedMetadata,
        processingSteps,
        processingTime,
        stats: {
          originalLength: content.length,
          cleanedLength: cleanedContent.length,
          chunkCount: chunks.length,
          averageChunkLength: chunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / chunks.length
        }
      };

    } catch (error) {
      // Mark current step as error
      const currentStep = processingSteps.find(s => s.status === 'processing');
      if (currentStep) {
        updateStep(currentStep.name, 'error', currentStep.progress, 
          error instanceof Error ? error.message : 'Unknown error');
      }
      throw error;
    }
  }

  /**
   * Clean and preprocess text content
   */
  private cleanText(text: string): string {
    let cleaned = text;

    // Remove excessive whitespace
    if (this.config.cleaningOptions.normalizeWhitespace) {
      cleaned = cleaned
        .replace(/\s{2,}/g, ' ')     // Multiple spaces to single
        .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
        .replace(/\t+/g, ' ')       // Tabs to spaces
        .trim();
    }

    // Remove page numbers
    if (this.config.cleaningOptions.removePageNumbers) {
      cleaned = cleaned
        .replace(/^\d+\s*$/gm, '')                    // Standalone page numbers
        .replace(/^Page\s+\d+\s*$/gmi, '')           // "Page X" headers
        .replace(/^\d+\s+of\s+\d+\s*$/gmi, '')       // "X of Y" footers
        .replace(/\[\d+\]/g, '');                    // Citation numbers
    }

    // Remove headers and footers
    if (this.config.cleaningOptions.removeHeadersFooters) {
      cleaned = cleaned
        .replace(/^.{0,50}(\r?\n){1,2}$/gm, '')      // Short lines (likely headers/footers)
        .replace(/©\s*\d{4}\s.*$/gm, '');           // Copyright lines
    }

    // Remove references section
    if (this.config.cleaningOptions.removeReferences) {
      cleaned = cleaned
        .replace(/references?\s*:?[\s\S]*$/gmi, '')  // References section
        .replace(/bibliography\s*:?[\s\S]*$/gmi, '') // Bibliography section
        .replace(/\[\d+\][\s\S]*?(?=\[\d+\]|$)/g, ''); // Individual references
    }

    return cleaned;
  }

  /**
   * Analyze document content for structure and keywords
   */
  private analyzeContent(content: string) {
    const sections = this.extractSections(content);
    const extractedKeywords = this.extractKeywords(content);
    const medicalTerms = this.extractMedicalTerms(content);
    const riskIndicators = this.extractRiskIndicators(content);
    const recoveryTimeline = this.extractRecoveryTimeline(content);

    return {
      sections,
      extractedKeywords,
      medicalTerms,
      riskIndicators,
      recoveryTimeline
    };
  }

  /**
   * Extract document sections
   */
  private extractSections(content: string): Array<{ title: string; content: string; level: number }> {
    const sections: Array<{ title: string; content: string; level: number }> = [];
    const lines = content.split('\n');
    let currentSection = { title: 'Introduction', content: '', level: 1 };

    for (const line of lines) {
      // Detect headers (markdown style or numbered)
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/) || line.match(/^(\d+\.)\s+(.+)$/);
      if (headerMatch) {
        // Save previous section
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection });
        }
        
        // Start new section
        const level = headerMatch[1].startsWith('#') ? headerMatch[1].length : 1;
        currentSection = {
          title: headerMatch[2].trim(),
          content: '',
          level
        };
      } else {
        currentSection.content += line + '\n';
      }
    }

    // Add last section
    if (currentSection.content.trim()) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    const medicalKeywords = [
      'pain', 'medication', 'wound', 'infection', 'fever', 'swelling',
      'recovery', 'rehabilitation', 'exercise', 'mobility', 'physiotherapy',
      'complication', 'prevention', 'treatment', 'symptoms', 'diagnosis',
      'surgery', 'post-operative', 'care', 'guidelines', 'protocol',
      'assessment', 'monitoring', 'risk', 'safety', 'emergency'
    ];

    const words = content.toLowerCase().split(/\s+/);
    const keywordCounts: Record<string, number> = {};

    // Count keyword occurrences
    for (const word of words) {
      if (medicalKeywords.includes(word)) {
        keywordCounts[word] = (keywordCounts[word] || 0) + 1;
      }
    }

    // Sort by frequency and return top keywords
    return Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }

  /**
   * Extract medical terms
   */
  private extractMedicalTerms(content: string): string[] {
    const medicalTerms = [
      'analgesic', 'antibiotic', 'anti-inflammatory', 'thrombosis', 'embolism',
      'hematoma', 'seroma', 'dehiscence', 'necrosis', 'edema',
      'arthroplasty', 'osteotomy', 'arthrodesis', 'meniscectomy',
      'laminectomy', 'discectomy', 'spinal fusion', 'colectomy',
      'gastrectomy', 'cholecystectomy', 'hysterectomy', 'mastectomy'
    ];

    const found = medicalTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    );

    return found;
  }

  /**
   * Extract risk indicators
   */
  private extractRiskIndicators(content: string): Array<{ type: string; level: RiskLevel; context: string }> {
    const riskIndicators: Array<{ type: string; level: RiskLevel; context: string }> = [];
    
    const riskPatterns = [
      { pattern: /high risk|risk factor|complication/gi, level: RiskLevel.HIGH, type: 'General Risk' },
      { pattern: /moderate risk|moderate complication/gi, level: RiskLevel.MODERATE, type: 'Moderate Risk' },
      { pattern: /low risk|minimal risk/gi, level: RiskLevel.LOW, type: 'Low Risk' },
      { pattern: /infection|fever|temperature/gi, level: RiskLevel.HIGH, type: 'Infection Risk' },
      { pattern: /bleeding|hemorrhage|blood loss/gi, level: RiskLevel.HIGH, type: 'Bleeding Risk' },
      { pattern: /pain|severe pain|uncontrolled pain/gi, level: RiskLevel.MODERATE, type: 'Pain Risk' }
    ];

    for (const { pattern, level, type } of riskPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        // Extract context around each match
        for (const match of matches) {
          const index = content.toLowerCase().indexOf(match.toLowerCase());
          const start = Math.max(0, index - 50);
          const end = Math.min(content.length, index + match.length + 50);
          const context = content.substring(start, end).trim();
          
          riskIndicators.push({ type, level, context });
        }
      }
    }

    return riskIndicators;
  }

  /**
   * Extract recovery timeline
   */
  private extractRecoveryTimeline(content: string): Array<{ day: number; activity: string; description: string }> {
    const timeline: Array<{ day: number; activity: string; description: string }> = [];
    
    const timelinePatterns = [
      { pattern: /day\s+(\d+)(?:\s*-\s*\d+)?[:\s]*(.+)/gi, type: 'Daily Activity' },
      { pattern: /week\s+(\d+)(?:\s*-\s*\d+)?[:\s]*(.+)/gi, type: 'Weekly Activity' },
      { pattern: /post-op\s+day\s+(\d+)(?:\s*-\s*\d+)?[:\s]*(.+)/gi, type: 'Post-op Activity' },
      { pattern: /(\d+)\s*weeks?\s+(?:post\s+)?(?:surgery|op)[:\s]*(.+)/gi, type: 'Week Activity' }
    ];

    for (const { pattern, type } of timelinePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const dayOrWeek = parseInt(match[1]);
        const description = match[2].trim();
        
        // Convert weeks to days for consistency
        const day = type.includes('Week') ? dayOrWeek * 7 : dayOrWeek;
        
        timeline.push({
          day,
          activity: type,
          description
        });
      }
    }

    return timeline.sort((a, b) => a.day - b.day);
  }

  /**
   * Create document chunks with overlap
   */
  private createChunks(content: string, metadata: Partial<MedicalEmbeddingMetadata>): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const words = content.split(/\s+/);
    
    for (let i = 0; i < words.length; i += this.config.chunkSize - this.config.overlap) {
      if (chunks.length >= this.config.maxChunks) break;
      
      const chunkWords = words.slice(i, i + this.config.chunkSize);
      const chunkContent = chunkWords.join(' ');
      
      // Skip very short chunks
      if (chunkContent.length < 50) continue;
      
      const chunk: DocumentChunk = {
        id: uuidv4(),
        content: chunkContent,
        metadata: {
          id: uuidv4(),
          title: `${metadata.title || 'Document'} - Chunk ${chunks.length + 1}`,
          documentType: metadata.documentType || MedicalDocumentType.CLINICAL_GUIDELINE,
          surgeryTypes: metadata.surgeryTypes || [],
          keywords: metadata.keywords || [],
          source: metadata.source || 'Unknown',
          author: metadata.author,
          lastUpdated: new Date(),
          evidenceLevel: metadata.evidenceLevel || 'moderate',
          language: metadata.language || 'en',
          specialty: metadata.specialty || 'General Surgery',
          riskLevel: metadata.riskLevel,
          recoveryDays: metadata.recoveryDays
        }
      };
      
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Enrich metadata with analysis results
   */
  private enrichMetadata(
    baseMetadata: Partial<MedicalEmbeddingMetadata>,
    analysis: any,
    chunks: DocumentChunk[]
  ): MedicalEmbeddingMetadata {
    // Combine base keywords with extracted keywords
    const allKeywords = [
      ...(baseMetadata.keywords || []),
      ...analysis.extractedKeywords,
      ...analysis.medicalTerms
    ].filter((keyword, index, arr) => arr.indexOf(keyword) === index); // Remove duplicates

    // Determine risk level from risk indicators
    let riskLevel = baseMetadata.riskLevel || RiskLevel.LOW;
    if (analysis.riskIndicators.some((r: any) => r.level === RiskLevel.HIGH)) {
      riskLevel = RiskLevel.HIGH;
    } else if (analysis.riskIndicators.some((r: any) => r.level === RiskLevel.MODERATE)) {
      riskLevel = RiskLevel.MODERATE;
    }

    // Extract recovery days from timeline
    const recoveryDays = analysis.recoveryTimeline.map((t: any) => t.day);

    return {
      id: baseMetadata.id || uuidv4(),
      title: baseMetadata.title || 'Medical Document',
      documentType: baseMetadata.documentType || MedicalDocumentType.CLINICAL_GUIDELINE,
      surgeryTypes: baseMetadata.surgeryTypes || [],
      riskLevel,
      recoveryDays,
      keywords: allKeywords,
      source: baseMetadata.source || 'Unknown',
      author: baseMetadata.author,
      lastUpdated: new Date(),
      evidenceLevel: baseMetadata.evidenceLevel || 'moderate',
      language: baseMetadata.language || 'en',
      specialty: baseMetadata.specialty || 'General Surgery'
    };
  }

  /**
   * Validate processed document
   */
  private validateProcessedDocument(
    chunks: DocumentChunk[],
    metadata: MedicalEmbeddingMetadata
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate chunks
    if (chunks.length === 0) {
      errors.push('No chunks created');
    }

    if (chunks.length > this.config.maxChunks) {
      warnings.push(`Too many chunks (${chunks.length} > ${this.config.maxChunks})`);
    }

    // Validate chunk content
    for (const chunk of chunks) {
      if (chunk.content.length < 50) {
        warnings.push(`Chunk ${chunk.id} is very short (${chunk.content.length} chars)`);
      }
      if (chunk.content.length > 2000) {
        warnings.push(`Chunk ${chunk.id} is very long (${chunk.content.length} chars)`);
      }
    }

    // Validate metadata
    if (!metadata.title) {
      errors.push('Missing document title');
    }

    if (!metadata.source) {
      warnings.push('Missing document source');
    }

    if (metadata.surgeryTypes.length === 0) {
      warnings.push('No surgery types specified');
    }

    if (metadata.keywords.length === 0) {
      warnings.push('No keywords specified');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get processing configuration
   */
  getConfig(): ProcessingConfig {
    return { ...this.config };
  }

  /**
   * Update processing configuration
   */
  updateConfig(newConfig: Partial<ProcessingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}
