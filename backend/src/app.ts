import { existsSync } from 'node:fs';
import path from 'node:path';

import cookieParser from 'cookie-parser';
import cors, { type CorsOptions } from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { clientUrls, env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { apiRouter } from './routes';

const app = express();
const frontendDistPath = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');
const shouldServeFrontend = env.NODE_ENV === 'production' && existsSync(frontendIndexPath);

app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = new Set(clientUrls);

const corsOrigin: CorsOptions['origin'] = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  callback(null, allowedOrigins.has(origin));
};

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  };
};

app.use(cors((req, callback) => callback(null, buildCorsOptions(req))));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    keyGenerator: (req) => resolveRateLimitKey(req),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/healthz', (_req, res) => {
  res.json({
    name: 'Ledger Premium SaaS API',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRouter);

if (shouldServeFrontend) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.sendFile(frontendIndexPath);
  });
} else {
  app.get('/', (_req, res) => {
    res.json({
      name: 'Ledger Premium SaaS API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  app.use(notFoundHandler);
}

app.use('/api', notFoundHandler);
app.use(errorHandler);

export { app };