import winston from 'winston';
import { env } from '../config/env.js';

const devFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const details = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
  return `${timestamp} ${level}: ${message}${details}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format:
    env.NODE_ENV === 'production'
      ? winston.format.combine(winston.format.timestamp(), winston.format.json())
      : winston.format.combine(winston.format.colorize(), winston.format.timestamp(), devFormat),
  transports: [new winston.transports.Console()],
});

export const logUnknownError = (
  message: string,
  error: unknown,
  metadata?: Record<string, unknown>,
): void => {
  const normalized =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { value: error };

  logger.error(message, {
    error: normalized,
    ...metadata,
  });
};
