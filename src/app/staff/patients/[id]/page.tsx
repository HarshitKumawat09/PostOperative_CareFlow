'use client';

import { PatientLogView } from '@/components/dashboard/staff/patient-log-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Info, RefreshCw, CalendarPlus } from 'lucide-react';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { UserProfile, DailyLog, Appointment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentsCard } from '@/components/dashboard/patient/appointments-card';
import { CreateAppointmentModal } from '@/components/dashboard/staff/create-appointment-modal';

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const { firestore, user } = useFirebase();

  const patientRef = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return doc(firestore, 'users', params.id);
  }, [firestore, params.id]);
  const { data: patient, isLoading: patientLoading } = useDoc<UserProfile>(patientRef);
  
  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return query(collection(firestore, `users/${params.id}/daily_logs`), orderBy('timestamp', 'desc'));
  }, [firestore, params.id]);
  const { data: logs, isLoading: logsLoading } = useCollection<DailyLog>(logsQuery);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !params.id) return null;
    return query(collection(firestore, `users/${params.id}/appointments`), orderBy('date', 'desc'));
  }, [firestore, params.id]);
  const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const isLoading = patientLoading || logsLoading || appointmentsLoading;

  const now = new Date().toISOString();
  const upcomingAppointments = appointments?.filter(apt => apt.date > now) || [];
  const pastAppointments = appointments?.filter(apt => apt.date <= now) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (!patient) {
    return (
        <div className="text-center py-10">
            <h2 className="text-2xl font-bold">Patient Not Found</h2>
            <p className="text-muted-foreground">The requested patient could not be found.</p>
             <Button asChild className="mt-4">
                <Link href="/staff/dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Triage
                </Link>
            </Button>
        </div>
    );
  }

  // Calculate patient status based on logs
  const needsReviewCount = logs?.filter(log => !log.acknowledged).length || 0;
  let status: 'Needs Review' | 'On Track' | 'Pending' = 'On Track';
  if (logs && logs.length === 0) {
      status = 'Pending'
  } else if (needsReviewCount > 0) {
      status = 'Needs Review';
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                <Link href="/staff/dashboard">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">Patient Details</h1>
            </div>
            {patient && user && <CreateAppointmentModal patient={patient} staff={user} />}
        </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={patient.profileImageUrl} alt={patient.firstName} />
              <AvatarFallback>{patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-headline">{patient.firstName} {patient.lastName}</p>
              <p className="text-sm font-normal text-muted-foreground">ID: {patient.id}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
             <div>
              <strong>Status:</strong> <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                status === 'Needs Review' ? 'bg-yellow-100 text-yellow-800' :
                status === 'On Track' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {status === 'Needs Review' ? <RefreshCw className="h-3 w-3"/> : status === 'On Track' ? <CheckCircle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
                {status} ({needsReviewCount} new)
              </span>
            </div>
            <div>
              <strong>Last Log:</strong> {logs && logs.length > 0 ? new Date(logs[0].timestamp.toDate()).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AppointmentsCard upcomingAppointments={upcomingAppointments} pastAppointments={pastAppointments} />

      <div>
        <h2 className="text-2xl font-bold font-headline mb-4">Daily Logs</h2>
        <PatientLogView logs={logs || []} patient={patient} />
      </div>
    </div>
  );
}
