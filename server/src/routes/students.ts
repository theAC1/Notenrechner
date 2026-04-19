import type { FastifyPluginAsync } from 'fastify';
import { nanoid } from 'nanoid';
import { execute, many, one, db } from '../db.js';
import { studentInputSchema } from '../schemas.js';

interface StudentRow {
  id: string;
  user_id: string;
  name: string;
  klasse: string | null;
  stufe: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function toDto(row: StudentRow): Record<string, unknown> {
  return {
    id: row.id,
    name: row.name,
    klasse: row.klasse,
    stufe: row.stufe,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const studentRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/', async (req) => {
    const rows = await many<StudentRow>(
      'SELECT * FROM students WHERE user_id = ? ORDER BY klasse, name COLLATE NOCASE',
      [req.user.sub],
    );
    return { students: rows.map(toDto) };
  });

  app.post('/', async (req, reply) => {
    const parsed = studentInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const now = new Date().toISOString();
    const id = nanoid(12);
    await execute(
      `INSERT INTO students (id, user_id, name, klasse, stufe, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.sub,
        parsed.data.name,
        parsed.data.klasse ?? null,
        parsed.data.stufe ?? null,
        parsed.data.notes ?? null,
        now,
        now,
      ],
    );
    const row = await one<StudentRow>('SELECT * FROM students WHERE id = ? AND user_id = ?', [
      id,
      req.user.sub,
    ]);
    if (!row) return reply.code(500).send({ error: 'Insert failed' });
    return reply.code(201).send({ student: toDto(row) });
  });

  app.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const parsed = studentInputSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const result = await db.execute({
      sql: `UPDATE students SET name = ?, klasse = ?, stufe = ?, notes = ?, updated_at = ?
            WHERE id = ? AND user_id = ?`,
      args: [
        parsed.data.name,
        parsed.data.klasse ?? null,
        parsed.data.stufe ?? null,
        parsed.data.notes ?? null,
        new Date().toISOString(),
        req.params.id,
        req.user.sub,
      ],
    });
    if (result.rowsAffected === 0) return reply.code(404).send({ error: 'Not found' });
    const row = await one<StudentRow>('SELECT * FROM students WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.user.sub,
    ]);
    return { student: row ? toDto(row) : null };
  });

  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const result = await db.execute({
      sql: 'DELETE FROM students WHERE id = ? AND user_id = ?',
      args: [req.params.id, req.user.sub],
    });
    if (result.rowsAffected === 0) return reply.code(404).send({ error: 'Not found' });
    return reply.code(204).send();
  });

  app.post<{ Body: { students: unknown } }>('/bulk', async (req, reply) => {
    const inputArray = (req.body as { students?: unknown }).students;
    if (!Array.isArray(inputArray))
      return reply.code(400).send({ error: 'students array required' });
    const parsed = inputArray.map((s) => studentInputSchema.safeParse(s));
    const failed = parsed.findIndex((r) => !r.success);
    if (failed !== -1) return reply.code(400).send({ error: `Invalid row at index ${failed}` });

    const now = new Date().toISOString();
    const stmts = parsed.map((p) => {
      const data = p.success ? p.data : null;
      if (!data) throw new Error('unreachable');
      const id = nanoid(12);
      return {
        sql: `INSERT INTO students (id, user_id, name, klasse, stufe, notes, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          req.user.sub,
          data.name,
          data.klasse ?? null,
          data.stufe ?? null,
          data.notes ?? null,
          now,
          now,
        ],
      };
    });
    await db.batch(stmts, 'write');
    const rows = await many<StudentRow>(
      'SELECT * FROM students WHERE user_id = ? AND created_at = ? ORDER BY rowid DESC',
      [req.user.sub, now],
    );
    return reply.code(201).send({ students: rows.map(toDto) });
  });
};
