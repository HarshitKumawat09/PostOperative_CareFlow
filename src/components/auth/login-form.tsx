'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { auth, firestore } = useFirebase();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // After successful login, fetch the user's profile to get their role
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userProfile = userDoc.data() as UserProfile;
        // Redirect based on role
        if (userProfile.role === 'staff') {
          router.push('/staff/dashboard');
        } else {
          router.push('/patient/dashboard');
        }
      } else {
        // This case should ideally not happen if signup creates the user doc
        setError('User profile not found. Please contact support.');
        await auth.signOut(); // Log out the user
      }
    } catch (e: any) {
      switch (e.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            setError('Invalid email or password.');
            break;
        default:
            setError('An unexpected error occurred. Please try again.');
            console.error(e);
            break;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="m@example.com" {...form.register('email')} />
        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
      </div>
      <div className="grid gap-2">
        <div className="flex items-center">
          <Label htmlFor="password">Password</Label>
          {/* <Link href="#" className="ml-auto inline-block text-sm underline">
            Forgot your password?
          </Link> */}
        </div>
        <Input id="password" type="password" {...form.register('password')} />
        {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
      </div>
      {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Login Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
