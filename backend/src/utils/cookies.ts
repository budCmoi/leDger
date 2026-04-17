import type { CookieOptions } from 'express';

import { env } from '../config/env';

const cookieLifetime = 1000 * 60 * 60 * 24 * 7;

export const buildAccessCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  maxAge: cookieLifetime,
  path: '/',
});

export const buildCsrfCookieOptions = (): CookieOptions => ({
  httpOnly: false,
  sameSite: 'strict',
  secure: env.NODE_ENV === 'production',
  maxAge: cookieLifetime,
  path: '/',
});