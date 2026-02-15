'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Progress } from '../ui/progress';
import { 
  Database, 
  Search, 
  FileText, 
  Brain, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';

// Mock data for demonstration (in real app, this would come from API)
interface VectorDBStats {
  totalDocuments: number;
  totalEmbeddings: number;
  documentTypes: Record<string, number>;
  surgeryTypes: Record<string, number>;
  lastUpdated: Date;
}

interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: {
    title: string;
    documentType: string;
    surgeryTypes: string[];
    keywords: string[];
  };
}

interface AIExplanation {
  summary: string;
  recommendations: string[];
  riskAssessment: string;
  confidence: number;
}

export default function VectorDBTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<VectorDBStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [aiExplanation, setAIExplanation] = useState<AIExplanation | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Mock initialization
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Simulate loading vector database stats
    setTimeout(() => {
      setStats({
        totalDocuments: 156,
        totalEmbeddings: 1248,
        documentTypes: {
          'clinical_guideline': 45,
          'post_operative_protocol': 38,
          'pain_management': 22,
          'wound_care': 18,
          'complication_guideline': 15,
          'medication_guideline': 12,
          'recovery_milestone': 6
        },
        surgeryTypes: {
          'KNEE_REPLACEMENT': 28,
          'HIP_REPLACEMENT': 24,
          'CARDIAC_BYPASS': 18,
          'ABDOMINAL_SURGERY': 15,
          'C_SECTION': 12,
          'SPINAL_SURGERY': 10,
          'OTHER': 49
        },
        lastUpdated: new Date()
      });
      setStatus('success');
      setStatusMessage('Vector database initialized successfully');
    }, 1000);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('Searching medical guidelines...');

    // Simulate search delay
    setTimeout(() => {
      const mockResults: SearchResult[] = [
        {
          id: '1',
          content: 'Knee replacement surgery requires comprehensive post-operative care to ensure optimal recovery...',
          score: 0.95,
          metadata: {
            title: 'Knee Replacement Post-Operative Care Guidelines',
            documentType: 'post_operative_protocol',
            surgeryTypes: ['KNEE_REPLACEMENT'],
            keywords: ['knee replacement', 'post-operative care', 'pain management', 'rehabilitation']
          }
        },
        {
          id: '2',
          content: 'Effective pain management is crucial for patient comfort and recovery after surgery...',
          score: 0.87,
          metadata: {
            title: 'Post-Operative Pain Management Protocol',
            documentType: 'pain_management',
            surgeryTypes: ['KNEE_REPLACEMENT', 'HIP_REPLACEMENT', 'CARDIAC_BYPASS'],
            keywords: ['pain management', 'analgesics', 'opioids', 'assessment']
          }
        },
        {
          id: '3',
          content: 'Proper wound care is essential to prevent surgical site infections and promote healing...',
          score: 0.82,
          metadata: {
            title: 'Surgical Wound Care and Infection Prevention',
            documentType: 'wound_care',
            surgeryTypes: ['KNEE_REPLACEMENT', 'HIP_REPLACEMENT', 'ABDOMINAL_SURGERY'],
            keywords: ['wound care', 'infection prevention', 'surgical site', 'dressing changes']
          }
        }
      ];

      setSearchResults(mockResults);
      setIsLoading(false);
      setStatus('success');
      setStatusMessage(`Found ${mockResults.length} relevant documents`);
    }, 1500);
  };

  const handleAIExplanation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('Generating AI-powered explanation...');

    // Simulate AI processing delay
    setTimeout(() => {
      const mockAIExplanation: AIExplanation = {
        summary: 'Based on the patient\'s knee replacement surgery on day 5 with moderate pain levels, the recovery appears to be progressing normally within expected parameters.',
        recommendations: [
          'Continue current pain management regimen',
          'Increase physical therapy exercises gradually',
          'Monitor wound site for any signs of infection',
          'Ensure proper elevation and ice application',
          'Schedule follow-up appointment if pain increases'
        ],
        riskAssessment: 'Low to moderate risk. Current symptoms are within expected range for post-operative day 5.',
        confidence: 0.89
      };

      setAIExplanation(mockAIExplanation);
      setIsLoading(false);
      setStatus('success');
      setStatusMessage('AI explanation generated successfully');
    }, 2000);
  };

  const handleInitializeDB = async () => {
    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('Initializing vector database...');

    setTimeout(() => {
      loadMockData();
      setIsLoading(false);
    }, 2000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'loading': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      case 'loading': return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vector Database Testing</h1>
          <p className="text-muted-foreground">Test and visualize ChromaDB medical guidelines integration</p>
        </div>
        <Button onClick={handleInitializeDB} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Database className="w-4 h-4 mr-2" />
          )}
          Initialize Database
        </Button>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <Alert>
          <div className={`flex items-center ${getStatusColor()}`}>
            {getStatusIcon()}
            <AlertTitle className="ml-2">Status</AlertTitle>
          </div>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="ai-explanation">AI Explanation</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Medical guidelines stored
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Embeddings</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalEmbeddings || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Vector representations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Database synchronization
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Vector Database Features</CardTitle>
              <CardDescription>
                Test the AI-powered medical guidelines search and explanation system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">🔍 Semantic Search</h4>
                  <p className="text-sm text-muted-foreground">
                    Find relevant medical guidelines using natural language queries
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">🤖 AI Explanations</h4>
                  <p className="text-sm text-muted-foreground">
                    Get AI-powered explanations based on retrieved medical guidelines
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">📊 Context-Aware</h4>
                  <p className="text-sm text-muted-foreground">
                    Search results filtered by surgery type and recovery day
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">🏥 Clinical Evidence</h4>
                  <p className="text-sm text-muted-foreground">
                    Evidence-based recommendations from trusted medical sources
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Medical Guidelines</CardTitle>
              <CardDescription>
                Search for relevant medical guidelines using natural language
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter your medical query (e.g., 'knee replacement pain management')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Search Results</h3>
                  {searchResults.map((result) => (
                    <Card key={result.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{result.metadata.title}</h4>
                            <Badge variant="secondary">
                              Score: {(result.score * 100).toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {result.content}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">{result.metadata.documentType}</Badge>
                            {result.metadata.surgeryTypes.map((type) => (
                              <Badge key={type} variant="outline">{type}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Explanation Tab */}
        <TabsContent value="ai-explanation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Medical Explanation</CardTitle>
              <CardDescription>
                Get AI-generated explanations based on medical guidelines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Describe patient condition or ask medical question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-h-[100px]"
                />
              </div>
              <Button onClick={handleAIExplanation} disabled={isLoading || !searchQuery.trim()}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Generate AI Explanation
              </Button>

              {aiExplanation && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{aiExplanation.summary}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Confidence</span>
                          <span>{(aiExplanation.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={aiExplanation.confidence * 100} className="mt-1" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{aiExplanation.riskAssessment}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {aiExplanation.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Document Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.documentTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(count / stats.totalDocuments) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Surgery Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.surgeryTypes)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 7)
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{type.replace('_', ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(count / stats.totalDocuments) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
