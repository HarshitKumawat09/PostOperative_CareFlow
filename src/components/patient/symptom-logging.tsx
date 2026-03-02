'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Thermometer, 
  Activity, 
  Heart, 
  Droplets, 
  TrendingUp, 
  Plus, 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  SymptomEntry, 
  SymptomData, 
  SymptomType, 
  SymptomMeasurements,
  MoodLevel,
  RecoveryIntelligenceIntegration 
} from '@/types/symptom-tracking';
import { recoveryIntelligenceService } from '@/ai/recovery-intelligence';

interface SymptomLoggingProps {
  patientId: string;
  surgeryType?: string;
  postOpDay?: number;
  onSymptomLogged: (entry: SymptomEntry) => void;
}

export default function SymptomLogging({ 
  patientId, 
  surgeryType, 
  postOpDay, 
  onSymptomLogged 
}: SymptomLoggingProps) {
  const [symptoms, setSymptoms] = useState<SymptomData[]>([]);
  const [measurements, setMeasurements] = useState<SymptomMeasurements>({});
  const [notes, setNotes] = useState('');
  const [overallWellbeing, setOverallWellbeing] = useState<number>(5);
  const [mood, setMood] = useState<MoodLevel>('fair');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryIntelligence, setRecoveryIntelligence] = useState<RecoveryIntelligenceIntegration | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize recovery intelligence
  useEffect(() => {
    if (surgeryType && postOpDay) {
      const intelligence = recoveryIntelligenceService.getRecoveryIntelligence(surgeryType);
      if (intelligence) {
        const currentPhase = recoveryIntelligenceService.getRecoveryPhase(surgeryType, postOpDay);
        const expectedSymptoms = recoveryIntelligenceService.getExpectedSymptoms(surgeryType, postOpDay);
        
        setRecoveryIntelligence({
          surgeryType: intelligence.surgeryType,
          postOpDay: postOpDay,
          expectedSymptoms: expectedSymptoms.map(s => ({
            symptomType: s.symptom as SymptomType,
            expectedPattern: s.expectedPattern,
            severityRange: [2, 6], // Default range
            normalVariance: s.normalVariance
          })),
          currentPhase: currentPhase ? {
            phase: currentPhase.phase,
            dayRange: currentPhase.dayRange,
            expectedPainLevel: currentPhase.expectedPainLevel,
            mobilityLevel: currentPhase.mobilityLevel
          } : {
            phase: 'Unknown',
            dayRange: [0, 0],
            expectedPainLevel: [0, 10],
            mobilityLevel: 'unknown'
          },
          upcomingMilestones: recoveryIntelligenceService.getUpcomingMilestones(surgeryType, postOpDay).map(m => ({
            day: m.day,
            milestone: m.milestone,
            expectedStatus: m.expectedStatus
          })),
          clinicalAlerts: intelligence.clinicalRules.map(rule => ({
            condition: rule.condition,
            riskLevel: rule.riskLevel,
            action: rule.action,
            appliesToDays: rule.appliesToDays
          }))
        });
      }
    }
  }, [surgeryType, postOpDay]);

  const addSymptom = () => {
    const newSymptom: SymptomData = {
      id: `symptom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symptomType: 'pain',
      severity: 5,
      description: '',
      location: '',
      duration: '',
      triggers: [],
      relief: []
    };
    setSymptoms([...symptoms, newSymptom]);
  };

  const updateSymptom = (id: string, updates: Partial<SymptomData>) => {
    setSymptoms(symptoms.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSymptom = (id: string) => {
    setSymptoms(symptoms.filter(s => s.id !== id));
  };

  const updateMeasurements = (key: keyof SymptomMeasurements, value: any) => {
    setMeasurements(prev => ({ ...prev, [key]: value }));
  };

  const validateEntry = (): string[] => {
    const errors: string[] = [];
    
    if (symptoms.length === 0) {
      errors.push('Please add at least one symptom');
    }
    
    symptoms.forEach(symptom => {
      if (symptom.severity < 0 || symptom.severity > 10) {
        errors.push(`${symptom.symptomType} severity must be between 0-10`);
      }
    });
    
    if (measurements.temperature && (measurements.temperature < 35 || measurements.temperature > 42)) {
      errors.push('Temperature must be between 35-42°C');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateEntry();
    if (errors.length > 0) {
      alert('Please fix the following errors:\n' + errors.join('\n'));
      return;
    }

    setIsSubmitting(true);

    try {
      const entry: SymptomEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        patientId,
        surgeryType,
        postOpDay,
        symptoms,
        medications: [], // Will be implemented in medication tracking
        notes,
        mood,
        overallWellbeing,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Call API to save entry
      const response = await fetch('/api/symptom-tracking/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });

      if (response.ok) {
        onSymptomLogged(entry);
        // Reset form
        setSymptoms([]);
        setMeasurements({});
        setNotes('');
        setOverallWellbeing(5);
        setMood('fair');
      } else {
        throw new Error('Failed to save symptom entry');
      }
    } catch (error) {
      console.error('Error logging symptoms:', error);
      alert('Failed to save symptom entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'bg-green-100 text-green-800 border-green-300';
    if (severity <= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getExpectedSymptoms = () => {
    return recoveryIntelligence?.expectedSymptoms.map(s => s.symptomType) || [];
  };

  const isExpectedSymptom = (symptomType: SymptomType) => {
    return getExpectedSymptoms().includes(symptomType);
  };

  return (
    <div className="space-y-6">
      {/* Recovery Intelligence Context */}
      {recoveryIntelligence && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recovery Context: Day {recoveryIntelligence.postOpDay}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-blue-700">Current Phase:</span>
                <p className="text-blue-900">{recoveryIntelligence.currentPhase.phase}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700">Expected Pain:</span>
                <p className="text-blue-900">
                  {recoveryIntelligence.currentPhase.expectedPainLevel[0]}-{recoveryIntelligence.currentPhase.expectedPainLevel[1]}/10
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700">Expected Symptoms:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getExpectedSymptoms().map((symptom, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                      {symptom.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Symptom Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Log Your Symptoms
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Symptoms List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Symptoms</h4>
              <Button onClick={addSymptom} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Add Symptom
              </Button>
            </div>
            
            {symptoms.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No symptoms added yet</p>
                <p className="text-sm">Click "Add Symptom" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {symptoms.map((symptom) => (
                  <div key={symptom.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Select
                          value={symptom.symptomType}
                          onValueChange={(value: SymptomType) => 
                            updateSymptom(symptom.id, { symptomType: value })
                          }
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pain">Pain</SelectItem>
                            <SelectItem value="fever">Fever</SelectItem>
                            <SelectItem value="swelling">Swelling</SelectItem>
                            <SelectItem value="stiffness">Stiffness</SelectItem>
                            <SelectItem value="fatigue">Fatigue</SelectItem>
                            <SelectItem value="nausea">Nausea</SelectItem>
                            <SelectItem value="dizziness">Dizziness</SelectItem>
                            <SelectItem value="shortness_of_breath">Shortness of Breath</SelectItem>
                            <SelectItem value="chest_pain">Chest Pain</SelectItem>
                            <SelectItem value="wound_drainage">Wound Drainage</SelectItem>
                            <SelectItem value="numbness">Numbness</SelectItem>
                            <SelectItem value="weakness">Weakness</SelectItem>
                            <SelectItem value="insomnia">Insomnia</SelectItem>
                            <SelectItem value="constipation">Constipation</SelectItem>
                            <SelectItem value="diarrhea">Diarrhea</SelectItem>
                            <SelectItem value="headache">Headache</SelectItem>
                            <SelectItem value="muscle_spasms">Muscle Spasms</SelectItem>
                            <SelectItem value="redness">Redness</SelectItem>
                            <SelectItem value="warmth">Warmth</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {isExpectedSymptom(symptom.symptomType) && (
                          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300 ml-2">
                            Expected
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSymptom(symptom.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Severity (0-10)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={symptom.severity}
                            onChange={(e) => updateSymptom(symptom.id, { severity: parseInt(e.target.value) })}
                            className="flex-1"
                          />
                          <Badge className={getSeverityColor(symptom.severity)}>
                            {symptom.severity}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Location</label>
                        <Input
                          placeholder="e.g., left knee, incision site"
                          value={symptom.location || ''}
                          onChange={(e) => updateSymptom(symptom.id, { location: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Duration</label>
                        <Input
                          placeholder="e.g., 2 hours, constant"
                          value={symptom.duration || ''}
                          onChange={(e) => updateSymptom(symptom.id, { duration: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Input
                          placeholder="Describe the symptom"
                          value={symptom.description || ''}
                          onChange={(e) => updateSymptom(symptom.id, { description: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Measurements */}
          {showAdvanced && (
            <div>
              <h4 className="font-medium mb-3">Measurements</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Thermometer className="w-4 h-4" />
                    Temperature (°C)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={measurements.temperature || ''}
                    onChange={(e) => updateMeasurements('temperature', parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    Heart Rate (BPM)
                  </label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={measurements.heartRate || ''}
                    onChange={(e) => updateMeasurements('heartRate', parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Blood Pressure</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="120"
                      value={measurements.bloodPressure?.systolic || ''}
                      onChange={(e) => updateMeasurements('bloodPressure', {
                        ...measurements.bloodPressure,
                        systolic: parseInt(e.target.value)
                      })}
                    />
                    <span className="self-center">/</span>
                    <Input
                      type="number"
                      placeholder="80"
                      value={measurements.bloodPressure?.diastolic || ''}
                      onChange={(e) => updateMeasurements('bloodPressure', {
                        ...measurements.bloodPressure,
                        diastolic: parseInt(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    <Droplets className="w-4 h-4" />
                    Oxygen (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="98"
                    value={measurements.oxygenSaturation || ''}
                    onChange={(e) => updateMeasurements('oxygenSaturation', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Overall Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Overall Wellbeing (1-10)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={overallWellbeing}
                  onChange={(e) => setOverallWellbeing(parseInt(e.target.value))}
                  className="flex-1"
                />
                <Badge variant="outline">{overallWellbeing}</Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Mood</label>
              <Select value={mood} onValueChange={(value: MoodLevel) => setMood(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very_poor">Very Poor</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="very_good">Very Good</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium">Additional Notes</label>
            <Textarea
              placeholder="Any additional information about your symptoms or how you're feeling..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || symptoms.length === 0}
              className="min-w-32"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Log Symptoms
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
