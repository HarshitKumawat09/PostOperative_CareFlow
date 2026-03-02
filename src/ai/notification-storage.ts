import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { CaregiverContact, NotificationPreferences } from '@/types/notifications';

interface StoredCaregiverContact extends CaregiverContact {}

export class NotificationStorage {
  private basePath: string;

  constructor() {
    this.basePath = join(process.cwd(), 'data', 'notifications');
    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }
  }

  private prefsPath(patientId: string) {
    return join(this.basePath, `prefs-${patientId}.json`);
  }

  private caregiversPath(patientId: string) {
    return join(this.basePath, `caregivers-${patientId}.json`);
  }

  getPreferences(patientId: string): NotificationPreferences | null {
    const path = this.prefsPath(patientId);
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as NotificationPreferences;
  }

  savePreferences(prefs: NotificationPreferences): NotificationPreferences {
    const path = this.prefsPath(prefs.patientId);
    writeFileSync(path, JSON.stringify(prefs, null, 2));
    return prefs;
  }

  listCaregivers(patientId: string): StoredCaregiverContact[] {
    const path = this.caregiversPath(patientId);
    if (!existsSync(path)) return [];
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as StoredCaregiverContact[];
  }

  saveCaregivers(patientId: string, caregivers: StoredCaregiverContact[]) {
    const path = this.caregiversPath(patientId);
    writeFileSync(path, JSON.stringify(caregivers, null, 2));
  }
}

export const notificationStorage = new NotificationStorage();
