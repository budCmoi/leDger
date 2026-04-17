import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { configurePassport } from './config/passport';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { apiRouter } from './routes';

const passportInstance = configurePassport();

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passportInstance.initialize());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/', (_req, res) => {
  res.json({
    name: 'Ledger Premium SaaS API',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };