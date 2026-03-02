// API route for searching medical guidelines
// Handles server-side vector database search operations

import { NextRequest, NextResponse } from 'next/server';
import { SimpleVectorDB } from '@/ai/simple-vector-db';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Search documents
    const results = await SimpleVectorDB.searchDocuments(query, limit);

    console.log(`🔍 Search completed: "${query}" -> ${results.length} results`);

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
