import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { slugify } from '@neara/utils';
import { z } from 'zod';
import { mapPropertyType } from '../mappers/index.js';
import type { UserRole } from '@neara/types';

export const lookupRouter = Router();

const propertyTypeCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Property types
lookupRouter.get('/property-types', async (_req, res) => {
  try {
    const types = await prisma.propertyType.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    send(res, types.map(mapPropertyType));
  } catch (err) {
    sendError(res, err);
  }
});

lookupRouter.post('/property-types', authenticate(), requireRoles('ADMIN' as UserRole), validate(propertyTypeCreateSchema), async (req, res) => {
  try {
    const body = req.body as { name: string; slug?: string; category?: string; isActive?: boolean };
    const type = await prisma.propertyType.create({
      data: {
        name: body.name,
        slug: body.slug ?? slugify(body.name),
        category: body.category,
        isActive: body.isActive ?? true,
      },
    });
    send(res, mapPropertyType(type), 201);
  } catch (err) {
    sendError(res, err);
  }
});

lookupRouter.patch('/property-types/:id', authenticate(), requireRoles('ADMIN' as UserRole), async (req, res) => {
  try {
    const body = req.body as { name?: string; category?: string; isActive?: boolean };
    const type = await prisma.propertyType.update({
      where: { id: pstr(req, "id") },
      data: {
        ...(body.name ? { name: body.name, slug: slugify(body.name) } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
    send(res, mapPropertyType(type));
  } catch (err) {
    sendError(res, err);
  }
});

// Amenities
lookupRouter.get('/amenities', async (_req, res) => {
  try {
    send(res, await prisma.amenity.findMany({ orderBy: { name: 'asc' } }));
  } catch (err) {
    sendError(res, err);
  }
});

// Locations
lookupRouter.get('/locations', async (req, res) => {
  try {
    const city = qstr(req, "city"); const  state = qstr(req, "state");
    send(
      res,
      await prisma.location.findMany({
        where: {
          isActive: true,
          ...(city ? { city: { contains: city } } : {}),
          ...(state ? { state: { contains: state } } : {}),
        },
        orderBy: [{ state: 'asc' }, { city: 'asc' }],
      }),
    );
  } catch (err) {
    sendError(res, err);
  }
});

// Popular areas (derived from active properties)
lookupRouter.get('/popular-areas', async (_req, res) => {
  try {
    const areas = await prisma.property.groupBy({
      by: ['city', 'area'],
      where: { status: 'active', deletedAt: null, area: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 12,
    });
    send(
      res,
      areas.map((a) => ({ city: a.city, area: a.area, count: a._count.id })),
    );
  } catch (err) {
    sendError(res, err);
  }
});
