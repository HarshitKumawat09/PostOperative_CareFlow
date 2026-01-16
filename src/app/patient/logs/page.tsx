'use client';

import { DailyLogList } from '@/components/dashboard/patient/daily-log-list';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { DailyLog } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientLogsPage() {
  const { firestore, user, isUserLoading } = useFirebase();

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, `users/${user.uid}/daily_logs`),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, user]);

  const { data: logs, isLoading: logsLoading } = useCollection<DailyLog>(logsQuery);

  const isLoading = isUserLoading || logsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline">My Logs</h1>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <DailyLogList logs={logs || []} />
      )}
    </div>
  );
}
