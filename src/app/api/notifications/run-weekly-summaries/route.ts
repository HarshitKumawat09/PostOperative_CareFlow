import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { notificationStorage } from '@/ai/notification-storage';
import { symptomPersistentStorage } from '@/ai/symptom-persistent-storage';
import { notificationService } from '@/services/notification-service';
import type { CaregiverContact, NotificationPreferences } from '@/types/notifications';

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

function buildSummaryText(entries: any[]): string {
  if (!entries.length) return 'No symptom updates were logged this week.';

  const painValues: number[] = [];
  const feverCount: number = entries
    .flatMap((e) => e.symptoms || [])
    .filter((s: any) => s.symptomType === 'fever')
    .length;

  for (const e of entries) {
    const pain = (e.symptoms || []).find((s: any) => s.symptomType === 'pain');
    if (pain?.severity != null) painValues.push(Number(pain.severity));
  }

  const avgPain = painValues.length ? (painValues.reduce((a, b) => a + b, 0) / painValues.length) : 0;

  return `Entries: ${entries.length}. Avg pain: ${avgPain.toFixed(1)}/10. Fever reports: ${feverCount}.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      patientIds?: string[];
    } | null;

    let patientIds: string[] = [];
    if (body?.patientIds?.length) {
      patientIds = body.patientIds;
    } else {
      try {
        patientIds = await getAllPatientsFromFirestore();
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'patientIds required when Firestore is unavailable' },
          { status: 400 },
        );
      }
    }

    const results: any[] = [];

    for (const patientId of patientIds) {
      const prefs = await getPreferences(patientId);
      if (!prefs || !prefs.enabled) {
        results.push({ patientId, skipped: true, reason: 'prefs_disabled_or_missing' });
        continue;
      }

      // last 7 days: just take last 50 and filter by timestamp
      const entries = await symptomPersistentStorage.getSymptomEntries(patientId, 50, 0);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const weekEntries = entries.filter((e) => {
        const ts = e.timestamp instanceof Date ? e.timestamp.getTime() : new Date(e.timestamp as any).getTime();
        return ts >= cutoff.getTime();
      });

      const caregivers = (await getCaregivers(patientId)).filter((c) => c.receiveWeeklySummary);
      if (caregivers.length === 0) {
        results.push({ patientId, skipped: true, reason: 'no_weekly_caregivers' });
        continue;
      }

      const summaryText = buildSummaryText(weekEntries);
      const sends: any[] = [];

      for (const caregiver of caregivers) {
        for (const ch of caregiver.channels || []) {
          const r = await notificationService.sendWeeklySummary(ch, caregiver.phoneE164, {
            patientId,
            summaryText,
            language: prefs.language,
          });
          sends.push(r);
        }
      }

      results.push({ patientId, caregivers: caregivers.length, sent: sends.length, sends, summaryText });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('run-weekly-summaries error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run weekly summaries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
