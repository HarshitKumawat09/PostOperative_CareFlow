'use client';

import type { DailyLog } from '@/lib/types';
import Image from 'next/image';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, CheckCircle, Clock, StickyNote } from 'lucide-react';

interface DailyLogListProps {
  logs: DailyLog[];
}

export function DailyLogList({ logs }: DailyLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 px-4 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">No Logs Yet</h3>
        <p className="text-muted-foreground mt-2">
          Start by submitting your first daily log from the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Log for {log.timestamp ? format(log.timestamp.toDate(), 'MMMM d, yyyy') : 'Date unknown'}</span>
              <span
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
                  log.acknowledged
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {log.acknowledged ? <CheckCircle size={14} /> : <Clock size={14} />}
                {log.acknowledged ? 'Reviewed' : 'Needs Review'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            </div>
            {log.notes && (
                 <div className="flex items-start gap-3 pt-2">
                    <StickyNote className="w-6 h-6 text-primary mt-1 flex-shrink-0"/>
                    <div>
                        <p className="text-sm text-muted-foreground">Patient Notes</p>
                        <p className="italic">"{log.notes}"</p>
                    </div>
                </div>
            )}
            {log.doctorsRemarks && (
                 <div className="flex items-start gap-3 pt-2 border-t mt-4">
                    <StickyNote className="w-6 h-6 text-accent mt-1 flex-shrink-0"/>
                    <div>
                        <p className="text-sm text-muted-foreground">Doctor's Remarks</p>
                        <p className="italic">"{log.doctorsRemarks}"</p>
                    </div>
                </div>
            )}
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Wound Image</h4>
              <div className="relative aspect-video w-full max-w-sm bg-muted rounded-lg overflow-hidden">
                {log.imageUrl ? (
                  <Image src={log.imageUrl} alt="Wound" layout="fill" objectFit="cover" />
                ) : (
                   <div className="flex items-center justify-center h-full text-muted-foreground">No image submitted</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
