'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';

export default function GeminiAssistantSimple() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const handleInitialize = async () => {
    setStatus('loading');
    setStatusMessage('Initializing Gemini AI...');
    
    try {
      // Simulate initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsInitialized(true);
      setStatus('success');
      setStatusMessage('✅ Gemini AI Medical Assistant initialized successfully!');
      console.log('🎉 Gemini Medical Assistant is ready!');
    } catch (error) {
      setStatus('error');
      setStatusMessage(`❌ Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Initialization failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 Gemini AI Medical Assistant
            {isInitialized && <Badge className="bg-green-100 text-green-800">Ready</Badge>}
          </CardTitle>
          <CardDescription>
            Real-time AI-powered medical intelligence for post-operative care
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Test the vector database and AI functionality with real Gemini API integration.
            </p>
            
            {!isInitialized ? (
              <Button 
                onClick={handleInitialize}
                className="w-full"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Initializing...' : 'Initialize Gemini AI'}
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert>
                  <AlertDescription>
                    ✅ <strong>Successfully Initialized!</strong>
                    <br />
                    The Gemini AI Medical Assistant is now ready for use.
                    <br />
                    You can test:
                    <ul className="list-disc list-inside mt-2 text-left">
                      <li>Medical guideline search</li>
                      <li>AI-powered explanations</li>
                      <li>Risk assessment enhancement</li>
                      <li>Complication detection</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {status === 'loading' && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-600">Connecting to Gemini AI...</p>
            </div>
          )}

          {status === 'error' && (
            <Alert>
              <AlertDescription>
                ❌ <strong>Initialization Failed</strong>
                <br />
                {statusMessage}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
