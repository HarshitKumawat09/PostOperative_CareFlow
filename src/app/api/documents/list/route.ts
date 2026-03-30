// API Endpoint to list all uploaded documents for evaluation

import { NextRequest, NextResponse } from 'next/server';
import { medicalVectorDB } from '@/ai/medical-vector-db';
import { SurgeryType, SURGERY_TYPE_LABELS } from '@/lib/types';

export interface DocumentListItem {
  id: string;
  title: string;
  surgeryType: SurgeryType;
  surgeryTypeLabel: string;
  department: string;
  uploadDate: string;
  evidenceLevel: string;
  wordCount: number;
  hasBeenEvaluated: boolean;
  lastEvaluationDate?: string;
  qualityGrade?: 'A' | 'B' | 'C' | 'D' | 'F';
}

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const surgeryType = searchParams.get('surgeryType') as SurgeryType | null;
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    // Get all documents from vector DB
    const allDocs = await medicalVectorDB.getAllDocuments();

    // Transform and filter documents
    let documents: DocumentListItem[] = allDocs.map(doc => {
      const wordCount = doc.content.split(/\s+/).length;
      
      return {
        id: doc.id,
        title: doc.metadata.title || 'Untitled Document',
        surgeryType: doc.metadata.surgeryType,
        surgeryTypeLabel: SURGERY_TYPE_LABELS[doc.metadata.surgeryType] || doc.metadata.surgeryType,
        department: doc.metadata.department || 'General',
        uploadDate: doc.metadata.uploadDate || doc.metadata.lastUpdated || new Date().toISOString(),
        evidenceLevel: doc.metadata.evidenceLevel || 'expert_opinion',
        wordCount,
        hasBeenEvaluated: false, // Will be populated from evaluation history in future
      };
    });

    // Apply filters
    if (surgeryType) {
      documents = documents.filter(d => d.surgeryType === surgeryType);
    }

    if (department) {
      documents = documents.filter(d => 
        d.department.toLowerCase().includes(department.toLowerCase())
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      documents = documents.filter(d => 
        d.title.toLowerCase().includes(searchLower) ||
        d.surgeryTypeLabel.toLowerCase().includes(searchLower)
      );
    }

    // Sort by upload date (newest first)
    documents.sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    // Get summary statistics
    const stats = {
      totalDocuments: documents.length,
      bySurgeryType: {} as Record<string, number>,
      byDepartment: {} as Record<string, number>,
      byEvidenceLevel: {} as Record<string, number>,
    };

    for (const doc of documents) {
      stats.bySurgeryType[doc.surgeryType] = (stats.bySurgeryType[doc.surgeryType] || 0) + 1;
      stats.byDepartment[doc.department] = (stats.byDepartment[doc.department] || 0) + 1;
      stats.byEvidenceLevel[doc.evidenceLevel] = (stats.byEvidenceLevel[doc.evidenceLevel] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      data: {
        documents,
        stats,
        filters: {
          surgeryType,
          department,
          search
        }
      }
    });

  } catch (error) {
    console.error('Failed to list documents:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve documents'
    }, { status: 500 });
  }
}
