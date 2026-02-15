'use client';

import { useState, useMemo } from 'react';
import { PhoneOutgoing, AlertTriangle } from 'lucide-react';
import { useLongPress } from '@/hooks/use-long-press';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp, addDoc } from 'firebase/firestore';

export function SosButton() {
  const [isTriggered, setIsTriggered] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  
  const onLongPress = async () => {
    if (!user || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to trigger SOS.',
        });
        return;
    }

    try {
        const alertData = {
            patientId: user.uid,
            patientName: user.displayName || 'Unknown Patient',
            location: 'Not available', // Geolocation could be added here
            timestamp: serverTimestamp(),
            status: 'active' as const,
            staffId: null,
        };
        
        await addDoc(collection(firestore, 'emergency_alerts'), alertData);

        setIsTriggered(true);
        setShowConfirmation(true);
        if (typeof window.navigator.vibrate === 'function') {
            window.navigator.vibrate(200);
        }
    } catch(error) {
        console.error("SOS Error:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to send SOS. Please try again.',
        });
    }
  };

  const { progress, ...longPressProps } = useLongPress(onLongPress, { duration: 3000 });
  
  const circumference = 2 * Math.PI * 22; // 2 * pi * radius
  const strokeDashoffset = useMemo(() => {
    return circumference - (progress / 100) * circumference;
  }, [progress, circumference]);

  if (isTriggered) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative flex items-center justify-center w-14 h-14">
                <Button
                  variant="destructive"
                  size="icon"
                  className="rounded-full w-14 h-14 shadow-lg animate-pulse"
                  aria-label="SOS Alert Sent"
                >
                  <AlertTriangle className="w-6 h-6" />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Help has been notified!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                Emergency Alert Sent
              </AlertDialogTitle>
              <AlertDialogDescription>
                Please wait, an emergency respondent will be contacting you soon.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowConfirmation(false)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="relative rounded-full w-14 h-14 shadow-lg active:scale-95 transition-transform"
            aria-label="Emergency SOS"
            {...longPressProps}
          >
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 48 48">
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="hsl(var(--muted))"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r="22"
                stroke="hsl(var(--destructive))"
                strokeWidth="3"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 24 24)"
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>
            <PhoneOutgoing className="w-6 h-6 relative z-10" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Press and hold for 3 seconds for emergency</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
