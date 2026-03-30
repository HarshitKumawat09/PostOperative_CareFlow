// 🧱 PHASE 1 & 2 — MEDICAL GUIDELINE INGESTION
// Staff-only protocol upload with persistent vector storage

import { NextRequest, NextResponse } from 'next/server';
import { medicalVectorDB } from '@/ai/medical-vector-db';
import { ProtocolMetadata } from '@/ai/medical-vector-db';

export async function POST(request: NextRequest) {
  try {
    const { content, metadata } = await request.json();

    if (!content || !metadata) {
      return NextResponse.json(
        { error: 'Content and metadata are required' },
        { status: 400 }
      );
    }

    // Validate required metadata fields
    const surgeryTypes = metadata.surgeryTypes || metadata.surgeryType;
    const surgeryType = Array.isArray(surgeryTypes) && surgeryTypes.length > 0 
      ? surgeryTypes[0] 
      : (surgeryTypes || 'General');
    
    const protocolMetadata: ProtocolMetadata = {
      title: metadata.title || 'Untitled Protocol',
      source: metadata.source || 'Unknown Source',
      surgeryType: surgeryType,
      department: metadata.department || 'General',
      version: metadata.version,
      uploadDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      evidenceLevel: metadata.evidenceLevel || 'moderate',
      keywords: metadata.keywords || []
    };

    // Staff uploads hospital protocols - REAL persistent storage
    const protocolId = await medicalVectorDB.addDocument(content, protocolMetadata);

    // Get updated stats
    const stats = await medicalVectorDB.getStats();

    console.log(`🏥 Protocol ingested: ${protocolMetadata.title} (${content.length} chars)`);

    return NextResponse.json({
      success: true,
      message: 'Hospital protocol stored successfully',
      protocolId,
      stats,
      chunksStored: 1,
      metadata: protocolMetadata
    });

  } catch (error) {
    console.error('Protocol ingestion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to store protocol',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get database statistics
    const stats = await medicalVectorDB.getStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get database stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
