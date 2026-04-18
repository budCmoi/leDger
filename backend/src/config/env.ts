import path from 'node:path';

import dotenv from 'dotenv';
import { z } from 'zod';

const backendRoot = path.resolve(__dirname, '..', '..');
const workspaceRoot = path.resolve(backendRoot, '..');

const loadEnvironmentFiles = () => {
  const candidates = [
    path.join(backendRoot, '.env.local'),
    path.join(backendRoot, '.env'),
    path.join(workspaceRoot, '.env.local'),
    path.join(workspaceRoot, '.env'),
  ];

  candidates.forEach((filePath) => {
    dotenv.config({ path: filePath });
  });
};

loadEnvironmentFiles();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().min(1).default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/ledger-premium-saas'),
  USE_IN_MEMORY_DB: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((value) => value === 'true' || value === '1'),
  JWT_SECRET: z.string().min(16).default('development-super-secret-key'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;

export const clientUrls = env.CLIENT_URL
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const invalidClientUrls = clientUrls.filter((value) => {
  try {
    new URL(value);
    return false;
  } catch {
    return true;
  }
});

if (invalidClientUrls.length > 0) {
  throw new Error('CLIENT_URL must contain one or more comma-separated absolute URLs.');
}

export const adminEmails = (env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export const isFirebaseAuthConfigured = Boolean(env.FIREBASE_PROJECT_ID);

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET,
);

if (env.NODE_ENV === 'production' && env.USE_IN_MEMORY_DB) {
  console.warn('⚠️  USE_IN_MEMORY_DB is enabled in production – data will NOT persist across restarts.');
}

if (env.NODE_ENV === 'production' && !isFirebaseAuthConfigured) {
  throw new Error('FIREBASE_PROJECT_ID must be configured in production.');
}