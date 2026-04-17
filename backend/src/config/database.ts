import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { env } from './env';

let memoryServer: MongoMemoryServer | null = null;

const resolveMongoUri = async () => {
  if (!env.USE_IN_MEMORY_DB) {
    return env.MONGODB_URI;
  }

  memoryServer ??= await MongoMemoryServer.create({
    instance: {
      dbName: 'ledger-premium-saas',
    },
  });

  return memoryServer.getUri();
};

export const connectDatabase = async () => {
  mongoose.set('strictQuery', true);
  const mongoUri = await resolveMongoUri();
  await mongoose.connect(mongoUri);
};