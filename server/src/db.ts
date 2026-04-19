import { createClient, type Client, type InValue } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function buildClient(): Client {
  const remoteUrl = process.env.DB_URL;
  if (remoteUrl) {
    const authToken = process.env.DB_AUTH_TOKEN;
    if (!authToken) {
      throw new Error('DB_URL is set but DB_AUTH_TOKEN is missing');
    }
    return createClient({ url: remoteUrl, authToken });
  }

  // Serverless hosts have a read-only FS — refuse to use a file-backed DB.
  const isServerless =
    process.env.VERCEL === '1' ||
    !!process.env.LAMBDA_TASK_ROOT ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    throw new Error(
      'DB_URL is not configured. Serverless deployments require a remote libSQL database (e.g. Turso). ' +
        'Set DB_URL=libsql://... and DB_AUTH_TOKEN=... in your environment variables.',
    );
  }

  const filePath = resolve(process.cwd(), process.env.DB_PATH ?? 'data/notenrechner.db');
  mkdirSync(dirname(filePath), { recursive: true });
  return createClient({ url: `file:${filePath.replace(/\\/g, '/')}` });
}

export const db: Client = buildClient();

export async function migrate(): Promise<void> {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      klasse TEXT,
      stufe TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_students_user ON students(user_id);
    CREATE INDEX IF NOT EXISTS idx_students_user_klasse ON students(user_id, klasse);

    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      subject TEXT,
      date TEXT NOT NULL,
      config_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id);

    CREATE TABLE IF NOT EXISTS exam_students (
      exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      points REAL NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (exam_id, student_id)
    );

    CREATE INDEX IF NOT EXISTS idx_exam_students_exam ON exam_students(exam_id);
  `);
}

export async function execute(sql: string, args: InValue[] = []): Promise<void> {
  await db.execute({ sql, args });
}

export async function one<T>(sql: string, args: InValue[] = []): Promise<T | null> {
  const result = await db.execute({ sql, args });
  const row = result.rows[0];
  return row ? (Object.fromEntries(result.columns.map((c, i) => [c, row[i]])) as T) : null;
}

export async function many<T>(sql: string, args: InValue[] = []): Promise<T[]> {
  const result = await db.execute({ sql, args });
  return result.rows.map(
    (row) => Object.fromEntries(result.columns.map((c, i) => [c, row[i]])) as T,
  );
}
