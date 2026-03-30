'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Bell, BookOpen, Activity, AlertCircle, Brain } from 'lucide-react';

// Import existing components
import { PatientTriageClient } from '@/components/dashboard/staff/patient-triage-client';
import NotificationControls from '@/components/dashboard/staff/notification-controls';
import SimpleMedicalIngestion from '@/components/dashboard/simple-medical-ingestion';
import EmbeddingEvaluationDashboard from '@/components/dashboard/staff/embedding-evaluation-dashboard';

export default function StaffDashboardPage() {
  const { firestore, user, userProfile: staffProfile, isUserLoading, isUserProfileLoading } = useFirebase();
  const [activeTab, setActiveTab] = useState('triage');

  // --- Data Fetching ---
  const patientsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // In a real app, you might filter by patients assigned to this specific staff member
    return query(collection(firestore, 'users'), where('role', '==', 'patient'));
  }, [firestore, user]);

  const { data: patients, isLoading: patientsLoading } = useCollection<UserProfile>(patientsQuery);

  const isLoading = isUserLoading || isUserProfileLoading || patientsLoading;
  const patientList = patients || [];

  // Calculate some basic stats for the overview
  const totalPatients = patientList.length;
  // This is a placeholder. You'd need real logic to determine 'critical' status.
  const criticalPatients = patientList.filter(p => p.surgeryType?.toLowerCase().includes('heart')).length > 0 ? 1 : 0; 
  const pendingReviews = Math.floor(totalPatients * 0.3); // Placeholder

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] space-y-8 pb-12 font-sans bg-slate-50/50 p-6 lg:p-8">
      
      {/* ================= HERO OVERVIEW SECTION ================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {staffProfile?.firstName ? `Dr. ${staffProfile.lastName}` : 'Staff'}.
          </h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <Activity className="h-4 w-4 text-blue-600" />
            Here's an overview of your patient panel today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white py-2 px-4 rounded-lg border border-slate-200 shadow-sm">
          <span>Last updated:</span>
          <span className="font-bold text-slate-800">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* ================= STATS CARDS ================= */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Assigned Patients</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{totalPatients}</div>
            <p className="text-xs text-slate-500 mt-1">Active monitoring</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Critical Alerts</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{criticalPatients}</div>
            <p className="text-xs text-red-600/80 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Reviews</CardTitle>
            <Activity className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{pendingReviews}</div>
            <p className="text-xs text-slate-500 mt-1">New logs to review</p>
          </CardContent>
        </Card>
      </div>


      {/* ================= MAIN TABBED CONTENT ================= */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-slate-200">
          <TabsList className="flex h-auto p-0 bg-transparent space-x-6 justify-start">
            <TabsTrigger 
              value="triage" 
              className="flex items-center gap-2 py-4 px-2 text-sm font-medium text-slate-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none transition-all hover:text-slate-900"
            >
              <Users className="h-4 w-4" />
              Patient Triage
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center gap-2 py-4 px-2 text-sm font-medium text-slate-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none transition-all hover:text-slate-900"
            >
              <Bell className="h-4 w-4" />
              Notification Controls
            </TabsTrigger>
            <TabsTrigger 
              value="guidelines" 
              className="flex items-center gap-2 py-4 px-2 text-sm font-medium text-slate-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none transition-all hover:text-slate-900"
            >
              <BookOpen className="h-4 w-4" />
              Medical Guidelines
            </TabsTrigger>
            <TabsTrigger 
              value="evaluation" 
              className="flex items-center gap-2 py-4 px-2 text-sm font-medium text-slate-600 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none transition-all hover:text-slate-900"
            >
              <Brain className="h-4 w-4" />
              Embedding Evaluation
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="triage" className="focus-visible:outline-none">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <CardTitle className="text-xl text-slate-800">Assigned Patients</CardTitle>
              <CardDescription>
                View and manage patient status, review logs, and identify at-risk individuals.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* The existing component is wrapped here. It should handle its own internal layout. */}
              <div className="p-6">
                <PatientTriageClient patients={patientList} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="focus-visible:outline-none">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg"><Bell className="h-5 w-5 text-blue-600"/></div>
                  <div>
                    <CardTitle className="text-xl text-slate-800">Notification Console</CardTitle>
                    <CardDescription>Manage system-wide reminders and alerts.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6">
              <NotificationControls />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guidelines" className="focus-visible:outline-none">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 px-6 py-4">
               <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg"><BookOpen className="h-5 w-5 text-purple-600"/></div>
                  <div>
                    <CardTitle className="text-xl text-slate-800">Medical Guidelines Ingestion</CardTitle>
                    <CardDescription>Upload and manage authoritative medical documents for the system's knowledge base.</CardDescription>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6">
              <SimpleMedicalIngestion />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluation" className="focus-visible:outline-none">
          <EmbeddingEvaluationDashboard />
        </TabsContent>

      </Tabs>

    </div>
  );
}