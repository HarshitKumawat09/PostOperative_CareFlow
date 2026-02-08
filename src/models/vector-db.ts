// Vector Database Schema and Interfaces for CareFlow Medical System
// This file defines the data structures for ChromaDB integration

import { SurgeryType, RiskLevel } from './base';

// Medical document types for vector storage
export enum MedicalDocumentType {
  CLINICAL_GUIDELINE = 'clinical_guideline',
  POST_OPERATIVE_PROTOCOL = 'post_operative_protocol',
  PAIN_MANAGEMENT = 'pain_management',
  WOUND_CARE = 'wound_care',
  COMPLICATION_GUIDELINE = 'complication_guideline',
  MEDICATION_GUIDELINE = 'medication_guideline',
  RECOVERY_MILESTONE = 'recovery_milestone',
  EMERGENCY_PROTOCOL = 'emergency_protocol'
}

// Embedding metadata structure
export interface MedicalEmbeddingMetadata {
  id: string;
  title: string;
  documentType: MedicalDocumentType;
  surgeryTypes: SurgeryType[];
  riskLevel?: RiskLevel;
  recoveryDays?: number[];
  keywords: string[];
  source: string;
  author?: string;
  lastUpdated: Date;
  evidenceLevel: 'low' | 'moderate' | 'high' | 'expert_opinion';
  language: string;
  specialty: string;
}

// Vector search query parameters
export interface VectorSearchQuery {
  query: string;
  surgeryType?: SurgeryType;
  documentType?: MedicalDocumentType;
  riskLevel?: RiskLevel;
  recoveryDay?: number;
  limit?: number;
  minScore?: number;
}

// Vector search result
export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: MedicalEmbeddingMetadata;
  score: number;
  distance: number;
}

// Document chunk for embedding
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: MedicalEmbeddingMetadata;
  embedding?: number[];
}

// Vector database statistics
export interface VectorDatabaseStats {
  totalDocuments: number;
  totalEmbeddings: number;
  documentTypes: Record<MedicalDocumentType, number>;
  surgeryTypes: Record<SurgeryType, number>;
  lastUpdated: Date;
}

// RAG (Retrieval-Augmented Generation) context
export interface RAGContext {
  patientContext: {
    surgeryType: SurgeryType;
    recoveryDay: number;
    currentSymptoms: any;
    riskLevel: RiskLevel;
  };
  retrievedDocuments: VectorSearchResult[];
  relevantGuidelines: string[];
  contextualInsights: string[];
}

// AI-generated explanation result
export interface AIExplanation {
  summary: string;
  detailedExplanation: string;
  recommendations: string[];
  riskAssessment: string;
  nextSteps: string[];
  confidence: number;
  sources: string[];
}

// Vector database configuration
export interface VectorDBConfig {
  host: string;
  port: number;
  path?: string;
  apiKey?: string;
  embeddingModel: string;
  dimension: number;
  collectionName: string;
}

// Batch processing options
export interface BatchProcessingOptions {
  chunkSize: number;
  overlap: number;
  maxChunks: number;
  includeMetadata: boolean;
}

// Index management
export interface IndexInfo {
  name: string;
  dimension: number;
  metric: 'cosine' | 'euclidean' | 'manhattan';
  documentCount: number;
  isReady: boolean;
  createdAt: Date;
}
