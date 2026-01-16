'use client';

import { useState } from 'react';
import type { DailyLog as DailyLogType, UserProfile } from '@/lib/types';
import Image from 'next/image';
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, Image as ImageIcon, MessageSquare, StickyNote, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AiAssessmentTool } from './ai-assessment-tool';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

interface PatientLogViewProps {
  logs: DailyLogType[];
  patient: UserProfile;
}

export function PatientLogView({ logs, patient }: PatientLogViewProps) {
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handleAcknowledge = async (logId: string) => {
    if (!firestore || !patient) return;
    setLoading(prev => ({ ...prev, [`ack_${logId}`]: true }));
    
    const logRef = doc(firestore, `users/${patient.id}/daily_logs/${logId}`);
    updateDocumentNonBlocking(logRef, { acknowledged: true });

    // Optimistic UI update can be done here if needed
    toast({ title: 'Log Acknowledged', description: `Log has been marked as reviewed.` });
    setLoading(prev => ({ ...prev, [`ack_${logId}`]: false }));
  };

  const handleRemarkSubmit = async (logId: string) => {
    if (!firestore || !patient) return;
    setLoading(prev => ({ ...prev, [`remark_${logId}`]: true }));

    const logRef = doc(firestore, `users/${patient.id}/daily_logs/${logId}`);
    updateDocumentNonBlocking(logRef, {
        doctorsRemarks: remarks[logId] || '',
        acknowledged: true, // Submitting a remark also acknowledges the log
    });
    
    toast({ title: 'Remark Submitted', description: 'Your remarks have been saved.' });
    setRemarks(prev => ({ ...prev, [logId]: '' }));
    setLoading(prev => ({ ...prev, [`remark_${logId}`]: false }));
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">No logs found for this patient.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full" defaultValue={logs.length > 0 ? `log-${logs[0].id}` : undefined}>
      {logs.map((log) => (
        <AccordionItem key={log.id} value={`log-${log.id}`}>
          <AccordionTrigger>
            <div className="flex justify-between w-full pr-4">
              <span className="font-semibold">
                Log for {format(log.timestamp.toDate(), 'MMMM d, yyyy')}
              </span>
              <span className={`flex items-center gap-1 text-sm ${log.acknowledged ? 'text-green-600' : 'text-yellow-600'}`}>
                {log.acknowledged ? <CheckCircle size={16} /> : <Clock size={16} />}
                {log.acknowledged ? 'Reviewed' : 'Needs Review'}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 bg-card rounded-b-md border-t-0">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Pain Level</p>
                            <p className="font-bold text-lg">{log.painLevel}/10</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-primary"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Tasks Completed</p>
                            <p className="font-bold text-lg">{log.tasksCompleted ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                     <div className="flex items-start col-span-1 sm:col-span-2 gap-3">
                        <StickyNote className="w-6 h-6 text-primary mt-1"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Patient Notes</p>
                            <p className="italic">"{log.notes || 'No additional notes.'}"</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2"><ImageIcon size={18}/> Wound Image</h4>
                  <div className="relative aspect-video w-full max-w-md bg-muted rounded-lg overflow-hidden">
                    <Image src={log.imageUrl} alt="Wound" layout="fill" objectFit="cover" />
                  </div>
                </div>
                
                <div className="space-y-2">
                   <h4 className="font-semibold flex items-center gap-2"><MessageSquare size={18}/> Medical Remarks</h4>
                   <p className="text-sm text-muted-foreground">Your remarks will be visible to the patient.</p>
                  <Textarea
                    placeholder="Add your remarks here..."
                    value={remarks[log.id] || log.doctorsRemarks || ''}
                    onChange={(e) => setRemarks(prev => ({...prev, [log.id]: e.target.value}))}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleRemarkSubmit(log.id)}
                      disabled={!remarks[log.id] || loading[`remark_${log.id}`]}
                    >
                      {loading[`remark_${log.id}`] ? 'Submitting...' : 'Submit Remark'}
                    </Button>
                     {!log.acknowledged && (
                        <Button
                            variant="secondary"
                            onClick={() => handleAcknowledge(log.id)}
                            disabled={loading[`ack_${log.id}`]}
                        >
                            {loading[`ack_${log.id}`] ? 'Acknowledging...' : 'Acknowledge'}
                        </Button>
                     )}
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <AiAssessmentTool currentLog={log} allLogs={logs} patient={patient} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
