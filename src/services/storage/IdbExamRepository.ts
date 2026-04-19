import { type IDBPDatabase, openDB } from 'idb';
import type { AppSettings, Exam, ExamInput } from '@/domain/types';
import { appSettingsSchema, examSchema } from '@/domain/types';
import { enrichStudents } from '@/domain/grading';
import type { ExamRepository } from './ExamRepository';

const DB_NAME = 'notenrechner-v2';
const DB_VERSION = 1;
const STORE_EXAMS = 'exams';
const STORE_META = 'meta';

const META_ACTIVE_EXAM = 'activeExamId';
const META_SETTINGS = 'settings';

type DbSchema = {
  exams: { key: string; value: ExamInput };
  meta: { key: string; value: unknown };
};

let dbPromise: Promise<IDBPDatabase<DbSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<DbSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DbSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_EXAMS)) {
          db.createObjectStore(STORE_EXAMS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      },
    });
  }
  return dbPromise;
}

function toExam(stored: ExamInput): Exam {
  const enriched = enrichStudents(stored.students, stored.config);
  return { ...stored, students: enriched };
}

function toStored(exam: Exam): ExamInput {
  return {
    ...exam,
    students: exam.students.map((s) => ({ id: s.id, name: s.name, points: s.points })),
  };
}

export class IdbExamRepository implements ExamRepository {
  async getAllExams(): Promise<ReadonlyArray<Exam>> {
    const db = await getDb();
    const all = await db.getAll(STORE_EXAMS);
    return all
      .map((raw) => {
        const parsed = examSchema.safeParse(raw);
        return parsed.success ? toExam(parsed.data) : null;
      })
      .filter((e): e is Exam => e !== null);
  }

  async getExam(id: string): Promise<Exam | null> {
    const db = await getDb();
    const raw = await db.get(STORE_EXAMS, id);
    if (!raw) return null;
    const parsed = examSchema.safeParse(raw);
    return parsed.success ? toExam(parsed.data) : null;
  }

  async saveExam(exam: Exam): Promise<void> {
    const db = await getDb();
    await db.put(STORE_EXAMS, toStored(exam));
  }

  async deleteExam(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE_EXAMS, id);
  }

  async getActiveExamId(): Promise<string | null> {
    const db = await getDb();
    const value = await db.get(STORE_META, META_ACTIVE_EXAM);
    return typeof value === 'string' ? value : null;
  }

  async setActiveExamId(id: string | null): Promise<void> {
    const db = await getDb();
    if (id === null) await db.delete(STORE_META, META_ACTIVE_EXAM);
    else await db.put(STORE_META, id, META_ACTIVE_EXAM);
  }

  async getSettings(): Promise<AppSettings | null> {
    const db = await getDb();
    const value = await db.get(STORE_META, META_SETTINGS);
    const parsed = appSettingsSchema.safeParse(value);
    return parsed.success ? parsed.data : null;
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await getDb();
    await db.put(STORE_META, settings, META_SETTINGS);
  }

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear(STORE_EXAMS);
    await db.clear(STORE_META);
  }
}

export const examRepository: ExamRepository = new IdbExamRepository();
