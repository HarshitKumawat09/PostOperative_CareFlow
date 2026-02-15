// Simple Medical Guidelines Ingestion Component
// Clean, fresh implementation for Phase 2 - NOW WITH REAL DATABASE STORAGE via API

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Database,
  BookOpen,
  Plus,
  X,
  Search,
  Eye
} from 'lucide-react';

import { SurgeryType, RiskLevel } from '../../models/base';
import { MedicalDocumentType } from '../../models/vector-db';

// Search result interface
interface SearchResult {
  content: string;
  score: number;
  metadata: any;
}

// Simple document interface
interface SimpleDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  documentType: MedicalDocumentType;
  surgeryTypes: SurgeryType[];
  keywords: string[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  chunks: number;
  uploadedAt: Date;
}

export default function SimpleMedicalIngestion() {
  const [activeTab, setActiveTab] = useState('upload');
  const [documents, setDocuments] = useState<SimpleDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [dbStats, setDbStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: '',
    documentType: MedicalDocumentType.CLINICAL_GUIDELINE,
    surgeryTypes: [] as SurgeryType[],
    keywords: [] as string[],
    riskLevel: RiskLevel.LOW
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          content,
          title: file.name.replace(/\.[^/.]+$/, ""),
          source: file.name
        }));
      };
      reader.readAsText(file);
    }
  };

  // Add keyword
  const addKeyword = (keyword: string) => {
    if (keyword.trim() && !formData.keywords.includes(keyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword.trim()]
      }));
    }
  };

  // Remove keyword
  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  // Add surgery type
  const addSurgeryType = (surgeryType: SurgeryType) => {
    if (!formData.surgeryTypes.includes(surgeryType)) {
      setFormData(prev => ({
        ...prev,
        surgeryTypes: [...prev.surgeryTypes, surgeryType]
      }));
    }
  };

  // Remove surgery type
  const removeSurgeryType = (surgeryType: SurgeryType) => {
    setFormData(prev => ({
      ...prev,
      surgeryTypes: prev.surgeryTypes.filter(s => s !== surgeryType)
    }));
  };

  // Initialize database stats from API
  React.useEffect(() => {
    loadDatabaseStats();
  }, []);

  // Load database stats from API
  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/ingest');
      const data = await response.json();
      if (data.success) {
        setDbStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  // Process document with REAL database storage via API
  const processDocument = async () => {
    if (!formData.content.trim() || !formData.title) {
      setStatus('error');
      setStatusMessage('Please provide document title and content');
      return;
    }

    setIsProcessing(true);
    setStatus('processing');
    setStatusMessage('🚀 Processing medical guidelines...');

    const newDoc: SimpleDocument = {
      id: `doc-${Date.now()}`,
      title: formData.title,
      content: formData.content,
      source: formData.source,
      documentType: formData.documentType,
      surgeryTypes: formData.surgeryTypes,
      keywords: formData.keywords,
      status: 'processing',
      chunks: 0,
      uploadedAt: new Date()
    };

    setDocuments(prev => [...prev, newDoc]);

    try {
      // REAL PROCESSING WITH API
      setProgress(20);
      setStatusMessage('📝 Cleaning and preparing document...');

      // Create metadata for the document
      const metadata = {
        title: formData.title,
        source: formData.source,
        documentType: formData.documentType,
        surgeryTypes: formData.surgeryTypes,
        keywords: formData.keywords,
        riskLevel: formData.riskLevel
      };

      setProgress(40);
      setStatusMessage('🔍 Generating embeddings with OpenAI...');

      // Call ingestion API
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formData.content,
          metadata
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.details || 'API call failed');
      }

      setProgress(70);
      setStatusMessage('💾 Storing in ChromaDB vector database...');

      // Update database stats
      setDbStats(result.stats);

      setProgress(90);
      setStatusMessage('✅ Validating and finalizing...');

      // Update document status
      setDocuments(prev => prev.map(doc => 
        doc.id === newDoc.id 
          ? { ...doc, status: 'completed', chunks: result.chunkCount }
          : doc
      ));

      setProgress(100);
      setStatus('success');
      setStatusMessage(`✅ Medical guidelines ingested successfully! Stored ${result.chunkCount} chunks in ChromaDB.`);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        source: '',
        documentType: MedicalDocumentType.CLINICAL_GUIDELINE,
        surgeryTypes: [],
        keywords: [],
        riskLevel: RiskLevel.LOW
      });

    } catch (error) {
      console.error('REAL ingestion error:', error);
      setStatus('error');
      setStatusMessage(`❌ Database storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setDocuments(prev => prev.map(doc => 
        doc.id === newDoc.id 
          ? { 
              ...doc, 
              status: 'error', 
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          : doc
      ));
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Search documents via API
  const searchDocuments = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 5
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults(result.results);
      } else {
        throw new Error(result.details || 'Search failed');
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setStatus('error');
      setStatusMessage('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: SimpleDocument['status']) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Medical Guidelines Ingestion</h1>
          <p className="text-muted-foreground">Build your medical brain with authoritative guidelines</p>
        </div>
      </div>

      {/* Database Stats */}
      {dbStats && (
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Vector Database Status</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total Documents:</span>
                <span className="ml-2 font-medium text-blue-900">{dbStats.totalDocuments || 0}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Embeddings:</span>
                <span className="ml-2 font-medium text-blue-900">{dbStats.totalEmbeddings || 0}</span>
              </div>
              <div>
                <span className="text-blue-700">Last Updated:</span>
                <span className="ml-2 font-medium text-blue-900">
                  {dbStats.lastUpdated ? new Date(dbStats.lastUpdated).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Alert */}
      {statusMessage && (
        <Alert>
          <div className={`flex items-center ${
            status === 'success' ? 'text-green-600' : 
            status === 'error' ? 'text-red-600' : 
            status === 'processing' ? 'text-blue-600' : 'text-gray-600'
          }`}>
            {status === 'processing' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {status === 'success' && <CheckCircle className="w-4 h-4 mr-2" />}
            {status === 'error' && <AlertCircle className="w-4 h-4 mr-2" />}
          </div>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      )}

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="text">Text Input</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Medical Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <Input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Supported formats: PDF, TXT, MD
                </p>
              </div>

              {/* Document Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Knee Replacement Post-Operative Care"
                  />
                </div>
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="e.g., Mayo Clinic"
                  />
                </div>
              </div>

              {/* Document Type */}
              <div>
                <Label>Document Type</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value: MedicalDocumentType) => 
                    setFormData(prev => ({ ...prev, documentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MedicalDocumentType).map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Surgery Types */}
              <div>
                <Label>Surgery Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.surgeryTypes.map(surgeryType => (
                    <Badge key={surgeryType} variant="secondary" className="cursor-pointer"
                           onClick={() => removeSurgeryType(surgeryType)}>
                      {surgeryType.replace('_', ' ')} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={addSurgeryType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Add surgery type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(SurgeryType)
                      .filter(type => !formData.surgeryTypes.includes(type))
                      .map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Keywords */}
              <div>
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="cursor-pointer"
                           onClick={() => removeKeyword(keyword)}>
                      {keyword} <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add keyword and press Enter..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addKeyword(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input');
                      if (input) {
                        addKeyword(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={processDocument} 
                disabled={isProcessing || !formData.content.trim() || !formData.title}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Ingest Medical Guidelines
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Input Tab */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Direct Text Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Paste your medical guidelines here..."
                className="min-h-[300px]"
              />
              <div className="text-sm text-muted-foreground">
                Character count: {formData.content.length}
              </div>
              <Button 
                onClick={processDocument} 
                disabled={isProcessing || !formData.content.trim() || !formData.title}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Process Text
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Medical Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for medical guidelines..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchDocuments();
                    }
                  }}
                />
                <Button onClick={searchDocuments} disabled={isSearching || !searchQuery.trim()}>
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Search Results ({searchResults.length}):</h3>
                  {searchResults.map((result: SearchResult, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">
                            Relevance: {(result.score * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm mb-2">{result.content}</p>
                        </div>
                        <Badge variant="outline">
                          {(result.score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      {result.metadata && (
                        <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
                          <p><strong>Source:</strong> {result.metadata.source || 'Unknown'}</p>
                          <p><strong>Type:</strong> {result.metadata.documentType || 'Unknown'}</p>
                          <p><strong>Keywords:</strong> {result.metadata.keywords?.join(', ') || 'None'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                  <p className="text-sm text-muted-foreground">Try different keywords or upload more documents</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ingested Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No documents ingested yet</p>
                  <Button onClick={() => setActiveTab('upload')} className="mt-4">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload First Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{doc.title}</h3>
                            {getStatusBadge(doc.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            Source: {doc.source} • {doc.uploadedAt.toLocaleDateString()}
                          </p>
                          <div className="flex flex-wrap gap-2 mb-2">
                            <Badge variant="outline">{doc.documentType}</Badge>
                            {doc.surgeryTypes.map(surgeryType => (
                              <Badge key={surgeryType} variant="secondary">
                                {surgeryType.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                          {doc.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {doc.keywords.map(keyword => (
                                <span key={keyword} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{doc.chunks} chunks</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
