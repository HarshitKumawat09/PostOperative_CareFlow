import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { symptomEngagementStorage } from '@/ai/symptom-engagement-storage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      alertId?: string;
      patientId?: string;
      reviewedBy?: string;
      remark?: string;
    } | null;

    if (!body?.alertId || !body?.patientId) {
      return NextResponse.json(
        { success: false, error: 'alertId and patientId are required' },
        { status: 400 },
      );
    }

    const record = {
      alertId: body.alertId,
      patientId: body.patientId,
      reviewedAt: new Date().toISOString(),
      reviewedBy: body.reviewedBy,
      remark: body.remark,
    };

    try {
      await adminDb
        .collection('users')
        .doc(body.patientId)
        .collection('symptom_alert_reviews')
        .doc(body.alertId)
        .set(record, { merge: true });
    } catch (e) {
      symptomEngagementStorage.markAlertReviewed(record);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark alert reviewed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
