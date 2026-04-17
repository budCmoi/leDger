import type { RequestHandler } from 'express';

import { uploadImageBuffer } from '../services/cloudinary.service';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { mapUser } from '../utils/serializers';
import type { IUser } from '../models/User';

type ProfileUpdatePayload = {
  name?: string;
  email?: string;
  companyName?: string;
  currency?: string;
  avatar?: string;
};

export const getCurrentUser: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return next(new AppError(401, 'Authentication required'));
  }

  return res.json({ user: mapUser(req.user as unknown as Record<string, unknown>) });
};

export const updateCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  const payload = req.body as ProfileUpdatePayload;

  if (payload.name) {
    user.name = payload.name;
  }

  if (payload.email) {
    user.email = payload.email.toLowerCase();
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
  const user = req.user;

  if (!user) {
    throw new AppError(401, 'Authentication required');
  }

  if (!req.file) {
    throw new AppError(400, 'Avatar file is required');
  }

  const avatarUrl = await uploadImageBuffer(req.file.buffer, `ledger-premium/users/${String((user as IUser & { _id: unknown })._id)}`);
  user.avatar = avatarUrl;
  await user.save();

  res.json({ user: mapUser(user as unknown as Record<string, unknown>) });
});