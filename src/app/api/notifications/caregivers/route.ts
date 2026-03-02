import { NextRequest, NextResponse } from 'next/server';
import type { CaregiverContact } from '@/types/notifications';
import { notificationStorage } from '@/ai/notification-storage';
import { adminDb } from '@/firebase/admin';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 });
  }

  try {
    const snapshot = await adminDb
      .collection('caregivers')
      .where('patientId', '==', patientId)
      .get();

    const caregivers = snapshot.docs.map((d) => d.data());
    return NextResponse.json({ success: true, data: caregivers });
  } catch (e) {
    const caregivers = notificationStorage.listCaregivers(patientId);
    return NextResponse.json({ success: true, data: caregivers });
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Partial<CaregiverContact> | null;
  const patientId = body?.patientId;

  if (!patientId) {
    return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const caregiver: CaregiverContact = {
    id: body?.id || `caregiver-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    patientId,
    name: body?.name || 'Caregiver',
    relationship: body?.relationship,
    phoneE164: body?.phoneE164 || '',
    channels: body?.channels?.length ? body.channels : ['whatsapp'],
    receiveWeeklySummary: body?.receiveWeeklySummary ?? true,
    receiveCriticalAlerts: body?.receiveCriticalAlerts ?? true,
    createdAt: body?.createdAt || now,
    updatedAt: now,
  };

  try {
    await adminDb.collection('caregivers').doc(caregiver.id).set(caregiver);
  } catch (e) {
    const existing = notificationStorage.listCaregivers(patientId);
    notificationStorage.saveCaregivers(patientId, [caregiver, ...existing.filter((c) => c.id !== caregiver.id)]);
  }

  return NextResponse.json({ success: true, data: caregiver });
}

export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { patientId?: string; caregiverId?: string } | null;
  const patientId = body?.patientId;
  const caregiverId = body?.caregiverId;

  if (!patientId || !caregiverId) {
    return NextResponse.json(
      { success: false, error: 'patientId and caregiverId are required' },
      { status: 400 },
    );
  }

  try {
    await adminDb.collection('caregivers').doc(caregiverId).delete();
  } catch (e) {
    const existing = notificationStorage.listCaregivers(patientId);
    notificationStorage.saveCaregivers(patientId, existing.filter((c) => c.id !== caregiverId));
  }

  return NextResponse.json({ success: true });
}
