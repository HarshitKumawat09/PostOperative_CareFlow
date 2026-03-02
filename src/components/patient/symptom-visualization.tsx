'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Activity, 
  BarChart3,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  PieChart as PieChartIcon,
  Download
} from 'lucide-react';
import { RecoveryProgress, SymptomEntry, SymptomType, SymptomTrend } from '@/types/symptom-tracking';
import { safeLocaleDateString, safeGetTime } from '@/utils/date-utils';

interface SymptomVisualizationProps {
  patientId: string;
  surgeryType?: string;
  postOpDay?: number;
  entries: SymptomEntry[];
  recoveryProgress?: RecoveryProgress;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function SymptomVisualization({ 
  patientId, 
  surgeryType, 
  postOpDay, 
  entries, 
  recoveryProgress 
}: SymptomVisualizationProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'recovery'>('recovery');
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>(['pain', 'fever', 'swelling']);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');

  // Process data for charts
  const processTrendData = () => {
    const filteredEntries = filterEntriesByTimeRange(entries);
    
    const trendData = filteredEntries.map(entry => {
      const dataPoint: any = {
        date: safeLocaleDateString(entry.timestamp),
        postOpDay: entry.postOpDay,
        timestamp: safeGetTime(entry.timestamp)
      };

      // Add symptom severities
      selectedSymptoms.forEach(symptomType => {
        const symptom = entry.symptoms.find(s => s.symptomType === symptomType);
        dataPoint[symptomType] = symptom && symptom.severity !== undefined && symptom.severity !== null
          ? Number(symptom.severity)
          : null;
      });

      // Add measurements
      if (entry.symptoms.length > 0) {
        const measurements = entry.symptoms[0].measurements;
        if (measurements) {
          dataPoint.temperature = measurements.temperature !== undefined && measurements.temperature !== null
            ? Number(measurements.temperature)
            : undefined;
          dataPoint.heartRate = measurements.heartRate !== undefined && measurements.heartRate !== null
            ? Number(measurements.heartRate)
            : undefined;
          dataPoint.bloodPressure = measurements.bloodPressure?.systolic !== undefined && measurements.bloodPressure?.systolic !== null
            ? Number(measurements.bloodPressure?.systolic)
            : undefined;
          dataPoint.oxygenSaturation = measurements.oxygenSaturation !== undefined && measurements.oxygenSaturation !== null
            ? Number(measurements.oxygenSaturation)
            : undefined;
        }
      }

      dataPoint.overallWellbeing = entry.overallWellbeing;
      dataPoint.symptomCount = entry.symptoms.length;

      return dataPoint;
    });

    return trendData.sort((a, b) => a.timestamp - b.timestamp);
  };

  const filterEntriesByTimeRange = (allEntries: SymptomEntry[]) => {
    const now = new Date();
    const cutoffDate = new Date();

    switch (timeRange) {
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case 'recovery':
        // Show all entries since surgery
        if (!postOpDay) {
          return allEntries;
        }

        if (postOpDay) {
          const surgeryDate = new Date(now);
          surgeryDate.setDate(now.getDate() - postOpDay);
          cutoffDate.setTime(surgeryDate.getTime());
        }
        break;
    }

    const cutoffTime = cutoffDate.getTime();
    return allEntries.filter(entry => safeGetTime(entry.timestamp) >= cutoffTime);
  };

  const getSymptomFrequencyData = () => {
    const filteredEntries = filterEntriesByTimeRange(entries);
    const frequency: { [key in SymptomType]?: number } = {};

    filteredEntries.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        frequency[symptom.symptomType] = (frequency[symptom.symptomType] || 0) + 1;
      });
    });

    return Object.entries(frequency)
      .map(([symptom, count]) => ({
        name: symptom.replace('_', ' '),
        value: count,
        symptom: symptom as SymptomType
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 symptoms
  };

  const getRecoveryProgressData = () => {
    if (!recoveryProgress) return [];

    return recoveryProgress.milestones.map(milestone => ({
      day: milestone.day,
      milestone: milestone.milestone,
      status: milestone.actualStatus || 'not_achieved',
      achieved: milestone.actualStatus === 'achieved'
    }));
  };

  const getSeverityDistribution = () => {
    const filteredEntries = filterEntriesByTimeRange(entries);
    const distribution = { mild: 0, moderate: 0, severe: 0 };

    filteredEntries.forEach(entry => {
      entry.symptoms.forEach(symptom => {
        const severity = Number(symptom.severity);
        if (severity <= 3) distribution.mild++;
        else if (severity <= 6) distribution.moderate++;
        else distribution.severe++;
      });
    });

    return [
      { name: 'Mild (1-3)', value: distribution.mild, color: '#10b981' },
      { name: 'Moderate (4-6)', value: distribution.moderate, color: '#f59e0b' },
      { name: 'Severe (7-10)', value: distribution.severe, color: '#ef4444' }
    ];
  };

  const calculateTrend = (data: any[], symptomType: SymptomType): 'improving' | 'stable' | 'worsening' => {
    const validData = data.filter(d => d[symptomType] !== null);
    if (validData.length < 2) return 'stable';

    const recent = validData.slice(-3);
    const older = validData.slice(0, Math.min(3, validData.length - 3));

    const recentAvg = recent.reduce((sum, d) => sum + d[symptomType], 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d[symptomType], 0) / older.length;

    if (recentAvg < olderAvg - 0.5) return 'improving';
    if (recentAvg > olderAvg + 0.5) return 'worsening';
    return 'stable';
  };

  const trendData = processTrendData();
  const symptomFrequencyData = getSymptomFrequencyData();
  const recoveryProgressData = getRecoveryProgressData();
  const severityDistribution = getSeverityDistribution();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'worsening': return <TrendingUp className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify({
      patientId,
      surgeryType,
      postOpDay,
      entries: filterEntriesByTimeRange(entries),
      recoveryProgress,
      exportedAt: new Date()
    }, null, 2);
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `symptom-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Symptom Analytics
            </span>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="recovery">Full Recovery</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Chart Type</label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Symptoms</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {(['pain', 'fever', 'swelling', 'stiffness', 'fatigue'] as SymptomType[]).map(symptom => (
                  <Badge
                    key={symptom}
                    variant={selectedSymptoms.includes(symptom) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedSymptoms(prev => 
                        prev.includes(symptom) 
                          ? prev.filter(s => s !== symptom)
                          : [...prev, symptom]
                      );
                    }}
                  >
                    {symptom.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptom Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Symptom Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  {selectedSymptoms.map((symptom, index) => (
                    <Line
                      key={symptom}
                      type="monotone"
                      dataKey={symptom}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      connectNulls={false}
                      name={symptom.replace('_', ' ')}
                    />
                  ))}
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  {selectedSymptoms.map((symptom, index) => (
                    <Area
                      key={symptom}
                      type="monotone"
                      dataKey={symptom}
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.3}
                      stackId="1"
                      name={symptom.replace('_', ' ')}
                    />
                  ))}
                </AreaChart>
              ) : (
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  {selectedSymptoms.map((symptom, index) => (
                    <Bar
                      key={symptom}
                      dataKey={symptom}
                      fill={COLORS[index % COLORS.length]}
                      name={symptom.replace('_', ' ')}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Trend Indicators */}
          <div className="flex flex-wrap gap-4 mt-4">
            {selectedSymptoms.map(symptom => {
              const trend = calculateTrend(trendData, symptom);
              return (
                <div key={symptom} className="flex items-center gap-2">
                  {getTrendIcon(trend)}
                  <span className="text-sm font-medium">{symptom.replace('_', ' ')}</span>
                  <Badge variant="outline" className="text-xs">
                    {trend}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Symptom Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Symptom Frequency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={symptomFrequencyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {symptomFrequencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8">
                    {severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recovery Progress */}
      {recoveryProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recovery Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-bold">{recoveryProgress.overallProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${recoveryProgress.overallProgress}%` }}
                  />
                </div>
              </div>

              {/* Current Phase */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium">Current Phase</span>
                  <p className="text-lg font-semibold text-blue-600">{recoveryProgress.currentPhase}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Post-Op Day</span>
                  <p className="text-lg font-semibold">{recoveryProgress.postOpDay}</p>
                </div>
                <div>
                  <span className="text-sm font-medium">Risk Level</span>
                  <Badge className={getRiskLevelColor(recoveryProgress.riskLevel)}>
                    {recoveryProgress.riskLevel}
                  </Badge>
                </div>
              </div>

              {/* Next Milestone */}
              {recoveryProgress.nextMilestone && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">Next Milestone</h4>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-blue-900">
                        Day {recoveryProgress.nextMilestone.day}: {recoveryProgress.nextMilestone.milestone}
                      </p>
                      <p className="text-sm text-blue-600">
                        {recoveryProgress.nextMilestone.daysUntil} days remaining
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'Low': return 'bg-green-100 text-green-800 border-green-300';
    case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}
