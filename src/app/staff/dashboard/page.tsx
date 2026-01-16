'use client';

import { PatientTriageClient } from '@/components/dashboard/staff/patient-triage-client';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function StaffDashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();

  // Query for all patients
  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users'),
      where('role', '==', 'patient')
    );
  }, [firestore, user]);

  const { data: patients, isLoading: patientsLoading } = useCollection<UserProfile>(patientsQuery);

  const isLoading = isUserLoading || patientsLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Patient Triage</h1>
      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>All Patients</CardTitle>
            <CardDescription>Loading patient data...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : (
        <PatientTriageClient patients={patients || []} />
      )}
    </div>
  );
}
