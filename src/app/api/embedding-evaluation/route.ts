// API Endpoint for Embedding Quality Evaluation
// Performs batch testing of medical guidelines against test queries

import { NextRequest, NextResponse } from 'next/server';
import { medicalVectorDB } from '@/ai/medical-vector-db';
import { 
  EMBEDDING_TEST_QUERIES, 
  getTestQueriesForSurgeryType,
  getNegativeTestQueriesForSurgeryType 
} from '@/lib/embedding-test-queries';
import { 
  calculateEmbeddingMetrics, 
  calculateAUC,
  getOptimalThreshold,
  TestResult,
  EmbeddingMetrics 
} from '@/lib/embedding-metrics';
import { SurgeryType } from '@/lib/types';

// Evaluation request body
interface EvaluationRequest {
  documentId?: string;
  surgeryType?: SurgeryType;
  testAllSurgeryTypes?: boolean;
  confidenceThreshold?: number;
  maxResultsPerQuery?: number;
}

// Single document evaluation result
interface DocumentEvaluation {
  documentId: string;
  documentTitle: string;
  surgeryType: SurgeryType;
  metrics: EmbeddingMetrics;
  testResults: TestResult[];
  formattedMetrics: {
    sensitivity: string;
    specificity: string;
    precision: string;
    accuracy: string;
    f1Score: string;
    auc: string;
  };
  qualityGrade: {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    color: string;
    description: string;
  };
  optimalThreshold: number;
  auc: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: EvaluationRequest = await request.json();
    const { 
      documentId, 
      surgeryType, 
      testAllSurgeryTypes = false,
      confidenceThreshold = 0.5,
      maxResultsPerQuery = 5
    } = body;

    // Validate request
    if (!documentId && !surgeryType && !testAllSurgeryTypes) {
      return NextResponse.json({
        success: false,
        error: 'Must provide documentId, surgeryType, or set testAllSurgeryTypes to true'
      }, { status: 400 });
    }

    const results: DocumentEvaluation[] = [];

    // Case 1: Evaluate specific document
    if (documentId && surgeryType) {
      const evaluation = await evaluateDocument(
        documentId, 
        surgeryType, 
        confidenceThreshold, 
        maxResultsPerQuery
      );
      results.push(evaluation);
    }
    // Case 2: Evaluate all documents for a surgery type
    else if (surgeryType) {
      // Get all documents for this surgery type from vector DB
      const documents = await getDocumentsForSurgeryType(surgeryType);
      
      for (const doc of documents) {
        const evaluation = await evaluateDocument(
          doc.id, 
          surgeryType, 
          confidenceThreshold, 
          maxResultsPerQuery,
          doc.title
        );
        results.push(evaluation);
      }
    }
    // Case 3: Evaluate all surgery types
    else if (testAllSurgeryTypes) {
      for (const type of Object.values(SurgeryType)) {
        const documents = await getDocumentsForSurgeryType(type);
        
        for (const doc of documents) {
          const evaluation = await evaluateDocument(
            doc.id, 
            type, 
            confidenceThreshold, 
            maxResultsPerQuery,
            doc.title
          );
          results.push(evaluation);
        }
      }
    }

    // Calculate aggregate metrics
    const aggregateMetrics = calculateAggregateMetrics(results);
    
    // DEBUG: Log what we're about to send
    console.log(`[DEBUG] API Response - First evaluation testResults[0]:`, 
      results[0]?.testResults[0]);
    console.log(`[DEBUG] API Response - expectedRelevant type:`, 
      typeof results[0]?.testResults[0]?.expectedRelevant);

    return NextResponse.json({
      success: true,
      data: {
        evaluations: results,
        aggregate: aggregateMetrics,
        totalDocumentsEvaluated: results.length,
        evaluationTimestamp: new Date().toISOString(),
        testQueryCount: EMBEDDING_TEST_QUERIES.length
      }
    });

  } catch (error) {
    console.error('Embedding evaluation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during evaluation'
    }, { status: 500 });
  }
}

/**
 * Evaluate a single document against test queries
 */
async function evaluateDocument(
  documentId: string,
  surgeryType: SurgeryType,
  confidenceThreshold: number,
  maxResults: number,
  documentTitle?: string
): Promise<DocumentEvaluation> {
  // Get positive and negative test queries
  const positiveQueries = getTestQueriesForSurgeryType(surgeryType);
  const negativeQueries = getNegativeTestQueriesForSurgeryType(surgeryType);
  
  console.log(`[DEBUG] Evaluating document: ${documentId}, surgeryType: ${surgeryType}`);
  console.log(`[DEBUG] Positive queries: ${positiveQueries.length}, Negative queries: ${negativeQueries.length}`);
  
  const testResults: TestResult[] = [];

  // Test positive queries (should be retrieved)
  for (const testQuery of positiveQueries) {
    // Search vector DB
    const searchResults = await medicalVectorDB.search(
      testQuery.query,
      maxResults,
      surgeryType
    );

    // Check if our document is in results
    const docResult = searchResults.find(r => r.id === documentId);
    const wasRetrieved = !!docResult;
    const confidenceScore = docResult?.relevanceScore || 0;
    const rank = wasRetrieved ? searchResults.findIndex(r => r.id === documentId) + 1 : null;

    testResults.push({
      queryId: testQuery.id,
      query: testQuery.query,
      expectedRelevant: true,
      wasRetrieved,
      confidenceScore,
      rank,
      queryCategory: testQuery.category,
      queryDifficulty: testQuery.difficulty
    });
  }

  // Test negative queries (should NOT be retrieved for this surgery type)
  for (const testQuery of negativeQueries) {
    const searchResults = await medicalVectorDB.search(
      testQuery.query,
      maxResults,
      surgeryType
    );

    const docResult = searchResults.find(r => r.id === documentId);
    const wasRetrieved = !!docResult;
    const confidenceScore = docResult?.relevanceScore || 0;
    const rank = wasRetrieved ? searchResults.findIndex(r => r.id === documentId) + 1 : null;

    testResults.push({
      queryId: testQuery.id,
      query: testQuery.query,
      expectedRelevant: false,  // Should NOT match this surgery type
      wasRetrieved,
      confidenceScore,
      rank,
      queryCategory: testQuery.category,
      queryDifficulty: testQuery.difficulty
    });
  }

  // Calculate metrics
  const metrics = calculateEmbeddingMetrics(testResults, surgeryType, documentId);
  
  console.log(`[DEBUG] Test results count: ${testResults.length}`);
  console.log(`[DEBUG] Expected relevant count: ${testResults.filter(r => r.expectedRelevant).length}`);
  console.log(`[DEBUG] Expected irrelevant count: ${testResults.filter(r => !r.expectedRelevant).length}`);
  console.log(`[DEBUG] Sample test result:`, testResults[0]);
  console.log(`[DEBUG] ROC curve points: ${metrics.rocCurve.length}`);
  console.log(`[DEBUG] Full ROC curve:`, JSON.stringify(metrics.rocCurve, null, 2));
  
  const auc = calculateAUC(metrics.rocCurve);
  const optimalThreshold = getOptimalThreshold(metrics.rocCurve);
  
  console.log(`[DEBUG] Calculated AUC: ${auc}`);

  // Import here to avoid circular dependency
  const { getQualityGrade, formatMetrics } = await import('@/lib/embedding-metrics');
  
  return {
    documentId,
    documentTitle: documentTitle || 'Unknown Document',
    surgeryType,
    metrics,
    testResults,
    formattedMetrics: formatMetrics(metrics),
    qualityGrade: getQualityGrade(metrics),
    optimalThreshold,
    auc
  };
}

/**
 * Get all documents for a specific surgery type
 */
async function getDocumentsForSurgeryType(surgeryType: SurgeryType): Promise<{id: string; title: string}[]> {
  try {
    // Query all documents with this surgery type from vector DB
    const allDocs = await medicalVectorDB.getAllDocuments();
    
    return allDocs
      .filter((doc: {metadata?: {surgeryType?: string}}) => doc.metadata?.surgeryType === surgeryType)
      .map((doc: {id?: string; metadata?: {title?: string}}) => ({
        id: doc.id || '',
        title: doc.metadata?.title || 'Untitled Document'
      }));
  } catch (error) {
    console.error(`Failed to get documents for ${surgeryType}:`, error);
    return [];
  }
}

/**
 * Calculate aggregate metrics across all evaluations
 */
function calculateAggregateMetrics(evaluations: DocumentEvaluation[]) {
  if (evaluations.length === 0) {
    return null;
  }

  const avgSensitivity = evaluations.reduce((sum, e) => sum + e.metrics.sensitivity, 0) / evaluations.length;
  const avgSpecificity = evaluations.reduce((sum, e) => sum + e.metrics.specificity, 0) / evaluations.length;
  const avgAccuracy = evaluations.reduce((sum, e) => sum + e.metrics.accuracy, 0) / evaluations.length;
  const avgF1Score = evaluations.reduce((sum, e) => sum + e.metrics.f1Score, 0) / evaluations.length;
  const avgAUC = evaluations.reduce((sum, e) => sum + e.auc, 0) / evaluations.length;

  // Count by quality grade
  const gradeDistribution = evaluations.reduce((acc, e) => {
    acc[e.qualityGrade.grade] = (acc[e.qualityGrade.grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find best and worst performing documents
  const sortedByF1 = [...evaluations].sort((a, b) => b.metrics.f1Score - a.metrics.f1Score);
  
  return {
    averageMetrics: {
      sensitivity: avgSensitivity,
      specificity: avgSpecificity,
      accuracy: avgAccuracy,
      f1Score: avgF1Score,
      auc: avgAUC
    },
    formattedAverages: {
      sensitivity: `${(avgSensitivity * 100).toFixed(1)}%`,
      specificity: `${(avgSpecificity * 100).toFixed(1)}%`,
      accuracy: `${(avgAccuracy * 100).toFixed(1)}%`,
      f1Score: `${(avgF1Score * 100).toFixed(1)}%`,
      auc: `${(avgAUC * 100).toFixed(1)}%`
    },
    gradeDistribution,
    bestPerforming: sortedByF1[0] ? {
      documentId: sortedByF1[0].documentId,
      title: sortedByF1[0].documentTitle,
      f1Score: sortedByF1[0].metrics.f1Score,
      surgeryType: sortedByF1[0].surgeryType
    } : null,
    worstPerforming: sortedByF1[sortedByF1.length - 1] ? {
      documentId: sortedByF1[sortedByF1.length - 1].documentId,
      title: sortedByF1[sortedByF1.length - 1].documentTitle,
      f1Score: sortedByF1[sortedByF1.length - 1].metrics.f1Score,
      surgeryType: sortedByF1[sortedByF1.length - 1].surgeryType
    } : null,
    totalEvaluated: evaluations.length
  };
}

// GET endpoint to retrieve available test queries
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      totalTestQueries: EMBEDDING_TEST_QUERIES.length,
      queriesByCategory: groupQueriesByCategory(),
      queriesBySurgeryType: groupQueriesBySurgeryType(),
      difficultyDistribution: getDifficultyDistribution()
    }
  });
}

function groupQueriesByCategory() {
  const groups: Record<string, number> = {};
  for (const query of EMBEDDING_TEST_QUERIES) {
    groups[query.category] = (groups[query.category] || 0) + 1;
  }
  return groups;
}

function groupQueriesBySurgeryType() {
  const groups: Record<string, number> = {};
  for (const query of EMBEDDING_TEST_QUERIES) {
    for (const st of query.expectedSurgeryTypes) {
      groups[st] = (groups[st] || 0) + 1;
    }
  }
  return groups;
}

function getDifficultyDistribution() {
  const distribution: Record<string, number> = { easy: 0, medium: 0, hard: 0 };
  for (const query of EMBEDDING_TEST_QUERIES) {
    distribution[query.difficulty]++;
  }
  return distribution;
}
