'use client';

import { ProfileCard } from '@/components/dashboard/patient/profile-card';
import { DoctorCard } from '@/components/dashboard/patient/doctor-card';
import { AppointmentsCard } from '@/components/dashboard/patient/appointments-card';
import { DoctorsRemarksCard } from '@/components/dashboard/patient/doctors-remarks-card';
import { DailyLogModal } from '@/components/dashboard/patient/daily-log-modal';
import { SosButton } from '@/components/dashboard/patient/sos-button';
import { ChatButton } from '@/components/dashboard/patient/chat-button';
import { useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import type { UserProfile, Doctor, DailyLog, Appointment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function PatientDashboardPage() {
  const { firestore, user, userProfile: patient, isUserProfileLoading: patientLoading } = useFirebase();

  const doctorProfileRef = useMemoFirebase(() => {
    if (!firestore || !patient?.doctorId) return null;
    return doc(firestore, `doctors/${patient.doctorId}`);
  }, [firestore, patient]);
  const { data: assignedDoctor, isLoading: doctorLoading } = useDoc<Doctor>(doctorProfileRef);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/appointments`), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const recentLogsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/daily_logs`), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore, user]);
  const { data: recentLogs, isLoading: logsLoading } = useCollection<DailyLog>(recentLogsQuery);

  const isLoading = patientLoading || doctorLoading || appointmentsLoading || logsLoading;

  const now = new Date().toISOString();
  const upcomingAppointments = appointments?.filter(apt => apt.date > now) || [];
  const pastAppointments = appointments?.filter(apt => apt.date <= now) || [];
  
  const latestRemark = recentLogs
    ?.filter(log => log.doctorsRemarks)
    .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0]?.doctorsRemarks;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
             <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
             <Skeleton className="h-48 w-full" />
             <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {patient && <ProfileCard patient={patient} />}
          <AppointmentsCard 
            upcomingAppointments={upcomingAppointments}
            pastAppointments={pastAppointments}
          />
        </div>
        <div className="space-y-6">
          <DoctorCard doctor={assignedDoctor} />
          <DoctorsRemarksCard latestRemark={latestRemark} />
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-4">
        <DailyLogModal />
        <ChatButton />
        <SosButton />
      </div>
    </div>
  );
}
