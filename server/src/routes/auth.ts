import type { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { execute, one } from '../db.js';
import { loginSchema, registerSchema } from '../schemas.js';

const BCRYPT_COST = 12;

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  created_at: string;
}

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export const authRoutes: FastifyPluginAsync = async (app) => {
  const inviteCode = process.env.INVITE_CODE ?? '';
  const allowOpenRegistration = process.env.ALLOW_OPEN_REGISTRATION === 'true';

  // Per-route stricter rate limit on login/register.
  app.post(
    '/register',
    {
      config: {
        rateLimit: { max: 5, timeWindow: '15 minutes' },
      },
    },
    async (req, reply) => {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid input' });

      const { email, password, displayName, inviteCode: submittedCode } = parsed.data;

      // Registration gate: either INVITE_CODE must match, or ALLOW_OPEN_REGISTRATION=true.
      if (!allowOpenRegistration) {
        if (!inviteCode) {
          app.log.warn('Registration attempted but INVITE_CODE is not configured');
          return reply.code(503).send({ error: 'Registration not configured' });
        }
        if (!submittedCode || !constantTimeCompare(submittedCode, inviteCode)) {
          return reply.code(403).send({ error: 'Invalid invite code' });
        }
      }

      const existing = await one<UserRow>(
        'SELECT id FROM users WHERE lower(email) = lower(?)',
        [email],
      );
      if (existing) {
        // Return a 409 here is fine — signup flow already requires email, so enumeration is limited.
        return reply.code(409).send({ error: 'Email already registered' });
      }

      const id = nanoid(12);
      const password_hash = await bcrypt.hash(password, BCRYPT_COST);
      await execute(
        `INSERT INTO users (id, email, password_hash, display_name, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [id, email.toLowerCase(), password_hash, displayName ?? null, new Date().toISOString()],
      );

      const token = app.jwt.sign({ sub: id }, { expiresIn: '7d' });
      return { token, user: { id, email: email.toLowerCase(), displayName: displayName ?? null } };
    },
  );

  app.post(
    '/login',
    {
      config: {
        rateLimit: { max: 10, timeWindow: '15 minutes' },
      },
    },
    async (req, reply) => {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) return reply.code(400).send({ error: 'Invalid input' });

      const user = await one<UserRow>(
        'SELECT * FROM users WHERE lower(email) = lower(?)',
        [parsed.data.email],
      );

      // Always perform a bcrypt compare — even on unknown emails — to keep timing uniform.
      const hash =
        user?.password_hash ??
        '$2a$12$invalidplaceholderhashvaluexxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      const valid = await bcrypt.compare(parsed.data.password, hash);

      if (!user || !valid) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      const token = app.jwt.sign({ sub: user.id }, { expiresIn: '7d' });
      return {
        token,
        user: { id: user.id, email: user.email, displayName: user.display_name },
      };
    },
  );

  app.get('/me', { preHandler: [app.authenticate] }, async (req, reply) => {
    const user = await one<UserRow>('SELECT * FROM users WHERE id = ?', [req.user.sub]);
    if (!user) return reply.code(401).send({ error: 'Unauthorized' });
    return { id: user.id, email: user.email, displayName: user.display_name };
  });
};
