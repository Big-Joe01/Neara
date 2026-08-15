import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import {
  createApplicationSchema,
  updateApplicationSchema,
  uuidParamSchema,
} from '@neara/validation';
import { mapApplication } from '../mappers/index.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';

export const applicationRouter = Router();

applicationRouter.post('/', authenticate(), validate(createApplicationSchema), async (req: AuthedRequest, res) => {
  try {
    const body = req.body as {
      propertyId: string;
      moveInDate: string;
      requestedPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
      employment?: string;
      income?: number;
    };
    const property = await prisma.property.findUnique({ where: { id: body.propertyId } });
    if (!property) throw notFound('Property not found');
    if (property.status !== 'active') throw badRequest('Property not available.');

    const existing = await prisma.application.findFirst({
      where: { propertyId: body.propertyId, customerId: req.user!.id, status: { in: ['submitted', 'under_review', 'approved'] } },
    });
    if (existing) throw badRequest('You already have an active application for this property.');

    const application = await prisma.application.create({
      data: {
        propertyId: body.propertyId,
        customerId: req.user!.id,
        landlordId: property.landlordId,
        agentId: property.agentId ?? null,
        moveInDate: body.moveInDate,
        requestedPeriod: body.requestedPeriod,
        employment: body.employment ?? null,
        income: body.income ?? null,
        status: 'submitted',
      },
    });
    await audit(req, 'application.submit', 'application', application.id, { propertyId: body.propertyId });
    await notify(
      property.landlordId,
      'application',
      'New application',
      `A customer applied for ${property.title}.`,
      { applicationId: application.id, propertyId: body.propertyId },
    );
    send(res, mapApplication(application), 201, 'Application submitted');
  } catch (err) {
    sendError(res, err);
  }
});

applicationRouter.get('/', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const where =
      req.user!.role === 'CUSTOMER'
        ? { customerId: req.user!.id }
        : req.user!.role === 'LANDLORD'
          ? { landlordId: req.user!.id }
          : req.user!.role === 'AGENT'
            ? { agentId: req.user!.id }
            : {};
    const apps = await prisma.application.findMany({ where, orderBy: { createdAt: 'desc' } });
    send(res, apps.map(mapApplication));
  } catch (err) {
    sendError(res, err);
  }
});

applicationRouter.get('/:id', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const app = await prisma.application.findUnique({ where: { id: pstr(req, "id") } });
    if (!app) throw notFound('Application not found');
    const party =
      app.customerId === req.user!.id ||
      app.landlordId === req.user!.id ||
      app.agentId === req.user!.id ||
      req.user!.role === 'ADMIN';
    if (!party) throw forbidden('Not allowed');
    send(res, mapApplication(app));
  } catch (err) {
    sendError(res, err);
  }
});

applicationRouter.patch('/:id', authenticate(), validate(uuidParamSchema, 'params'), validate(updateApplicationSchema), async (req: AuthedRequest, res) => {
  try {
    const app = await prisma.application.findUnique({ where: { id: pstr(req, "id") } });
    if (!app) throw notFound('Application not found');
    const canManage =
      app.landlordId === req.user!.id ||
      app.agentId === req.user!.id ||
      req.user!.role === 'ADMIN';
    if (!canManage) throw forbidden('Not allowed');
    const { status, notes } = req.body as {
      status: 'under_review' | 'approved' | 'rejected' | 'info_requested';
      notes?: string;
    };
    const updated = await prisma.application.update({
      where: { id: app.id },
      data: { status, notes: notes ?? app.notes },
    });
    await audit(req, 'application.update', 'application', app.id, { status });
    await notify(
      app.customerId,
      'application_status',
      `Application ${status.replace('_', ' ')}`,
      `Your application has been ${status.replace('_', ' ')}.`,
      { applicationId: app.id, status },
    );
    send(res, mapApplication(updated), 200, 'Application updated');
  } catch (err) {
    sendError(res, err);
  }
});
