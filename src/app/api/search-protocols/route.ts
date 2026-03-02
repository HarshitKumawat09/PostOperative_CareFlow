// 🔍 PHASE 1 & 3 — SEMANTIC SEARCH
// Vector DB retrieves top-K relevant protocols

import { NextRequest, NextResponse } from 'next/server';
import { medicalVectorDB } from '@/ai/medical-vector-db';

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5, filters } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required and must be a string' },
        { status: 400 }
      );
    }

    // System finds relevant protocols - REAL semantic search
    const protocols = await medicalVectorDB.search(query.trim(), limit);

    console.log(`🔍 Protocol search: "${query}" → ${protocols.length} results`);

    return NextResponse.json({
      success: true,
      protocols,
      query: query.trim(),
      totalFound: protocols.length,
      searchType: 'semantic_vector_search'
    });

  } catch (error) {
    console.error('Protocol search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search protocols',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query parameter "q" is required' },
        { status: 400 }
      );
    }

    // System finds relevant protocols - REAL semantic search
    const protocols = await medicalVectorDB.search(query.trim(), limit);

    console.log(`🔍 Protocol search (GET): "${query}" → ${protocols.length} results`);

    return NextResponse.json({
      success: true,
      protocols,
      query: query.trim(),
      totalFound: protocols.length,
      searchType: 'semantic_vector_search'
    });

  } catch (error) {
    console.error('Protocol search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search protocols',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
