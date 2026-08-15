import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { feeRuleSchema, uuidParamSchema } from '@neara/validation';
import { feeService } from '../services/fee.service.js';
import { mapFeeRule, mapReport, mapDispute, mapUser } from '../mappers/index.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';
import { qstr, pstr } from '../utils/query.js';
import type { UserRole } from '@neara/types';
import type { Prisma } from '@prisma/client';

const adminOnly = [authenticate(), requireRoles('ADMIN' as UserRole)] as const;

export const adminRouter = Router();

adminRouter.use((...args) => {
  // apply auth + role on all admin routes
  const [req, res, next] = args;
  return Promise.resolve(authenticate()(req as import('express').Request, res, () =>
    requireRoles('ADMIN' as UserRole)(req as AuthedRequest, res, next),
  ));
});

// ---- Dashboard stats
adminRouter.get('/stats', async (_req, res) => {
  try {
    const [totalUsers, activeLandlords, activeAgents, properties, verifiedProperties, activeListings, transactions, revenueAgg, pendingVerifications, pendingReports, disputes, agentActivity] =
      await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({ where: { role: 'LANDLORD', status: 'active' } }),
        prisma.user.count({ where: { role: 'AGENT', status: 'active' } }),
        prisma.property.count({ where: { deletedAt: null } }),
        prisma.property.count({ where: { nearaVerified: true, deletedAt: null } }),
        prisma.property.count({ where: { status: 'active', deletedAt: null } }),
        prisma.payment.count({ where: { status: 'successful' } }),
        prisma.payment.aggregate({ where: { status: 'successful' }, _sum: { amount: true } }),
        prisma.verificationDocument.count({ where: { status: 'pending' } }),
        prisma.report.count({ where: { status: { in: ['open', 'under_review'] } } }),
        prisma.dispute.count({ where: { status: { in: ['opened', 'under_review', 'awaiting_information'] } } }),
        prisma.agentAuthorization.count({ where: { status: 'verified' } }),
      ]);
    send(res, {
      totalUsers,
      activeLandlords,
      activeAgents,
      properties,
      verifiedProperties,
      activeListings,
      transactions,
      revenue: revenueAgg._sum.amount ?? 0,
      pendingVerifications,
      pendingReports,
      disputes,
      agentActivity,
    });
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Users management
adminRouter.get('/users', async (req, res) => {
  try {
    const role = qstr(req, 'role');
    const status = qstr(req, 'status');
    const q = qstr(req, 'q');
    const where: Prisma.UserWhereInput = {};
    if (role) where.role = role as UserRole;
    if (status) where.status = status as never;
    if (q) where.OR = [{ email: { contains: q } }, { phone: { contains: q } }, { displayName: { contains: q } }];
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    send(res, users.map(mapUser));
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.get('/users/:id', validate(uuidParamSchema, 'params'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: pstr(req, "id") } });
    if (!user) throw notFoundUser();
    send(res, mapUser(user));
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.patch('/users/:id/status', validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const { status } = req.body as { status: 'active' | 'suspended' | 'pending' | 'deleted' };
    const user = await prisma.user.update({
      where: { id: pstr(req, "id") },
      data: { status, ...(status === 'deleted' ? { deletedAt: new Date() } : {}) },
    });
    await audit(req, 'admin.user.status', 'user', pstr(req, "id"), { status });
    send(res, mapUser(user), 200, 'User status updated');
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Properties moderation
adminRouter.get('/properties', async (req, res) => {
  try {
    const status = qstr(req, 'status');
    const properties = await prisma.property.findMany({
      where: { deletedAt: null, ...(status ? { status: status as never } : {}) },
      include: {
        propertyType: true,
        landlord: { include: { landlordProfile: true } },
        images: { orderBy: { order: 'asc' } },
        amenities: { include: { amenity: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const { toDto } = await import('../services/property.service.js');
    send(res, properties.map((p) => toDto(p)));
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.patch('/properties/:id/moderate', validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const { status, nearaVerified } = req.body as { status?: 'pending_review' | 'active' | 'suspended' | 'rented' | 'expired'; nearaVerified?: boolean };
    const property = await prisma.property.findUnique({ where: { id: pstr(req, "id") } });
    if (!property) throw notFoundUser();
    const updated = await prisma.property.update({
      where: { id: pstr(req, "id") },
      data: {
        ...(status ? { status } : {}),
        ...(nearaVerified !== undefined ? { nearaVerified, verifiedAt: nearaVerified ? new Date() : null, verificationLevel: nearaVerified ? 'neara' : property.verificationLevel } : {}),
      },
      include: { propertyType: true, landlord: { include: { landlordProfile: true } }, images: { orderBy: { order: 'asc' } }, amenities: { include: { amenity: true } } },
    });
    await audit(req, 'admin.property.moderate', 'property', pstr(req, "id"), { status, nearaVerified });
    if (status === 'active') {
      await notify(property.landlordId, 'account', 'Property approved', `${property.title} is now live on NEARA.`, { propertyId: property.id });
    }
    const { toDto } = await import('../services/property.service.js');
    send(res, toDto(updated as never), 200, 'Property moderated');
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Verification
adminRouter.get('/verifications', async (_req, res) => {
  try {
    send(res, await prisma.verificationDocument.findMany({ orderBy: { uploadedAt: 'desc' }, include: { user: { select: { displayName: true, email: true, role: true } } } }));
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.patch('/verifications/:id', validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const { status, notes } = req.body as { status: 'approved' | 'rejected'; notes?: string };
    const doc = await prisma.verificationDocument.update({
      where: { id: pstr(req, "id") },
      data: { status, notes, reviewedAt: new Date(), reviewerId: req.user!.id },
    });
    // If identity approved, mark user identity verified
    if (status === 'approved' && doc.type === 'identity') {
      await prisma.user.update({
        where: { id: doc.userId },
        data: { isIdentityVerified: true, verificationLevel: 'identity' },
      });
    }
    if (status === 'approved' && doc.type === 'landlord_ownership') {
      await prisma.landlordProfile.update({
        where: { userId: doc.userId },
        data: { isVerified: true, verifiedAt: new Date() },
      });
      await prisma.user.update({ where: { id: doc.userId }, data: { verificationLevel: 'landlord' } });
    }
    if (status === 'approved' && (doc.type === 'agent_license' || doc.type === 'agent_authorization')) {
      await prisma.agentProfile.update({
        where: { userId: doc.userId },
        data: { isVerified: true, verifiedAt: new Date() },
      });
    }
    await audit(req, 'admin.verification.review', 'verification_document', pstr(req, "id"), { status });
    await notify(doc.userId, 'verification', `Verification ${status}`, `Your ${doc.type} document was ${status}.`, { documentId: doc.id });
    send(res, doc, 200, `Document ${status}`);
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Agent authorizations
adminRouter.patch('/authorizations/:id', validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const { status } = req.body as { status: 'verified' | 'rejected' };
    const auth = await prisma.agentAuthorization.update({
      where: { id: pstr(req, "id") },
      data: { status, verifiedAt: status === 'verified' ? new Date() : null },
    });
    await audit(req, 'admin.authorization.review', 'agent_authorization', pstr(req, "id"), { status });
    await notify(auth.agentId, 'agent_authorization', `Authorization ${status}`, `Your authorization submission was ${status}.`, { authorizationId: auth.id });
    const { mapAuthorization } = await import('../mappers/index.js');
    send(res, mapAuthorization(auth), 200, `Authorization ${status}`);
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Fee rules
adminRouter.get('/fee-rules', async (_req, res) => {
  try {
    send(res, await feeService.getActiveRules());
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.post('/fee-rules', validate(feeRuleSchema), async (req: AuthedRequest, res) => {
  try {
    const rule = await feeService.createRule(req.body as Parameters<typeof feeService.createRule>[0], req.user!.id);
    await audit(req, 'admin.fee_rule.create', 'fee_rule', rule.id);
    send(res, rule, 201, 'Fee rule created');
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.patch('/fee-rules/:id', validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const rule = await feeService.updateRule(pstr(req, "id"), req.body as Parameters<typeof feeService.updateRule>[1]);
    await audit(req, 'admin.fee_rule.update', 'fee_rule', pstr(req, "id"));
    send(res, rule, 200, 'Fee rule updated');
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.delete('/fee-rules/:id', validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    await feeService.deleteRule(pstr(req, "id"));
    await audit(req, 'admin.fee_rule.delete', 'fee_rule', pstr(req, "id"));
    send(res, null, 200, 'Fee rule deleted');
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Reports
adminRouter.get('/reports', async (req, res) => {
  try {
    const status = qstr(req, "status");
    const reports = await prisma.report.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    send(res, reports.map(mapReport));
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.patch('/reports/:id', validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const { status, priority, adminNotes, resolution } = req.body as {
      status?: 'open' | 'under_review' | 'resolved' | 'dismissed';
      priority?: 'low' | 'medium' | 'high' | 'critical';
      adminNotes?: string;
      resolution?: string;
    };
    const report = await prisma.report.update({
      where: { id: pstr(req, "id") },
      data: {
        ...(status ? { status, resolvedAt: ['resolved', 'dismissed'].includes(status) ? new Date() : undefined } : {}),
        ...(priority ? { priority } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(resolution !== undefined ? { resolution } : {}),
      },
    });
    await audit(req, 'admin.report.update', 'report', pstr(req, "id"), { status });
    send(res, mapReport(report), 200, 'Report updated');
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Disputes
adminRouter.get('/disputes', async (req, res) => {
  try {
    const status = qstr(req, "status");
    const disputes = await prisma.dispute.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    send(res, disputes.map(mapDispute));
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.patch('/disputes/:id', validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const { status, resolution } = req.body as { status?: 'opened' | 'under_review' | 'awaiting_information' | 'resolved' | 'rejected' | 'escalated'; resolution?: string };
    const dispute = await prisma.dispute.update({
      where: { id: pstr(req, "id") },
      data: { ...(status ? { status } : {}), ...(resolution !== undefined ? { resolution } : {}) },
    });
    await audit(req, 'admin.dispute.update', 'dispute', pstr(req, "id"), { status });
    await notify(dispute.openedById, 'dispute', `Dispute ${status ?? 'updated'}`, resolution ?? 'Your dispute has been updated.', { disputeId: dispute.id });
    send(res, mapDispute(dispute), 200, 'Dispute updated');
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Payments / transactions
adminRouter.get('/payments', async (req, res) => {
  try {
    const status = qstr(req, "status");
    const payments = await prisma.payment.findMany({
      where: status ? { status: status as never } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const { mapPayment } = await import('../mappers/index.js');
    send(res, payments.map(mapPayment));
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Audit logs
adminRouter.get('/audit-logs', async (req, res) => {
  try {
    const entityType = qstr(req, "entityType");
    const logs = await prisma.auditLog.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    send(res, logs);
  } catch (err) {
    sendError(res, err);
  }
});

// ---- Platform settings
adminRouter.get('/settings', async (_req, res) => {
  try {
    send(res, await prisma.platformSetting.findMany());
  } catch (err) {
    sendError(res, err);
  }
});

adminRouter.patch('/settings/:key', async (req, res) => {
  try {
    const { value, description } = req.body as { value: string; description?: string };
    const setting = await prisma.platformSetting.upsert({
      where: { key: pstr(req, "key") },
      create: { key: pstr(req, "key"), value, description },
      update: { value, description },
    });
    send(res, setting, 200, 'Setting updated');
  } catch (err) {
    sendError(res, err);
  }
});

// Mark adminOnly referenced (used as middleware pattern)
void adminOnly;

import { notFound as notFoundUser } from '../lib/errors.js';
