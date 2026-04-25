import serverless from 'serverless-http';

import { app } from './app';
import { connectDatabase } from './config/database';

let databaseConnectionPromise: Promise<void> | null = null;

const ensureDatabaseConnection = async () => {
  databaseConnectionPromise ??= connectDatabase().catch((error) => {
    databaseConnectionPromise = null;
    throw error;
  });

  await databaseConnectionPromise;
};

const serverlessHandler = serverless(app, {
  basePath: '/.netlify/functions/api',
});

export const handler = async (...args: Parameters<typeof serverlessHandler>) => {
  await ensureDatabaseConnection();
  return serverlessHandler(...args);
};