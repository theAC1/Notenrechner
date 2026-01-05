import { StorageAdapter } from './StorageAdapter';
import { Exam, AppStorage } from '../../types';

const STORAGE_KEY = 'notenrechner-data';
const STORAGE_VERSION = '1.0.0';

/**
 * LocalStorage implementation of StorageAdapter
 * Stores all data in browser's localStorage
 */
export class LocalStorageAdapter implements StorageAdapter {

  /**
   * Load all data from localStorage
   */
  async load(): Promise<AppStorage> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);

      if (!data) {
        // Return empty storage if nothing exists
        return this.getDefaultStorage();
      }

      const parsed = JSON.parse(data) as AppStorage;

      // Validate version and migrate if needed
      if (parsed.version !== STORAGE_VERSION) {
        return await this.migrate(parsed);
      }

      return parsed;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      // Return default storage on error
      return this.getDefaultStorage();
    }
  }

  /**
   * Save complete storage state
   */
  async save(storage: AppStorage): Promise<void> {
    try {
      const data = JSON.stringify(storage);

      // Check quota before saving
      if (this.wouldExceedQuota(data)) {
        throw new Error('Storage quota exceeded');
      }

      localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete some exams or export your data.');
      }
      throw error;
    }
  }

  /**
   * Save a single exam (optimization - updates only the exam in storage)
   */
  async saveExam(exam: Exam): Promise<void> {
    const storage = await this.load();
    const examIndex = storage.exams.findIndex(e => e.id === exam.id);

    if (examIndex >= 0) {
      // Update existing exam
      storage.exams[examIndex] = {
        ...exam,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new exam
      storage.exams.push({
        ...exam,
        createdAt: exam.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    await this.save(storage);
  }

  /**
   * Get a single exam by ID
   */
  async getExam(id: string): Promise<Exam | null> {
    const storage = await this.load();
    return storage.exams.find(e => e.id === id) || null;
  }

  /**
   * Delete an exam by ID
   */
  async deleteExam(id: string): Promise<void> {
    const storage = await this.load();
    storage.exams = storage.exams.filter(e => e.id !== id);

    // If deleted exam was active, clear active exam
    if (storage.activeExamId === id) {
      storage.activeExamId = null;
    }

    await this.save(storage);
  }

  /**
   * Update active exam ID
   */
  async setActiveExamId(id: string | null): Promise<void> {
    const storage = await this.load();
    storage.activeExamId = id;
    await this.save(storage);
  }

  /**
   * Clear all data (reset)
   */
  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Check available storage space (rough estimate)
   */
  async getAvailableSpace(): Promise<number> {
    // Most browsers allow ~5-10MB for localStorage
    // This is a rough estimate
    const testKey = '_test_quota_';
    const minimalData = 'a'.repeat(1024); // 1KB
    let size = 0;

    try {
      // Try to estimate by attempting to store data
      for (let i = 0; i < 10000; i++) {
        localStorage.setItem(testKey, minimalData.repeat(i));
        size = i * 1024;
      }
    } catch (e) {
      // QuotaExceeded - we found the limit
    } finally {
      localStorage.removeItem(testKey);
    }

    return size;
  }

  /**
   * Check if localStorage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get default empty storage
   */
  private getDefaultStorage(): AppStorage {
    return {
      version: STORAGE_VERSION,
      activeExamId: null,
      exams: [],
      settings: {
        language: 'de',
        darkMode: false
      }
    };
  }

  /**
   * Check if saving data would exceed quota
   */
  private wouldExceedQuota(data: string): boolean {
    const estimatedSize = new Blob([data]).size;
    const maxSize = 5 * 1024 * 1024; // 5MB conservative limit

    return estimatedSize > maxSize;
  }

  /**
   * Migrate from old storage version to current
   */
  private async migrate(oldStorage: AppStorage): Promise<AppStorage> {
    // For now, just update version and return
    // Future migrations would be handled here
    return {
      ...oldStorage,
      version: STORAGE_VERSION
    };
  }
}

// Export singleton instance
export const storage = new LocalStorageAdapter();
