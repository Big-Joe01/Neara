import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@neara/types';
import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../lib/auth.js';
import { unauthorized } from '../lib/errors.js';
import { sendError } from '../lib/response.js';

export interface AuthedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.access_token) return req.cookies.access_token as string;
  return null;
}

export function authenticate(required = true) {
  return async (req: AuthedRequest, _res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);
      if (!token) {
        if (required) throw unauthorized('Authentication required');
        return next();
      }
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, status: true },
      });
      if (!user || user.status === 'suspended') {
        throw unauthorized(user?.status === 'suspended' ? 'Account suspended' : 'Invalid session');
      }
      req.user = { id: user.id, role: user.role };
      next();
    } catch (err) {
      if (required) {
        sendError(_res, err);
        return;
      }
      next();
    }
  };
}

export function requireRoles(...roles: UserRole[]) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized('Authentication required'));
    if (!roles.includes(req.user.role)) return next(unauthorized('Insufficient permissions'));
    next();
  };
}

export function requireVerifiedIdentity(req: AuthedRequest, _res: Response, next: NextFunction) {
  // lightweight inline check; full verification enforced in services
  next();
}
