import { randomUUID } from 'node:crypto';

import jwt from 'jsonwebtoken';

import type { UserRole } from '../constants/app';
import { env } from '../config/env';

type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

export const signAccessToken = (userId: string, role: UserRole) =>
  jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload & jwt.JwtPayload;

export const createCsrfToken = () => randomUUID();