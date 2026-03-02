import type {
  NotificationChannel,
  NotificationSendResult,
  ReminderMessagePayload,
  WeeklySummaryPayload,
} from '@/types/notifications';

interface NotificationProvider {
  name: string;
  sendWhatsApp(to: string, message: string): Promise<NotificationSendResult>;
  sendSms(to: string, message: string): Promise<NotificationSendResult>;
}

class ConsoleNotificationProvider implements NotificationProvider {
  name = 'console';

  async sendWhatsApp(to: string, message: string): Promise<NotificationSendResult> {
    console.log(`[WhatsApp][console] to=${to} message=${message}`);
    return { channel: 'whatsapp', to, provider: this.name, success: true };
  }

  async sendSms(to: string, message: string): Promise<NotificationSendResult> {
    console.log(`[SMS][console] to=${to} message=${message}`);
    return { channel: 'sms', to, provider: this.name, success: true };
  }
}

function buildReminderMessage(payload: ReminderMessagePayload): string {
  const lang = payload.language || 'en';
  const url = payload.checkInUrl || '';

  if (lang === 'hi') {
    return `Namaste${payload.patientName ? ` ${payload.patientName}` : ''}! Aaj ka recovery check-in kar lijiye. ${url}`.trim();
  }

  return `Hi${payload.patientName ? ` ${payload.patientName}` : ''}! Please complete your recovery check-in. ${url}`.trim();
}

function buildWeeklySummaryMessage(payload: WeeklySummaryPayload): string {
  const lang = payload.language || 'en';

  if (lang === 'hi') {
    return `Weekly Recovery Summary${payload.patientName ? ` (${payload.patientName})` : ''}: ${payload.summaryText}`;
  }

  return `Weekly Recovery Summary${payload.patientName ? ` (${payload.patientName})` : ''}: ${payload.summaryText}`;
}

export class NotificationService {
  private provider: NotificationProvider;

  constructor(provider?: NotificationProvider) {
    this.provider = provider || new ConsoleNotificationProvider();
  }

  async send(
    channel: NotificationChannel,
    to: string,
    message: string,
  ): Promise<NotificationSendResult> {
    if (channel === 'whatsapp') return this.provider.sendWhatsApp(to, message);
    return this.provider.sendSms(to, message);
  }

  async sendReminder(
    channel: NotificationChannel,
    to: string,
    payload: ReminderMessagePayload,
  ): Promise<NotificationSendResult> {
    return this.send(channel, to, buildReminderMessage(payload));
  }

  async sendWeeklySummary(
    channel: NotificationChannel,
    to: string,
    payload: WeeklySummaryPayload,
  ): Promise<NotificationSendResult> {
    return this.send(channel, to, buildWeeklySummaryMessage(payload));
  }
}

export const notificationService = new NotificationService();
