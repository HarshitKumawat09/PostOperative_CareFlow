'use client';

import * as React from "react";
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Info, RefreshCw } from 'lucide-react';
import { doc, collection, query, orderBy } from 'firebase/firestore';

import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import type { UserProfile, DailyLog, Appointment } from '@/lib/types';

import { PatientLogView } from '@/components/dashboard/staff/patient-log-view';
import { AppointmentsCard } from '@/components/dashboard/patient/appointments-card';
import { CreateAppointmentModal } from '@/components/dashboard/staff/create-appointment-modal';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useParams } from 'next/navigation';

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;
  const { firestore, user } = useFirebase();

  const patientRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'users', id);
  }, [firestore, id]);

  const { data: patient, isLoading: patientLoading } =
    useDoc<UserProfile>(patientRef);

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, `users/${id}/daily_logs`),
      orderBy('timestamp', 'desc')
    );
  }, [firestore, id]);

  const { data: logs, isLoading: logsLoading } =
    useCollection<DailyLog>(logsQuery);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return query(
      collection(firestore, `users/${id}/appointments`),
      orderBy('date', 'desc')
    );
  }, [firestore, id]);

  const { data: appointments, isLoading: appointmentsLoading } =
    useCollection<Appointment>(appointmentsQuery);

  const isLoading = patientLoading || logsLoading || appointmentsLoading;

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
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold">Patient Not Found</h2>
        <p className="text-muted-foreground">
          The requested patient could not be found.
        </p>
        <Button asChild className="mt-4">
          <Link href="/staff/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Triage
          </Link>
        </Button>
      </div>
    );
  }

  const now = new Date().toISOString();
  const upcomingAppointments =
    appointments?.filter(a => a.date > now) || [];
  const pastAppointments =
    appointments?.filter(a => a.date <= now) || [];

  const needsReviewCount =
    logs?.filter(log => !log.acknowledged).length || 0;

  let status: 'Needs Review' | 'On Track' | 'Pending' = 'On Track';
  if (!logs || logs.length === 0) status = 'Pending';
  else if (needsReviewCount > 0) status = 'Needs Review';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/staff/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Patient Details</h1>
        </div>
        {user && <CreateAppointmentModal patient={patient} staff={user} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={patient.profileImageUrl} />
              <AvatarFallback>
                {patient.firstName?.[0]}
                {patient.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p>{patient.firstName} {patient.lastName}</p>
              <p className="text-sm text-muted-foreground">
                ID: {patient.id}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <strong>Status:</strong>{' '}
          <span className="ml-2">{status}</span>
        </CardContent>
      </Card>

      <AppointmentsCard
        upcomingAppointments={upcomingAppointments}
        pastAppointments={pastAppointments}
      />

      <PatientLogView logs={logs || []} patient={patient} />
    </div>
  );
}
