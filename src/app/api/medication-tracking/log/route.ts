// 💊 MEDICATION MANAGEMENT API
// Log and manage medications with adherence tracking and refill alerts

import { NextRequest, NextResponse } from 'next/server';
import { 
  MedicationEntry, 
  MedicationTrackingResponse, 
  MedicationReminder,
  MedicationAnalytics,
  SideEffect,
  MedicationInteraction
} from '@/types/medication-tracking';

// In-memory storage for demo (in production, use database)
const medicationEntries: Map<string, MedicationEntry[]> = new Map();
const medicationReminders: Map<string, MedicationReminder[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const medication: MedicationEntry = await request.json();

    // Validate required fields
    if (!medication.patientId || !medication.name || !medication.dosage) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Patient ID, medication name, and dosage are required' 
        },
        { status: 400 }
      );
    }

    // Add server-side timestamps and IDs
    const processedMedication: MedicationEntry = {
      ...medication,
      id: medication.id || `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store medication
    if (!medicationEntries.has(processedMedication.patientId)) {
      medicationEntries.set(processedMedication.patientId, []);
    }
    medicationEntries.get(processedMedication.patientId)!.push(processedMedication);

    // Create initial reminders based on frequency
    const reminders = createMedicationReminders(processedMedication);
    if (!medicationReminders.has(processedMedication.patientId)) {
      medicationReminders.set(processedMedication.patientId, []);
    }
    medicationReminders.get(processedMedication.patientId)!.push(...reminders);

    // Analyze medication for potential issues
    const analysis = await analyzeMedication(processedMedication);

    console.log(`💊 Medication logged: Patient ${processedMedication.patientId}, ${processedMedication.name}`);

    return NextResponse.json({
      success: true,
      data: processedMedication,
      reminders,
      ...analysis
    });

  } catch (error) {
    console.error('Medication logging error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to log medication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const medications = medicationEntries.get(patientId) || [];
    const paginatedMedications = medications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    // Generate analytics
    const analytics = medications.length > 0 ? await generateMedicationAnalytics(medications) : {};

    return NextResponse.json({
      success: true,
      data: paginatedMedications,
      total: medications.length,
      analytics,
      reminders: medicationReminders.get(patientId) || []
    });

  } catch (error) {
    console.error('Medication retrieval error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve medications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function createMedicationReminders(medication: MedicationEntry): MedicationReminder[] {
  const reminders: MedicationReminder[] = [];

  if (medication.frequency.type === 'daily' && medication.frequency.specificTimes) {
    medication.frequency.specificTimes.forEach((time, index) => {
      reminders.push({
        id: `reminder-${medication.id}-${index}`,
        medicationId: medication.id,
        patientId: medication.patientId,
        reminderTime: time,
        reminderType: 'dose',
        enabled: true,
        notificationMethod: 'push',
        message: `Time to take ${medication.name}`,
        advanceNotice: 15, // 15 minutes before
        recurring: true,
        daysOfWeek: undefined, // Daily
        createdAt: new Date()
      });
    });
  }

  // Add refill reminder
  if (medication.refills && medication.refills.nextRefillDate) {
    try {
      const refillDate = new Date(medication.refills.nextRefillDate);
      const reminderDate = new Date(refillDate.getTime() - (3 * 24 * 60 * 60 * 1000)); // 3 days before

      reminders.push({
        id: `refill-${medication.id}`,
        medicationId: medication.id,
        patientId: medication.patientId,
        reminderTime: reminderDate.toTimeString().slice(0, 5),
        reminderType: 'refill',
        enabled: medication.refills.autoRefill,
        notificationMethod: 'push',
        message: `Time to refill ${medication.name}`,
        advanceNotice: 3 * 24 * 60, // 3 days in minutes
        recurring: false,
        createdAt: new Date()
      });
    } catch (dateError) {
      console.error('Date parsing error:', dateError);
      // Continue without refill reminder if date parsing fails
    }
  }

  return reminders;
}

async function analyzeMedication(medication: MedicationEntry): Promise<{
  interactions?: MedicationInteraction[];
  alerts?: string[];
}> {
  const alerts: string[] = [];
  const interactions: MedicationInteraction[] = [];

  // Check for potential issues
  if (medication.sideEffects && medication.sideEffects.length > 0) {
    const severeSideEffects = medication.sideEffects.filter(se => se.severity === 'severe');
    if (severeSideEffects.length > 0) {
      alerts.push('Severe side effects detected - contact healthcare provider');
    }

    const concerningSideEffects = medication.sideEffects.filter(se => 
      ['difficulty_breathing', 'chest_pain', 'irregular_heartbeat', 'swelling'].includes(se.type)
    );
    if (concerningSideEffects.length > 0) {
      alerts.push('Concerning side effects - seek medical attention');
    }
  }

  // Check refill status
  if (medication.refills) {
    const daysUntilRefill = Math.ceil(
      (medication.refills.nextRefillDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntilRefill <= 3 && !medication.refills.reminderSent) {
      alerts.push(`Medication refill needed in ${daysUntilRefill} days`);
    }

    if (daysUntilRefill <= 0) {
      alerts.push('Medication refill overdue');
    }
  }

  // Check for duplicate medications (simplified check)
  const patientMedications = medicationEntries.get(medication.patientId) || [];
  const duplicates = patientMedications.filter(med => 
    med.name.toLowerCase() === medication.name.toLowerCase() && med.id !== medication.id
  );

  if (duplicates.length > 0) {
    interactions.push({
      id: `interaction-${Date.now()}`,
      medication1Id: medication.id,
      medication2Id: duplicates[0].id,
      interactionType: 'minor',
      description: `Duplicate medication: ${medication.name}`,
      severity: 'mild',
      recommendations: ['Review with healthcare provider', 'Consider consolidation'],
      detectedAt: new Date(),
      reviewedByProvider: false
    });
  }

  return { interactions, alerts };
}

async function generateMedicationAnalytics(medications: MedicationEntry[]): Promise<MedicationAnalytics> {
  const totalMedications = medications.length;
  const activeMedications = medications.filter(med => med.status === 'active').length;
  
  // Calculate adherence rates
  let totalAdherenceRate = 0;
  let totalMissedDoses = 0;
  let totalSideEffects = 0;
  let totalRefillsProcessed = 0;

  medications.forEach(medication => {
    if (medication.adherence) {
      totalAdherenceRate += medication.adherence.adherenceRate;
      totalMissedDoses += medication.adherence.missedDoses;
    }
    
    if (medication.sideEffects) {
      totalSideEffects += medication.sideEffects.length;
    }
    
    if (medication.refills && medication.refills.lastRefillDate) {
      totalRefillsProcessed++;
    }
  });

  const averageAdherence = totalMedications > 0 ? totalAdherenceRate / totalMedications : 0;

  // Determine trends
  const adherenceTrend = averageAdherence >= 80 ? 'excellent' : 
                         averageAdherence >= 60 ? 'good' : 
                         averageAdherence >= 40 ? 'fair' : 'poor';

  // Find most problematic medication
  const mostMissedMedication = medications
    .filter(med => medication.adherence && medication.adherence.missedDoses > 0)
    .sort((a, b) => (b.adherence?.missedDoses || 0) - (a.adherence?.missedDoses || 0))[0]?.name;

  const bestAdherenceMedication = medications
    .filter(med => medication.adherence && medication.adherence.adherenceRate >= 80)
    .sort((a, b) => (b.adherence?.adherenceRate || 0) - (a.adherence?.adherenceRate || 0))[0]?.name;

  // Generate chart data
  const adherenceChart = medications.map(med => ({
    date: medication.createdAt.toISOString().split('T')[0],
    rate: medication.adherence?.adherenceRate || 0
  }));

  const sideEffectChart = medications.flatMap(med => 
    (medication.sideEffects || []).map(se => ({
      date: se.onsetTime.toISOString().split('T')[0],
      count: 1
    }))
  );

  const refillTimeline = medications
    .filter(med => medication.refills?.lastRefillDate)
    .map(medication => ({
      date: medication.refills!.lastRefillDate.toISOString().split('T')[0],
      medication: medication.name,
      action: 'refill'
    }));

  return {
    period: 'month',
    totalMedications,
    activeMedications,
    adherenceRate: averageAdherence,
    missedDoses: totalMissedDoses,
    sideEffectsReported: totalSideEffects,
    refillsProcessed: totalRefillsProcessed,
    mostMissedMedication,
    bestAdherenceMedication,
    trends: {
      adherenceTrend: adherenceTrend as any,
      sideEffectTrend: 'stable',
      refillPattern: 'on_time'
    },
    charts: {
      adherenceChart,
      sideEffectChart,
      refillTimeline
    }
  };
}
