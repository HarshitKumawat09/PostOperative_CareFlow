// Interactive Embedding Evaluation Dashboard
// Displays sensitivity/specificity graphs, ROC curves, and confusion matrices
// for medical guideline embeddings

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  BarChart3, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Brain,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  FolderOpen,
  Play
} from 'lucide-react';
import { SurgeryType, SURGERY_TYPE_LABELS } from '@/lib/types';
import { EmbeddingMetrics, TestResult, calculateAggregateMetrics } from '@/lib/embedding-metrics';

// Types for API response
interface EvaluationData {
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

interface EvaluationResponse {
  evaluations: EvaluationData[];
  aggregate: AggregateMetrics;
  totalDocumentsEvaluated: number;
  evaluationTimestamp: string;
  testQueryCount: number;
}

// Document list item from API
interface DocumentListItem {
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

export default function EmbeddingEvaluationDashboard() {
  const [selectedSurgeryType, setSelectedSurgeryType] = useState<SurgeryType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState<EvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Document browser state
  const [availableDocuments, setAvailableDocuments] = useState<DocumentListItem[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [showDocumentBrowser, setShowDocumentBrowser] = useState(true);
  const [selectedDocumentsToEvaluate, setSelectedDocumentsToEvaluate] = useState<string[]>([]);

  // Run evaluation
  const runEvaluation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/embedding-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surgeryType: selectedSurgeryType === 'all' ? undefined : selectedSurgeryType,
          testAllSurgeryTypes: selectedSurgeryType === 'all',
          confidenceThreshold: 0.5,
          maxResultsPerQuery: 5
        })
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // DEBUG: Log what we received
      console.log('[DEBUG FRONTEND] API result:', result);
      console.log('[DEBUG FRONTEND] First evaluation testResults[0]:', result.data?.evaluations[0]?.testResults[0]);
      
      if (result.success) {
        setEvaluationData(result.data);
        // Auto-select first document if available
        if (result.data.evaluations.length > 0) {
          setSelectedDocument(result.data.evaluations[0].documentId);
        }
      } else {
        throw new Error(result.error || 'Evaluation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSurgeryType]);

  // Fetch available documents
  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocuments(true);
    try {
      const params = new URLSearchParams();
      if (selectedSurgeryType !== 'all') {
        params.append('surgeryType', selectedSurgeryType);
      }
      if (documentSearchQuery) {
        params.append('search', documentSearchQuery);
      }

      const response = await fetch(`/api/documents/list?${params}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      
      const result = await response.json();
      if (result.success) {
        setAvailableDocuments(result.data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [selectedSurgeryType, documentSearchQuery]);

  // Load documents on mount and when filters change
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Toggle document selection for evaluation
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocumentsToEvaluate(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // Run evaluation for selected documents only
  const runEvaluationForSelected = async () => {
    if (selectedDocumentsToEvaluate.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    setShowDocumentBrowser(false);

    try {
      // Evaluate each selected document
      const evaluations = [];
      for (const docId of selectedDocumentsToEvaluate) {
        const doc = availableDocuments.find(d => d.id === docId);
        if (!doc) continue;

        const response = await fetch('/api/embedding-evaluation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentId: docId,
            surgeryType: doc.surgeryType,
            confidenceThreshold: 0.5,
            maxResultsPerQuery: 5
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.evaluations[0]) {
            evaluations.push(result.data.evaluations[0]);
          }
        }
      }

      // Build aggregate metrics
      const aggregate = calculateAggregateMetrics(evaluations);

      setEvaluationData({
        evaluations,
        aggregate,
        totalDocumentsEvaluated: evaluations.length,
        evaluationTimestamp: new Date().toISOString(),
        testQueryCount: evaluations.length > 0 ? evaluations[0].metrics.totalQueries : 0
      });

      if (evaluations.length > 0) {
        setSelectedDocument(evaluations[0].documentId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle card expansion
  const toggleCard = (docId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedCards(newExpanded);
  };

  // Get selected evaluation data
  const selectedEvaluation = evaluationData?.evaluations.find(
    e => e.documentId === selectedDocument
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-2xl">Embedding Quality Analysis</CardTitle>
              <CardDescription>
                Evaluate medical guideline embeddings using sensitivity and specificity metrics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Select 
              value={selectedSurgeryType} 
              onValueChange={(value) => setSelectedSurgeryType(value as SurgeryType | 'all')}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select surgery type to evaluate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Surgery Types</SelectItem>
                {Object.values(SurgeryType).map(type => (
                  <SelectItem key={type} value={type}>
                    {SURGERY_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline"
              onClick={() => setShowDocumentBrowser(!showDocumentBrowser)}
              className="gap-2"
            >
              <FolderOpen className="h-4 w-4" />
              {showDocumentBrowser ? 'Hide Document Browser' : 'Browse Documents'}
            </Button>

            {selectedDocumentsToEvaluate.length > 0 && (
              <Button 
                onClick={runEvaluationForSelected}
                disabled={isLoading}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Evaluate Selected ({selectedDocumentsToEvaluate.length})
              </Button>
            )}

            <Button 
              onClick={runEvaluation} 
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Run Evaluation
                </>
              )}
            </Button>

            {evaluationData && (
              <Badge variant="outline" className="text-sm">
                {evaluationData.totalDocumentsEvaluated} documents evaluated
              </Badge>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Evaluation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Document Browser */}
      {showDocumentBrowser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>Uploaded Documents</CardTitle>
                  <CardDescription>
                    Select documents to evaluate their embedding quality
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={documentSearchQuery}
                    onChange={(e) => setDocumentSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border rounded-md text-sm w-[250px]"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchDocuments}
                  disabled={isLoadingDocuments}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingDocuments ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[300px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                ))}
              </div>
            ) : availableDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents found</p>
                <p className="text-sm">Upload documents using the Medical Guidelines section</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDocumentsToEvaluate.length > 0 && (
                  <div className="bg-primary/5 p-3 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {selectedDocumentsToEvaluate.length} document(s) selected
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedDocumentsToEvaluate([])}
                        >
                          Clear
                        </Button>
                        <Button 
                          size="sm"
                          onClick={runEvaluationForSelected}
                          disabled={isLoading}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Evaluate Selected
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  {availableDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDocumentsToEvaluate.includes(doc.id)
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleDocumentSelection(doc.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocumentsToEvaluate.includes(doc.id)}
                        onChange={() => {}} // Handled by parent click
                        className="h-4 w-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{doc.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {doc.surgeryTypeLabel}
                          </Badge>
                          <span>•</span>
                          <span>{doc.department}</span>
                          <span>•</span>
                          <span>{doc.wordCount.toLocaleString()} words</span>
                          <span>•</span>
                          <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {doc.hasBeenEvaluated && doc.qualityGrade && (
                        <Badge 
                          style={{ 
                            backgroundColor: getGradeColor(doc.qualityGrade),
                            color: 'white'
                          }}
                        >
                          Grade {doc.qualityGrade}
                        </Badge>
                      )}

                      {!doc.hasBeenEvaluated && (
                        <Badge variant="secondary">Not Evaluated</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
              <Progress value={45} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                Running test queries against embeddings...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Dashboard */}
      {evaluationData && !isLoading && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[650px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roc">ROC Curve</TabsTrigger>
            <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Aggregate Metrics */}
            {evaluationData.aggregate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Aggregate Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <MetricCard
                      title="Sensitivity"
                      value={evaluationData.aggregate.formattedAverages.sensitivity}
                      subtitle="True Positive Rate"
                      icon={<Target className="h-4 w-4" />}
                    />
                    <MetricCard
                      title="Specificity"
                      value={evaluationData.aggregate.formattedAverages.specificity}
                      subtitle="True Negative Rate"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                    />
                    <MetricCard
                      title="Accuracy"
                      value={evaluationData.aggregate.formattedAverages.accuracy}
                      subtitle="Overall Correct"
                      icon={<Activity className="h-4 w-4" />}
                    />
                    <MetricCard
                      title="F1 Score"
                      value={evaluationData.aggregate.formattedAverages.f1Score}
                      subtitle="Precision + Recall"
                      icon={<BarChart3 className="h-4 w-4" />}
                    />
                    <MetricCard
                      title="AUC"
                      value={evaluationData.aggregate.formattedAverages.auc}
                      subtitle="Area Under Curve"
                      icon={<TrendingUp className="h-4 w-4" />}
                    />
                  </div>

                  {/* Grade Distribution */}
                  {evaluationData.aggregate.gradeDistribution && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Quality Grade Distribution</h4>
                      <div className="flex gap-2">
                        {Object.entries(evaluationData.aggregate.gradeDistribution).map(([grade, count]) => (
                          <Badge 
                            key={grade} 
                            style={{ 
                              backgroundColor: getGradeColor(grade),
                              color: 'white'
                            }}
                            className="text-sm px-3 py-1"
                          >
                            Grade {grade}: {count} docs
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Document Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Document for Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {evaluationData.evaluations.map((evalData) => (
                    <Button
                      key={evalData.documentId}
                      variant={selectedDocument === evalData.documentId ? "default" : "outline"}
                      className="h-auto py-3 px-4 justify-start text-left"
                      onClick={() => setSelectedDocument(evalData.documentId)}
                    >
                      <div className="w-full">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{evalData.documentTitle}</span>
                          <Badge 
                            style={{ backgroundColor: evalData.qualityGrade.color }}
                            className="text-xs text-white"
                          >
                            {evalData.qualityGrade.grade}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {SURGERY_TYPE_LABELS[evalData.surgeryType]} • F1: {evalData.formattedMetrics.f1Score}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected Document Summary */}
            {selectedEvaluation && (
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedEvaluation.documentTitle}</CardTitle>
                      <CardDescription>
                        {SURGERY_TYPE_LABELS[selectedEvaluation.surgeryType]} • 
                        Optimal Threshold: {(selectedEvaluation.optimalThreshold * 100).toFixed(0)}%
                      </CardDescription>
                    </div>
                    <div 
                      className="px-4 py-2 rounded-lg text-white font-bold text-lg"
                      style={{ backgroundColor: selectedEvaluation.qualityGrade.color }}
                    >
                      Grade {selectedEvaluation.qualityGrade.grade}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {selectedEvaluation.formattedMetrics.sensitivity}
                      </div>
                      <div className="text-sm text-muted-foreground">Sensitivity</div>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {selectedEvaluation.formattedMetrics.specificity}
                      </div>
                      <div className="text-sm text-muted-foreground">Specificity</div>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {selectedEvaluation.formattedMetrics.f1Score}
                      </div>
                      <div className="text-sm text-muted-foreground">F1 Score</div>
                    </div>
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-3xl font-bold text-primary">
                        {selectedEvaluation.formattedMetrics.auc}
                      </div>
                      <div className="text-sm text-muted-foreground">AUC</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    {selectedEvaluation.qualityGrade.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ROC Curve Tab */}
          <TabsContent value="roc">
            <Card>
              <CardHeader>
                <CardTitle>ROC Curve Analysis</CardTitle>
                <CardDescription>
                  Receiver Operating Characteristic curve showing model performance at different confidence thresholds
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEvaluation ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <ROCCurve 
                      data={selectedEvaluation.metrics.rocCurve} 
                      auc={selectedEvaluation.auc}
                      title={`${selectedEvaluation.documentTitle} (AUC: ${(selectedEvaluation.auc * 100).toFixed(1)}%)`}
                    />
                    {evaluationData && evaluationData.evaluations.length > 1 && (
                      <MultiROCCurves evaluations={evaluationData.evaluations} />
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a document to view its ROC curve
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Confusion Matrix Tab */}
          <TabsContent value="confusion">
            <Card>
              <CardHeader>
                <CardTitle>Confusion Matrix</CardTitle>
                <CardDescription>
                  Detailed breakdown of true positives, false positives, true negatives, and false negatives
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEvaluation ? (
                  <ConfusionMatrix metrics={selectedEvaluation.metrics} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a document to view its confusion matrix
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Results Tab */}
          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Test Results</CardTitle>
                <CardDescription>
                  Query-by-query breakdown of retrieval performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedEvaluation ? (
                  <DetailedResultsTable results={selectedEvaluation.testResults} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Select a document to view detailed results
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon 
}: { 
  title: string; 
  value: string; 
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-secondary/50 rounded-lg text-center">
      <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}

// ROC Curve Component
function ROCCurve({ 
  data, 
  auc, 
  title 
}: { 
  data: Array<{ threshold: number; sensitivity: number; fpr: number }>; 
  auc: number;
  title: string;
}) {
  // SVG dimensions
  const width = 400;
  const height = 400;
  const padding = 50;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  // Scale functions
  const scaleX = (fpr: number) => padding + fpr * graphWidth;
  const scaleY = (sensitivity: number) => padding + (1 - sensitivity) * graphHeight;

  // Generate path for ROC curve
  const pathData = data
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(point.fpr)} ${scaleY(point.sensitivity)}`)
    .join(' ');

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h4 className="text-sm font-medium mb-2 text-center">{title}</h4>
      <svg width={width} height={height} className="mx-auto">
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Diagonal reference line (random classifier) */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={padding}
          stroke="#9ca3af"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#374151"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={padding}
          y2={padding}
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Axis labels */}
        <text x={width / 2} y={height - 10} textAnchor="middle" className="text-xs fill-gray-600">
          False Positive Rate (1 - Specificity)
        </text>
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 20, ${height / 2})`}
          className="text-xs fill-gray-600"
        >
          True Positive Rate (Sensitivity)
        </text>

        {/* ROC Curve */}
        <path
          d={pathData}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
        />

        {/* Data points */}
        {data.map((point, i) => (
          <circle
            key={i}
            cx={scaleX(point.fpr)}
            cy={scaleY(point.sensitivity)}
            r="4"
            fill="#2563eb"
          />
        ))}

        {/* AUC Label */}
        <text
          x={width - padding - 10}
          y={padding + 20}
          textAnchor="end"
          className="text-sm font-bold fill-blue-600"
        >
          AUC = {(auc * 100).toFixed(1)}%
        </text>
      </svg>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Higher curve = better discrimination between relevant/irrelevant queries
      </p>
    </div>
  );
}

// Multi ROC Curves Component
function MultiROCCurves({ evaluations }: { evaluations: EvaluationData[] }) {
  const width = 600;
  const height = 500;
  const padding = 60;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;

  const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c', '#0891b2'];

  const scaleX = (fpr: number) => padding + fpr * graphWidth;
  const scaleY = (sensitivity: number) => padding + (1 - sensitivity) * graphHeight;

  return (
    <div className="bg-white p-4 rounded-lg border overflow-x-auto">
      <svg width={width} height={height} className="mx-auto">
        {/* Background */}
        <rect width={width} height={height} fill="#f9fafb" />

        {/* Grid */}
        <defs>
          <pattern id="grid2" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect 
          x={padding} 
          y={padding} 
          width={graphWidth} 
          height={graphHeight} 
          fill="url(#grid2)" 
        />

        {/* Diagonal reference */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={padding}
          stroke="#9ca3af"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#374151"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={padding}
          y2={padding}
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Axis labels */}
        <text x={width / 2} y={height - 15} textAnchor="middle" className="text-sm fill-gray-700 font-medium">
          False Positive Rate (1 - Specificity)
        </text>
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          transform={`rotate(-90, 20, ${height / 2})`}
          className="text-sm fill-gray-700 font-medium"
        >
          True Positive Rate (Sensitivity)
        </text>

        {/* ROC Curves for each document */}
        {evaluations.map((evalData, idx) => {
          const color = colors[idx % colors.length];
          const pathData = evalData.metrics.rocCurve
            .map((point, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(point.fpr)} ${scaleY(point.sensitivity)}`)
            .join(' ');

          return (
            <g key={evalData.documentId}>
              <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Legend */}
        {evaluations.slice(0, 6).map((evalData, idx) => {
          const color = colors[idx % colors.length];
          return (
            <g key={evalData.documentId} transform={`translate(${width - 180}, ${padding + idx * 25})`}>
              <line x1="0" y1="10" x2="30" y2="10" stroke={color} strokeWidth="2" />
              <text x="40" y="14" className="text-xs fill-gray-700">
                {evalData.documentTitle.substring(0, 15)}...
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Confusion Matrix Component
function ConfusionMatrix({ metrics }: { metrics: EmbeddingMetrics }) {
  const { truePositives, falsePositives, trueNegatives, falseNegatives } = metrics;
  const total = truePositives + falsePositives + trueNegatives + falseNegatives;

  const MatrixCell = ({ 
    value, 
    label, 
    color, 
    row, 
    col 
  }: { 
    value: number; 
    label: string; 
    color: string;
    row: number;
    col: number;
  }) => {
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    return (
      <div 
        className="p-6 rounded-lg text-center"
        style={{ backgroundColor: color }}
      >
        <div className="text-3xl font-bold text-white">{value}</div>
        <div className="text-sm text-white/90">{label}</div>
        <div className="text-xs text-white/70">{percentage}%</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <MatrixCell 
          value={truePositives} 
          label="True Positives" 
          color="#22c55e"
          row={0}
          col={0}
        />
        <MatrixCell 
          value={falsePositives} 
          label="False Positives" 
          color="#ef4444"
          row={0}
          col={1}
        />
        <MatrixCell 
          value={falseNegatives} 
          label="False Negatives" 
          color="#f97316"
          row={1}
          col={0}
        />
        <MatrixCell 
          value={trueNegatives} 
          label="True Negatives" 
          color="#3b82f6"
          row={1}
          col={1}
        />
      </div>

      <div className="text-center space-y-2 text-sm text-muted-foreground">
        <p><strong>True Positives:</strong> Correctly retrieved relevant queries</p>
        <p><strong>False Positives:</strong> Retrieved queries that should have been excluded</p>
        <p><strong>False Negatives:</strong> Missed relevant queries</p>
        <p><strong>True Negatives:</strong> Correctly excluded irrelevant queries</p>
      </div>
    </div>
  );
}

// Detailed Results Table
function DetailedResultsTable({ results }: { results: TestResult[] }) {
  const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
  
  // DEBUG: Log what we received
  console.log('[DEBUG TABLE] results length:', results.length);
  console.log('[DEBUG TABLE] first result expectedRelevant:', results[0]?.expectedRelevant);
  console.log('[DEBUG TABLE] first result type:', typeof results[0]?.expectedRelevant);

  const filteredResults = results.filter(r => {
    if (filter === 'all') return true;
    const isCorrect = r.expectedRelevant === r.wasRetrieved;
    return filter === 'correct' ? isCorrect : !isCorrect;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({results.length})
        </Button>
        <Button 
          variant={filter === 'correct' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('correct')}
        >
          Correct ({results.filter(r => r.expectedRelevant === r.wasRetrieved).length})
        </Button>
        <Button 
          variant={filter === 'incorrect' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setFilter('incorrect')}
        >
          Incorrect ({results.filter(r => r.expectedRelevant !== r.wasRetrieved).length})
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Query</th>
              <th className="p-3 text-left">Category</th>
              <th className="p-3 text-center">Expected</th>
              <th className="p-3 text-center">Result</th>
              <th className="p-3 text-center">Score</th>
              <th className="p-3 text-center">Rank</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result, idx) => {
              const isCorrect = result.expectedRelevant === result.wasRetrieved;
              return (
                <tr 
                  key={result.queryId} 
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}
                >
                  <td className="p-3 max-w-md truncate" title={result.query}>
                    {result.query}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{result.queryCategory}</Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant={result.expectedRelevant ? 'default' : 'secondary'}>
                      {result.expectedRelevant ? 'Relevant' : 'Irrelevant'}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge 
                      variant={isCorrect ? 'default' : 'destructive'}
                      className={isCorrect ? 'bg-green-100 text-green-800' : ''}
                    >
                      {result.wasRetrieved ? 'Retrieved' : 'Not Retrieved'}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    {(result.confidenceScore * 100).toFixed(1)}%
                  </td>
                  <td className="p-3 text-center">
                    {result.rank || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Helper function to get color for grade
function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return '#22c55e';
    case 'B': return '#84cc16';
    case 'C': return '#eab308';
    case 'D': return '#f97316';
    case 'F': return '#ef4444';
    default: return '#6b7280';
  }
}
