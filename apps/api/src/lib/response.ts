import type { Response } from 'express';
import type { ApiResponse } from '@neara/types';
import { AppError, ErrorCodes, ok } from './errors.js';

export function send<T>(res: Response, data: T, status = 200, message?: string): Response {
  return res.status(status).json(ok(data, message) as ApiResponse<T>);
}

export function sendError(res: Response, err: unknown): Response {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  // Prisma known errors
  const e = err as { code?: string; message?: string };
  if (e?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: ErrorCodes.DUPLICATE,
        message: 'A record with this value already exists.',
      },
    });
  }
  if (e?.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: { code: ErrorCodes.NOT_FOUND, message: 'Record not found.' },
    });
  }

  // Never leak stack traces in production
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : (e?.message ?? 'Internal error');
  return res.status(500).json({
    success: false,
    error: { code: ErrorCodes.INTERNAL, message },
  });
}
