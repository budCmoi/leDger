import type { RequestHandler } from 'express';

import { z } from 'zod';

import { ACCESS_TOKEN_COOKIE, CSRF_TOKEN_COOKIE } from '../constants/app';
import { adminEmails, isFirebaseAuthConfigured } from '../config/env';
import { User } from '../models/User';
import { type DecodedFirebaseIdToken, verifyFirebaseIdToken } from '../services/firebase-admin.service';
import { createCsrfToken, signAccessToken } from '../services/token.service';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';
import { buildAccessCookieOptions, buildCsrfCookieOptions } from '../utils/cookies';
import { loadRestaurantBootstrap } from '../services/restaurant.service';

type FirebaseSessionPayload = {
  idToken: string;
  profile?: {
    name?: string;
    companyName?: string;
  };
};

const normalizeText = (value?: string | null) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
};

const toTitleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const deriveNameFromEmail = (email: string) => toTitleCase(email.split('@')[0].replace(/[._-]+/g, ' '));

const deriveCompanyName = (email: string) => deriveNameFromEmail(email);

const resolveFirebaseEmail = (decodedToken: DecodedFirebaseIdToken) => normalizeText(decodedToken.email?.toLowerCase());

export const ensureFirebaseAuthConfigured: RequestHandler = (_req, _res, next) => {
  if (!isFirebaseAuthConfigured) {
    return next(new AppError(503, 'Firebase authentication is not configured yet'));
  }

  return next();
};

export const createFirebaseSession: RequestHandler = asyncHandler(async (req, res) => {
  const { idToken, profile } = req.body as FirebaseSessionPayload;

  let decodedToken: DecodedFirebaseIdToken;

  try {
    decodedToken = await verifyFirebaseIdToken(idToken);
  } catch {
    throw new AppError(401, 'Invalid Firebase session token');
  }

  const email = resolveFirebaseEmail(decodedToken);

  if (!email) {
    throw new AppError(400, 'Firebase session token does not include an email address');
  }

  let user = await User.findOne({ firebaseUid: decodedToken.uid });

  if (!user) {
    const existingUserByEmail = await User.findOne({ email });

    if (existingUserByEmail?.firebaseUid && existingUserByEmail.firebaseUid !== decodedToken.uid) {
      throw new AppError(409, 'This email address is already linked to another account');
    }

    user = existingUserByEmail ?? new User();
  }

  const requestedName = normalizeText(profile?.name);
  const requestedCompanyName = normalizeText(profile?.companyName);
  const firebasePicture = normalizeText(decodedToken.picture);

  user.firebaseUid = decodedToken.uid;
  user.email = email;
  user.emailVerified = decodedToken.email_verified ?? false;
  user.name = requestedName ?? normalizeText(decodedToken.name) ?? user.name ?? deriveNameFromEmail(email);
  user.companyName = requestedCompanyName ?? user.companyName ?? deriveCompanyName(email);
  user.role = adminEmails.includes(email) ? 'admin' : user.role || 'user';
  user.lastLoginAt = new Date();

  if (firebasePicture) {
    user.avatar = firebasePicture;
  }

  await user.save();

  const accessToken = signAccessToken(String(user._id), user.role);
  const csrfToken = createCsrfToken();

  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, buildAccessCookieOptions());
  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, buildCsrfCookieOptions());

  res.json({
    user: mapUser(user),
    csrfToken,
  });
});

export const getSession: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required'));
  }

  return res.json({
    user: mapAuthenticatedUser(req.user),
    csrfToken: req.cookies[CSRF_TOKEN_COOKIE] ?? null,
  });
};

export const getWorkspaceBootstrap: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const payload = await loadRestaurantBootstrap(req.user);

  res.json({
    ...payload,
    session: {
      ...payload.session,
      user: mapAuthenticatedUser(req.user),
      csrfToken: req.cookies[CSRF_TOKEN_COOKIE] ?? null,
    },
  });
});

export const logout: RequestHandler = (_req, res) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, buildAccessCookieOptions());
  res.clearCookie(CSRF_TOKEN_COOKIE, buildCsrfCookieOptions());
  res.status(204).send();
};