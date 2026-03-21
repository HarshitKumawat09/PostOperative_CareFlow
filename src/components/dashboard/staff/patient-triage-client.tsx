'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { UserProfile } from '@/lib/types';
import { SURGERY_TYPE_LABELS } from '@/lib/types';
import { CheckCircle, Info, RefreshCw, Stethoscope } from 'lucide-react';

interface PatientTriageClientProps {
  patients: UserProfile[];
}

type TriageStatus = 'Needs Review' | 'On Track' | 'Pending';

interface SymptomSummary {
  patientId: string;
  lastEntryDate: string | null;
  totalEntries: number;
  activeAlerts: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' | 'Unknown';
}

// A sub-component to render a single patient row based on pre-fetched summaries
function PatientRow({
  patient,
  summary,
  onClick,
}: {
  patient: UserProfile;
  summary?: SymptomSummary;
  onClick: (id: string) => void;
}) {
  let status: TriageStatus = 'Pending';

  if (summary) {
    if (!summary.totalEntries) {
      status = 'Pending';
    } else if (
      summary.riskLevel === 'High' ||
      summary.riskLevel === 'Critical' ||
      summary.activeAlerts > 0
    ) {
      status = 'Needs Review';
    } else {
      status = 'On Track';
    }
  }

  return (
    <TableRow onClick={() => onClick(patient.id)} className="cursor-pointer">
      <TableCell className="font-medium">{patient.id.substring(0, 7)}...</TableCell>
      <TableCell>{patient.firstName} {patient.lastName}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          {patient.surgeryType ? (
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {SURGERY_TYPE_LABELS[patient.surgeryType] || patient.surgeryType.replace('_', ' ')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Stethoscope className="h-4 w-4" />
              <span className="text-sm">Not specified</span>
            </div>
          )}
          {patient.postOpDay && (
            <div className="text-xs text-muted-foreground">
              Day {patient.postOpDay}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <Badge
            variant={
              status === 'Needs Review' ? 'destructive' : status === 'On Track' ? 'default' : 'secondary'
            }
            className={`inline-flex items-center gap-1.5 ${status === 'On Track' ? 'bg-green-100 text-green-800' : status === 'Needs Review' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}
          >
            {status === 'Needs Review' ? <RefreshCw className="h-3 w-3"/> : status === 'On Track' ? <CheckCircle className="h-3 w-3" /> : <Info className="h-3 w-3" />}
            {status}
          </Badge>
      </TableCell>
      <TableCell className="text-right">
        {summary?.lastEntryDate
          ? new Date(summary.lastEntryDate).toLocaleDateString()
          : 'N/A'}
      </TableCell>
    </TableRow>
  );
}


export function PatientTriageClient({ patients }: PatientTriageClientProps) {
  const router = useRouter();
  const [summaries, setSummaries] = React.useState<SymptomSummary[] | null>(null);
  const [loadingSummaries, setLoadingSummaries] = React.useState(false);

  React.useEffect(() => {
    const loadSummaries = async () => {
      if (!patients || patients.length === 0) {
        setSummaries([]);
        return;
      }

      setLoadingSummaries(true);
      try {
        const res = await fetch('/api/symptom-tracking/staff-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientIds: patients.map((p) => p.id) }),
        });

        if (!res.ok) {
          throw new Error('Failed to fetch symptom summaries');
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSummaries(json.data as SymptomSummary[]);
        } else {
          setSummaries([]);
        }
      } catch (err) {
        console.error('Error loading symptom summaries:', err);
        setSummaries([]);
      } finally {
        setLoadingSummaries(false);
      }
    };

    loadSummaries();
  }, [patients]);

  const handleRowClick = (patientId: string) => {
    router.push(`/staff/patients/${patientId}`);
  };

  return (
    <Card>
       <CardHeader>
        <CardTitle>Assigned Patients</CardTitle>
        <CardDescription>Click on a patient to view their detailed logs and progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Surgery</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Last Log Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length > 0 ? (
              patients.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  summary={summaries?.find((s) => s.patientId === patient.id)}
                  onClick={handleRowClick}
                />
              ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        {loadingSummaries ? 'Loading symptom data...' : 'No patients assigned to you.'}
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
