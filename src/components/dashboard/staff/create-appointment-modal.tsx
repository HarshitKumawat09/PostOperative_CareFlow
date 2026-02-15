'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { CalendarPlus } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import type { User } from 'firebase/auth';

const appointmentSchema = z.object({
  title: z.string().min(3, 'Appointment title must be at least 3 characters.'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please select a valid date and time.',
  }),
});

interface CreateAppointmentModalProps {
    patient: UserProfile;
    staff: User;
}

export function CreateAppointmentModal({ patient, staff }: CreateAppointmentModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      title: '',
      date: '',
    },
  });

  async function onSubmit(values: z.infer<typeof appointmentSchema>) {
    if (!firestore || !patient) return;

    setLoading(true);

    try {
      const appointmentData = {
        patientId: patient.id,
        title: values.title,
        date: new Date(values.date).toISOString(),
        with: staff.displayName || 'Medical Staff',
      };

      const appointmentsRef = collection(firestore, `users/${patient.id}/appointments`);
      await addDocumentNonBlocking(appointmentsRef, appointmentData);

      toast({
        title: 'Appointment Scheduled',
        description: `An appointment for ${patient.firstName} has been created.`,
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to schedule appointment. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <CalendarPlus className="mr-2 h-4 w-4" />
            Schedule Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment for {patient.firstName} {patient.lastName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label htmlFor="title">Appointment Title</Label>
            <Input id="title" {...form.register('title')} />
            {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
          </div>
          <div className="grid gap-3">
            <Label htmlFor="date">Date & Time</Label>
            <Input id="date" type="datetime-local" {...form.register('date')} />
             {form.formState.errors.date && <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Scheduling...' : 'Schedule'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
