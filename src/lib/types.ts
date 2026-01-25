import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'patient' | 'staff';
  bio?: string;
  profileImageUrl?: string;
  doctorId?: string | null;
  activeChatRequestId?: string | null;
  age?: number;
  primaryCondition?: string;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  contactNumber: string;
  profileImageUrl?: string;
}

export interface DailyLog {
  id: string;
  patientId: string;
  timestamp: Timestamp;
  painLevel: number;
  imageUrl: string;
  tasksCompleted: boolean;
  notes?: string;
  acknowledged: boolean;
  doctorsRemarks?: string;
}

export interface Appointment {
    id: string;
    patientId: string;
    date: string; // ISO string format
    title: string;
    with: string; // Doctor's name or department
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
}

export interface EmergencyAlert {
    id: string;
    patientId: string;
    patientName: string;
    timestamp: Timestamp;
    status: 'active' | 'acknowledged';
    location?: string;
    staffId?: string | null;
}

export interface ChatRequest {
  id: string;
  patientId: string;
  patientName: string;
  initialQuestion: string;
  status: 'pending' | 'active';
  staffId?: string | null;
  activeChatId?: string | null;
  timestamp: Timestamp;
}

export interface ActiveChat {
    id: string;
    patientId: string;
    staffId: string;
    patientName: string;
    staffName: string;
    lastMessage?: string;
    lastMessageTimestamp?: Timestamp;
}
