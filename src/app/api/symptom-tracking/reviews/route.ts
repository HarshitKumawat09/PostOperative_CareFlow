import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { symptomEngagementStorage, SymptomReviewNote } from '@/ai/symptom-engagement-storage';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const patientId = url.searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'patientId is required' },
        { status: 400 },
      );
    }

    try {
      const snapshot = await adminDb
        .collection('users')
        .doc(patientId)
        .collection('symptom_reviews')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      const notes = snapshot.docs.map((d) => d.data() as SymptomReviewNote);
      return NextResponse.json({ success: true, data: notes });
    } catch (e) {
      const notes = symptomEngagementStorage.listReviews(patientId);
      const sorted = [...notes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 50);
      return NextResponse.json({ success: true, data: sorted });
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load symptom reviews',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as {
      patientId?: string;
      note?: string;
      entryId?: string;
      alertId?: string;
      authorId?: string;
      authorName?: string;
    } | null;

    if (!body?.patientId || !body?.note) {
      return NextResponse.json(
        { success: false, error: 'patientId and note are required' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const note: SymptomReviewNote = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      patientId: body.patientId,
      note: body.note,
      entryId: body.entryId,
      alertId: body.alertId,
      authorId: body.authorId,
      authorName: body.authorName,
      createdAt: now,
    };

    try {
      await adminDb
        .collection('users')
        .doc(body.patientId)
        .collection('symptom_reviews')
        .doc(note.id)
        .set(note);
    } catch (e) {
      symptomEngagementStorage.addReview(note);
    }

    return NextResponse.json({ success: true, data: note });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save symptom review',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
