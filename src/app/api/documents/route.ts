import { NextRequest, NextResponse } from 'next/server';
import { medicalVectorDB } from '@/ai/medical-vector-db';

// GET all documents for management
export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching all documents for management...');
    
    const documents = await medicalVectorDB.getAllDocuments();
    
    console.log(`✅ Retrieved ${documents.length} documents`);
    
    return NextResponse.json({
      success: true,
      documents: documents,
      total: documents.length
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch documents:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      documents: [],
      total: 0
    }, { status: 500 });
  }
}
