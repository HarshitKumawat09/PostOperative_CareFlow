'use client';

import { ProfileForm } from '@/components/dashboard/patient/profile-form';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

export default function ProfilePage() {
  const { firestore, user, isUserLoading } = useFirebase();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);

  const { data: staffProfile, isLoading: profileLoading } = useDoc<UserProfile>(profileRef);

  const isLoading = isUserLoading || profileLoading;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">My Profile</h1>
      <p className="text-muted-foreground">
        Update your personal information.
      </p>
      {isLoading || !staffProfile ? (
        <Card>
            <CardContent className="pt-6">
                 <div className="flex items-center gap-6">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <div className="space-y-4 mt-6">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </CardContent>
            <CardFooter>
                 <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
      ) : (
        <ProfileForm patient={staffProfile} />
      )}
    </div>
  );
}
