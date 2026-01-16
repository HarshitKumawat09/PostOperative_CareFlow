'use client';

import type { Doctor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Stethoscope, Phone } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface DoctorCardProps {
  doctor?: Doctor | null;
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  if (doctor === undefined) { // Loading state
      return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-6 h-6" />
                    Assigned Doctor
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            </CardContent>
        </Card>
      )
  }

  if (!doctor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6" />
            Assigned Doctor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No doctor assigned.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-6 h-6" />
          Assigned Doctor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="item-1">
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-semibold text-lg">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={doctor.profileImageUrl} alt={`${doctor.firstName} ${doctor.lastName}`} />
                  <AvatarFallback>{doctor.firstName?.charAt(0)}{doctor.lastName?.charAt(0)}</AvatarFallback>
                </Avatar>
                {doctor.firstName} {doctor.lastName}
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-2">
              <p className="text-muted-foreground">{doctor.specialization}</p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <a href={`tel:${doctor.contactNumber}`} className="text-primary hover:underline">
                  {doctor.contactNumber}
                </a>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
