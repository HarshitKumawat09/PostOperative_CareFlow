import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notification-service';
import type { WeeklySummaryPayload } from '@/types/notifications';
import { adminDb } from '@/firebase/admin';

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    patientId?: string;
    to?: string;
    channel?: 'whatsapp' | 'sms';
    patientName?: string;
    summaryText?: string;
    language?: 'en' | 'hi';
  } | null;

  if (!body?.patientId || !body?.to || !body?.channel || !body?.summaryText) {
    return NextResponse.json(
      { success: false, error: 'patientId, to, channel, summaryText are required' },
      { status: 400 },
    );
  }

  const payload: WeeklySummaryPayload = {
    patientId: body.patientId,
    patientName: body.patientName,
    summaryText: body.summaryText,
    language: body.language,
  };

  const result = await notificationService.sendWeeklySummary(body.channel, body.to, payload);

  try {
    await adminDb.collection('notification_audit').add({
      type: 'weekly_summary',
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
