import { Router } from 'express';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { uuidParamSchema, signAgreementSchema } from '@neara/validation';
import { agreementService } from '../services/agreement.service.js';

export const agreementRouter = Router();

agreementRouter.get('/', authenticate(), async (req: AuthedRequest, res) => {
  try {
    send(res, await agreementService.listForUser(req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
});

agreementRouter.get('/:id', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    send(res, await agreementService.getForUser(pstr(req, "id"), req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
});

agreementRouter.post('/:id/sign', authenticate(), validate(uuidParamSchema, 'params'), validate(signAgreementSchema), async (req: AuthedRequest, res) => {
  try {
    const { signatureData } = req.body as { signatureData: string };
    const agreement = await agreementService.sign(pstr(req, "id"), req, signatureData);
    send(res, agreement, 200, 'Agreement signed');
  } catch (err) {
    sendError(res, err);
  }
});

// Public verification by agreementId
agreementRouter.get('/:agreementId/verify', async (req, res) => {
  try {
    send(res, await agreementService.verify(pstr(req, "agreementId")));
  } catch (err) {
    sendError(res, err);
  }
});

// Public document view by agreementId (returns the terms text)
agreementRouter.get('/:agreementId/document', async (req, res) => {
  try {
    const { prisma } = await import('../lib/prisma.js');
    const agreement = await prisma.agreement.findUnique({
      where: { agreementId: pstr(req, "agreementId") },
      select: { terms: true, agreementId: true, status: true, qrCodeUrl: true, signatures: { select: { signerName: true, signerRole: true, signedAt: true } } },
    });
    if (!agreement) {
      const { notFound } = await import('../lib/errors.js');
      throw notFound('Agreement not found');
    }
    res.setHeader('Content-Type', 'text/plain');
    res.send(agreement.terms + '\n\nSIGNATURES\n' + agreement.signatures.map((s) => `- ${s.signerName} (${s.signerRole}) on ${new Date(s.signedAt).toLocaleString()}`).join('\n'));
  } catch (err) {
    sendError(res, err);
  }
});
