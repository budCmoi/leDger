import type { RequestHandler } from 'express';

import { ACCESS_TOKEN_COOKIE, CSRF_TOKEN_COOKIE, type UserRole } from '../constants/app';
import { prisma } from '../lib/prisma';
import { verifyAccessToken } from '../services/token.service';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';

const resolveBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader?.startsWith('Bearer ')) {
    return undefined;
  }

  return authorizationHeader.slice(7);
};

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies[ACCESS_TOKEN_COOKIE] || resolveBearerToken(req.headers.authorization);

  if (!token) {
    throw new AppError(401, 'Authentication required');
  }

  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub,
    },
  });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Session expired');
  }

  req.user = {
    _id: user.id,
    id: user.id,
    identifier: user.identifier,
    fullName: user.fullName,
    name: user.fullName,
    role: user.role,
    isActive: user.isActive,
  };
  next();
});

export const requireRole = (...roles: UserRole[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have access to this resource'));
    }

    return next();
  };
};

export const requireCsrf: RequestHandler = (req, _res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies[CSRF_TOKEN_COOKIE];
  const headerValue = req.headers['x-csrf-token'];
  const headerToken = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError(403, 'Invalid CSRF token'));
  }

  return next();
};