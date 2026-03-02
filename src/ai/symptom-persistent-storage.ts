// 💾 PERSISTENT FILE STORAGE FOR SYMPTOM TRACKING
// Fallback when Firestore is not available

import { SymptomEntry } from '@/types/symptom-tracking';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface StoredSymptomEntry extends SymptomEntry {
  storedAt: string;
}

export class SymptomPersistentStorage {
  private storagePath: string;
  private patientEntries: Map<string, SymptomEntry[]> = new Map();

  constructor() {
    // Store in a data directory in the project root
    this.storagePath = join(process.cwd(), 'data', 'symptom-entries');
    
    // Ensure directory exists
    if (!existsSync(this.storagePath)) {
      mkdirSync(this.storagePath, { recursive: true });
    }
    
    this.loadAllPatientEntries();
    console.log(`💾 Symptom persistent storage initialized at: ${this.storagePath}`);
  }

  private getPatientFilePath(patientId: string): string {
    return join(this.storagePath, `${patientId}.json`);
  }

  private loadAllPatientEntries(): void {
    try {
      const files = require('fs').readdirSync(this.storagePath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const patientId = file.replace('.json', '');
          const filePath = this.getPatientFilePath(patientId);
          
          try {
            const data = readFileSync(filePath, 'utf-8');
            const entries: SymptomEntry[] = JSON.parse(data);
            
            // Convert date strings back to Date objects
            const processedEntries = entries.map(entry => ({
              ...entry,
              timestamp: new Date(entry.timestamp),
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt)
            }));
            
            this.patientEntries.set(patientId, processedEntries);
          } catch (error) {
            console.error(`❌ Failed to load symptom entries for patient ${file}:`, error);
          }
        }
      }
      
      console.log(`💾 Loaded symptom entries for ${this.patientEntries.size} patients`);
    } catch (error) {
      console.error('❌ Failed to load symptom entries:', error);
    }
  }

  async addSymptomEntry(patientId: string, entry: SymptomEntry): Promise<void> {
    // Get existing entries for this patient
    const entries = this.patientEntries.get(patientId) || [];
    
    // Add new entry
    entries.push(entry);
    
    // Store in memory
    this.patientEntries.set(patientId, entries);
    
    // Persist to file
    try {
      const filePath = this.getPatientFilePath(patientId);
      
      // Convert Date objects to strings for JSON serialization
      const serializableEntries = entries.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString()
      }));
      
      writeFileSync(filePath, JSON.stringify(serializableEntries, null, 2));
      console.log(`💾 Symptom entry persisted: Patient ${patientId}, ${entry.symptoms.length} symptoms`);
    } catch (error) {
      console.error(`❌ Failed to persist symptom entry for patient ${patientId}:`, error);
    }
  }

  async getSymptomEntries(patientId: string, limit: number = 30, offset: number = 0): Promise<SymptomEntry[]> {
    const entries = this.patientEntries.get(patientId) || [];
    
    // Sort by timestamp (newest first) and paginate
    const sortedEntries = entries
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);
    
    return sortedEntries;
  }

  async getAllSymptomEntries(patientId: string): Promise<SymptomEntry[]> {
    return this.patientEntries.get(patientId) || [];
  }

  listPatientIds(): string[] {
    return Array.from(this.patientEntries.keys());
  }

  async updateSymptomEntry(patientId: string, entryId: string, updates: Partial<SymptomEntry>): Promise<boolean> {
    const entries = this.patientEntries.get(patientId);
    if (!entries) return false;

    const entryIndex = entries.findIndex(entry => entry.id === entryId);
    if (entryIndex === -1) return false;

    // Update the entry
    entries[entryIndex] = {
      ...entries[entryIndex],
      ...updates,
      updatedAt: new Date()
    };

    // Update memory and persist
    this.patientEntries.set(patientId, entries);
    await this.savePatientEntries(patientId, entries);
    
    console.log(`💾 Symptom entry updated: Patient ${patientId}, Entry ${entryId}`);
    return true;
  }

  async deleteSymptomEntry(patientId: string, entryId: string): Promise<boolean> {
    const entries = this.patientEntries.get(patientId);
    if (!entries) return false;

    const filteredEntries = entries.filter(entry => entry.id !== entryId);
    
    if (filteredEntries.length === entries.length) return false; // No entry was removed

    // Update memory and persist
    this.patientEntries.set(patientId, filteredEntries);
    await this.savePatientEntries(patientId, filteredEntries);
    
    console.log(`💾 Symptom entry deleted: Patient ${patientId}, Entry ${entryId}`);
    return true;
  }

  private async savePatientEntries(patientId: string, entries: SymptomEntry[]): Promise<void> {
    try {
      const filePath = this.getPatientFilePath(patientId);
      
      // Convert Date objects to strings for JSON serialization
      const serializableEntries = entries.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString()
      }));
      
      writeFileSync(filePath, JSON.stringify(serializableEntries, null, 2));
    } catch (error) {
      console.error(`❌ Failed to save symptom entries for patient ${patientId}:`, error);
    }
  }

  getStats(): any {
    const totalPatients = this.patientEntries.size;
    const totalEntries = Array.from(this.patientEntries.values())
      .reduce((total, entries) => total + entries.length, 0);

    return {
      totalPatients,
      totalEntries,
      storageType: 'Persistent File Storage',
      lastUpdated: new Date().toISOString(),
      storagePath: this.storagePath
    };
  }

  async searchSymptomEntries(patientId: string, query: string, limit: number = 10): Promise<SymptomEntry[]> {
    const entries = this.patientEntries.get(patientId) || [];
    const queryWords = query.toLowerCase().split(' ');

    const results = entries.filter(entry => {
      const searchText = [
        ...entry.symptoms.map(s => s.symptomType),
        ...entry.symptoms.map(s => s.description || ''),
        entry.notes || '',
        entry.mood || ''
      ].join(' ').toLowerCase();

      return queryWords.some(word => searchText.includes(word));
    });

    return results
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
}

// Singleton instance
export const symptomPersistentStorage = new SymptomPersistentStorage();
