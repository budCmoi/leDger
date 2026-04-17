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

  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    if (env.USE_IN_MEMORY_DB) {
      throw new Error('Unable to start the in-memory MongoDB instance. Configure a real MongoDB server for persistent development data.', {
        cause: error,
      });
    }

    throw new Error('Unable to connect to MongoDB. Make sure MONGODB_URI points to a running MongoDB instance.', {
      cause: error,
    });
  }
};