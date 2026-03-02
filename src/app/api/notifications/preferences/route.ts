import { NextRequest, NextResponse } from 'next/server';
import type { NotificationPreferences } from '@/types/notifications';
import { notificationStorage } from '@/ai/notification-storage';
import { adminDb } from '@/firebase/admin';

function defaultPrefs(patientId: string): NotificationPreferences {
  return {
    patientId,
    patientPhoneE164: '',
    enabled: true,
    channels: ['whatsapp'],
    reminderTimes: ['09:00'],
    timezone: 'Asia/Kolkata',
    language: 'en',
    remindIfNoLogToday: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 });
  }

  // Try Firestore first, fallback to file storage
  try {
    const doc = await adminDb.collection('notification_preferences').doc(patientId).get();
    if (doc.exists) {
      return NextResponse.json({ success: true, data: doc.data() });
    }
  } catch (e) {
    // ignore
  }

  const stored = notificationStorage.getPreferences(patientId);
  return NextResponse.json({ success: true, data: stored || defaultPrefs(patientId) });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Partial<NotificationPreferences> | null;
  const patientId = body?.patientId;

  if (!patientId) {
    return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 });
  }

  const prefs: NotificationPreferences = {
    ...defaultPrefs(patientId),
    ...body,
    patientId,
    updatedAt: new Date().toISOString(),
  };

  // Try Firestore first, fallback to file storage
  try {
    await adminDb.collection('notification_preferences').doc(patientId).set(prefs);
  } catch (e) {
    notificationStorage.savePreferences(prefs);
  }

  return NextResponse.json({ success: true, data: prefs });
}
