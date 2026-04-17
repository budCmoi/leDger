import type { RequestHandler } from 'express';

import { ACCESS_TOKEN_COOKIE, CSRF_TOKEN_COOKIE } from '../constants/app';
import { env, isGoogleAuthConfigured } from '../config/env';
import { createCsrfToken, signAccessToken } from '../services/token.service';
import { AppError } from '../utils/app-error';
import { buildAccessCookieOptions, buildCsrfCookieOptions } from '../utils/cookies';
import { mapUser } from '../utils/serializers';

export const ensureGoogleAuthConfigured: RequestHandler = (_req, _res, next) => {
  if (!isGoogleAuthConfigured) {
    return next(new AppError(503, 'Google OAuth is not configured yet'));
  }

  return next();
};

export const handleGoogleCallbackSuccess: RequestHandler = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError(401, 'Google authentication failed'));
  }

  const accessToken = signAccessToken(String((user as { _id?: unknown })._id), user.role);
  const csrfToken = createCsrfToken();

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, buildAccessCookieOptions());
  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, buildCsrfCookieOptions());
  res.redirect(`${env.CLIENT_URL}/dashboard`);
};

export const getSession: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required'));
  }

  return res.json({
    user: mapUser(req.user),
    csrfToken: req.cookies[CSRF_TOKEN_COOKIE] ?? null,
  });
};

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, buildAccessCookieOptions());
  res.clearCookie(CSRF_TOKEN_COOKIE, buildCsrfCookieOptions());
  res.status(204).send();
};