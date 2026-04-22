import { z } from 'zod';

import { hashPassword } from '../services/password.service';
import { createAppUser, listAppUsers, listAuditLogs } from '../services/restaurant.service';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';

export const listUsers = asyncHandler(async (_req, res) => {
  res.json({ users: await listAppUsers() });
});

const createUserSchema = z.object({
  identifier: z.string().min(2),
  fullName: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(['user', 'admin']),
});

export const createAdminUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const payload = createUserSchema.parse(req.body);
  const user = await createAppUser(req.user, {
    identifier: payload.identifier.trim().toLowerCase(),
    fullName: payload.fullName.trim(),
    passwordHash: await hashPassword(payload.password),
    role: payload.role,
  });

  res.status(201).json({ user });
});

export const getAuditTrail = asyncHandler(async (_req, res) => {
  res.json({ auditLogs: await listAuditLogs() });
});