// 📊 SYMPTOM TRACKING API - FIRESTORE + PERSISTENT STORAGE
// Log and analyze patient symptoms with recovery intelligence integration

import { NextRequest, NextResponse } from 'next/server';
import { 
  SymptomEntry, 
  SymptomTrackingResponse, 
  RiskAlert, 
  RecoveryProgress,
  SymptomTrend 
} from '@/types/symptom-tracking';
import { recoveryIntelligenceService } from '@/ai/recovery-intelligence';
import { adminDb } from '@/firebase/admin';
import { symptomPersistentStorage } from '@/ai/symptom-persistent-storage';
import { notificationStorage } from '@/ai/notification-storage';
import { notificationService } from '@/services/notification-service';
import type { CaregiverContact, NotificationChannel, NotificationPreferences } from '@/types/notifications';
import { symptomEngagementStorage } from '@/ai/symptom-engagement-storage';
import { createHash } from 'crypto';

export const runtime = 'nodejs';

// In-memory storage for demo (in production, use database)
const symptomEntries: Map<string, SymptomEntry[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const entry: SymptomEntry = await request.json();

    // Validate required fields
    if (!entry.patientId || !entry.symptoms || entry.symptoms.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Patient ID and at least one symptom are required' 
        },
        { status: 400 }
      );
    }

    // Add server-side timestamps and ID
    const processedEntry: SymptomEntry = {
      ...entry,
      id: entry.id || `symptom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in Firestore with fallback to persistent storage
    try {
      const symptomRef = adminDb.collection('users')
        .doc(processedEntry.patientId)
        .collection('symptom_entries')
        .doc(processedEntry.id);

      await symptomRef.set({
        ...processedEntry,
        timestamp: processedEntry.timestamp.toISOString(),
        createdAt: processedEntry.createdAt.toISOString(),
        updatedAt: processedEntry.updatedAt.toISOString()
      });
      
      console.log(`📊 Symptom logged to Firestore: Patient ${processedEntry.patientId}, ${processedEntry.symptoms.length} symptoms, Day ${processedEntry.postOpDay || 'Unknown'}`);
    } catch (firestoreError) {
      console.error('Firestore error:', firestoreError);
      // Fallback to persistent file storage
      await symptomPersistentStorage.addSymptomEntry(processedEntry.patientId, processedEntry);
      console.log(`💾 Symptom logged to persistent storage: Patient ${processedEntry.patientId}, ${processedEntry.symptoms.length} symptoms`);
    }

    // Analyze with recovery intelligence (with error handling)
    let analysis = {};
    try {
      await recoveryIntelligenceService.initialize();
      analysis = await analyzeSymptoms(processedEntry);
    } catch (error) {
      console.error('Recovery intelligence error:', error);
      analysis = {
        alerts: [],
        progress: null,
        trends: []
      };
    }

    try {
      const alerts = (analysis as any)?.alerts as RiskAlert[] | undefined;
      if (alerts && alerts.length) {
        await forwardCriticalAlerts(processedEntry, alerts);
      }
    } catch (error) {
      console.error('Critical alert forwarding error:', error);
    }

    console.log(`📊 Symptom logged to Firestore: Patient ${processedEntry.patientId}, ${processedEntry.symptoms.length} symptoms, Day ${processedEntry.postOpDay || 'Unknown'}`);

    return NextResponse.json({
      success: true,
      data: processedEntry,
      ...analysis
    });

  } catch (error) {
    console.error('Symptom logging error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to log symptoms',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function getCaregiversForPatient(patientId: string): Promise<CaregiverContact[]> {
  try {
    const snapshot = await adminDb.collection('caregivers').where('patientId', '==', patientId).get();
    return snapshot.docs.map((d) => d.data() as CaregiverContact);
  } catch (e) {
    return notificationStorage.listCaregivers(patientId);
  }
}

async function getNotificationPrefs(patientId: string): Promise<NotificationPreferences | null> {
  try {
    const doc = await adminDb.collection('notification_preferences').doc(patientId).get();
    if (doc.exists) return doc.data() as NotificationPreferences;
  } catch (e) {
    // ignore
  }
  return notificationStorage.getPreferences(patientId);
}

async function forwardCriticalAlerts(entry: SymptomEntry, alerts: RiskAlert[]): Promise<void> {
  const criticalAlerts = alerts.filter(
    (a) => a.requiresMedicalAttention || a.severity === 'High' || a.severity === 'Critical',
  );

  if (!criticalAlerts.length) return;

  const caregivers = (await getCaregiversForPatient(entry.patientId)).filter((c) => c.receiveCriticalAlerts);
  if (!caregivers.length) return;

  const prefs = await getNotificationPrefs(entry.patientId);
  const language = prefs?.language || 'en';

  const message =
    language === 'hi'
      ? `⚠️ Critical Alert: Patient ${entry.patientId}. ${criticalAlerts
          .slice(0, 3)
          .map((a) => `${a.severity}: ${a.title}`)
          .join(' | ')}. Please contact the patient/doctor.`
      : `⚠️ Critical Alert: Patient ${entry.patientId}. ${criticalAlerts
          .slice(0, 3)
          .map((a) => `${a.severity}: ${a.title}`)
          .join(' | ')}. Please contact the patient/doctor.`;

  const sendPromises: Promise<unknown>[] = [];

  for (const caregiver of caregivers) {
    const channels: NotificationChannel[] = caregiver.channels?.length ? caregiver.channels : ['whatsapp'];
    for (const ch of channels) {
      sendPromises.push(notificationService.send(ch, caregiver.phoneE164, message));
    }
  }

  await Promise.allSettled(sendPromises);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    let entries: SymptomEntry[] = [];

    // Try to retrieve from Firestore first
    try {
      const symptomSnapshot = await adminDb.collection('users')
        .doc(patientId)
        .collection('symptom_entries')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .offset(offset)
        .get();

      entries = symptomSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: new Date(data.timestamp),
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        } as SymptomEntry;
      });
    } catch (firestoreError) {
      console.error('Firestore retrieval error:', firestoreError);
      // Fallback to persistent file storage
      entries = await symptomPersistentStorage.getSymptomEntries(patientId, limit, offset);
      console.log(`💾 Retrieved ${entries.length} symptom entries from persistent storage: Patient ${patientId}`);
    }

    // Generate trends and progress
    const analysis = entries.length > 0 ? await analyzeSymptoms(entries[0]) : {};

    // Merge persisted acknowledgement state into computed alerts
    const computedAlerts = (analysis as any)?.alerts as RiskAlert[] | undefined;
    if (patientId && computedAlerts?.length) {
      const acknowledgedIds = await getAcknowledgedAlertIds(patientId);
      const staffReviews = await getStaffAlertReviews(patientId);
      for (const a of computedAlerts) {
        if (acknowledgedIds.includes(a.id)) a.acknowledged = true;
        const review = staffReviews.get(a.id);
        if (review) {
          a.reviewedByStaff = true;
          a.reviewedAt = new Date(review.reviewedAt);
          a.reviewedBy = review.reviewedBy;
          a.staffRemark = review.remark;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: entries,
      total: entries.length,
      ...analysis
    });

  } catch (error) {
    console.error('Symptom retrieval error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve symptoms',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function analyzeSymptoms(entry: SymptomEntry): Promise<{
  alerts?: RiskAlert[];
  progress?: RecoveryProgress;
  trends?: SymptomTrend[];
}> {
  const alerts: RiskAlert[] = [];
  const trends: SymptomTrend[] = [];
  let progress: RecoveryProgress | undefined;

  // Recovery Intelligence Analysis
  if (entry.surgeryType && entry.postOpDay) {
    const recoveryIntelligence = recoveryIntelligenceService.getRecoveryIntelligence(entry.surgeryType);
    const currentPhase = recoveryIntelligenceService.getRecoveryPhase(entry.surgeryType, entry.postOpDay);
    const expectedSymptoms = recoveryIntelligenceService.getExpectedSymptoms(entry.surgeryType, entry.postOpDay);
    const clinicalRules = recoveryIntelligenceService.getClinicalRules(entry.surgeryType);

    // Check for unexpected symptoms
    const symptomTypes = entry.symptoms.map(s => s.symptomType);
    const unexpectedSymptoms = symptomTypes.filter(type => 
      !expectedSymptoms.some(expected => expected.symptom === type)
    );

    if (unexpectedSymptoms.length > 0) {
      const id = buildAlertId(entry, {
        kind: 'unexpected',
        type: 'recovery_deviation',
        severity: 'Moderate',
        relatedSymptoms: unexpectedSymptoms,
        title: 'Unexpected Symptoms Detected',
      });
      alerts.push({
        id,
        severity: 'Moderate',
        type: 'recovery_deviation',
        title: 'Unexpected Symptoms Detected',
        description: `Symptoms not typically expected for day ${entry.postOpDay}: ${unexpectedSymptoms.join(', ')}`,
        recommendations: ['Monitor these symptoms closely', 'Contact healthcare provider if symptoms worsen'],
        detectedAt: new Date(),
        acknowledged: false,
        requiresMedicalAttention: false,
        relatedSymptoms: unexpectedSymptoms
      });
    }

    // Apply clinical rules
    for (const rule of clinicalRules) {
      if (entry.postOpDay >= rule.appliesToDays[0] && entry.postOpDay <= rule.appliesToDays[1]) {
        const ruleAlert = evaluateClinicalRule(entry, rule);
        if (ruleAlert) {
          alerts.push(ruleAlert);
        }
      }
    }

    // Generate recovery progress
    progress = generateRecoveryProgress(entry, recoveryIntelligence, currentPhase);
  }

  // Check for severe symptoms
  entry.symptoms.forEach(symptom => {
    if (symptom.severity >= 8) {
      const id = buildAlertId(entry, {
        kind: 'severe_symptom',
        type: 'threshold_breach',
        severity: 'High',
        relatedSymptoms: [symptom.symptomType],
        title: `Severe ${symptom.symptomType.replace('_', ' ')}`,
      });
      alerts.push({
        id,
        severity: 'High',
        type: 'threshold_breach',
        title: `Severe ${symptom.symptomType.replace('_', ' ')}`,
        description: `${symptom.symptomType.replace('_', ' ')} severity is ${symptom.severity}/10`,
        recommendations: ['Contact healthcare provider immediately', 'Do not wait for symptoms to improve'],
        detectedAt: new Date(),
        acknowledged: false,
        requiresMedicalAttention: true,
        relatedSymptoms: [symptom.symptomType]
      });
    }

    // Fever alert
    if (symptom.symptomType === 'fever' && symptom.measurements?.temperature) {
      const temp = symptom.measurements.temperature;
      if (temp > 38.5) {
        const id = buildAlertId(entry, {
          kind: 'fever_high',
          type: 'threshold_breach',
          severity: 'High',
          relatedSymptoms: ['fever'],
          title: 'High Fever Detected',
          extra: `${temp}`,
        });
        alerts.push({
          id,
          severity: 'High',
          type: 'threshold_breach',
          title: 'High Fever Detected',
          description: `Temperature is ${temp}°C`,
          recommendations: ['Seek immediate medical attention', 'Monitor for other infection signs'],
          detectedAt: new Date(),
          acknowledged: false,
          requiresMedicalAttention: true,
          relatedSymptoms: ['fever']
        });
      } else if (temp > 38.0 && entry.postOpDay && entry.postOpDay > 2) {
        const id = buildAlertId(entry, {
          kind: 'fever_elevated',
          type: 'threshold_breach',
          severity: 'Moderate',
          relatedSymptoms: ['fever'],
          title: 'Elevated Temperature',
          extra: `${temp}`,
        });
        alerts.push({
          id,
          severity: 'Moderate',
          type: 'threshold_breach',
          title: 'Elevated Temperature',
          description: `Temperature is ${temp}°C after day ${entry.postOpDay}`,
          recommendations: ['Monitor temperature closely', 'Contact provider if fever persists'],
          detectedAt: new Date(),
          acknowledged: false,
          requiresMedicalAttention: false,
          relatedSymptoms: ['fever']
        });
      }
    }
  });

  return { alerts, progress, trends };
}

function evaluateClinicalRule(entry: SymptomEntry, rule: any): RiskAlert | null {
  const symptomTypes = entry.symptoms.map(s => s.symptomType);
  
  // Simple rule evaluation (in production, this would be more sophisticated)
  if (rule.condition.includes('fever') && symptomTypes.includes('fever')) {
    const feverSymptom = entry.symptoms.find(s => s.symptomType === 'fever');
    if (feverSymptom && feverSymptom.measurements?.temperature) {
      const temp = feverSymptom.measurements.temperature;
      if (temp > 38.0) {
        const id = buildAlertId(entry, {
          kind: 'rule',
          type: 'recovery_deviation',
          severity: rule.riskLevel as any,
          relatedSymptoms: ['fever'],
          title: 'Clinical Rule Alert',
          extra: `${rule.id}`,
        });
        return {
          id,
          severity: rule.riskLevel as any,
          type: 'recovery_deviation',
          title: 'Clinical Rule Alert',
          description: rule.explanation,
          recommendations: [rule.action],
          detectedAt: new Date(),
          acknowledged: false,
          requiresMedicalAttention: rule.riskLevel === 'High' || rule.riskLevel === 'Critical',
          relatedSymptoms: ['fever'],
          clinicalRules: [rule.id]
        };
      }
    }
  }

  if (rule.condition.includes('pain') && symptomTypes.includes('pain')) {
    const painSymptom = entry.symptoms.find(s => s.symptomType === 'pain');
    if (painSymptom && painSymptom.severity > 7) {
      const id = buildAlertId(entry, {
        kind: 'rule',
        type: 'threshold_breach',
        severity: rule.riskLevel as any,
        relatedSymptoms: ['pain'],
        title: 'Pain Management Alert',
        extra: `${rule.id}`,
      });
      return {
        id,
        severity: rule.riskLevel as any,
        type: 'threshold_breach',
        title: 'Pain Management Alert',
        description: rule.explanation,
        recommendations: [rule.action],
        detectedAt: new Date(),
        acknowledged: false,
        requiresMedicalAttention: rule.riskLevel === 'High' || rule.riskLevel === 'Critical',
        relatedSymptoms: ['pain'],
        clinicalRules: [rule.id]
      };
    }
  }

  return null;
}

function stableHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function buildAlertId(
  entry: SymptomEntry,
  params: {
    kind: string;
    type: RiskAlert['type'];
    severity: RiskAlert['severity'];
    title: string;
    relatedSymptoms?: string[];
    extra?: string;
  },
): string {
  const base = [
    entry.patientId,
    entry.id,
    entry.postOpDay ?? 'na',
    params.kind,
    params.type,
    params.severity,
    params.title,
    (params.relatedSymptoms || []).join(','),
    params.extra || '',
  ].join('|');

  return `alert-${stableHash(base)}`;
}

async function getAcknowledgedAlertIds(patientId: string): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection('users')
      .doc(patientId)
      .collection('symptom_alert_acks')
      .get();

    const ids = snapshot.docs.map((d) => d.id);
    if (ids.length) return ids;
  } catch (e) {
    // ignore and fallback
  }

  return symptomEngagementStorage.listAcknowledgedAlertIds(patientId);
}

async function getStaffAlertReviews(
  patientId: string,
): Promise<Map<string, { reviewedAt: string; reviewedBy?: string; remark?: string }>> {
  try {
    const snapshot = await adminDb
      .collection('users')
      .doc(patientId)
      .collection('symptom_alert_reviews')
      .get();

    const map = new Map<string, { reviewedAt: string; reviewedBy?: string; remark?: string }>();
    for (const doc of snapshot.docs) {
      const data = doc.data() as any;
      if (data?.reviewedAt) {
        map.set(doc.id, {
          reviewedAt: data.reviewedAt,
          reviewedBy: data.reviewedBy,
          remark: data.remark,
        });
      }
    }
    if (map.size) return map;
  } catch (e) {
    // ignore and fallback
  }

  const reviews = symptomEngagementStorage.listStaffAlertReviews(patientId);
  const map = new Map<string, { reviewedAt: string; reviewedBy?: string; remark?: string }>();
  for (const r of reviews) {
    map.set(r.alertId, { reviewedAt: r.reviewedAt, reviewedBy: r.reviewedBy, remark: r.remark });
  }
  if (map.size) return map;

  const ids = symptomEngagementStorage.listStaffReviewedAlertIds(patientId);
  for (const id of ids) {
    map.set(id, { reviewedAt: new Date().toISOString() });
  }
  return map;
}

function generateRecoveryProgress(
  entry: SymptomEntry, 
  intelligence: any, 
  currentPhase: any
): RecoveryProgress {
  const totalDays = intelligence.recoveryCurve.totalRecoveryDays;
  const progressPercentage = Math.min((entry.postOpDay || 0) / totalDays * 100, 100);
  
  // Calculate milestone progress
  const milestones = intelligence.recoveryCurve.milestones.map((milestone: any) => ({
    day: milestone.day,
    milestone: milestone.milestone,
    expectedStatus: milestone.expectedStatus,
    actualStatus: entry.postOpDay && entry.postOpDay >= milestone.day ? 'achieved' : 'not_achieved',
    achievedDate: entry.postOpDay && entry.postOpDay >= milestone.day ? entry.timestamp : undefined
  }));

  // Symptom comparison
  const symptomComparison = entry.symptoms.map(symptom => {
    const expectedSymptom = intelligence.recoveryCurve.expectedSymptoms.find((s: any) => s.symptomType === symptom.symptomType);
    if (expectedSymptom) {
      const expectedSeverity = (expectedSymptom.severityRange[0] + expectedSymptom.severityRange[1]) / 2;
      return {
        symptomType: symptom.symptomType,
        currentSeverity: symptom.severity,
        expectedSeverity,
        status: (symptom.severity <= expectedSeverity ? 'as_expected' : 'worse') as 'as_expected' | 'worse' | 'better',
        deviation: symptom.severity - expectedSeverity
      };
    }
    return {
      symptomType: symptom.symptomType,
      currentSeverity: symptom.severity,
      expectedSeverity: 0,
      status: 'worse' as 'as_expected' | 'worse' | 'better',
      deviation: symptom.severity
    };
  });

  // Find next milestone
  const nextMilestone = intelligence.recoveryCurve.milestones
    .filter((m: any) => m.day > (entry.postOpDay || 0))
    .sort((a: any, b: any) => a.day - b.day)[0];

  return {
    surgeryType: intelligence.surgeryType,
    postOpDay: entry.postOpDay || 0,
    currentPhase: currentPhase?.phase || 'Unknown',
    overallProgress: progressPercentage,
    milestones,
    symptomComparison,
    riskLevel: 'Low', // Would be calculated based on alerts
    nextMilestone: nextMilestone ? {
      day: nextMilestone.day,
      milestone: nextMilestone.milestone,
      daysUntil: nextMilestone.day - (entry.postOpDay || 0)
    } : undefined
  };
}
