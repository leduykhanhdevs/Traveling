import { env } from './config/env.js';
import { createServer } from './server.js';
import { prisma } from './services/prisma.service.js';
import { closeRedis } from './services/redis.service.js';
import { logger } from './utils/logger.js';
import { posthog } from './services/posthog.service.js';
const app = createServer();

const server = app.listen(env.PORT, () => {
  logger.info(`Traveling API listening on port ${env.PORT}`);
});

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Closing Traveling API.`);
  server.close(async () => {
    await posthog.shutdown();
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
