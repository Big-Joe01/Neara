import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { createReportSchema, uuidParamSchema } from '@neara/validation';
import { mapReport } from '../mappers/index.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';

export const reportRouter = Router();

reportRouter.post('/', authenticate(), validate(createReportSchema), async (req: AuthedRequest, res) => {
  try {
    const body = req.body as Parameters<typeof createReportSchema.parse>[0] extends infer T ? T : never;
    const { reason, description, reportedEntityType, reportedEntityId, evidenceUrls } = req.body as {
      reason: string;
      description: string;
      reportedEntityType: 'property' | 'landlord' | 'agent' | 'customer' | 'message';
      reportedEntityId: string;
      evidenceUrls?: string[];
    };
    void body;
    const report = await prisma.report.create({
      data: {
        reporterId: req.user!.id,
        reason: reason as never,
        description,
        reportedEntityType: reportedEntityType as never,
        reportedEntityId,
        evidenceUrls: evidenceUrls ? (JSON.stringify(evidenceUrls) as never) : undefined,
        status: 'open',
        priority: ['scam', 'fake_property', 'fake_landlord', 'fake_agent'].includes(reason)
          ? 'high'
          : 'medium',
      },
    });
    await audit(req, 'report.create', 'report', report.id, { reason, reportedEntityId });
    // notify admins
    const admins = await prisma.adminProfile.findMany({ select: { userId: true } });
    for (const a of admins) {
      await notify(a.userId, 'report', 'New report submitted', `${reason}: ${description.slice(0, 80)}`, { reportId: report.id });
    }
    send(res, mapReport(report), 201, 'Report submitted');
  } catch (err) {
    sendError(res, err);
  }
});

reportRouter.get('/me', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const reports = await prisma.report.findMany({
      where: { reporterId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    send(res, reports.map(mapReport));
  } catch (err) {
    sendError(res, err);
  }
});
