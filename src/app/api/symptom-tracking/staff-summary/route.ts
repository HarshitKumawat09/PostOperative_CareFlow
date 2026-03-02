import { NextRequest, NextResponse } from 'next/server';
import { SymptomEntry } from '@/types/symptom-tracking';
import { symptomPersistentStorage } from '@/ai/symptom-persistent-storage';
import { adminDb } from '@/firebase/admin';
import { symptomEngagementStorage } from '@/ai/symptom-engagement-storage';

export const runtime = 'nodejs';

interface StaffSymptomSummary {
  patientId: string;
  lastEntryDate: string | null;
  totalEntries: number;
  activeAlerts: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical' | 'Unknown';
}

async function fetchSummaryFromLogApi(
  req: NextRequest,
  patientId: string,
): Promise<StaffSymptomSummary | null> {
  try {
    const origin = new URL(req.url).origin;
    const res = await fetch(
      `${origin}/api/symptom-tracking/log?patientId=${encodeURIComponent(patientId)}&limit=1`,
      { cache: 'no-store' },
    );

    const json = (await res.json().catch(() => null)) as any;
    if (!json?.success) return null;

    const entries = Array.isArray(json.data) ? json.data : json.data ? [json.data] : [];
    const lastEntryDate = entries?.[0]?.timestamp ? new Date(entries[0].timestamp).toISOString() : null;
    const alerts = Array.isArray(json.alerts) ? json.alerts : [];
    const activeAlerts = alerts.filter((a: any) => !a.acknowledged && !a.reviewedByStaff).length;
    const riskLevel = (json.progress?.riskLevel as StaffSymptomSummary['riskLevel']) || 'Unknown';

    return {
      patientId,
      lastEntryDate,
      totalEntries: entries.length,
      activeAlerts,
      riskLevel,
    };
  } catch (e) {
    return null;
  }
}

async function getEntriesForPatient(patientId: string, limit: number = 50): Promise<SymptomEntry[]> {
  // Try Firestore first (if configured), then fallback to persistent storage
  try {
    const snapshot = await adminDb
      .collection('users')
      .doc(patientId)
      .collection('symptom_entries')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const entries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        timestamp: new Date(data.timestamp),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as SymptomEntry;
    });

    if (entries.length > 0) return entries;
  } catch (err) {
    // Ignore and fallback
  }

  return symptomPersistentStorage.getSymptomEntries(patientId, limit, 0);
}

function computeSummary(patientId: string, entries: SymptomEntry[]): StaffSymptomSummary {
  if (!entries || entries.length === 0) {
    return {
      patientId,
      lastEntryDate: null,
      totalEntries: 0,
      activeAlerts: 0,
      riskLevel: 'Unknown',
    };
  }

  const sorted = [...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const last = sorted[0];

  // Simple heuristic: look at most recent entry's symptoms
  let risk: StaffSymptomSummary['riskLevel'] = 'Low';
  let activeAlerts = 0;

  for (const s of last.symptoms) {
    if (s.severity >= 8) {
      risk = 'High';
      activeAlerts++;
    } else if (s.severity >= 6 && risk !== 'High') {
      risk = 'Moderate';
      activeAlerts++;
    }
  }

  return {
    patientId,
    lastEntryDate: last.timestamp.toISOString(),
    totalEntries: entries.length,
    activeAlerts,
    riskLevel: risk,
  };
}

async function getStaffReviewedAlertIds(patientId: string): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection('users')
      .doc(patientId)
      .collection('symptom_alert_reviews')
      .get();
    const ids = snapshot.docs.map((d) => d.id);
    if (ids.length) return ids;
  } catch (e) {
    // ignore and fallback
  }

  return symptomEngagementStorage.listStaffReviewedAlertIds(patientId);
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const body = await req.json().catch(() => null);
    const patientIdsFromBody: unknown = body?.patientIds;

    const patientIdsFromQuery = url.searchParams
      .get('patientIds')
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const patientIds: string[] | undefined = Array.isArray(patientIdsFromBody)
      ? (patientIdsFromBody as string[])
      : patientIdsFromQuery;

    if (!patientIds || patientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'patientIds array is required' },
        { status: 400 },
      );
    }

    const summaries: StaffSymptomSummary[] = [];

    for (const id of patientIds) {
      const fromLog = await fetchSummaryFromLogApi(req, id);
      if (fromLog) {
        summaries.push(fromLog);
        continue;
      }

      const entries = await getEntriesForPatient(id, 50);
      const summary = computeSummary(id, entries);
      // If we have a last entry, recompute activeAlerts by excluding staff-reviewed alerts
      try {
        const reviewedIds = await getStaffReviewedAlertIds(id);
        if (reviewedIds.length) {
          summary.activeAlerts = 0;
        } else if (entries.length) {
          // Simple heuristic: active alerts are only those that would be active based on severity thresholds
          // and are not yet staff reviewed.
          const last = [...entries].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
          let computed = 0;
          for (const s of last.symptoms) {
            if (s.severity >= 6) computed++;
          }
          // If everything is reviewed, consider activeAlerts 0
          summary.activeAlerts = computed > 0 && reviewedIds.length > 0 ? Math.max(0, computed - reviewedIds.length) : computed;
        }
      } catch (e) {
        // ignore
      }
      summaries.push(summary);
    }

    return NextResponse.json({ success: true, data: summaries });
  } catch (error) {
    console.error('Staff symptom summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compute staff symptom summaries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const patientIds = url.searchParams
      .get('patientIds')
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!patientIds || patientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'patientIds array is required' },
        { status: 400 },
      );
    }

    const summaries: StaffSymptomSummary[] = [];
    for (const id of patientIds) {
      const fromLog = await fetchSummaryFromLogApi(req, id);
      if (fromLog) {
        summaries.push(fromLog);
        continue;
      }
      const entries = await getEntriesForPatient(id, 50);
      summaries.push(computeSummary(id, entries));
    }

    return NextResponse.json({ success: true, data: summaries });
  } catch (error) {
    console.error('Staff symptom summary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to compute staff symptom summaries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
