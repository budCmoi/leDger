import { env } from './env';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../services/password.service';

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