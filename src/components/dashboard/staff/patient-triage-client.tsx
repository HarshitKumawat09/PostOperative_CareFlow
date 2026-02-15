'use client';

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
import { CheckCircle, Info, RefreshCw } from 'lucide-react';
import { useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

interface PatientTriageClientProps {
  patients: UserProfile[];
}

// A sub-component to fetch and calculate the status for a single patient
function PatientRow({ patient, onClick }: { patient: UserProfile, onClick: (id: string) => void }) {
  const { firestore } = useCollection.useFirebase();

  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `users/${patient.id}/daily_logs`),
      where('acknowledged', '==', false)
    );
  }, [firestore, patient.id]);

  const { data: unacknowledgedLogs, isLoading } = useCollection(logsQuery);
  
  const lastLogQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, `users/${patient.id}/daily_logs`), 
        orderBy('timestamp', 'desc'), 
        limit(1)
    );
  }, [firestore, patient.id]);

  const { data: lastLogArr } = useCollection(lastLogQuery);


  let status: 'Needs Review' | 'On Track' | 'Pending' = 'On Track';
  if (isLoading) {
    status = 'Pending';
  } else if (unacknowledgedLogs && unacknowledgedLogs.length > 0) {
    status = 'Needs Review';
  }

  return (
    <TableRow onClick={() => onClick(patient.id)} className="cursor-pointer">
      <TableCell className="font-medium">{patient.id.substring(0, 7)}...</TableCell>
      <TableCell>{patient.firstName} {patient.lastName}</TableCell>
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
          {lastLogArr && lastLogArr.length > 0 ? new Date(lastLogArr[0].timestamp.toDate()).toLocaleDateString() : 'N/A'}
      </TableCell>
    </TableRow>
  );
}


export function PatientTriageClient({ patients }: PatientTriageClientProps) {
  const router = useRouter();

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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Last Log Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length > 0 ? (
                patients.map((patient) => (
                    <PatientRow key={patient.id} patient={patient} onClick={handleRowClick} />
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                        No patients assigned to you.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// A tiny hook to get firestore instance inside the sub-component without prop drilling
useCollection.useFirebase = useFirebase;
