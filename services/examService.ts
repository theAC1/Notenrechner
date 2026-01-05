import { nanoid } from 'nanoid';
import { Exam, CreateExamData, GradingConfig, Student, ExamSortOption } from '../types';
import { storage } from './storage/LocalStorageAdapter';

/**
 * Service for managing exams
 * Handles business logic for CRUD operations
 */
export class ExamService {

  /**
   * Create a new exam
   */
  async createExam(data: CreateExamData, defaultConfig: GradingConfig): Promise<Exam> {
    const now = new Date().toISOString();
    const date = data.date || new Date().toISOString().split('T')[0];

    // Get students if copying from another exam
    let students: Student[] = [];
    if (data.copyStudentsFromExamId) {
      const sourceExam = await storage.getExam(data.copyStudentsFromExamId);
      if (sourceExam) {
        // Copy students but reset their points and grades
        students = sourceExam.students.map(s => ({
          ...s,
          id: nanoid(),  // New IDs for students
          points: 0,
          grade: 0,
          isPassing: false
        }));
      }
    }

    const exam: Exam = {
      id: nanoid(),
      name: data.name,
      subject: data.subject,
      date,
      config: data.config || defaultConfig,
      students,
      createdAt: now,
      updatedAt: now
    };

    await storage.saveExam(exam);
    return exam;
  }

  /**
   * Get all exams
   */
  async getAllExams(): Promise<Exam[]> {
    const appStorage = await storage.load();
    return appStorage.exams;
  }

  /**
   * Get a single exam by ID
   */
  async getExam(id: string): Promise<Exam | null> {
    return storage.getExam(id);
  }

  /**
   * Update an exam
   */
  async updateExam(id: string, updates: Partial<Exam>): Promise<Exam | null> {
    const exam = await storage.getExam(id);
    if (!exam) return null;

    const updated: Exam = {
      ...exam,
      ...updates,
      id: exam.id,  // Don't allow ID changes
      createdAt: exam.createdAt,  // Don't allow createdAt changes
      updatedAt: new Date().toISOString()
    };

    await storage.saveExam(updated);
    return updated;
  }

  /**
   * Delete an exam
   */
  async deleteExam(id: string): Promise<void> {
    await storage.deleteExam(id);
  }

  /**
   * Duplicate an exam
   */
  async duplicateExam(id: string): Promise<Exam | null> {
    const source = await storage.getExam(id);
    if (!source) return null;

    const now = new Date().toISOString();
    const duplicated: Exam = {
      ...source,
      id: nanoid(),
      name: `${source.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
      // Copy students with new IDs
      students: source.students.map(s => ({
        ...s,
        id: nanoid()
      }))
    };

    await storage.saveExam(duplicated);
    return duplicated;
  }

  /**
   * Get active exam ID
   */
  async getActiveExamId(): Promise<string | null> {
    const appStorage = await storage.load();
    return appStorage.activeExamId;
  }

  /**
   * Set active exam ID
   */
  async setActiveExamId(id: string | null): Promise<void> {
    await storage.setActiveExamId(id);
  }

  /**
   * Sort exams by given option
   */
  sortExams(exams: Exam[], sortBy: ExamSortOption): Exam[] {
    const sorted = [...exams];

    switch (sortBy) {
      case 'date-desc':
        return sorted.sort((a, b) => b.date.localeCompare(a.date));
      case 'date-asc':
        return sorted.sort((a, b) => a.date.localeCompare(b.date));
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default:
        return sorted;
    }
  }

  /**
   * Filter exams by search query
   */
  filterExams(exams: Exam[], query: string): Exam[] {
    if (!query.trim()) return exams;

    const lowerQuery = query.toLowerCase();
    return exams.filter(exam =>
      exam.name.toLowerCase().includes(lowerQuery) ||
      exam.subject?.toLowerCase().includes(lowerQuery) ||
      exam.date.includes(query)
    );
  }

  /**
   * Get exam statistics
   */
  getExamStats(exam: Exam): { studentCount: number; average: number | null } {
    const studentCount = exam.students.length;

    if (studentCount === 0) {
      return { studentCount, average: null };
    }

    const total = exam.students.reduce((sum, s) => sum + s.grade, 0);
    const average = total / studentCount;

    return { studentCount, average };
  }

  /**
   * Migrate existing single-exam state to multi-exam structure
   * This is called on first load to preserve existing data
   */
  async migrateFromLegacyState(
    students: Student[],
    config: GradingConfig
  ): Promise<Exam> {
    const appStorage = await storage.load();

    // Check if already migrated
    if (appStorage.exams.length > 0) {
      return appStorage.exams[0];
    }

    // Create default exam from existing state
    const now = new Date().toISOString();
    const defaultExam: Exam = {
      id: nanoid(),
      name: 'Prüfung 1',
      date: now.split('T')[0],
      config,
      students,
      createdAt: now,
      updatedAt: now
    };

    await storage.saveExam(defaultExam);
    await storage.setActiveExamId(defaultExam.id);

    return defaultExam;
  }
}

// Export singleton instance
export const examService = new ExamService();
