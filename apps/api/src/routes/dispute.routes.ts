import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { createDisputeSchema, uuidParamSchema } from '@neara/validation';
import { mapDispute } from '../mappers/index.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';
import { forbidden, notFound } from '../lib/errors.js';

export const disputeRouter = Router();

disputeRouter.post('/', authenticate(), validate(createDisputeSchema), async (req: AuthedRequest, res) => {
  try {
    const { againstId, type, paymentId, propertyId, description } = req.body as {
      againstId: string;
      type: string;
      paymentId?: string;
      propertyId?: string;
      description: string;
    };
    const dispute = await prisma.dispute.create({
      data: {
        openedById: req.user!.id,
        againstId,
        type: type as never,
        paymentId: paymentId ?? null,
        propertyId: propertyId ?? null,
        description,
        status: 'opened',
      },
    });
    await audit(req, 'dispute.create', 'dispute', dispute.id, { type, againstId });
    const admins = await prisma.adminProfile.findMany({ select: { userId: true } });
    for (const a of admins) {
      await notify(a.userId, 'dispute', 'New dispute opened', description.slice(0, 80), { disputeId: dispute.id });
    }
    send(res, mapDispute(dispute), 201, 'Dispute opened');
  } catch (err) {
    sendError(res, err);
  }
});

disputeRouter.get('/', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const where =
      req.user!.role === 'ADMIN'
        ? {}
        : { OR: [{ openedById: req.user!.id }, { againstId: req.user!.id }] };
    const disputes = await prisma.dispute.findMany({ where, orderBy: { createdAt: 'desc' } });
    send(res, disputes.map(mapDispute));
  } catch (err) {
    sendError(res, err);
  }
});

disputeRouter.get('/:id', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const dispute = await prisma.dispute.findUnique({ where: { id: pstr(req, "id") } });
    if (!dispute) throw notFound('Dispute not found');
    const party =
      dispute.openedById === req.user!.id ||
      dispute.againstId === req.user!.id ||
      req.user!.role === 'ADMIN';
    if (!party) throw forbidden('Not allowed');
    send(res, mapDispute(dispute));
  } catch (err) {
    sendError(res, err);
  }
});
