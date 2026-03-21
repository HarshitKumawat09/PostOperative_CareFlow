import { Timestamp } from "firebase/firestore";

export enum SurgeryType {
  KNEE_REPLACEMENT = 'knee_replacement',
  ABDOMINAL_SURGERY = 'abdominal_surgery',
  CARDIAC_SURGERY = 'cardiac_surgery',
  HIP_REPLACEMENT = 'hip_replacement',
  SPINAL_SURGERY = 'spinal_surgery',
  SHOULDER_SURGERY = 'shoulder_surgery',
  GALLBLADDER_SURGERY = 'gallbladder_surgery',
  APPENDECTOMY = 'appendectomy',
  CESAREAN_SECTION = 'cesarean_section',
  PROSTATE_SURGERY = 'prostate_surgery',
  GENERAL_SURGERY = 'general_surgery'
}

export const SURGERY_TYPE_LABELS = {
  [SurgeryType.KNEE_REPLACEMENT]: 'Knee Replacement',
  [SurgeryType.ABDOMINAL_SURGERY]: 'Abdominal Surgery',
  [SurgeryType.CARDIAC_SURGERY]: 'Cardiac Surgery',
  [SurgeryType.HIP_REPLACEMENT]: 'Hip Replacement',
  [SurgeryType.SPINAL_SURGERY]: 'Spinal Surgery',
  [SurgeryType.SHOULDER_SURGERY]: 'Shoulder Surgery',
  [SurgeryType.GALLBLADDER_SURGERY]: 'Gallbladder Surgery',
  [SurgeryType.APPENDECTOMY]: 'Appendectomy',
  [SurgeryType.CESAREAN_SECTION]: 'Cesarean Section',
  [SurgeryType.PROSTATE_SURGERY]: 'Prostate Surgery',
  [SurgeryType.GENERAL_SURGERY]: 'General Surgery'
} as const;

export interface AssignedDoctorSnapshot {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  specialization?: string;
  contactNumber?: string;
  profileImageUrl?: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'patient' | 'staff';
  bio?: string;
  profileImageUrl?: string;
  doctorId?: string | null;
  assignedDoctor?: AssignedDoctorSnapshot | null;
  activeChatRequestId?: string | null;
  age?: number;
  primaryCondition?: string;
  surgeryType?: SurgeryType;
  postOpDay?: number;
  surgeryDate?: string;
  onboardingComplete?: boolean;
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
