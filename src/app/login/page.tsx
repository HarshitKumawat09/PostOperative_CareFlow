'use client';

import { AuthLayout } from '@/components/auth/auth-layout';
import { LoginForm } from '@/components/auth/login-form';
import { SignupForm } from '@/components/auth/signup-form';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // The login form handles role-based redirection upon successful login.
    // If a user is already logged in and somehow lands here, the login form's
    // own logic will eventually redirect them.
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="space-y-4">
          <Skeleton className="h-12 w-80" />
          <Skeleton className="h-40 w-80" />
          <Skeleton className="h-10 w-80" />
        </div>
      </div>
    );
  }

  return (
    <AuthLayout>
        <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <Card className="border-0 shadow-none bg-transparent">
                    <CardHeader className="text-center px-0">
                        <CardTitle className="text-3xl font-bold font-headline">Welcome Back</CardTitle>
                        <CardDescription>
                          Enter your credentials to access your dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        <LoginForm />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="signup">
                <Card className="border-0 shadow-none bg-transparent">
                     <CardHeader className="text-center px-0">
                        <CardTitle className="text-3xl font-bold font-headline">Create an Account</CardTitle>
                        <CardDescription>
                          Select your role and enter your information to get started.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        <SignupForm />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </AuthLayout>
  );
}
