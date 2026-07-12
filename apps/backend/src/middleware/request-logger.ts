import morgan from 'morgan';
import { logger } from '../utils/logger.js';

morgan.token('request-path', (req) => req.url?.split('?')[0] ?? '/');

export const requestLogger = morgan(':method :request-path :status :response-time ms :res[content-length]', {
  stream: {
    write: (message: string) => logger.http(message.trim()),
  },
});
