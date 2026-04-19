import 'dotenv/config';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { migrate } from './db.js';
import { authRoutes } from './routes/auth.js';
import { studentRoutes } from './routes/students.js';
import { examRoutes } from './routes/exams.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      req: import('fastify').FastifyRequest,
      reply: import('fastify').FastifyReply,
    ) => Promise<void>;
  }
  interface FastifyRequest {
    user: { sub: string };
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL ?? 'info', redact: ['req.headers.authorization'] },
    bodyLimit: 1024 * 1024, // 1 MB per request
    trustProxy: process.env.TRUST_PROXY === 'true' ? 1 : false,
    ajv: { customOptions: { removeAdditional: false } },
  });

  // Security headers — tuned for an API that also serves a built SPA in prod.
  await app.register(helmet, {
    contentSecurityPolicy: false, // CSP is set by the SPA when served via fastify-static / Vercel config
    crossOriginEmbedderPolicy: false,
  });

  // Global rate limiter — protects against casual abuse.
  const allowList = process.env.RATELIMIT_ALLOWLIST
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: '1 minute',
    ban: 3,
    ...(allowList && allowList.length > 0 ? { allowList } : {}),
    keyGenerator: (req) => {
      const forwarded = req.headers['x-forwarded-for'];
      if (typeof forwarded === 'string') return forwarded.split(',')[0]!.trim();
      return req.ip;
    },
  });

  const corsOrigin = process.env.CORS_ORIGIN;
  const origins =
    corsOrigin === '*'
      ? true
      : corsOrigin
          ?.split(',')
          .map((o) => o.trim())
          .filter(Boolean) ?? ['http://localhost:5173'];
  await app.register(cors, {
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  await app.register(jwt, { secret: jwtSecret });

  app.decorate('authenticate', async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  await migrate();

  app.get('/api/health', async () => ({ status: 'ok' }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(studentRoutes, { prefix: '/api/students' });
  await app.register(examRoutes, { prefix: '/api/exams' });

  // Don't leak internal errors in prod.
  app.setErrorHandler((error, req, reply) => {
    req.log.error({ err: error }, 'request failed');
    const err = error as { statusCode?: number; message?: string };
    const status = err.statusCode ?? 500;
    const message = status < 500 ? err.message ?? 'Bad request' : 'Internal server error';
    reply.code(status).send({ error: message });
  });

  return app;
}
