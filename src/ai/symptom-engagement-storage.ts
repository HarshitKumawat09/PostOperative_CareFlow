import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface AlertAcknowledgementRecord {
  alertId: string;
  patientId: string;
  acknowledgedAt: string;
  acknowledgedBy?: string;
}

export interface AlertStaffReviewRecord {
  alertId: string;
  patientId: string;
  reviewedAt: string;
  reviewedBy?: string;
  remark?: string;
}

export interface SymptomReviewNote {
  id: string;
  patientId: string;
  note: string;
  entryId?: string;
  alertId?: string;
  authorId?: string;
  authorName?: string;
  createdAt: string;
}

export class SymptomEngagementStorage {
  private basePath: string;

  constructor() {
    this.basePath = join(process.cwd(), 'data', 'symptom-engagement');
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }
  }

  private acksPath(patientId: string) {
    return join(this.basePath, `acks-${patientId}.json`);
  }

  private reviewsPath(patientId: string) {
    return join(this.basePath, `reviews-${patientId}.json`);
  }

  private staffAlertReviewsPath(patientId: string) {
    return join(this.basePath, `staff-alert-reviews-${patientId}.json`);
  }

  listAcknowledgedAlertIds(patientId: string): string[] {
    const path = this.acksPath(patientId);
    if (!existsSync(path)) return [];
    try {
      const raw = readFileSync(path, 'utf-8');
      const parsed = JSON.parse(raw) as AlertAcknowledgementRecord[];
      return parsed.map((r) => r.alertId);
    } catch {
      return [];
    }
  }

  acknowledgeAlert(record: AlertAcknowledgementRecord): void {
    const path = this.acksPath(record.patientId);
    const existing: AlertAcknowledgementRecord[] = existsSync(path)
      ? (JSON.parse(readFileSync(path, 'utf-8')) as AlertAcknowledgementRecord[])
      : [];

    const idx = existing.findIndex((r) => r.alertId === record.alertId);
    if (idx >= 0) existing[idx] = record;
    else existing.push(record);

    writeFileSync(path, JSON.stringify(existing, null, 2));
  }

  listStaffReviewedAlertIds(patientId: string): string[] {
    const path = this.staffAlertReviewsPath(patientId);
    if (!existsSync(path)) return [];
    try {
      const raw = readFileSync(path, 'utf-8');
      const parsed = JSON.parse(raw) as AlertStaffReviewRecord[];
      return parsed.map((r) => r.alertId);
    } catch {
      return [];
    }
  }

  listStaffAlertReviews(patientId: string): AlertStaffReviewRecord[] {
    const path = this.staffAlertReviewsPath(patientId);
    if (!existsSync(path)) return [];
    try {
      const raw = readFileSync(path, 'utf-8');
      const parsed = JSON.parse(raw) as AlertStaffReviewRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  markAlertReviewed(record: AlertStaffReviewRecord): void {
    const path = this.staffAlertReviewsPath(record.patientId);
    const existing: AlertStaffReviewRecord[] = existsSync(path)
      ? (JSON.parse(readFileSync(path, 'utf-8')) as AlertStaffReviewRecord[])
      : [];

    const idx = existing.findIndex((r) => r.alertId === record.alertId);
    if (idx >= 0) existing[idx] = record;
    else existing.push(record);

    writeFileSync(path, JSON.stringify(existing, null, 2));
  }

  listReviews(patientId: string): SymptomReviewNote[] {
    const path = this.reviewsPath(patientId);
    if (!existsSync(path)) return [];
    try {
      const raw = readFileSync(path, 'utf-8');
      return JSON.parse(raw) as SymptomReviewNote[];
    } catch {
      return [];
    }
  }

  addReview(note: SymptomReviewNote): SymptomReviewNote {
    const path = this.reviewsPath(note.patientId);
    const existing: SymptomReviewNote[] = existsSync(path)
      ? (JSON.parse(readFileSync(path, 'utf-8')) as SymptomReviewNote[])
      : [];

    existing.push(note);
    writeFileSync(path, JSON.stringify(existing, null, 2));
    return note;
  }
}

export const symptomEngagementStorage = new SymptomEngagementStorage();
