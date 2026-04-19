import type { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid';
import { db, execute, many, one } from '../db.js';
import { examInputSchema } from '../schemas.js';

interface ExamRow {
  id: string;
  user_id: string;
  name: string;
  subject: string | null;
  date: string;
  config_json: string;
  created_at: string;
  updated_at: string;
}

interface ExamStudentRow {
  exam_id: string;
  student_id: string;
  points: number;
  position: number;
  name: string;
  klasse: string | null;
  stufe: string | null;
}

async function loadExamStudents(examId: string): Promise<ExamStudentRow[]> {
  return many<ExamStudentRow>(
    `SELECT es.exam_id, es.student_id, es.points, es.position,
            s.name, s.klasse, s.stufe
     FROM exam_students es
     JOIN students s ON s.id = es.student_id
     WHERE es.exam_id = ?
     ORDER BY es.position, s.name COLLATE NOCASE`,
    [examId],
  );
}

function toExamDto(row: ExamRow, students: ExamStudentRow[]): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    date: row.date,
    config: JSON.parse(row.config_json),
    students: students.map((s) => ({
      studentId: s.student_id,
      name: s.name,
      klasse: s.klasse,
      stufe: s.stufe,
      points: s.points,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function setExamStudents(
  examId: string,
  userId: string,
  entries: ReadonlyArray<{ studentId: string; points: number }>,
): Promise<void> {
  // Verify ownership of all referenced students first.
  for (const entry of entries) {
    const owned = await one<{ cnt: number }>(
      'SELECT COUNT(*) AS cnt FROM students WHERE id = ? AND user_id = ?',
      [entry.studentId, userId],
    );
    if (!owned || owned.cnt === 0) {
      throw new Error(`Student ${entry.studentId} not owned by user`);
    }
  }
  const ops = [
    { sql: 'DELETE FROM exam_students WHERE exam_id = ?', args: [examId] as (string | number)[] },
    ...entries.map((e, idx) => ({
      sql: `INSERT INTO exam_students (exam_id, student_id, points, position)
            VALUES (?, ?, ?, ?)`,
      args: [examId, e.studentId, e.points, idx] as (string | number)[],
    })),
  ];
  await db.batch(ops, 'write');
}

export const examRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (req) => {
    const rows = await many<ExamRow>(
      'SELECT * FROM exams WHERE user_id = ? ORDER BY date DESC',
      [req.user.sub],
    );
    const exams = await Promise.all(
      rows.map(async (r) => toExamDto(r, await loadExamStudents(r.id))),
    );
    return { exams };
  });

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const row = await one<ExamRow>('SELECT * FROM exams WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.sub,
    ]);
    if (!row) return reply.code(404).send({ error: 'Not found' });
    return { exam: toExamDto(row, await loadExamStudents(row.id)) };
  });

  app.post('/', async (req, reply) => {
    const parsed = examInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const now = new Date().toISOString();
    const id = nanoid(12);
    await execute(
      `INSERT INTO exams (id, user_id, name, subject, date, config_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.sub,
        parsed.data.name,
        parsed.data.subject ?? null,
        parsed.data.date,
        JSON.stringify(parsed.data.config),
        now,
        now,
      ],
    );
    try {
      await setExamStudents(id, req.user.sub, parsed.data.students);
    } catch (err) {
      await execute('DELETE FROM exams WHERE id = ? AND user_id = ?', [id, req.user.sub]);
      return reply.code(400).send({ error: (err as Error).message });
    }
    const row = await one<ExamRow>('SELECT * FROM exams WHERE id = ? AND user_id = ?', [
      id,
      req.user.sub,
    ]);
    if (!row) return reply.code(500).send({ error: 'Create failed' });
    return reply.code(201).send({ exam: toExamDto(row, await loadExamStudents(id)) });
  });

  app.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const parsed = examInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const result = await db.execute({
      sql: `UPDATE exams SET name = ?, subject = ?, date = ?, config_json = ?, updated_at = ?
            WHERE id = ? AND user_id = ?`,
      args: [
        parsed.data.name,
        parsed.data.subject ?? null,
        parsed.data.date,
        JSON.stringify(parsed.data.config),
        new Date().toISOString(),
        req.params.id,
        req.user.sub,
      ],
    });
    if (result.rowsAffected === 0) return reply.code(404).send({ error: 'Not found' });
    try {
      await setExamStudents(req.params.id, req.user.sub, parsed.data.students);
    } catch (err) {
      return reply.code(400).send({ error: (err as Error).message });
    }
    const row = await one<ExamRow>('SELECT * FROM exams WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.sub,
    ]);
    if (!row) return reply.code(500).send({ error: 'Update failed' });
    return { exam: toExamDto(row, await loadExamStudents(row.id)) };
  });

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const result = await db.execute({
      sql: 'DELETE FROM exams WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.sub],
    });
    if (result.rowsAffected === 0) return reply.code(404).send({ error: 'Not found' });
    return reply.code(204).send();
  });
};
