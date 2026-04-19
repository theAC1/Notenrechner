// Vercel serverless function entry point.
// Wraps the Fastify app and reuses a single instance across warm invocations.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildApp } from '../server/src/app.js';

let appPromise: Promise<Awaited<ReturnType<typeof buildApp>>> | null = null;

function getApp() {
  if (!appPromise) {
    // Vercel sits behind a trusted proxy — ensure we read client IP correctly.
    if (process.env.TRUST_PROXY === undefined) process.env.TRUST_PROXY = 'true';
    appPromise = buildApp().then(async (app) => {
      await app.ready();
      return app;
    });
  }
  return appPromise;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const app = await getApp();
  app.server.emit('request', req, res);
}
