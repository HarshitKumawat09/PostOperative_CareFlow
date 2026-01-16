'use client';

import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { analyzePatientLogs } from '@/ai/flows/ai-symptom-assessment';
import { suggestTreatmentActions } from '@/ai/flows/ai-suggest-treatment-actions';
import { DailyLog, UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp } from 'firebase/firestore';

type AssessmentResult = {
  relevantSymptoms?: string[];
  suggestedSymptomClusters?: string[];
  recommendations?: string;
};

type TreatmentResult = {
  suggestedActions?: string[];
  symptomClusters?: string[];
};

interface AiAssessmentToolProps {
  currentLog: DailyLog;
  allLogs: DailyLog[];
  patient: UserProfile;
}

export function AiAssessmentTool({ currentLog, allLogs, patient }: AiAssessmentToolProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [treatment, setTreatment] = useState<TreatmentResult | null>(null);
  const { toast } = useToast();

  // Helper to convert Firestore Timestamp to a readable string or number
  const formatTimestamp = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString();
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAssessment(null);
    setTreatment(null);
    try {
      // Analyze current log in context of previous ones
      const previousLogsText = allLogs
        .filter(log => log.id !== currentLog.id)
        .map(log => `Date: ${formatTimestamp(log.timestamp)}\nNotes: ${log.notes}\nPain: ${log.painLevel}`);
      
      const assessmentInput = {
        currentLog: `Date: ${formatTimestamp(currentLog.timestamp)}\nNotes: ${currentLog.notes}\nPain: ${currentLog.painLevel}`,
        previousLogs: previousLogsText,
      };
      
      const assessmentPromise = analyzePatientLogs(assessmentInput);

      // Suggest treatment actions based on all logs
      const treatmentInput = {
        patientId: patient.id,
        dailyLogs: allLogs.map(log => ({
            painLevel: log.painLevel,
            woundImage: "Image data not available for text model", // Image data is not passed to the text model.
            taskCompletion: { completed: log.tasksCompleted },
            additionalNotes: log.notes || '',
            timestamp: log.timestamp.toMillis(), // Pass timestamp as milliseconds
        }))
      };

      const treatmentPromise = suggestTreatmentActions(treatmentInput);

      const [assessmentResult, treatmentResult] = await Promise.all([assessmentPromise, treatmentPromise]);

      setAssessment(assessmentResult);
      setTreatment(treatmentResult);

    } catch (error) {
      console.error("AI analysis failed:", error);
      toast({
        variant: 'destructive',
        title: 'AI Analysis Failed',
        description: 'Could not generate AI-powered insights. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Sparkles className="w-6 h-6" />
          AI-Powered Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use our AI tool to analyze this log in the context of the patient's history and get suggested actions.
          </p>
          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? 'Analyzing...' : <><Bot className="mr-2 h-4 w-4" /> Generate Insights</>}
          </Button>

          {isLoading && (
            <div className="space-y-4 pt-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
          )}

          {assessment && treatment && (
            <Accordion type="multiple" className="w-full pt-4" defaultValue={['assessment', 'treatment']}>
              <AccordionItem value="assessment">
                <AccordionTrigger className="font-semibold">Symptom Analysis</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-medium">Relevant Symptoms from History</h4>
                    <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                      {assessment.relevantSymptoms?.map((s, i) => <li key={i}>{s}</li>) ?? <li>None identified.</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Potential Symptom Clusters</h4>
                     <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                      {assessment.suggestedSymptomClusters?.map((s, i) => <li key={i}>{s}</li>) ?? <li>None identified.</li>}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium">Overall Recommendation</h4>
                    <p className="text-sm text-muted-foreground mt-1">{assessment.recommendations || "No specific recommendations."}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="treatment">
                <AccordionTrigger className="font-semibold">Suggested Actions</AccordionTrigger>
                <AccordionContent className="space-y-4">
                   <div>
                    <h4 className="font-medium">Identified Symptom Clusters</h4>
                     <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                      {treatment.symptomClusters?.map((s, i) => <li key={i}>{s}</li>) ?? <li>None identified.</li>}
                    </ul>
                  </div>
                   <div>
                    <h4 className="font-medium">Actionable Recommendations for Staff</h4>
                    <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                      {treatment.suggestedActions?.map((s, i) => <li key={i}>{s}</li>) ?? <li>No specific actions suggested.</li>}
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
