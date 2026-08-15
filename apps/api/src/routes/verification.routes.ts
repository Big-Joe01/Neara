import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { badRequest, notFound } from '../lib/errors.js';
import { verifyDocumentSchema } from '@neara/validation';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';

export const verificationRouter = Router();

// Submit a verification document (identity, ownership, etc.)
verificationRouter.post('/documents', authenticate(), validate(verifyDocumentSchema), async (req: AuthedRequest, res) => {
  try {
    const { type, documentUrl } = req.body as { type: string; documentUrl: string };
    const doc = await prisma.verificationDocument.create({
      data: {
        userId: req.user!.id,
        type: type as never,
        documentUrl,
        status: 'pending',
      },
    });
    await audit(req, 'verification.document.submit', 'verification_document', doc.id, { type });
    const admins = await prisma.adminProfile.findMany({ select: { userId: true } });
    for (const a of admins) {
      await notify(a.userId, 'verification', 'New verification document', `A ${type} document was submitted for review.`, { documentId: doc.id });
    }
    send(res, doc, 201, 'Document submitted for review');
  } catch (err) {
    sendError(res, err);
  }
});

verificationRouter.get('/documents', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const docs = await prisma.verificationDocument.findMany({
      where: { userId: req.user!.id },
      orderBy: { uploadedAt: 'desc' },
    });
    send(res, docs);
  } catch (err) {
    sendError(res, err);
  }
});

verificationRouter.get('/status', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      select: {
        isEmailVerified: true,
        isPhoneVerified: true,
        isIdentityVerified: true,
        verificationLevel: true,
        landlordProfile: { select: { isVerified: true } },
        agentProfile: { select: { isVerified: true } },
      },
    });
    send(res, {
      email: user.isEmailVerified,
      phone: user.isPhoneVerified,
      identity: user.isIdentityVerified,
      level: user.verificationLevel,
      landlordVerified: user.landlordProfile?.isVerified ?? false,
      agentVerified: user.agentProfile?.isVerified ?? false,
    });
  } catch (err) {
    sendError(res, err);
  }
});
