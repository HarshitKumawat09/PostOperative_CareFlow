'use client';

import { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import type { EmergencyAlert } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SosAlertHandler() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  // Real-time listener for active SOS alerts
  const activeAlertsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'emergency_alerts'),
      where('status', '==', 'active')
    );
  }, [firestore, user]);

  const { data: activeAlerts } = useCollection<EmergencyAlert>(activeAlertsQuery);

  // The alert to display is the first one in the active list.
  // A more robust implementation might sort by timestamp to show the oldest first.
  const currentAlert = activeAlerts && activeAlerts.length > 0 ? activeAlerts[0] : null;

  const handleAcknowledge = async () => {
    if (!currentAlert || !user) return;

    setIsAcknowledging(true);
    const alertRef = doc(firestore, 'emergency_alerts', currentAlert.id);

    try {
      await updateDoc(alertRef, {
        status: 'acknowledged',
        staffId: user.uid,
      });
      toast({
        title: 'SOS Acknowledged',
        description: `You have acknowledged the alert from ${currentAlert.patientName}.`,
      });
    } catch (error) {
      console.error('Failed to acknowledge SOS:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to acknowledge the alert. It may have been handled by another staff member.',
      });
    } finally {
      // The onSnapshot listener will automatically cause a re-render when the status changes,
      // which will make `currentAlert` null and close the dialog.
      setIsAcknowledging(false);
    }
  };

  return (
    <AlertDialog open={!!currentAlert}>
      <AlertDialogContent>
        {currentAlert && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Urgent SOS Alert
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-4 text-lg text-foreground">
                Patient <span className="font-bold">{currentAlert.patientName}</span> has triggered an SOS alert.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleAcknowledge}
                disabled={isAcknowledging}
              >
                {isAcknowledging && <Loader2 className="mr-2 h-4 w-4 animate-spin" /> }
                Acknowledge SOS
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
