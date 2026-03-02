'use client';

import * as React from "react";
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle, Info, RefreshCw, User, Calendar, Activity, FileText, Clock, Stethoscope, ChevronRight, MessageSquare, FileClock } from 'lucide-react';
import { doc, collection, query, orderBy, where } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

import { useFirebase, useDoc, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import type { UserProfile, Appointment, DailyLog } from '@/lib/types';
import type { RiskAlert, RecoveryProgress, SymptomEntry, SymptomTrackingResponse } from '@/types/symptom-tracking';

// Import Components
import { AppointmentsCard } from '@/components/dashboard/patient/appointments-card';
import { CreateAppointmentModal } from '@/components/dashboard/staff/create-appointment-modal';
import SymptomVisualization from '@/components/patient/symptom-visualization';
import { PatientLogView } from '@/components/dashboard/staff/patient-log-view';

// Import UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;
  const { firestore, user } = useFirebase();

  // --- State ---
  const [selectedDoctorId, setSelectedDoctorId] = React.useState<string | undefined>(undefined);
  const [symptomEntries, setSymptomEntries] = React.useState<SymptomEntry[]>([]);
  const [symptomAlerts, setSymptomAlerts] = React.useState<RiskAlert[]>([]);
  const [recoveryProgress, setRecoveryProgress] = React.useState<RecoveryProgress | null>(null);
  const [symptomLoading, setSymptomLoading] = React.useState(false);
  const [reviewingAlertId, setReviewingAlertId] = React.useState<string | null>(null);
  const [alertRemarks, setAlertRemarks] = React.useState<Record<string, string>>({});
  const [reviewNotes, setReviewNotes] = React.useState<{ id: string; note: string; createdAt: string; authorName?: string; }[]>([]);
  const [newReviewNote, setNewReviewNote] = React.useState('');
  const [savingReview, setSavingReview] = React.useState(false);
  const notesEndRef = React.useRef<HTMLDivElement>(null);

  // --- Data Fetching ---
  const patientRef = useMemoFirebase(() => firestore && id ? doc(firestore, 'users', id) : null, [firestore, id]);
  const { data: patient, isLoading: patientLoading } = useDoc<UserProfile>(patientRef);

  const doctorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), where('role', '==', 'staff')) : null, [firestore]);
  const { data: doctors } = useCollection<UserProfile>(doctorsQuery);

  const appointmentsQuery = useMemoFirebase(() => firestore && id ? query(collection(firestore, `users/${id}/appointments`), orderBy('date', 'desc')) : null, [firestore, id]);
  const { data: appointments, isLoading: appointmentsLoading } = useCollection<Appointment>(appointmentsQuery);

  const dailyLogsQuery = useMemoFirebase(() => firestore && id ? query(collection(firestore, `users/${id}/daily_logs`), orderBy('timestamp', 'desc')) : null, [firestore, id]);
  const { data: dailyLogs, isLoading: dailyLogsLoading } = useCollection<DailyLog>(dailyLogsQuery);

  // --- Effects ---
  React.useEffect(() => {
    if (patient && selectedDoctorId === undefined) {
      setSelectedDoctorId(patient.doctorId || undefined);
    }
  }, [patient, selectedDoctorId]);

  React.useEffect(() => {
    const loadSymptoms = async () => {
      if (!id) return;
      setSymptomLoading(true);
      try {
        const res = await fetch(`/api/symptom-tracking/log?patientId=${encodeURIComponent(id)}&limit=50`);
        const json: SymptomTrackingResponse = await res.json();
        if (json.success && json.data) {
          setSymptomEntries(Array.isArray(json.data) ? json.data : [json.data]);
          setSymptomAlerts(json.alerts || []);
          setRecoveryProgress(json.progress || null);
        }
      } catch (err) {
        console.error('Failed to load symptom tracking data:', err);
      } finally {
        setSymptomLoading(false);
      }
    };
    loadSymptoms();
  }, [id]);

  React.useEffect(() => {
    const loadReviews = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/symptom-tracking/reviews?patientId=${encodeURIComponent(id)}`);
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setReviewNotes(json.data);
        }
      } catch (e) {
        console.error('Failed to load reviews:', e);
      }
    };
    loadReviews();
  }, [id]);

  React.useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reviewNotes]);

  // --- Handlers ---
  const handleDoctorChange = (value: string) => {
    const next = value === 'none' ? undefined : value;
    setSelectedDoctorId(next);
    if (patientRef) {
      const selected = (doctors || []).find((d) => d.id === next);
      updateDocumentNonBlocking(patientRef, {
        doctorId: next || null,
        assignedDoctor: next ? { id: next, firstName: selected?.firstName, lastName: selected?.lastName, email: selected?.email, profileImageUrl: selected?.profileImageUrl } : null,
      });
    }
  };

  const handleSaveReviewNote = async () => {
    if (!id || !newReviewNote.trim()) return;
    setSavingReview(true);
    try {
      const res = await fetch('/api/symptom-tracking/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id, note: newReviewNote.trim(), authorId: user?.uid, authorName: user?.displayName || undefined }),
      });
      const json = await res.json();
      if (json?.success && json.data) {
        setReviewNotes((prev) => [...prev, json.data]); // Add to end
        setNewReviewNote('');
      }
    } finally {
      setSavingReview(false);
    }
  };

  const handleMarkAlertReviewed = async (alertId: string, remark?: string) => {
    if (!id) return;
    setReviewingAlertId(alertId);
    try {
      await fetch('/api/symptom-tracking/alerts/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: id, alertId: alertId, reviewedBy: user?.uid, remark: remark }),
      });
      setSymptomAlerts((prev) => prev.map((x) => x.id === alertId ? { ...x, reviewedByStaff: true, reviewedAt: new Date(), reviewedBy: user?.uid, staffRemark: remark } : x));
      setAlertRemarks((prev) => { const update = { ...prev }; delete update[alertId]; return update; });
    } finally {
      setReviewingAlertId(null);
    }
  };


  // --- Render Logic ---
  const isLoading = patientLoading || appointmentsLoading || dailyLogsLoading;
  if (isLoading) return <PatientDetailSkeleton />;
  if (!patient) return <PatientNotFound />;

  const now = new Date().toISOString();
  const upcomingAppointments = appointments?.filter(a => a.date > now) || [];
  const pastAppointments = appointments?.filter(a => a.date <= now) || [];
  const activeAlerts = symptomAlerts.filter((a) => !a.acknowledged && !a.reviewedByStaff);

  let status: 'Needs Review' | 'On Track' | 'Pending' = 'Pending';
  if (symptomEntries.length > 0) {
    const risk = recoveryProgress?.riskLevel;
    if (risk === 'High' || risk === 'Critical' || activeAlerts.length > 0) status = 'Needs Review';
    else status = 'On Track';
  }

  const StatusBadge = () => (
    <Badge variant={status === 'Needs Review' ? 'destructive' : status === 'On Track' ? 'default' : 'secondary'} className="px-3 py-1 text-sm font-medium capitalize shadow-sm">
      {status === 'Needs Review' ? <RefreshCw className="mr-2 h-4 w-4" /> : status === 'On Track' ? <CheckCircle className="mr-2 h-4 w-4" /> : <Info className="mr-2 h-4 w-4" />}
      {status.replace('-', ' ')}
    </Badge>
  );


  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50/80">
      
      {/* ================= HEADER HERO SECTION ================= */}
      <div className="bg-white border-b border-slate-200 px-6 lg:px-10 py-8 shadow-sm relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-slate-50/50 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <Button variant="outline" size="icon" asChild className="rounded-full bg-white/80 backdrop-blur-sm shadow-sm border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0 mt-1">
                <Link href="/staff/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div className="flex items-center gap-5">
                <Avatar className="h-20 w-20 border-4 border-white shadow-md ring-1 ring-slate-100">
                <AvatarImage src={patient.profileImageUrl} className="object-cover" />
                <AvatarFallback className="text-lg bg-slate-100 text-slate-600">{patient.firstName?.[0]}{patient.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{patient.firstName} {patient.lastName}</h1>
                    <StatusBadge />
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                    <span className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-md"><User className="h-4 w-4" /> ID: <span className="font-mono text-slate-700">{patient.id.substring(0, 8)}...</span></span>
                    {patient.postOpDay !== undefined && (
                        <span className="flex items-center gap-1.5 bg-blue-50/80 text-blue-700 px-2.5 py-1 rounded-md"><Clock className="h-4 w-4" /> Post-Op Day {patient.postOpDay}</span>
                    )}
                </div>
                </div>
            </div>
          </div>
          <div className="flex shrink-0">
             {user && <CreateAppointmentModal patient={patient} staff={user} trigger={<Button className="rounded-full shadow-md bg-blue-600 hover:bg-blue-700 gap-2 pl-3 pr-4"><Calendar className="h-5 w-5" /> Schedule Appointment</Button>} />}
          </div>
        </div>
      </div>


      {/* ================= MAIN CONTENT GRID ================= */}
      <div className="flex-1 p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 max-w-[1600px] mx-auto w-full">

        {/* ___ LEFT COLUMN (Clinical Data) ___ */}
        <div className="space-y-8">
          
          {/* 1. Symptom Visualization Card */}
          <Card className="border-0 shadow-lg shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50/50 px-8 py-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 shadow-sm"><Activity className="h-6 w-6" /></div>
                <div>
                    <CardTitle className="text-xl text-slate-800">Symptom Recovery Trajectory</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Visualizing reported pain and symptom severity over time.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {symptomLoading ? (
                <div className="h-64 flex items-center justify-center text-slate-400">Loading chart data...</div>
              ) : symptomEntries.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No symptom data available yet.</div>
              ) : (
                <SymptomVisualization
                  patientId={id || ''}
                  surgeryType={patient.surgeryType}
                  postOpDay={patient.postOpDay}
                  entries={symptomEntries}
                  recoveryProgress={recoveryProgress || undefined}
                />
              )}
            </CardContent>
          </Card>

          {/* 2. Recent Logs & Appointments grouped */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Logs Tile */}
              <Card className="border-0 shadow-md shadow-slate-200/50 rounded-[2rem] overflow-hidden flex flex-col h-full bg-white">
                <CardHeader className="px-6 py-5 border-b border-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-teal-100 p-2 rounded-lg text-teal-600 shadow-sm"><FileText className="h-5 w-5" /></div>
                    <CardTitle className="text-lg text-slate-800">Latest Symptom Logs</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 bg-slate-50/30">
                  {symptomEntries.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                        <div className="divide-y divide-slate-100">
                        {symptomEntries.slice(0, 5).map((entry) => (
                            <div key={entry.id} className="p-5 hover:bg-white transition-colors cursor-pointer group relative">
                             <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="font-semibold text-slate-800 flex items-center gap-2">
                                {entry.timestamp ? formatDistanceToNow(new Date(entry.timestamp as any), { addSuffix: true }) : 'Unknown'}
                                </div>
                                {entry.postOpDay && <Badge variant="secondary" className="bg-slate-200 text-slate-600 font-medium">Day {entry.postOpDay}</Badge>}
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {entry.symptoms.slice(0, 3).map((s) => (
                                <Badge key={s.id} variant={s.severity >= 7 ? "destructive" : "outline"} className={`${s.severity < 7 ? 'bg-white text-slate-700 border-slate-200' : ''} shadow-sm`}>
                                    {s.symptomType.replace('_', ' ')}: {s.severity}
                                </Badge>
                                ))}
                                {entry.symptoms.length > 3 && <Badge variant="outline" className="bg-slate-50 text-slate-500">+{entry.symptoms.length - 3} more</Badge>}
                            </div>
                            {entry.notes && <p className="text-sm text-slate-600 line-clamp-1 italic pl-2 border-l-2 border-slate-200">"{entry.notes}"</p>}
                            </div>
                        ))}
                        </div>
                    </ScrollArea>
                  ) : (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                        <FileText className="h-10 w-10 text-slate-300 mb-2" />
                        No logs submitted yet.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Appointments Tile - Reusing existing component but wrapped nicely */}
              <div className="h-full [&>div]:h-full [&>div]:rounded-[2rem] [&>div]:border-0 [&>div]:shadow-md [&>div]:shadow-slate-200/50">
                 <AppointmentsCard upcomingAppointments={upcomingAppointments} pastAppointments={pastAppointments} />
              </div>
          </div>

          {/* 3. Full Patient Log View Table (if logs exist) */}
          <Card className="border-0 shadow-lg shadow-slate-200/60 rounded-[2rem] overflow-hidden bg-white mt-8">
            <CardHeader className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-slate-50/50">
                <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600 shadow-sm"><FileClock className="h-6 w-6" /></div>
                <div>
                    <CardTitle className="text-xl text-slate-800">Detailed Patient Log History</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Comprehensive view of all submitted daily logs, including symptoms and notes.</p>
                </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {dailyLogs && dailyLogs.length > 0 ? (
                <>
                    <div className="bg-slate-50/50 px-8 py-3 border-b border-slate-100 flex justify-between items-center text-sm text-slate-500">
                        <span className="font-medium flex items-center gap-2"><FileText className="h-4 w-4"/> Total entries: {dailyLogs.length}</span>
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4"/> Latest: {formatDistanceToNow(dailyLogs[0].timestamp.toDate(), { addSuffix: true })}
                        </span>
                    </div>
                    <div className="p-2">
                        <PatientLogView logs={dailyLogs} patient={patient} />
                    </div>
                </>
                ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500 bg-slate-50/30 m-6 rounded-[1.5rem] border border-dashed border-slate-200">
                    <FileClock className="h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No History Available</h3>
                    <p className="text-sm text-slate-500 max-w-xs">The patient has not submitted any detailed daily logs yet.</p>
                </div>
                )}
            </CardContent>
            </Card>
        </div>


        {/* ___ RIGHT COLUMN (Sidebar: Alerts, Info, Notes) ___ */}
        <div className="space-y-6 lg:sticky lg:top-10 h-fit">

          {/* 1. Critical Alerts Card (High Visual Priority) */}
          <Card className={`border-0 shadow-lg rounded-[2rem] overflow-hidden ${activeAlerts.length > 0 ? 'bg-gradient-to-br from-red-50 to-white shadow-red-200/50 relative' : 'bg-white shadow-slate-200/50'}`}>
            {activeAlerts.length > 0 && <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>}
            <CardHeader className="px-6 py-4 border-b border-red-100/50">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${activeAlerts.length > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'} shadow-sm`}>
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <CardTitle className={`text-lg ${activeAlerts.length > 0 ? 'text-red-800' : 'text-slate-700'}`}>
                    {activeAlerts.length > 0 ? `Active Alerts (${activeAlerts.length})` : 'No Active Alerts'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 bg-red-50/30">
                {activeAlerts.length > 0 ? (
                  <div className="space-y-3">
                  {activeAlerts.map((a) => (
                    <div key={a.id} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex justify-between items-start gap-3 mb-3">
                          <div>
                              <div className="font-bold text-red-700 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" /> {a.title}
                              </div>
                              <div className="text-sm text-slate-600 mt-1 leading-snug">{a.description}</div>
                              <div className="mt-2">
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs font-semibold uppercase tracking-wider shadow-sm">{a.severity} Priority</Badge>
                              </div>
                          </div>
                      </div>
                      
                      {/* Review Action Area */}
                      <div className="mt-3 pt-3 border-t border-red-50 bg-red-50/20 -mx-4 -mb-4 p-4 rounded-b-xl">
                        {reviewingAlertId === a.id ? (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Textarea 
                                    placeholder="Add clinical remark for patient (optional)..." 
                                    value={alertRemarks[a.id] || ''} 
                                    onChange={(e) => setAlertRemarks((prev) => ({ ...prev, [a.id]: e.target.value }))} 
                                    className="text-sm bg-white border-red-200 focus-visible:ring-red-500 min-h-[80px] resize-none shadow-sm" 
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-800 hover:bg-red-100/50" onClick={() => setReviewingAlertId(null)}>Cancel</Button>
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-sm" onClick={() => handleMarkAlertReviewed(a.id, alertRemarks[a.id])}>
                                        <CheckCircle className="h-4 w-4 mr-1.5" /> Mark as Reviewed
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button size="sm" variant="outline" className="w-full bg-white border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 shadow-sm font-medium" onClick={() => setReviewingAlertId(a.id)}>
                                Review Alert
                            </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  </div>
                ) : (
                    <div className="text-center text-slate-500 py-6 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-100 border-dashed shadow-sm">
                        <CheckCircle className="h-10 w-10 text-slate-300 mb-2" />
                        Patient is currently stable.
                    </div>
                )}
            </CardContent>
          </Card>

          {/* 2. Patient Snapshot Card */}
          <Card className="border-0 shadow-md shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="px-6 py-5 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shadow-sm"><User className="h-5 w-5" /></div>
                <CardTitle className="text-lg text-slate-800">Patient Snapshot</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6 text-sm font-medium">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><Activity className="h-3 w-3" /> Surgery</p>
                  <p className="text-slate-900 font-bold truncate" title={patient.surgeryType}>{patient.surgeryType || 'Not specified'}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
                  <p className="text-blue-400 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Recovery</p>
                  <p className="text-blue-900 font-bold">{patient.postOpDay !== undefined ? `Day ${patient.postOpDay}` : 'N/A'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-slate-500 flex items-center gap-1.5"><Stethoscope className="h-4 w-4 text-slate-400" /> Assigned Doctor</p>
                <Select value={selectedDoctorId ?? 'none'} onValueChange={handleDoctorChange}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:ring-blue-500 shadow-sm">
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                    <SelectItem value="none" className="text-slate-500 font-medium">No doctor assigned</SelectItem>
                    <Separator className="my-1 opacity-50"/>
                    {(doctors || []).map((d) => (
                      <SelectItem key={d.id} value={d.id} className="font-medium">Dr. {d.firstName} {d.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-slate-500">
                <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-slate-400" /> Total Logs</span>
                <span className="font-bold text-slate-700">{symptomEntries.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* 3. Staff Chat/Notes Card */}
          <Card className="border-0 shadow-md shadow-slate-200/50 rounded-[2rem] overflow-hidden flex flex-col h-[450px] bg-white">
            <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
               <div className="flex items-center gap-2.5">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600 shadow-sm"><MessageSquare className="h-5 w-5" /></div>
                <div>
                    <CardTitle className="text-lg text-slate-800">Staff Review Notes</CardTitle>
                    <p className="text-xs text-slate-500 font-normal">Internal notes visible only to clinical staff.</p>
                </div>
              </div>
            </CardHeader>
            
            <ScrollArea className="flex-1 p-4 bg-slate-50/30">
              <div className="space-y-4">
                {reviewNotes.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
                    <MessageSquare className="h-8 w-8 mb-2 text-slate-300" />
                    No notes added yet.
                  </div>
                ) : (
                  reviewNotes.map((n, index) => {
                    const isMe = n.authorName === (user?.displayName || 'Staff'); // Simple check for styling
                    return (
                    <div key={n.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none shadow-blue-200/50' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'}`}>
                        <p className="leading-relaxed">{n.note}</p>
                      </div>
                      <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span>{n.authorName || 'Staff'}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  )})
                )}
                 <div ref={notesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-slate-100 bg-white shrink-0">
              <div className="flex gap-2 items-end rounded-xl border border-slate-200 bg-slate-50/50 p-1.5 focus-within:border-blue-500 focus-within:bg-white transition-colors shadow-sm">
                <Textarea
                  placeholder="Type a note..."
                  value={newReviewNote}
                  onChange={(e) => setNewReviewNote(e.target.value)}
                  className="min-h-[40px] max-h-[120px] text-sm resize-none border-0 focus-visible:ring-0 bg-transparent p-2"
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveReviewNote(); } }}
                />
                <Button size="icon" onClick={handleSaveReviewNote} disabled={savingReview || !newReviewNote.trim()} className="h-9 w-9 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">
                  <ChevronRight className={`h-5 w-5 ${savingReview ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function PatientDetailSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <div className="bg-white border-b border-slate-200 px-10 py-8">
        <div className="flex items-center gap-6">
           <Skeleton className="h-20 w-20 rounded-full" />
           <div className="space-y-3">
             <Skeleton className="h-8 w-64 rounded-lg" />
             <Skeleton className="h-5 w-96 rounded-lg" />
           </div>
        </div>
      </div>
      <div className="flex-1 p-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 max-w-[1600px] mx-auto w-full">
        <div className="space-y-8">
          <Skeleton className="h-[400px] w-full rounded-[2rem]" />
          <div className="grid grid-cols-2 gap-6">
             <Skeleton className="h-[350px] w-full rounded-[2rem]" />
             <Skeleton className="h-[350px] w-full rounded-[2rem]" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-[2rem]" />
          <Skeleton className="h-64 w-full rounded-[2rem]" />
          <Skeleton className="h-96 w-full rounded-[2rem]" />
        </div>
      </div>
    </div>
  );
}

function PatientNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 p-6">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 text-center max-w-md">
        <div className="bg-slate-100 p-4 rounded-full inline-flex mb-4 shadow-sm">
            <User className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Patient Not Found</h2>
        <p className="text-slate-500 mb-6">
            The requested patient ID could not be found or does not exist in the system.
        </p>
        <Button asChild className="rounded-full shadow-md bg-slate-800 hover:bg-slate-900 px-6">
            <Link href="/staff/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Triage
            </Link>
        </Button>
      </div>
    </div>
  );
}