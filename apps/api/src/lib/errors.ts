import type { ApiResponse } from '@neara/types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  FEE_EXCEEDS_LIMIT: 'FEE_EXCEEDS_LIMIT',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  UNVERIFIED: 'UNVERIFIED',
  DUPLICATE: 'DUPLICATE',
  INTERNAL: 'INTERNAL_ERROR',
} as const;

export function badRequest(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(400, ErrorCodes.BAD_REQUEST, message, details);
}

export function validationError(details: Record<string, unknown>): AppError {
  return new AppError(422, ErrorCodes.VALIDATION, 'Validation failed', details);
}

export function unauthorized(message = 'Unauthorized'): AppError {
  return new AppError(401, ErrorCodes.UNAUTHORIZED, message);
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(403, ErrorCodes.FORBIDDEN, message);
}

export function notFound(message = 'Not found'): AppError {
  return new AppError(404, ErrorCodes.NOT_FOUND, message);
}

export function conflict(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(409, ErrorCodes.CONFLICT, message, details);
}

export function feeExceedsLimit(message: string, details?: Record<string, unknown>): AppError {
  return new AppError(422, ErrorCodes.FEE_EXCEEDS_LIMIT, message, details);
}

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}
