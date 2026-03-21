'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SurgeryTypeSelector } from '@/components/patient/surgery-type-selector';
import { useFirebase } from '@/firebase';
import { SurgeryType } from '@/lib/types';
import { Calendar, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function PatientOnboardingPage() {
  const router = useRouter();
  const { user, userProfile, updateUserProfile, isUserProfileLoading } = useFirebase();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    age: userProfile?.age || undefined,
    surgeryType: userProfile?.surgeryType || undefined,
    surgeryDate: userProfile?.surgeryDate || '',
    postOpDay: userProfile?.postOpDay || undefined
  });

  const calculatePostOpDay = (surgeryDate: string) => {
    if (!surgeryDate) return undefined;
    const surgery = new Date(surgeryDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - surgery.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSurgerySelect = (surgeryType: SurgeryType) => {
    setFormData(prev => ({ ...prev, surgeryType }));
  };

  const handleBasicInfoSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.age) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.age < 1 || formData.age > 120) {
      setError('Please enter a valid age');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleSurgeryInfoSubmit = async () => {
    if (!formData.surgeryType || !formData.surgeryDate) {
      setError('Please select your surgery type and date');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const postOpDay = calculatePostOpDay(formData.surgeryDate);
      
      await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        surgeryType: formData.surgeryType,
        surgeryDate: formData.surgeryDate,
        postOpDay: postOpDay,
        // Set onboarding as complete
        onboardingComplete: true
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/patient/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('Failed to save your information. Please try again.');
      console.error('Onboarding error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isUserProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Setup Complete!</h2>
            <p className="text-green-700 mb-4">
              Your profile is ready. Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                1
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}></div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                2
              </div>
              <span className="font-medium">Surgery Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <Card className="border-2 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-primary flex items-center justify-center gap-3">
                <User className="h-8 w-8" />
                Welcome to CareFlow
              </CardTitle>
              <CardDescription className="text-lg">
                Let's set up your profile for personalized recovery care
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center pt-4">
                <Button size="lg" onClick={handleBasicInfoSubmit} className="px-8">
                  Continue to Surgery Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Surgery Information */}
        {step === 2 && (
          <div className="space-y-6">
            <SurgeryTypeSelector
              selectedSurgery={formData.surgeryType}
              onSurgerySelect={handleSurgerySelect}
              loading={loading}
            />

            {/* Surgery Date Input */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Surgery Date
                </CardTitle>
                <CardDescription>
                  When did you have your surgery?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="surgeryDate">Surgery Date *</Label>
                  <Input
                    id="surgeryDate"
                    type="date"
                    value={formData.surgeryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, surgeryDate: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                {formData.surgeryDate && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Post-Op Day:</strong> {calculatePostOpDay(formData.surgeryDate)} days
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button size="lg" onClick={handleSurgeryInfoSubmit} disabled={loading}>
                {loading ? 'Saving...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
