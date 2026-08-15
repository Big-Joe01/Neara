import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { validationError } from '../lib/errors.js';
import { sendError } from '../lib/response.js';
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details: Record<string, unknown> = {};
        for (const issue of err.issues) {
          const key = issue.path.join('.') || '_';
          details[key] = issue.message;
        }
        return sendError(_res, validationError(details));
      }
      next(err);
    }
  };
}
