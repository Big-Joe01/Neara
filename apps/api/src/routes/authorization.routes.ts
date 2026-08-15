import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import { createAuthorizationSchema } from '@neara/validation';
import { mapAuthorization } from '../mappers/index.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';

export const authorizationRouter = Router();

// Landlord authorizes an agent
authorizationRouter.post('/', authenticate(), validate(createAuthorizationSchema), async (req: AuthedRequest, res) => {
  try {
    const body = req.body as Parameters<typeof createAuthorizationSchema.parse>[0] extends infer T ? T : never;
    const { agentId, propertyId, source, evidenceDocumentUrl, validUntil } = req.body as {
      agentId: string;
      propertyId?: string | null;
      source: 'landlord_grant' | 'agent_evidence';
      evidenceDocumentUrl?: string | null;
      validUntil?: string | null;
    };

    if (source === 'landlord_grant') {
      if (req.user!.role !== 'LANDLORD') throw forbidden('Only landlords can grant authorization.');
      const landlordId = req.user!.id;
      const agent = await prisma.user.findUnique({ where: { id: agentId } });
      if (!agent || agent.role !== 'AGENT') throw notFound('Agent not found');
      if (propertyId) {
        const prop = await prisma.property.findUnique({ where: { id: propertyId } });
        if (!prop || prop.landlordId !== landlordId) throw forbidden('Property not owned by you.');
      }
      const existing = await prisma.agentAuthorization.findFirst({
        where: { agentId, landlordId, propertyId: propertyId ?? null, status: 'verified' },
      });
      if (existing) throw badRequest('Authorization already exists.');

      const auth = await prisma.agentAuthorization.create({
        data: {
          agentId,
          landlordId,
          propertyId: propertyId ?? null,
          status: 'verified',
          source: 'landlord_grant',
          validFrom: new Date(),
          validUntil: validUntil ? new Date(validUntil) : null,
          verifiedAt: new Date(),
        },
      });
      await audit(req, 'authorization.grant', 'agent_authorization', auth.id, { agentId });
      await notify(agentId, 'agent_authorization', 'You are now authorized', 'A landlord has authorized you on NEARA.', { authorizationId: auth.id });
      send(res, mapAuthorization(auth), 201, 'Agent authorized');
    } else {
      // agent submits external evidence
      if (req.user!.role !== 'AGENT') throw forbidden('Only agents can submit evidence.');
      if (!evidenceDocumentUrl) throw badRequest('Evidence document is required.');
      const agentId = req.user!.id;
      const landlordId = body && typeof req.body === 'object' && 'agentId' in req.body ? req.body.agentId : agentId;
      void landlordId;
      // find landlord from propertyId if provided
      let landlordIdResolved = body && 'landlordId' in (req.body as Record<string, unknown>) ? (req.body as { landlordId?: string }).landlordId : undefined;
      if (propertyId && !landlordIdResolved) {
        const prop = await prisma.property.findUnique({ where: { id: propertyId } });
        landlordIdResolved = prop?.landlordId;
      }
      if (!landlordIdResolved) throw badRequest('Could not resolve landlord for evidence submission.');

      const auth = await prisma.agentAuthorization.create({
        data: {
          agentId,
          landlordId: landlordIdResolved,
          propertyId: propertyId ?? null,
          status: 'pending',
          source: 'agent_evidence',
          evidenceDocumentUrl,
          validFrom: new Date(),
          validUntil: validUntil ? new Date(validUntil) : null,
        },
      });
      await audit(req, 'authorization.evidence_submit', 'agent_authorization', auth.id, { agentId });
      send(res, mapAuthorization(auth), 201, 'Evidence submitted for review.');
    }
  } catch (err) {
    sendError(res, err);
  }
});

// List authorizations for current user (as agent or landlord)
authorizationRouter.get('/', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const where =
      req.user!.role === 'AGENT'
        ? { agentId: req.user!.id }
        : req.user!.role === 'LANDLORD'
          ? { landlordId: req.user!.id }
          : {};
    const auths = await prisma.agentAuthorization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    send(res, auths.map(mapAuthorization));
  } catch (err) {
    sendError(res, err);
  }
});

// Revoke authorization
authorizationRouter.patch('/:id/revoke', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const auth = await prisma.agentAuthorization.findUnique({ where: { id: pstr(req, "id") } });
    if (!auth) throw notFound('Authorization not found');
    if (auth.landlordId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw forbidden('Only the landlord or admin can revoke.');
    }
    const updated = await prisma.agentAuthorization.update({
      where: { id: auth.id },
      data: { status: 'revoked', revokedAt: new Date() },
    });
    await audit(req, 'authorization.revoke', 'agent_authorization', auth.id);
    await notify(auth.agentId, 'agent_authorization', 'Authorization revoked', 'A landlord has revoked your authorization.', { authorizationId: auth.id });
    send(res, mapAuthorization(updated), 200, 'Authorization revoked');
  } catch (err) {
    sendError(res, err);
  }
});
