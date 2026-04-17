import type { RequestHandler } from 'express';

import type { ZodTypeAny } from 'zod';

import { sanitizePayload } from '../utils/sanitize';

export const validate = (schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body'): RequestHandler => {
  return (req, _res, next) => {
    const parsedValue = schema.parse(sanitizePayload(req[source]));
    (req as unknown as Record<string, unknown>)[source] = parsedValue;
    next();
  };
};