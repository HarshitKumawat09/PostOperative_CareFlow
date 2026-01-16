'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
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
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUploadUrl } from '@/app/actions';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

const dailyLogSchema = z.object({
  painLevel: z.number().min(1).max(10),
  woundImage: z.any().optional(),
  tasksCompleted: z.enum(['yes', 'no'], {
    required_error: 'You need to select an option.',
  }),
  additionalNotes: z.string().optional(),
});

export function DailyLogModal() {
  const [open, setOpen] = useState(false);
  const [painLevel, setPainLevel] = useState(5);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, firestore } = useFirebase();

  const form = useForm<z.infer<typeof dailyLogSchema>>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      painLevel: 5,
    },
  });
  
  async function uploadFile(file: File, patientId: string) {
      const {url, fields, publicUrl} = await getUploadUrl({name: file.name, type: file.type}, patientId);
      
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append('file', file);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return publicUrl;
  }

  async function onSubmit(values: z.infer<typeof dailyLogSchema>) {
    if (!user || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to submit a log.',
        });
        return;
    }

    setLoading(true);

    try {
        let imageUrl = "https://picsum.photos/seed/placeholder/400/300";
        const imageFile = values.woundImage?.[0];

        if (imageFile) {
            imageUrl = await uploadFile(imageFile, user.uid);
        }

        const logData = {
          patientId: user.uid,
          painLevel: values.painLevel,
          tasksCompleted: values.tasksCompleted === 'yes',
          notes: values.additionalNotes,
          imageUrl: imageUrl,
          timestamp: serverTimestamp(),
          acknowledged: false,
          doctorsRemarks: '',
        };

        await addDocumentNonBlocking(collection(firestore, `users/${user.uid}/daily_logs`), logData);

        toast({
            title: 'Success!',
            description: "Log submitted successfully!",
        });
        setOpen(false);
        form.reset();
        setPainLevel(5);

    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to submit log. Please try again.',
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full w-14 h-14 shadow-lg">
          <Plus className="w-6 h-6" />
          <span className="sr-only">Log Today's Progress</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Today's Progress</DialogTitle>
          <DialogDescription>
            Provide a quick update on your recovery. This helps your care team monitor your progress.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label htmlFor="painLevel">Pain Level: {painLevel}</Label>
            <Slider
              id="painLevel"
              min={1}
              max={10}
              step={1}
              value={[painLevel]}
              onValueChange={(value) => {
                setPainLevel(value[0]);
                form.setValue('painLevel', value[0]);
              }}
            />
          </div>
          <div className="grid gap-3">
            <Label htmlFor="woundImage">Wound Image</Label>
            <Input id="woundImage" type="file" accept="image/*" {...form.register('woundImage')} />
          </div>
          <div className="grid gap-3">
            <Label>Completed daily tasks?</Label>
             <Controller
                name="tasksCompleted"
                control={form.control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="yes" />
                      <Label htmlFor="yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="no" />
                      <Label htmlFor="no">No</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {form.formState.errors.tasksCompleted && <p className="text-sm text-destructive">{form.formState.errors.tasksCompleted.message}</p>}
          </div>
          <div className="grid gap-3">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any other symptoms or feelings to report?"
              {...form.register('additionalNotes')}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Log'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
