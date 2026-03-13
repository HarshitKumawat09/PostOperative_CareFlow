'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import type { DailyLog, Appointment } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isSameDay, parseISO } from 'date-fns';
import { CheckCircle2, Activity, CalendarClock, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { DoctorCard } from '@/components/dashboard/patient/doctor-card';
import { AppointmentsCard } from '@/components/dashboard/patient/appointments-card';
import { DoctorsRemarksCard } from '@/components/dashboard/patient/doctors-remarks-card';
import { DailyLogModal } from '@/components/dashboard/patient/daily-log-modal';
import { SosButton } from '@/components/dashboard/patient/sos-button';
import { ChatButton } from '@/components/dashboard/patient/chat-button';
import HospitalQA from '@/components/patient/hospital-qa';
import SymptomDashboard from '@/components/patient/symptom-dashboard';
// ProfileCard is no longer needed as it's integrated into the Hero section

export default function PatientDashboardPage() {
  const { firestore, user, userProfile: patient, isUserProfileLoading: patientLoading } = useFirebase();

  const assignedDoctor = patient?.assignedDoctor || null;

  // --- Data Fetching ---
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

  const isLoading = patientLoading || appointmentsLoading || logsLoading;

  // --- Logic ---
  const now = new Date();
  const nowISO = now.toISOString();
  const upcomingAppointments = appointments?.filter(apt => apt.date > nowISO) || [];
  const pastAppointments = appointments?.filter(apt => apt.date <= nowISO) || [];

  // Find latest remark
  const latestRemarkLog = recentLogs
    ?.filter(log => log.doctorsRemarks)
    .sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
  
  const latestRemark = latestRemarkLog?.doctorsRemarks;

  // Check if logged today (temporarily disabled for testing)
  const hasLoggedToday = false; // recentLogs && recentLogs.length > 0 && isSameDay(recentLogs[0].timestamp.toDate(), now);
  
  // Debug: Check the values
  console.log('Debug - Patient Dashboard:', {
    recentLogs: recentLogs?.length || 0,
    hasLoggedToday,
    latestLogDate: recentLogs?.[0]?.timestamp?.toDate?.(),
    today: now
  });

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-8 p-4">
        <Skeleton className="h-48 w-full rounded-[2rem]" /> {/* Hero skeleton */}
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 space-y-8">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-8">
              <Skeleton className="h-56 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] space-y-8 pb-24 font-sans">
      
      {/* ================= HERO SECTION ================= */}
      {/* Combines Profile info and primary call-to-action */}
      <div className={`relative overflow-hidden rounded-[2.5rem] p-8 shadow-lg transition-all ${
          hasLoggedToday 
          ? 'bg-gradient-to-br from-teal-50 to-emerald-100 border-2 border-teal-200/50' 
          : 'bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200/50'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
              Welcome back, {patient?.firstName || 'Patient'}.
            </h1>
            {patient?.postOpDay && (
              <p className="text-lg text-slate-600 mb-4 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-primary" />
                You are on <span className="font-semibold text-primary">Day {patient.postOpDay}</span> of your recovery journey.
              </p>
            )}

            {hasLoggedToday ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-600/10 px-4 py-2 text-sm font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
                <CheckCircle2 className="h-5 w-5" />
                You're all caught up for today! Great job.
              </div>
            ) : (
               <div className="space-y-3">
                 <p className="text-slate-700 max-w-md">How are you feeling right now? Logging your symptoms daily is crucial for your recovery.</p>
                 {/* We wrap the modal trigger button to style it prominently */}
                 <div className="[&>button]:bg-primary [&>button]:hover:bg-primary/90 [&>button]:text-lg [&>button]:py-6 [&>button]:px-8 [&>button]:rounded-full [&>button]:shadow-md">
                   <DailyLogModal triggerText={<span>Log My Symptoms Now</span>} />
                 </div>
               </div>
            )}
          </div>

          {/* Decorative Icon Graphic on the right */}
          <div className={`hidden lg:flex h-32 w-32 items-center justify-center rounded-full ${hasLoggedToday ? 'bg-teal-200/40 text-teal-600' : 'bg-blue-200/40 text-blue-600'} opacity-80 shrink-0`}>
            {hasLoggedToday ? <CheckCircle2 className="h-16 w-16" /> : <Activity className="h-16 w-16" />}
          </div>
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute right-0 top-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/40 blur-3xl z-0"></div>
        <div className="absolute left-0 bottom-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-white/40 blur-3xl z-0"></div>
      </div>


      {/* ================= MAIN GRID LAYOUT ================= */}
      <div className="grid gap-8 lg:grid-cols-3 items-start">
        
        {/* --- LEFT COLUMN (Primary Care Info & Logistics) --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Doctor's Feedback (High Priority) */}
          {latestRemark && (
             <div className="transform transition-all hover:scale-[1.01]">
                 <DoctorsRemarksCard latestRemark={latestRemark} timestamp={latestRemarkLog?.timestamp} />
             </div>
          )}

          {/* 2. Logistics & Appointments */}
          <AppointmentsCard 
            upcomingAppointments={upcomingAppointments}
            pastAppointments={pastAppointments}
          />

           {/* 3. Symptom Trends (Deeper dive) */}
           <SymptomDashboard 
            patientId={user?.uid || ''} 
            surgeryType={patient?.surgeryType}
            postOpDay={patient?.postOpDay}
          />
        </div>

        {/* --- RIGHT COLUMN (Care Team & Support) --- */}
        <div className="space-y-8 lg:sticky lg:top-20">
          
          {/* 1. Your Care Team Section */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-1 overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                 <div className="bg-primary/10 p-2 rounded-lg"><Stethoscope className="h-5 w-5 text-primary"/></div>
                 <h3 className="text-lg font-bold text-slate-800">Your Care Team</h3>
              </div>
              <div className="p-2">
                  {/* Reuse existing component but wrapped nicely */}
                 <DoctorCard doctor={assignedDoctor} />
              </div>
          </div>

           {/* 2. Support Resources */}
           <HospitalQA />
           
           {/* See NotificationSettings component below for required tweak */}
           {/* <NotificationSettings patientId={user?.uid || ''} ... /> */}

        </div>
      </div>

      {/* ================= FLOATING ACTION BUTTONS ================= */}
      <div className="fixed bottom-6 right-6 flex flex-col items-center gap-4 z-50">
        {/* Only show the small floating log button if they HAVE logged today. 
            If they haven't, the big hero button is enough. */}
        {hasLoggedToday && (
           <div className="[&>button]:rounded-full [&>button]:h-14 [&>button]:w-14 [&>button]:shadow-lg">
             <DailyLogModal triggerText={<Activity className="h-6 w-6"/>} />
           </div>
        )}
        <div className="[&>button]:rounded-full [&>button]:h-14 [&>button]:w-14 [&>button]:shadow-lg [&>button]:bg-blue-600 hover:[&>button]:bg-blue-700">
           <ChatButton />
        </div>
        <div className="[&>button]:rounded-full [&>button]:h-14 [&>button]:w-14 [&>button]:shadow-xl [&>button]:ring-4 [&>button]:ring-red-100">
           <SosButton />
        </div>
      </div>
    </div>
  );
}