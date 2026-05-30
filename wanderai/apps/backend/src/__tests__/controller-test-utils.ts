import express, { type Express, type RequestHandler } from 'express';
import { errorHandler } from '../middleware/error-handler.js';
import { AppError, toErrorResponse } from '../utils/errors.js';

type HttpMethod = 'get' | 'post' | 'put';

type TestRoute = {
  method: HttpMethod;
  path: string;
  handlers: readonly RequestHandler[];
};

export const authenticated = (userId = 'clerk_test_user'): RequestHandler => {
  return (req, _res, next) => {
    req.auth = { userId };
    next();
  };
};

export const requireAuthForTest: RequestHandler = (req, res, next) => {
  const userId = req.header('x-user-id');

  if (!userId) {
    const error = new AppError('UNAUTHORIZED', 'Authentication required.', 401);
    res.status(error.statusCode).json(toErrorResponse(error));
    return;
  }

  req.auth = { userId };
  next();
};

export const buildTestApp = (routes: readonly TestRoute[]): Express => {
  const app = express();

  app.use(express.json());
  app.use((req, _res, next) => {
    req.correlationId = 'test-correlation-id';
    next();
  });

  for (const route of routes) {
    switch (route.method) {
      case 'get':
        app.get(route.path, ...route.handlers);
        break;
      case 'post':
        app.post(route.path, ...route.handlers);
        break;
      case 'put':
        app.put(route.path, ...route.handlers);
        break;
    }
  }

  app.use(errorHandler);
  return app;
};
