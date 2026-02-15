'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['patient', 'staff'], {
    required_error: 'You must select a role.',
  }),
});

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { auth, firestore } = useFirebase();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'patient',
    },
  });

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      
      // 2. Update Firebase Auth profile
      await updateProfile(user, {
        displayName: `${values.firstName} ${values.lastName}`,
      });

      // 3. Create user document in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      const userProfileData = {
        id: user.uid,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role, // Use role from form
        bio: '',
        profileImageUrl: '',
        doctorId: null,
        activeChatRequestId: null,
      };
      
      // Use await with setDoc to ensure the document is created before proceeding.
      await setDoc(userDocRef, userProfileData);

      setSuccess(true);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError('This email address is already in use.');
      } else {
        setError('An unexpected error occurred. Please try again.');
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="grid gap-4 text-center">
         <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Account Created!</AlertTitle>
              <AlertDescription>Your account has been created successfully. Please switch to the Login tab to continue.</AlertDescription>
         </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-3">
        <Label>I am a...</Label>
        <Controller
            name="role"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient" className="font-normal">Patient</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="staff" id="staff" />
                  <Label htmlFor="staff" className="font-normal">Staff</Label>
                </div>
              </RadioGroup>
            )}
          />
          {form.formState.errors.role && <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" placeholder="John" {...form.register('firstName')} />
          {form.formState.errors.firstName && <p className="text-sm text-destructive">{form.formState.errors.firstName.message}</p>}
          </div>
          <div className="grid gap-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" placeholder="Doe" {...form.register('lastName')} />
          {form.formState.errors.lastName && <p className="text-sm text-destructive">{form.formState.errors.lastName.message}</p>}
          </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="m@example.com" {...form.register('email')} />
        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...form.register('password')} />
        {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
      </div>
      {error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Signup Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  );
}
