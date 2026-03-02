import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notification-service';
import type { ReminderMessagePayload } from '@/types/notifications';
import { adminDb } from '@/firebase/admin';
import { notificationStorage } from '@/ai/notification-storage';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    patientId?: string;
    to?: string;
    channel?: 'whatsapp' | 'sms';
    patientName?: string;
    checkInUrl?: string;
    language?: 'en' | 'hi';
  } | null;

  if (!body?.patientId || !body?.to || !body?.channel) {
    return NextResponse.json(
      { success: false, error: 'patientId, to, channel are required' },
      { status: 400 },
    );
  }

  const payload: ReminderMessagePayload = {
    patientId: body.patientId,
    patientName: body.patientName,
    checkInUrl: body.checkInUrl,
    language: body.language,
  };

  const result = await notificationService.sendReminder(body.channel, body.to, payload);

  // Store a simple audit record (Firestore if possible, else ignore)
  try {
    await adminDb.collection('notification_audit').add({
      type: 'reminder',
      patientId: body.patientId,
      to: body.to,
      channel: body.channel,
      provider: result.provider,
      success: result.success,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    // ignore
  }

  return NextResponse.json({ success: true, data: result });
}
