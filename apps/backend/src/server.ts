import * as Sentry from '@sentry/node';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { apiRateLimiter } from './middleware/rate-limit.js';
import { correlationIdMiddleware } from './middleware/correlation-id.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { optionalAuth } from './middleware/auth.js';
import { apiRouter } from './routes/index.js';
import { legalRouter } from './routes/legal.routes.js';
import { webhookRouter } from './routes/webhook.routes.js';
import { sendSuccess } from './utils/http-response.js';

type SentryExpressCompat = typeof Sentry & {
  Handlers?: {
    errorHandler?: () => express.ErrorRequestHandler;
    requestHandler?: () => express.RequestHandler;
  };
  setupExpressErrorHandler?: (app: express.Express) => void;
};

const sentry = Sentry as SentryExpressCompat;
const sentryDsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: env.NODE_ENV,
});

const sentryUserContext: express.RequestHandler = (req, _res, next) => {
  Sentry.setUser(req.auth?.userId ? { id: req.auth.userId } : null);
  next();
};

const appleAppSiteAssociation = {
  applinks: {
    apps: [],
    details: [
      {
        appID: 'TEAM123456.com.traveling.app',
        paths: ['/discover/*', '/itinerary/*', '/community/*'],
      },
    ],
  },
} as const;

export const createServer = (): express.Express => {
  const app = express();
  const sentryRequestHandler = sentry.Handlers?.requestHandler?.();

  app.disable('x-powered-by');
  if (sentryRequestHandler) {
    app.use(sentryRequestHandler);
  }
  app.use(helmet());
  app.use(
    cors({
      origin: env.NODE_ENV === 'production' ? env.APP_URL : true,
      credentials: true,
    }),
  );
  app.use(compression());
  
  app.use('/api/v1/payments/bank-transfer/webhook', express.raw({ type: 'application/json' }), webhookRouter);
  
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(correlationIdMiddleware);
  app.use(requestLogger);
  app.get('/health', (_req, res) => {
    sendSuccess(res, {
      status: 'ok',
      service: 'traveling-backend',
      timestamp: new Date().toISOString(),
    });
  });
  app.get('/.well-known/apple-app-site-association', (_req, res) => {
    res
      .status(200)
      .type('application/json')
      .send(JSON.stringify(appleAppSiteAssociation));
  });
  app.use('/legal', legalRouter);
  app.use('/api/v1', optionalAuth, sentryUserContext, apiRateLimiter, apiRouter);
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found.',
      },
    });
  });
  const sentryErrorHandler = sentry.Handlers?.errorHandler?.();
  if (sentryErrorHandler) {
    app.use(sentryErrorHandler);
  } else {
    sentry.setupExpressErrorHandler?.(app);
  }
  app.use(errorHandler);

  return app;
};
