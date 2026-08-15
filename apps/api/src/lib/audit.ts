import { prisma } from './prisma.js';
import type { UserRole } from '@neara/types';
import type { AuthedRequest } from '../middleware/auth.js';
import { getClientIp } from '../utils/ip.js';

export function audit(
  req: AuthedRequest | undefined,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  const actorId = req?.user?.id;
  const actorRole = req?.user?.role;
  const ipAddress = req ? getClientIp(req) : undefined;
  return prisma.auditLog
    .create({
      data: {
        actorId,
        actorRole,
        action,
        entityType,
        entityId,
        metadata: metadata as never,
        ipAddress,
      },
    })
    .catch((e) => {
      // audit must never break the request flow
      // eslint-disable-next-line no-console
      console.error('audit log failed', e);
    });
}

export { audit as logAudit };
