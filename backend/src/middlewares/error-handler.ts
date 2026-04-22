import type { ErrorRequestHandler, RequestHandler } from 'express';

import { Prisma } from '@prisma/client';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

import { env } from '../config/env';
import { AppError } from '../utils/app-error';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'Route not found'));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      message: 'Validation failed',
      issues: error.issues,
    });
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(422).json({
      message: 'Database validation failed',
      issues: Object.values(error.errors).map((issue) => issue.message),
    });
  }

  if (error instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: `Invalid identifier for ${error.path}`,
    });
  }

  if (error instanceof mongoose.mongo.MongoServerError && error.code === 11000) {
    return res.status(409).json({
      message: 'A record with the same unique value already exists',
      details: error.keyValue,
    });
  }

  const appError = error instanceof AppError ? error : new AppError(500, 'Internal server error');

  return res.status(appError.statusCode).json({
    message: appError.message,
    details: appError.details,
    ...(env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
  });
};