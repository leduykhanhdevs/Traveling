import * as Sentry from '@sentry/node';
import { env } from './config/env.js';
import { createServer } from './server.js';
import { prisma } from './services/prisma.service.js';
import { closeRedis } from './services/redis.service.js';
import { logger } from './utils/logger.js';

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: Boolean(env.SENTRY_DSN),
  environment: env.NODE_ENV,
});

const app = createServer();

const server = app.listen(env.PORT, () => {
  logger.info(`WanderAI API listening on port ${env.PORT}`);
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Closing WanderAI API.`);
  server.close(async () => {
    await prisma.$disconnect();
    await closeRedis();
    process.exit(0);
  });
};

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
