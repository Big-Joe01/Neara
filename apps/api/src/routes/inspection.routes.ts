import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { badRequest, forbidden, notFound } from '../lib/errors.js';
import {
  requestInspectionSchema,
  updateInspectionSchema,
  uuidParamSchema,
} from '@neara/validation';
import { mapInspection } from '../mappers/index.js';
import { audit } from '../lib/audit.js';
import { notify } from '../lib/notify.js';

export const inspectionRouter = Router();

inspectionRouter.post('/', authenticate(), validate(requestInspectionSchema), async (req: AuthedRequest, res) => {
  try {
    const { propertyId, requestedDate, requestedTime, notes } = req.body as {
      propertyId: string;
      requestedDate: string;
      requestedTime: string;
      notes?: string;
    };
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw notFound('Property not found');
    if (property.status !== 'active') throw badRequest('Property not available for inspection.');

    const inspection = await prisma.inspection.create({
      data: {
        propertyId,
        customerId: req.user!.id,
        landlordId: property.landlordId,
        agentId: property.agentId ?? null,
        requestedDate,
        requestedTime,
        notes,
        status: 'requested',
      },
    });
    await audit(req, 'inspection.request', 'inspection', inspection.id, { propertyId });
    await notify(
      property.landlordId,
      'inspection',
      'New inspection request',
      `A customer requested an inspection for ${property.title}.`,
      { inspectionId: inspection.id, propertyId },
    );
    send(res, mapInspection(inspection), 201, 'Inspection requested');
  } catch (err) {
    sendError(res, err);
  }
});

inspectionRouter.get('/', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const where =
      req.user!.role === 'CUSTOMER'
        ? { customerId: req.user!.id }
        : req.user!.role === 'LANDLORD'
          ? { landlordId: req.user!.id }
          : req.user!.role === 'AGENT'
            ? { agentId: req.user!.id }
            : {};
    const inspections = await prisma.inspection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    send(res, inspections.map(mapInspection));
  } catch (err) {
    sendError(res, err);
  }
});

inspectionRouter.get('/:id', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const inspection = await prisma.inspection.findUnique({ where: { id: pstr(req, "id") } });
    if (!inspection) throw notFound('Inspection not found');
    const party =
      inspection.customerId === req.user!.id ||
      inspection.landlordId === req.user!.id ||
      inspection.agentId === req.user!.id ||
      req.user!.role === 'ADMIN';
    if (!party) throw forbidden('Not allowed');
    send(res, mapInspection(inspection));
  } catch (err) {
    sendError(res, err);
  }
});

inspectionRouter.patch('/:id', authenticate(), validate(uuidParamSchema, 'params'), validate(updateInspectionSchema), async (req: AuthedRequest, res) => {
  try {
    const inspection = await prisma.inspection.findUnique({ where: { id: pstr(req, "id") } });
    if (!inspection) throw notFound('Inspection not found');
    const canManage =
      inspection.landlordId === req.user!.id ||
      inspection.agentId === req.user!.id ||
      req.user!.role === 'ADMIN' ||
      (req.body.status === 'cancelled' && inspection.customerId === req.user!.id);
    if (!canManage) throw forbidden('Not allowed');
    const { status, confirmedDate, notes } = req.body as {
      status: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed';
      confirmedDate?: string;
      notes?: string;
    };
    const updated = await prisma.inspection.update({
      where: { id: inspection.id },
      data: {
        status,
        confirmedDate: confirmedDate ? new Date(confirmedDate) : undefined,
        notes: notes ?? inspection.notes,
      },
    });
    await audit(req, 'inspection.update', 'inspection', inspection.id, { status });
    await notify(
      inspection.customerId,
      'inspection',
      `Inspection ${status}`,
      `Your inspection has been ${status}.`,
      { inspectionId: inspection.id },
    );
    send(res, mapInspection(updated), 200, 'Inspection updated');
  } catch (err) {
    sendError(res, err);
  }
});
