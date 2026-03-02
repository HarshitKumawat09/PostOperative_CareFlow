'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Calendar, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  Eye,
  Heart
} from 'lucide-react';
import SymptomLogging from './symptom-logging';
import SymptomVisualization from './symptom-visualization';
import { SymptomEntry, RiskAlert } from '@/types/symptom-tracking';
import { safeLocaleDateString, safeLocaleTimeString, safeGetTime } from '@/utils/date-utils';
import { recoveryIntelligenceService } from '@/ai/recovery-intelligence';

interface SymptomDashboardProps {
  patientId: string;
  surgeryType?: string;
  postOpDay?: number;
}

export default function SymptomDashboard({ 
  patientId, 
  surgeryType, 
  postOpDay 
}: SymptomDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [entries, setEntries] = useState<SymptomEntry[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [recoveryProgress, setRecoveryProgress] = useState<RecoveryProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load symptom data
  useEffect(() => {
    loadSymptomData();
  }, [patientId]);

  const loadSymptomData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/symptom-tracking/log?patientId=${patientId}&limit=50`);
      const data: SymptomTrackingResponse = await response.json();
      
      if (data.success && data.data) {
        const entriesArray = Array.isArray(data.data) ? data.data : [data.data];
        setEntries(entriesArray);
        setAlerts(data.alerts || []);
        setRecoveryProgress(data.progress || null);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error loading symptom data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSymptomLogged = (newEntry: SymptomEntry) => {
    setEntries(prev => [newEntry, ...prev]);
    loadSymptomData(); // Refresh to get updated analysis
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch('/api/symptom-tracking/alerts/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, patientId })
      });
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const getRecentEntries = () => {
    return entries.slice(0, 5);
  };

  const getActiveAlerts = () => {
    return alerts.filter(alert => !alert.acknowledged && !alert.reviewedByStaff);
  };

  const getTodaysEntry = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return entries.find(entry => {
      const entryDate = new Date(safeGetTime(entry.timestamp));
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
  };

  const getAveragePain = () => {
    const recentEntries = entries.slice(0, 7); // Last 7 entries
    const painValues = recentEntries
      .flatMap(entry => entry.symptoms)
      .filter(symptom => symptom.symptomType === 'pain')
      .map(symptom => symptom.severity);
    
    if (painValues.length === 0) return 0;
    return painValues.reduce((sum, pain) => sum + pain, 0) / painValues.length;
  };

  const getMostFrequentSymptom = () => {
    const symptomCounts: { [key: string]: number } = {};
    
    entries.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        symptomCounts[symptom.symptomType] = (symptomCounts[symptom.symptomType] || 0) + 1;
      });
    });

    const sorted = Object.entries(symptomCounts).sort(([,a], [,b]) => b - a);
    return sorted.length > 0 ? sorted[0][0] : null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 animate-spin" />
          <span>Loading symptom data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Symptom Tracking
          </h1>
          {surgeryType && postOpDay && (
            <p className="text-gray-600">
              {surgeryType.replace('_', ' ')} - Day {postOpDay}
            </p>
          )}
        </div>
        
        {lastUpdated && (
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Active Alerts */}
      {getActiveAlerts().length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <strong>Active Alerts ({getActiveAlerts().length})</strong>
              {getActiveAlerts().slice(0, 3).map(alert => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{alert.title}</span>
                    <p className="text-sm text-gray-600">{alert.description}</p>
                    {alert.reviewedByStaff && (
                      <p className="text-sm text-green-700 mt-1">
                        Reviewed by staff{alert.staffRemark ? `: ${alert.staffRemark}` : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                </div>
              ))}
              {getActiveAlerts().length > 3 && (
                <p className="text-sm text-gray-600">
                  ...and {getActiveAlerts().length - 3} more alerts
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Today's Entry</p>
                <p className="text-lg font-semibold">
                  {getTodaysEntry() ? 'Logged' : 'Not logged'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Pain (7 days)</p>
                <p className="text-lg font-semibold">{getAveragePain().toFixed(1)}/10</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-lg font-semibold">{entries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-lg font-semibold">{getActiveAlerts().length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="log">Log Symptoms</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getRecentEntries().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2" />
                    <p>No symptom entries yet</p>
                    <p className="text-sm">Start by logging your first symptoms</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getRecentEntries().map((entry) => (
                      <div key={entry.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">
                            {safeLocaleDateString(entry.timestamp)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {entry.symptoms.length} symptoms
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {entry.symptoms.slice(0, 3).map((symptom) => (
                            <Badge key={symptom.id} variant="outline" className="text-xs">
                              {symptom.symptomType.replace('_', ' ')} ({symptom.severity}/10)
                            </Badge>
                          ))}
                          {entry.symptoms.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.symptoms.length - 3} more
                            </Badge>
                          )}
                        </div>
                        {entry.overallWellbeing && (
                          <div className="mt-2 text-xs text-gray-600">
                            Overall wellbeing: {entry.overallWellbeing}/10
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recovery Progress */}
            {recoveryProgress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recovery Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm font-bold">{recoveryProgress.overallProgress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${recoveryProgress.overallProgress}%` }}
                        />
                      </div>
                    </div>

                    {/* Current Status */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-blue-800">Current Phase</span>
                        <p className="font-semibold text-blue-900">{recoveryProgress.currentPhase}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-800">Post-Op Day</span>
                        <p className="font-semibold text-green-900">{recoveryProgress.postOpDay}</p>
                      </div>
                    </div>

                    {/* Next Milestone */}
                    {recoveryProgress.nextMilestone && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-yellow-800 mb-1">Next Milestone</h4>
                        <p className="font-semibold text-yellow-900">
                          {recoveryProgress.nextMilestone.milestone}
                        </p>
                        <p className="text-sm text-yellow-600">
                          Day {recoveryProgress.nextMilestone.day} ({recoveryProgress.nextMilestone.daysUntil} days)
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="log">
          <SymptomLogging
            patientId={patientId}
            surgeryType={surgeryType}
            postOpDay={postOpDay}
            onSymptomLogged={handleSymptomLogged}
          />
        </TabsContent>

        <TabsContent value="trends">
          <SymptomVisualization
            patientId={patientId}
            surgeryType={surgeryType}
            postOpDay={postOpDay}
            entries={entries}
            recoveryProgress={recoveryProgress || undefined}
          />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Symptom History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2" />
                  <p>No symptom history available</p>
                  <p className="text-sm">Start logging symptoms to see your history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div key={entry.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-medium">
                            {safeLocaleDateString(entry.timestamp)} at {safeLocaleTimeString(entry.timestamp)}
                          </span>
                          {entry.postOpDay && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Day {entry.postOpDay}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.symptoms.length} symptoms logged
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-sm mb-2">Symptoms</h5>
                          <div className="space-y-1">
                            {entry.symptoms.map((symptom) => (
                              <div key={symptom.id} className="flex items-center justify-between text-sm">
                                <span>{symptom.symptomType.replace('_', ' ')}</span>
                                <Badge variant="outline" className="text-xs">
                                  {symptom.severity}/10
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="font-medium text-sm mb-2">Assessment</h5>
                          {entry.overallWellbeing && (
                            <div className="text-sm">
                              <span>Overall wellbeing: </span>
                              <Badge variant="outline" className="text-xs">
                                {entry.overallWellbeing}/10
                              </Badge>
                            </div>
                          )}
                          {entry.mood && (
                            <div className="text-sm mt-1">
                              <span>Mood: </span>
                              <Badge variant="outline" className="text-xs">
                                {entry.mood.replace('_', ' ')}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {entry.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <strong>Notes:</strong> {entry.notes}
                        </div>
                      )}
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
