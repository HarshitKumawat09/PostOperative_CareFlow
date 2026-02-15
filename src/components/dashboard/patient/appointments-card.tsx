'use client';

import type { Appointment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock } from 'lucide-react';

interface AppointmentsCardProps {
  upcomingAppointments: Appointment[];
  pastAppointments: Appointment[];
}

function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground p-4 text-center">No appointments found.</p>;
  }

  return (
    <ul className="space-y-4">
      {appointments.map((apt) => (
        <li key={apt.id} className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-md bg-secondary text-secondary-foreground">
              <span className="text-xs">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</span>
              <span className="text-lg font-bold">{new Date(apt.date).getDate()}</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">{apt.title}</p>
            <p className="text-sm text-muted-foreground">with {apt.with}</p>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Clock className="w-4 h-4 mr-1.5" />
              <span>{new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AppointmentsCard({ upcomingAppointments, pastAppointments }: AppointmentsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Appointments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            <AppointmentList appointments={upcomingAppointments} />
          </TabsContent>
          <TabsContent value="past" className="mt-4">
            <AppointmentList appointments={pastAppointments} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
