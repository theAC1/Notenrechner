import type { AppSettings, Exam, ExamInput } from '@/domain/types';

export interface ExamRepository {
  getAllExams(): Promise<ReadonlyArray<Exam>>;
  getExam(id: string): Promise<Exam | null>;
  saveExam(exam: Exam): Promise<void>;
  deleteExam(id: string): Promise<void>;
  getActiveExamId(): Promise<string | null>;
  setActiveExamId(id: string | null): Promise<void>;
  getSettings(): Promise<AppSettings | null>;
  saveSettings(settings: AppSettings): Promise<void>;
  clear(): Promise<void>;
}

export type StoredExam = ExamInput;
