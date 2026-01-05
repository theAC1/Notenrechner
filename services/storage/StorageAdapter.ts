import { Exam, AppStorage } from '../../types';

/**
 * Abstract storage adapter interface
 * Allows for easy swapping between LocalStorage, Cloud Storage, etc.
 */
export interface StorageAdapter {
  /**
   * Load all exams and settings from storage
   */
  load(): Promise<AppStorage>;

  /**
   * Save complete storage state
   */
  save(storage: AppStorage): Promise<void>;

  /**
   * Save a single exam (optimization)
   */
  saveExam(exam: Exam): Promise<void>;

  /**
   * Get a single exam by ID
   */
  getExam(id: string): Promise<Exam | null>;

  /**
   * Delete an exam by ID
   */
  deleteExam(id: string): Promise<void>;

  /**
   * Update active exam ID
   */
  setActiveExamId(id: string | null): Promise<void>;

  /**
   * Clear all data (reset)
   */
  clear(): Promise<void>;

  /**
   * Check available storage space (in bytes)
   */
  getAvailableSpace(): Promise<number>;

  /**
   * Check if storage is available
   */
  isAvailable(): boolean;
}
