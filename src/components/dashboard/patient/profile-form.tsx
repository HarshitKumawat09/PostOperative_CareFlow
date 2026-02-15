'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/lib/types';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save } from 'lucide-react';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  bio: z.string().max(200, 'Bio must be less than 200 characters.').optional(),
  profileImageUrl: z.string().url('Please enter a valid image URL.').or(z.literal('')).optional(),
});

interface ProfileFormProps {
  patient: UserProfile;
}

export function ProfileForm({ patient }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, firestore, auth } = useFirebase();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      bio: patient.bio || '',
      profileImageUrl: patient.profileImageUrl || '',
    },
  });

  const avatarUrl = form.watch('profileImageUrl');

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    setLoading(true);
    
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        
        // Data for Firestore document
        const firestoreData = {
            firstName: values.firstName,
            lastName: values.lastName,
            bio: values.bio,
            profileImageUrl: values.profileImageUrl,
        };

        // Update Firestore document
        updateDocumentNonBlocking(userDocRef, firestoreData);
        
        // Also update Firebase Auth user profile
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, {
                displayName: `${values.firstName} ${values.lastName}`,
                photoURL: values.profileImageUrl,
            });
        }
        
        toast({
            title: 'Profile Updated',
            description: 'Your information has been saved successfully.',
        });
    } catch (error) {
        console.error("Profile update error:", error);
        toast({
            title: 'Update Failed',
            description: 'Could not save your profile. Please try again.',
            variant: 'destructive',
        });
    } finally {
        setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="pt-6 grid gap-6">
           <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border">
              <AvatarImage src={avatarUrl} alt={`${form.getValues('firstName')} ${form.getValues('lastName')}`} />
              <AvatarFallback className="text-3xl">
                {form.getValues('firstName')?.charAt(0)}{form.getValues('lastName')?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid gap-2 flex-1">
              <Label htmlFor="profileImageUrl">Profile Image URL</Label>
              <Input
                id="profileImageUrl"
                placeholder="https://example.com/image.png"
                {...form.register('profileImageUrl')}
              />
              {form.formState.errors.profileImageUrl && <p className="text-sm text-destructive">{form.formState.errors.profileImageUrl.message}</p>}
            </div>
          </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" {...form.register('firstName')} />
                    {form.formState.errors.firstName && <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" {...form.register('lastName')} />
                    {form.formState.errors.lastName && <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>}
                </div>
            </div>
          
          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us a little about yourself"
              {...form.register('bio')}
              rows={3}
            />
             {form.formState.errors.bio && <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>}
          </div>

        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
