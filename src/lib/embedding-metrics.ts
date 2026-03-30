// Sensitivity and Specificity Calculation for Embedding Quality Analysis
// Provides metrics for evaluating medical guideline retrieval performance

import { TestQuery } from './embedding-test-queries';
import { SurgeryType } from './types';

// Result of a single test query evaluation
export interface TestResult {
  queryId: string;
  query: string;
  expectedRelevant: boolean;
  wasRetrieved: boolean;
  confidenceScore: number;  // Relevance score from vector search
  rank: number | null;      // Position in search results (null if not found)
  queryCategory: string;
  queryDifficulty: string;
}

// Aggregated metrics for a document/surgery type
export interface EmbeddingMetrics {
  // Core metrics
  sensitivity: number;      // True Positive Rate (Recall)
  specificity: number;      // True Negative Rate
  precision: number;        // Positive Predictive Value
  npv: number;              // Negative Predictive Value
  accuracy: number;         // Overall accuracy
  f1Score: number;         // Harmonic mean of precision and recall
  
  // Component counts
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  
  // Test coverage
  totalQueries: number;
  relevantQueries: number;
  irrelevantQueries: number;
  
  // Performance by category
  byCategory: Record<string, CategoryMetrics>;
  
  // Performance by difficulty
  byDifficulty: Record<string, DifficultyMetrics>;
  
  // ROC curve data
  rocCurve: ROCCurvePoint[];
  
  // Metadata
  surgeryType: SurgeryType;
  evaluatedAt: string;
  documentId?: string;
}

export interface CategoryMetrics {
  category: string;
  sensitivity: number;
  specificity: number;
  accuracy: number;
  totalQueries: number;
}

export interface DifficultyMetrics {
  difficulty: string;
  sensitivity: number;
  specificity: number;
  accuracy: number;
  totalQueries: number;
}

export interface ROCCurvePoint {
  threshold: number;
  sensitivity: number;   // True Positive Rate
  fpr: number;          // False Positive Rate (1 - Specificity)
  precision: number;
}

/**
 * Calculate comprehensive embedding metrics from test results
 */
export function calculateEmbeddingMetrics(
  results: TestResult[],
  surgeryType: SurgeryType,
  documentId?: string
): EmbeddingMetrics {
  // Calculate confusion matrix
  const truePositives = results.filter(r => r.expectedRelevant && r.wasRetrieved).length;
  const falsePositives = results.filter(r => !r.expectedRelevant && r.wasRetrieved).length;
  const trueNegatives = results.filter(r => !r.expectedRelevant && !r.wasRetrieved).length;
  const falseNegatives = results.filter(r => r.expectedRelevant && !r.wasRetrieved).length;
  
  const totalQueries = results.length;
  const relevantQueries = results.filter(r => r.expectedRelevant).length;
  const irrelevantQueries = results.filter(r => !r.expectedRelevant).length;
  
  // Calculate core metrics with safe division
  const sensitivity = relevantQueries > 0 ? truePositives / relevantQueries : 0;
  const specificity = irrelevantQueries > 0 ? trueNegatives / irrelevantQueries : 0;
  const precision = (truePositives + falsePositives) > 0 
    ? truePositives / (truePositives + falsePositives) 
    : 0;
  const npv = (trueNegatives + falseNegatives) > 0 
    ? trueNegatives / (trueNegatives + falseNegatives) 
    : 0;
  const accuracy = totalQueries > 0 
    ? (truePositives + trueNegatives) / totalQueries 
    : 0;
  const f1Score = (precision + sensitivity) > 0 
    ? 2 * (precision * sensitivity) / (precision + sensitivity) 
    : 0;
  
  // Calculate category breakdown
  const byCategory = calculateCategoryMetrics(results);
  
  // Calculate difficulty breakdown
  const byDifficulty = calculateDifficultyMetrics(results);
  
  // Generate ROC curve
  const rocCurve = generateROCCurve(results);
  
  return {
    sensitivity,
    specificity,
    precision,
    npv,
    accuracy,
    f1Score,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    totalQueries,
    relevantQueries,
    irrelevantQueries,
    byCategory,
    byDifficulty,
    rocCurve,
    surgeryType,
    evaluatedAt: new Date().toISOString(),
    documentId
  };
}

/**
 * Calculate metrics broken down by query category
 */
function calculateCategoryMetrics(results: TestResult[]): Record<string, CategoryMetrics> {
  const categories = [...new Set(results.map(r => r.queryCategory))];
  const metrics: Record<string, CategoryMetrics> = {};
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.queryCategory === category);
    const relevant = categoryResults.filter(r => r.expectedRelevant);
    const irrelevant = categoryResults.filter(r => !r.expectedRelevant);
    
    const tp = relevant.filter(r => r.wasRetrieved).length;
    const fn = relevant.filter(r => !r.wasRetrieved).length;
    const tn = irrelevant.filter(r => !r.wasRetrieved).length;
    const fp = irrelevant.filter(r => r.wasRetrieved).length;
    
    metrics[category] = {
      category,
      sensitivity: relevant.length > 0 ? tp / relevant.length : 0,
      specificity: irrelevant.length > 0 ? tn / irrelevant.length : 0,
      accuracy: categoryResults.length > 0 ? (tp + tn) / categoryResults.length : 0,
      totalQueries: categoryResults.length
    };
  }
  
  return metrics;
}

/**
 * Calculate metrics broken down by query difficulty
 */
function calculateDifficultyMetrics(results: TestResult[]): Record<string, DifficultyMetrics> {
  const difficulties = [...new Set(results.map(r => r.queryDifficulty))];
  const metrics: Record<string, DifficultyMetrics> = {};
  
  for (const difficulty of difficulties) {
    const difficultyResults = results.filter(r => r.queryDifficulty === difficulty);
    const relevant = difficultyResults.filter(r => r.expectedRelevant);
    const irrelevant = difficultyResults.filter(r => !r.expectedRelevant);
    
    const tp = relevant.filter(r => r.wasRetrieved).length;
    const tn = irrelevant.filter(r => !r.wasRetrieved).length;
    
    metrics[difficulty] = {
      difficulty,
      sensitivity: relevant.length > 0 ? tp / relevant.length : 0,
      specificity: irrelevant.length > 0 ? tn / irrelevant.length : 0,
      accuracy: difficultyResults.length > 0 ? (tp + tn) / difficultyResults.length : 0,
      totalQueries: difficultyResults.length
    };
  }
  
  return metrics;
}

/**
 * Generate ROC curve data points at various confidence thresholds
 */
function generateROCCurve(results: TestResult[]): ROCCurvePoint[] {
  const thresholds = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
  const curve: ROCCurvePoint[] = [];
  
  const relevant = results.filter(r => r.expectedRelevant);
  const irrelevant = results.filter(r => !r.expectedRelevant);
  
  console.log(`[DEBUG ROC] Total results: ${results.length}, Relevant: ${relevant.length}, Irrelevant: ${irrelevant.length}`);
  
  // Edge case: if no relevant or no irrelevant queries, return default curve
  if (relevant.length === 0 || irrelevant.length === 0) {
    console.log(`[DEBUG ROC] Edge case - returning diagonal line`);
    return thresholds.map(t => ({
      threshold: t,
      sensitivity: t,
      fpr: t,
      precision: 0.5
    }));
  }
  
  for (const threshold of thresholds) {
    // At this threshold, what would the metrics be?
    // Count as "retrieved" if confidence >= threshold and actually retrieved
    const tp = relevant.filter(r => r.wasRetrieved && r.confidenceScore >= threshold).length;
    const fn = relevant.filter(r => !r.wasRetrieved || r.confidenceScore < threshold).length;
    const fp = irrelevant.filter(r => r.wasRetrieved && r.confidenceScore >= threshold).length;
    const tn = irrelevant.filter(r => !r.wasRetrieved || r.confidenceScore < threshold).length;
    
    const sensitivity = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const specificity = (fp + tn) > 0 ? tn / (fp + tn) : 0;
    const fpr = 1 - specificity; // False Positive Rate = 1 - Specificity
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    
    curve.push({
      threshold,
      sensitivity,
      fpr,
      precision
    });
  }
  
  console.log(`[DEBUG ROC] Generated ${curve.length} points. First point:`, curve[0]);
  console.log(`[DEBUG ROC] Last point:`, curve[curve.length - 1]);
  
  return curve;
}

/**
 * Calculate Area Under ROC Curve (AUC)
 */
export function calculateAUC(rocCurve: ROCCurvePoint[]): number {
  if (rocCurve.length < 2) {
    return 0.5; // Default to random classifier
  }
  
  // Sort by FPR ascending for proper trapezoidal calculation
  const sorted = [...rocCurve].sort((a, b) => a.fpr - b.fpr);
  
  // Ensure curve starts at (0,0) and ends at (1,1)
  const extended: ROCCurvePoint[] = [];
  if (sorted[0].fpr > 0) {
    extended.push({ threshold: 1, sensitivity: 0, fpr: 0, precision: 0 });
  }
  extended.push(...sorted);
  if (sorted[sorted.length - 1].fpr < 1) {
    extended.push({ threshold: 0, sensitivity: 1, fpr: 1, precision: 0 });
  }
  
  // Use trapezoidal rule to calculate AUC
  let auc = 0;
  for (let i = 1; i < extended.length; i++) {
    const width = extended[i].fpr - extended[i - 1].fpr;
    const height = (extended[i].sensitivity + extended[i - 1].sensitivity) / 2;
    auc += width * height;
  }
  
  // Clamp to valid range [0, 1]
  return Math.max(0, Math.min(1, auc));
}

/**
 * Get optimal threshold that maximizes F1 score
 */
export function getOptimalThreshold(rocCurve: ROCCurvePoint[]): number {
  let bestF1 = 0;
  let bestThreshold = 0.5;
  
  for (const point of rocCurve) {
    const f1 = point.precision + point.sensitivity > 0 
      ? 2 * (point.precision * point.sensitivity) / (point.precision + point.sensitivity)
      : 0;
    
    if (f1 > bestF1) {
      bestF1 = f1;
      bestThreshold = point.threshold;
    }
  }
  
  return bestThreshold;
}

/**
 * Compare two embedding metrics to see which performs better
 */
export function compareMetrics(
  baseline: EmbeddingMetrics,
  current: EmbeddingMetrics
): {
  sensitivityChange: number;
  specificityChange: number;
  accuracyChange: number;
  f1Change: number;
  overallImprovement: number;
} {
  const sensitivityChange = current.sensitivity - baseline.sensitivity;
  const specificityChange = current.specificity - baseline.specificity;
  const accuracyChange = current.accuracy - baseline.accuracy;
  const f1Change = current.f1Score - baseline.f1Score;
  
  // Weighted overall improvement
  const overallImprovement = (
    sensitivityChange * 0.3 +
    specificityChange * 0.3 +
    accuracyChange * 0.2 +
    f1Change * 0.2
  );
  
  return {
    sensitivityChange,
    specificityChange,
    accuracyChange,
    f1Change,
    overallImprovement
  };
}

/**
 * Get quality grade based on metrics
 */
export function getQualityGrade(metrics: EmbeddingMetrics): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
  description: string;
} {
  const { sensitivity, specificity, accuracy, f1Score } = metrics;
  
  // Weighted scoring
  const score = (
    sensitivity * 0.3 +
    specificity * 0.3 +
    accuracy * 0.2 +
    f1Score * 0.2
  ) * 100;
  
  if (score >= 90) {
    return { grade: 'A', color: '#22c55e', description: 'Excellent - Highly reliable embeddings' };
  } else if (score >= 80) {
    return { grade: 'B', color: '#84cc16', description: 'Good - Reliable with minor improvements needed' };
  } else if (score >= 70) {
    return { grade: 'C', color: '#eab308', description: 'Fair - Usable but significant improvements needed' };
  } else if (score >= 60) {
    return { grade: 'D', color: '#f97316', description: 'Poor - Major improvements required' };
  } else {
    return { grade: 'F', color: '#ef4444', description: 'Critical - Embeddings not suitable for production' };
  }
}

/**
 * Format metrics for display
 */
export function formatMetrics(metrics: EmbeddingMetrics): {
  sensitivity: string;
  specificity: string;
  precision: string;
  accuracy: string;
  f1Score: string;
  auc: string;
} {
  return {
    sensitivity: `${(metrics.sensitivity * 100).toFixed(1)}%`,
    specificity: `${(metrics.specificity * 100).toFixed(1)}%`,
    precision: `${(metrics.precision * 100).toFixed(1)}%`,
    accuracy: `${(metrics.accuracy * 100).toFixed(1)}%`,
    f1Score: `${(metrics.f1Score * 100).toFixed(1)}%`,
    auc: `${(calculateAUC(metrics.rocCurve) * 100).toFixed(1)}%`
  };
}

// Evaluation data type for aggregate calculation
interface EvaluationData {
  documentId: string;
  documentTitle: string;
  surgeryType: SurgeryType;
  metrics: EmbeddingMetrics;
}

// Aggregate metrics result type
interface AggregateMetrics {
  averageMetrics: {
    sensitivity: number;
    specificity: number;
    accuracy: number;
    f1Score: number;
    auc: number;
  };
  formattedAverages: {
    sensitivity: string;
    specificity: string;
    accuracy: string;
    f1Score: string;
    auc: string;
  };
  gradeDistribution: Record<string, number>;
  bestPerforming: {
    documentId: string;
    title: string;
    f1Score: number;
    surgeryType: SurgeryType;
  } | null;
  worstPerforming: {
    documentId: string;
    title: string;
    f1Score: number;
    surgeryType: SurgeryType;
  } | null;
  totalEvaluated: number;
}

/**
 * Calculate aggregate metrics from multiple document evaluations
 */
export function calculateAggregateMetrics(evaluations: EvaluationData[]): AggregateMetrics {
  if (evaluations.length === 0) {
    return {
      averageMetrics: { sensitivity: 0, specificity: 0, accuracy: 0, f1Score: 0, auc: 0 },
      formattedAverages: { sensitivity: '0.0%', specificity: '0.0%', accuracy: '0.0%', f1Score: '0.0%', auc: '0.0%' },
      gradeDistribution: {},
      bestPerforming: null,
      worstPerforming: null,
      totalEvaluated: 0
    };
  }

  // Calculate averages
  const totalSensitivity = evaluations.reduce((sum, e) => sum + e.metrics.sensitivity, 0);
  const totalSpecificity = evaluations.reduce((sum, e) => sum + e.metrics.specificity, 0);
  const totalAccuracy = evaluations.reduce((sum, e) => sum + e.metrics.accuracy, 0);
  const totalF1Score = evaluations.reduce((sum, e) => sum + e.metrics.f1Score, 0);
  const totalAuc = evaluations.reduce((sum, e) => sum + calculateAUC(e.metrics.rocCurve), 0);

  const count = evaluations.length;
  const averageMetrics = {
    sensitivity: totalSensitivity / count,
    specificity: totalSpecificity / count,
    accuracy: totalAccuracy / count,
    f1Score: totalF1Score / count,
    auc: totalAuc / count
  };

  // Format averages
  const formattedAverages = {
    sensitivity: `${(averageMetrics.sensitivity * 100).toFixed(1)}%`,
    specificity: `${(averageMetrics.specificity * 100).toFixed(1)}%`,
    accuracy: `${(averageMetrics.accuracy * 100).toFixed(1)}%`,
    f1Score: `${(averageMetrics.f1Score * 100).toFixed(1)}%`,
    auc: `${(averageMetrics.auc * 100).toFixed(1)}%`
  };

  // Calculate grade distribution
  const gradeDistribution: Record<string, number> = {};
  for (const evalData of evaluations) {
    const grade = getQualityGrade(evalData.metrics).grade;
    gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
  }

  // Find best and worst performing
  const sortedByF1 = [...evaluations].sort((a, b) => b.metrics.f1Score - a.metrics.f1Score);
  const bestPerforming = sortedByF1.length > 0 ? {
    documentId: sortedByF1[0].documentId,
    title: sortedByF1[0].documentTitle,
    f1Score: sortedByF1[0].metrics.f1Score,
    surgeryType: sortedByF1[0].surgeryType
  } : null;

  const worstPerforming = sortedByF1.length > 0 ? {
    documentId: sortedByF1[sortedByF1.length - 1].documentId,
    title: sortedByF1[sortedByF1.length - 1].documentTitle,
    f1Score: sortedByF1[sortedByF1.length - 1].metrics.f1Score,
    surgeryType: sortedByF1[sortedByF1.length - 1].surgeryType
  } : null;

  return {
    averageMetrics,
    formattedAverages,
    gradeDistribution,
    bestPerforming,
    worstPerforming,
    totalEvaluated: count
  };
}
