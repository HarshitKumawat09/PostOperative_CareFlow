import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { notificationStorage } from '@/ai/notification-storage';
import { symptomPersistentStorage } from '@/ai/symptom-persistent-storage';
import { notificationService } from '@/services/notification-service';
import type { CaregiverContact, NotificationPreferences } from '@/types/notifications';

function startOfTodayKolkata(): number {
  const now = new Date();
  // Approximate: server local time is fine for demo; store as local date start
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.getTime();
}

async function getAllPatientsFromFirestore(): Promise<string[]> {
  const snapshot = await adminDb.collection('users').where('role', '==', 'patient').get();
  return snapshot.docs.map((d) => d.id);
}

async function getPreferences(patientId: string): Promise<NotificationPreferences | null> {
  try {
    const doc = await adminDb.collection('notification_preferences').doc(patientId).get();
    if (doc.exists) return doc.data() as NotificationPreferences;
  } catch (e) {
    // ignore
  }

  return notificationStorage.getPreferences(patientId);
}

async function getCaregivers(patientId: string): Promise<CaregiverContact[]> {
  try {
    const snapshot = await adminDb.collection('caregivers').where('patientId', '==', patientId).get();
    return snapshot.docs.map((d) => d.data() as CaregiverContact);
  } catch (e) {
    return notificationStorage.listCaregivers(patientId);
  }
}

async function hasSymptomLogToday(patientId: string): Promise<boolean> {
  // Firestore may be unavailable locally; the persistent storage is our reliable fallback.
  const entries = await symptomPersistentStorage.getSymptomEntries(patientId, 1, 0);
  if (!entries.length) return false;

  const todayStart = startOfTodayKolkata();
  return entries.some((e) => {
    const ts = e.timestamp instanceof Date ? e.timestamp.getTime() : new Date(e.timestamp as any).getTime();
    return ts >= todayStart;
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      patientIds?: string[];
      checkInUrl?: string;
    } | null;

    let patientIds: string[] = [];
    if (body?.patientIds?.length) {
      patientIds = body.patientIds;
    } else {
      // If no list passed, try pull all patients from Firestore (if configured)
      try {
        patientIds = await getAllPatientsFromFirestore();
      } catch (e) {
        patientIds = symptomPersistentStorage.listPatientIds();

        if (!patientIds.length) {
          return NextResponse.json(
            { success: false, error: 'No patients found locally. Provide patientIds or log symptoms at least once.' },
            { status: 400 },
          );
        }
      }
    }

    const checkInUrl = body?.checkInUrl || '';

    const results: any[] = [];

    for (const patientId of patientIds) {
      const prefs = await getPreferences(patientId);
      if (!prefs || !prefs.enabled) {
        results.push({ patientId, skipped: true, reason: 'prefs_disabled_or_missing' });
        continue;
      }

      if (prefs.remindIfNoLogToday) {
        const loggedToday = await hasSymptomLogToday(patientId);
        if (loggedToday) {
          results.push({ patientId, skipped: true, reason: 'already_logged_today' });
          continue;
        }
      }

      const channels = prefs.channels?.length ? prefs.channels : ['whatsapp'];
      const sends: any[] = [];

      // Send to patient
      if (prefs.patientPhoneE164) {
        for (const ch of channels) {
          const r = await notificationService.sendReminder(ch, prefs.patientPhoneE164, {
            patientId,
            checkInUrl,
            language: prefs.language,
          });
          sends.push(r);
        }
      }

      // Send to caregivers (if configured)
      const caregivers = await getCaregivers(patientId);
      for (const caregiver of caregivers) {
        for (const ch of caregiver.channels || []) {
          const r = await notificationService.sendReminder(ch, caregiver.phoneE164, {
            patientId,
            checkInUrl,
            language: prefs.language,
          });
          sends.push(r);
        }
      }

      results.push({ patientId, sent: sends.length, sends });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('run-daily-reminders error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run daily reminders',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
