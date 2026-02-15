import type { UserProfile } from '@/lib/types';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import Link from 'next/link';

interface ProfileCardProps {
  patient: UserProfile;
}

export function ProfileCard({ patient }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="relative">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar className="w-24 h-24 border-4 border-card">
            <AvatarImage src={patient.profileImageUrl} alt={patient.firstName} />
            <AvatarFallback className="text-3xl">{patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold font-headline">{patient.firstName} {patient.lastName}</h2>
            <p className="text-muted-foreground">{patient.bio || "No bio set."}</p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="absolute top-4 right-4">
            <Link href="/patient/profile">
                <Pencil className="w-4 h-4 mr-2" />
                Edit Profile
            </Link>
        </Button>
      </CardHeader>
    </Card>
  );
}
