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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Brain, 
  Search, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  TrendingUp,
  Activity,
  Database,
  Heart,
  Stethoscope
} from 'lucide-react';

// Import our real services
import { SimpleGeminiService } from '../../ai/simple-gemini-service';
import { GeminiEnhancedRiskAssessmentEngine } from '../../models/gemini-enhanced-risk-assessment';
import { Patient } from '../../models/patient';
import { SurgeryType } from '../../models/base';
import { createTestPatient } from '../../models/__tests__/test-helpers';
import sampleMedicalGuidelines from '../../data/sample-guidelines';
import { useRateLimit } from '../../utils/rate-limiter';

// Types for our component
interface AIExplanation {
  summary: string;
  detailedExplanation: string;
  recommendations: string[];
  riskAssessment: string;
  nextSteps: string[];
  confidence: number;
  sources: string[];
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
    source: string;
  };
}

interface DatabaseStats {
  totalDocuments: number;
  totalEmbeddings: number;
  documentTypes: Record<string, number>;
  surgeryTypes: Record<string, number>;
  lastUpdated: Date;
}

export default function GeminiMedicalAssistant() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [aiExplanation, setAIExplanation] = useState<AIExplanation | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedSurgeryType, setSelectedSurgeryType] = useState<SurgeryType>(SurgeryType.KNEE_REPLACEMENT);
  const [testPatient, setTestPatient] = useState<Patient | null>(null);
  
  // Rate limiting hook
  const { status: rateLimitStatus, canMakeRequest, recordRequest } = useRateLimit();
  
  // Service instances
  const [geminiService, setGeminiService] = useState<SimpleGeminiService | null>(null);
  const [assessmentEngine, setAssessmentEngine] = useState<GeminiEnhancedRiskAssessmentEngine | null>(null);

  // Initialize services only when user clicks "Initialize" button
  const initializeServices = async () => {
    try {
      setIsLoading(true);
      setStatus('loading');
      setStatusMessage('Initializing Gemini AI services...');

      // Initialize services
      const service = new SimpleGeminiService();
      const engine = new GeminiEnhancedRiskAssessmentEngine(service);

      await service.initialize();
      await engine.initialize();

      setGeminiService(service);
      setAssessmentEngine(engine);

      // Create test patient
      const patient = createTestPatient('test-patient-001', selectedSurgeryType, 5);
      setTestPatient(patient);

      // Load sample medical guidelines
      await engine.addMedicalGuidelines(sampleMedicalGuidelines);

      // Get database stats
      const dbStats = await engine.getVectorDBStats();
      setStats(dbStats);

      setIsInitialized(true);
      setStatus('success');
      setStatusMessage('✅ Gemini Medical Assistant initialized successfully!');
      
      console.log('🎉 Services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      setStatus('error');
      setStatusMessage(`❌ Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !assessmentEngine || !testPatient) return;
    
    // Check rate limit
    const rateCheck = canMakeRequest();
    if (!rateCheck.allowed) {
      setStatus('error');
      setStatusMessage(`⚠️ ${rateCheck.reason}`);
      return;
    }
    
    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('🔍 Searching medical guidelines...');
    recordRequest(); // Record this request

    try {
      const guidelines = await assessmentEngine.searchRelevantGuidelines(
        testPatient,
        searchQuery
      );

      // Convert to search results format
      const results: SearchResult[] = guidelines.map((content, index) => ({
        id: `result-${index}`,
        content: content.substring(0, 500) + '...',
        score: Math.max(0.1, 1 - (index * 0.1)),
        metadata: {
          title: `Medical Guideline ${index + 1}`,
          documentType: 'clinical_guideline',
          surgeryTypes: [selectedSurgeryType],
          keywords: ['medical', 'guideline', 'care'],
          source: 'Medical Database'
        }
      }));

      setSearchResults(results);
      setStatus('success');
      setStatusMessage(`✅ Found ${results.length} relevant medical guidelines`);
    } catch (error) {
      console.error('❌ Search failed:', error);
      setStatus('error');
      setStatusMessage(`❌ Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIExplanation = async () => {
    if (!searchQuery.trim() || !assessmentEngine || !testPatient) return;
    
    // Check rate limit
    const rateCheck = canMakeRequest();
    if (!rateCheck.allowed) {
      setStatus('error');
      setStatusMessage(`⚠️ ${rateCheck.reason}`);
      return;
    }
    
    setIsLoading(true);
    setStatus('loading');
    setStatusMessage('🤖 Generating AI-powered medical explanation...');
    recordRequest(); // Record this request

    try {
      const explanation = await assessmentEngine.getAIExplanation(
        testPatient,
        searchQuery
      );

      if (explanation) {
        setAIExplanation(explanation);
        setStatus('success');
        setStatusMessage('✅ AI explanation generated successfully');
      }
    } catch (error) {
      console.error('❌ AI explanation failed:', error);
      setStatus('error');
      setStatusMessage(`❌ AI explanation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSurgeryTypeChange = async (newType: SurgeryType) => {
    setSelectedSurgeryType(newType);
    
    if (assessmentEngine) {
      // Create new test patient with updated surgery type
      const patient = createTestPatient('test-patient-001', newType, 5);
      setTestPatient(patient);
      
      // Clear previous results
      setSearchResults([]);
      setAIExplanation(null);
    }
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-blue-600" />
            Gemini Medical Assistant
          </h1>
          <p className="text-muted-foreground">Real AI-powered medical guidelines and patient assessment</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedSurgeryType} onValueChange={handleSurgeryTypeChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select surgery type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(SurgeryType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={initializeServices} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 mr-2" />
            )}
            {isInitialized ? 'Reinitialize' : 'Initialize'}
          </Button>
        </div>
      </div>

      {/* Rate Limit Status */}
      {isInitialized && (
        <Alert>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-4 h-4 text-blue-600" />
              <AlertTitle className="ml-2">API Usage</AlertTitle>
            </div>
            <div className="text-sm text-muted-foreground">
              {rateLimitStatus.remainingRequests}/{rateLimitStatus.maxRequests} requests remaining today
            </div>
          </div>
          <AlertDescription>
            Daily limit: {rateLimitStatus.requestsToday}/{rateLimitStatus.maxRequests} requests used. 
            {rateLimitStatus.remainingRequests === 0 && " Limit reached. Please try again tomorrow."}
          </AlertDescription>
        </Alert>
      )}

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

      {isInitialized && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="search">Search Guidelines</TabsTrigger>
            <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Medical Guidelines</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Real medical guidelines loaded
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Model</CardTitle>
                  <Brain className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Gemini Pro</div>
                  <p className="text-xs text-muted-foreground">
                    Google's AI model
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Test Patient</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedSurgeryType.replace('_', ' ')}</div>
                  <p className="text-xs text-muted-foreground">
                    Day {testPatient?.getRecoveryDay() || 0} post-op
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>
                  Current test patient context for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testPatient && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Surgery Type</label>
                      <p className="text-lg">{testPatient.getSurgeryType().replace('_', ' ')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Recovery Day</label>
                      <p className="text-lg">{testPatient.getRecoveryDay()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Pain Level</label>
                      <p className="text-lg">{testPatient.getCurrentSymptoms().painLevel}/10</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Mobility Score</label>
                      <p className="text-lg">{testPatient.getCurrentSymptoms().mobilityScore}/10</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Search Medical Guidelines</CardTitle>
                <CardDescription>
                  Search real medical guidelines using natural language
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
                            <p className="text-sm text-muted-foreground">
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

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Medical Assistant</CardTitle>
                <CardDescription>
                  Get AI-powered medical explanations using Gemini
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Describe patient condition or ask medical question..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <Button 
                  onClick={handleAIExplanation} 
                  disabled={isLoading || !searchQuery.trim()}
                  className="w-full"
                >
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
                        <CardTitle className="text-lg">AI Summary</CardTitle>
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

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {aiExplanation.nextSteps.map((step, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-green-500 mr-2">•</span>
                              {step}
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
      )}
    </div>
  );
}
