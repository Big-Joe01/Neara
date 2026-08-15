import { Router } from 'express';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { propertyService } from '../services/property.service.js';
import {
  createPropertySchema,
  searchSchema,
  updatePropertySchema,
  uuidParamSchema,
} from '@neara/validation';
import { prisma } from '../lib/prisma.js';
import { forbidden, notFound } from '../lib/errors.js';

export const propertyRouter = Router();

// Public: list/search properties
propertyRouter.get('/', validate(searchSchema, 'query'), async (req, res) => {
  try {
    const filters = req.query as unknown as Parameters<typeof propertyService.search>[0];
    // allow optional auth for favorites tracking
    const authHeader = req.headers.authorization;
    let userId: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../lib/auth.js');
        const payload = verifyAccessToken(authHeader.slice(7));
        userId = payload.sub;
      } catch {
        // ignore invalid tokens on public search
      }
    }
    const result = await propertyService.search(filters, userId);
    send(res, result);
  } catch (err) {
    sendError(res, err);
  }
});

// Public: map bounds search
propertyRouter.get('/map', async (req, res) => {
  try {
    const south = qstr(req, "south"); const  west = qstr(req, "west"); const  north = qstr(req, "north"); const  east = qstr(req, "east");
    if (!south || !west || !north || !east) {
      throw notFound('Map bounds required: south, west, north, east');
    }
    const result = await propertyService.mapSearch({
      south: Number(south),
      west: Number(west),
      north: Number(north),
      east: Number(east),
    });
    send(res, result);
  } catch (err) {
    sendError(res, err);
  }
});

propertyRouter.get('/recommended', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { verifyAccessToken } = await import('../lib/auth.js');
        userId = verifyAccessToken(authHeader.slice(7)).sub;
      } catch {
        /* ignore */
      }
    }
    const items = await propertyService.recommended(10, userId);
    send(res, items);
  } catch (err) {
    sendError(res, err);
  }
});

propertyRouter.get('/recent', async (_req, res) => {
  try {
    send(res, await propertyService.recentlyAdded(10));
  } catch (err) {
    sendError(res, err);
  }
});

propertyRouter.get('/direct', async (_req, res) => {
  try {
    send(res, await propertyService.directFromLandlord(10));
  } catch (err) {
    sendError(res, err);
  }
});

// Public: by slug
propertyRouter.get('/slug/:slug', async (req: AuthedRequest, res) => {
  try {
    let userId: string | undefined;
    if (req.user?.id) userId = req.user.id;
    const property = await propertyService.getBySlug(pstr(req, "slug"), userId);
    send(res, property);
  } catch (err) {
    sendError(res, err);
  }
});

// Authenticated: get by id
propertyRouter.get('/:id', authenticate(false), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const property = await propertyService.getById(pstr(req, "id"), req.user?.id);
    send(res, property);
  } catch (err) {
    sendError(res, err);
  }
});

// Create
propertyRouter.post('/', authenticate(), requireRolesLandlordOrAgent, validate(createPropertySchema), async (req: AuthedRequest, res) => {
  try {
    const property = await propertyService.create(req, req.body);
    send(res, property, 201, 'Property created. Pending review.');
  } catch (err) {
    sendError(res, err);
  }
});

// Update
propertyRouter.patch('/:id', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const property = await propertyService.update(req, pstr(req, "id"), req.body);
    send(res, property, 200, 'Property updated');
  } catch (err) {
    sendError(res, err);
  }
});

// Delete (soft)
propertyRouter.delete('/:id', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    await propertyService.remove(req, pstr(req, "id"));
    send(res, null, 200, 'Property removed');
  } catch (err) {
    sendError(res, err);
  }
});

// Set status
propertyRouter.patch('/:id/status', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const { status } = req.body as { status: 'draft' | 'active' | 'rented' | 'suspended' };
    const property = await propertyService.setStatus(req, pstr(req, "id"), status);
    send(res, property, 200, 'Status updated');
  } catch (err) {
    sendError(res, err);
  }
});

// Reorder images
propertyRouter.patch('/:id/images/reorder', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const property = await prisma.property.findUnique({ where: { id: pstr(req, "id") } });
    if (!property) throw notFound('Property not found');
    if (property.landlordId !== req.user!.id && property.agentId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw forbidden('Not allowed');
    }
    const result = await propertyService.reorderImages(pstr(req, "id"), req.body as { id: string; order: number; isCover?: boolean }[]);
    send(res, result, 200, 'Images reordered');
  } catch (err) {
    sendError(res, err);
  }
});

// List owner properties
propertyRouter.get('/owner/me', authenticate(), async (req: AuthedRequest, res) => {
  try {
    send(res, await propertyService.listByOwner(req.user!.id));
  } catch (err) {
    sendError(res, err);
  }
});

// Upload signature for direct media upload
propertyRouter.post('/media/sign', authenticate(), requireRolesLandlordOrAgent, async (req: AuthedRequest, res) => {
  try {
    const { folder } = req.body as { folder?: string };
    const { mediaService } = await import('../services/media.service.js');
    send(res, mediaService.signUpload(folder ?? `neara/properties/${req.user!.id}`));
  } catch (err) {
    sendError(res, err);
  }
});

function requireRolesLandlordOrAgent(req: AuthedRequest, _res: import('express').Response, next: import('express').NextFunction) {
  if (!req.user) return next(forbidden('Authentication required'));
  if (req.user.role !== 'LANDLORD' && req.user.role !== 'AGENT') {
    return next(forbidden('Only landlords or agents can perform this action.'));
  }
  next();
}
