import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { symptomEngagementStorage } from '@/ai/symptom-engagement-storage';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      alertId?: string;
      patientId?: string;
      acknowledgedBy?: string;
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
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: body.acknowledgedBy,
    };

    try {
      await adminDb
        .collection('users')
        .doc(body.patientId)
        .collection('symptom_alert_acks')
        .doc(body.alertId)
        .set(record, { merge: true });
    } catch (e) {
      symptomEngagementStorage.acknowledgeAlert(record);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to acknowledge alert',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
