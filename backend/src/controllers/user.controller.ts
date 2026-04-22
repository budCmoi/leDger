import type { RequestHandler } from 'express';

import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';

type ProfileUpdatePayload = {
  name?: string;
  companyName?: string;
  currency?: string;
  avatar?: string;
};

export const getCurrentUser: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required'));
  }

  return res.json({ user: mapProfileUser(req.user) });
};

export const updateCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const fullName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';

  if (!fullName) {
    throw new AppError(422, 'Name is required');
  }

  if (payload.companyName) {
    user.companyName = payload.companyName;
  }

  if (payload.currency) {
    user.currency = payload.currency.toUpperCase();
  }

  if (payload.avatar) {
    user.avatar = payload.avatar;
  }

  await user.save();

  res.json({ user: mapUser(user as unknown as Record<string, unknown>) });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  if (!req.file) {
    throw new AppError(400, 'Avatar file is required');
  }

  throw new AppError(501, 'Avatar upload is not available in the PostgreSQL profile flow yet');
});