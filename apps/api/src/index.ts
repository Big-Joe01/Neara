import { createApp } from './app.js';
import { appConfig } from '@neara/config';
import { prisma } from './lib/prisma.js';

const app = createApp();
const port = appConfig.api.port;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  NEARA API — "One tap from home."
  Listening on http://localhost:${port} (prefix /api)
  Environment: ${process.env.NODE_ENV ?? 'development'}\n`);
});

async function shutdown(signal: string) {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

export default server;
