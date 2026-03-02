// Notification + caregiver data structures

export type NotificationChannel = 'whatsapp' | 'sms';

export interface NotificationPreferences {
  patientId: string;
  patientPhoneE164?: string; // +91...
  enabled: boolean;
  channels: NotificationChannel[];
  // Times are stored in local time (India) as HH:mm (24h)
  reminderTimes: string[];
  timezone: string; // e.g. "Asia/Kolkata"
  language: 'en' | 'hi';
  // If true, system will send a reminder if patient hasn't logged today
  remindIfNoLogToday: boolean;
  updatedAt: string; // ISO
}

export interface CaregiverContact {
  id: string;
  patientId: string;
  name: string;
  relationship?: string;
  phoneE164: string; // +91...
  channels: NotificationChannel[];
  receiveWeeklySummary: boolean;
  receiveCriticalAlerts: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ReminderMessagePayload {
  patientId: string;
  patientName?: string;
  checkInUrl?: string;
  language?: 'en' | 'hi';
}

export interface WeeklySummaryPayload {
  patientId: string;
  patientName?: string;
  summaryText: string;
  language?: 'en' | 'hi';
}

export interface NotificationSendResult {
  channel: NotificationChannel;
  to: string;
  provider: string;
  success: boolean;
  error?: string;
  messageId?: string;
}
