import 'dotenv/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import fastifyStatic from '@fastify/static';
import { buildApp } from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

buildApp()
  .then(async (app) => {
    const distPath = resolve(__dirname, '../../dist');
    if (existsSync(distPath)) {
      await app.register(fastifyStatic, { root: distPath });
      app.setNotFoundHandler(async (_req, reply) => reply.sendFile('index.html'));
    }
    return app.listen({ port, host });
  })
  .then((addr) => console.log(`[server] listening on ${addr}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
