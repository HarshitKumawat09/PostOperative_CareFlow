'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MessageCircle, Hospital, Loader2, FileText, AlertTriangle, Volume2, Languages, VolumeX, Activity, Calendar, TrendingUp, Clock } from 'lucide-react';
import { translationService } from '@/services/translation-service';
import { voiceService } from '@/services/voice-service';

interface QAResponse {
  answer: string;
  riskLevel: string;
  sources: Array<{
    protocolTitle: string;
    department: string;
    surgeryType: string;
    relevanceScore: number;
    excerpt: string;
  }>;
  protocolsUsed: number;
  patientContext: string;
  whenToContactDoctor: string;
  searchQuery: string;
  responseTime: string;
  recoveryIntelligence?: {
    surgeryType: string;
    currentPhase: string;
    postOpDay: number | null;
    expectedSymptoms: string[];
    upcomingMilestones: Array<{ day: number; milestone: string }>;
    recoveryContext: string | null;
    clinicalRiskAssessment: {
      riskLevel: string;
      reasoning: string;
      appliedRules: string[];
    };
  };
}

export default function HospitalQA() {
  const [question, setQuestion] = useState('');
  const [patientContext, setPatientContext] = useState('');
  const [response, setResponse] = useState<QAResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translatedAnswer, setTranslatedAnswer] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);

  // Check voice support on mount
  React.useEffect(() => {
    const checkVoiceSupport = async () => {
      try {
        await voiceService.initialize();
        setVoiceSupported(voiceService.isVoiceSupported());
      } catch (error) {
        console.error('Voice service initialization failed:', error);
        setVoiceSupported(false);
      }
    };
    checkVoiceSupport();
  }, []);

  const askMedicalQuestion = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/medical-qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          patientContext: patientContext.trim()
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setResponse(data);
        
        // Auto-translate answer if not English
        if (selectedLanguage !== 'en') {
          const translation = await translationService.translateText(data.answer, selectedLanguage);
          setTranslatedAnswer(translation.translatedText);
        } else {
          setTranslatedAnswer(data.answer);
        }
      } else {
        throw new Error(data.error || 'Failed to get medical guidance');
      }
    } catch (error) {
      console.error('Error asking medical question:', error);
      setResponse({
        answer: 'Sorry, I encountered an error processing your question. Please try again or contact your healthcare provider.',
        riskLevel: 'Unknown',
        sources: [],
        protocolsUsed: 0,
        patientContext: 'Error',
        whenToContactDoctor: 'Contact your healthcare provider immediately',
        searchQuery: question.trim(),
        responseTime: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Toggle speech
  const toggleSpeech = async () => {
    if (isSpeaking) {
      voiceService.stop();
      setIsSpeaking(false);
    } else {
      const textToSpeak = translatedAnswer || response?.answer || '';
      if (textToSpeak) {
        try {
          // Check if voice is supported
          if (!voiceService.isVoiceSupported()) {
            alert('🔊 Voice synthesis not supported in this browser. Text will be displayed instead.');
            return;
          }
          
          await voiceService.speak(textToSpeak, { 
            language: selectedLanguage === 'en' ? 'en-US' : `${selectedLanguage}-IN` 
          });
          setIsSpeaking(true);
        } catch (error) {
          console.error('Speech error:', error);
          alert('🔊 Voice synthesis failed. Please read the text instead.');
          setIsSpeaking(false);
        }
      }
    }
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    if (response && value !== 'en') {
      translationService.translateText(response.answer, value).then(translation => {
        setTranslatedAnswer(translation.translatedText);
      });
    } else if (response) {
      setTranslatedAnswer(response.answer);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Ask Your Medical Question
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Get answers based on our hospital's specific medical protocols and guidelines
        </p>
      </div>

      {/* Language Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4" />
              <label className="text-sm font-medium">Language:</label>
            </div>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {translationService.getSupportedLanguages().map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Question Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Ask Your Medical Question
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Your Question <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Is swelling normal after knee surgery? When should I call the doctor?"
              rows={3}
              className="resize-none"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Your Medical Context (Optional)
            </label>
            <Input
              value={patientContext}
              onChange={(e) => setPatientContext(e.target.value)}
              placeholder="e.g., 3 days post knee replacement surgery, mild swelling, pain level 3/10"
              className="w-full"
              disabled={isLoading}
            />
          </div>

          <Button 
            onClick={askMedicalQuestion} 
            disabled={isLoading || !question.trim()}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting Hospital Guidance...
              </>
            ) : (
              <>
                <Hospital className="w-4 h-4 mr-2" />
                Get Medical Answer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Hospital Medical Guidance
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={response.protocolsUsed > 0 ? "default" : "secondary"}>
                  {response.protocolsUsed} protocols used
                </Badge>
                {response.patientContext === 'Provided' && (
                  <Badge variant="outline">Context considered</Badge>
                )}
                {/* Voice Control */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSpeech}
                  disabled={!translatedAnswer || !voiceSupported}
                  className="flex items-center gap-1"
                  title={voiceSupported ? "Click to speak the answer" : "Voice not supported in this browser"}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Speak
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Risk Level Indicator */}
            <div className="flex items-center gap-2">
              <span className="font-medium">Risk Level:</span>
              <Badge className={getRiskLevelColor(response.riskLevel)}>
                {response.riskLevel}
              </Badge>
            </div>

            {/* Answer */}
            <Alert>
              <AlertDescription className="text-base leading-relaxed">
                {translatedAnswer || response.answer}
              </AlertDescription>
            </Alert>

            {/* Sources */}
            {response.sources.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Source Protocols Used:
                </h4>
                <div className="space-y-2">
                  {response.sources.map((source, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{source.protocolTitle}</span>
                        <Badge variant="outline" className="text-xs">
                          {(source.relevanceScore * 100).toFixed(0)}% relevant
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">
                        {source.department} • {source.surgeryType}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {source.excerpt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recovery Intelligence */}
            {response.recoveryIntelligence && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Your Recovery Journey:
                </h4>
                <div className="space-y-3">
                  {/* Current Phase */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-sm text-blue-800">
                        Current Phase: {response.recoveryIntelligence.currentPhase}
                      </span>
                    </div>
                    {response.recoveryIntelligence.postOpDay && (
                      <div className="text-xs text-blue-600">
                        Day {response.recoveryIntelligence.postOpDay} of recovery
                      </div>
                    )}
                    {response.recoveryIntelligence.recoveryContext && (
                      <div className="text-xs text-blue-700 mt-1">
                        {response.recoveryIntelligence.recoveryContext}
                      </div>
                    )}
                  </div>

                  {/* Expected Symptoms */}
                  {response.recoveryIntelligence.expectedSymptoms.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-sm text-green-800">
                          Expected Symptoms:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {response.recoveryIntelligence.expectedSymptoms.map((symptom, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Milestones */}
                  {response.recoveryIntelligence.upcomingMilestones.length > 0 && (
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-sm text-purple-800">
                          Upcoming Milestones:
                        </span>
                      </div>
                      <div className="space-y-1">
                        {response.recoveryIntelligence.upcomingMilestones.map((milestone, index) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-purple-700">
                            <Clock className="w-3 h-3" />
                            <span>Day {milestone.day}: {milestone.milestone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical Risk Assessment */}
                  {response.recoveryIntelligence.clinicalRiskAssessment && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-sm text-orange-800">
                          Clinical Assessment:
                        </span>
                        <Badge className={`text-xs ${getRiskLevelColor(response.recoveryIntelligence.clinicalRiskAssessment.riskLevel)}`}>
                          {response.recoveryIntelligence.clinicalRiskAssessment.riskLevel}
                        </Badge>
                      </div>
                      <div className="text-xs text-orange-700">
                        {response.recoveryIntelligence.clinicalRiskAssessment.reasoning}
                      </div>
                      {response.recoveryIntelligence.clinicalRiskAssessment.appliedRules.length > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          Rules applied: {response.recoveryIntelligence.clinicalRiskAssessment.appliedRules.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Guidance */}
            {response.whenToContactDoctor && (
              <Alert>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-orange-500" />
                  <div>
                    <strong>When to Contact Doctor:</strong>
                    <p className="text-sm mt-1">{response.whenToContactDoctor}</p>
                  </div>
                </div>
              </Alert>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-500 border-t pt-2">
              <div className="flex justify-between">
                <span>Query: "{response.searchQuery}"</span>
                <span>Response: {response.responseTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
