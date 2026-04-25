import { prisma } from '../lib/prisma';

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
  } catch (error) {
    throw new Error('Unable to connect to PostgreSQL. Configure DATABASE_URL to a running PostgreSQL instance before starting the API.', {
      cause: error,
    });
  }
};