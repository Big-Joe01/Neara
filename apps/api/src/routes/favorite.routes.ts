import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { send, sendError } from '../lib/response.js';
import { notFound } from '../lib/errors.js';
import { mapFavorite } from '../mappers/index.js';
import { validate } from '../middleware/validate.js';
import { propertyService } from '../services/property.service.js';
import { z } from 'zod';

const propertyIdParamSchema = z.object({ propertyId: z.string().uuid() });

export const favoriteRouter = Router();

favoriteRouter.get('/', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: { property: true },
      orderBy: { createdAt: 'desc' },
    });
    // return full property dtos with isFavorited true
    const items = await Promise.all(
      favorites.map(async (f) => ({
        favorite: mapFavorite(f),
        property: await propertyService.getById(f.propertyId, req.user!.id),
      })),
    );
    send(res, items);
  } catch (err) {
    sendError(res, err);
  }
});

favoriteRouter.post('/:propertyId', authenticate(), validate(propertyIdParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const propertyId = (req.params as { propertyId: string }).propertyId;
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw notFound('Property not found');
    const fav = await prisma.favorite.upsert({
      where: { userId_propertyId: { userId: req.user!.id, propertyId } },
      create: { userId: req.user!.id, propertyId },
      update: {},
    });
    await prisma.property.update({
      where: { id: propertyId },
      data: { saves: { increment: 1 } },
    });
    send(res, mapFavorite(fav), 201, 'Saved');
  } catch (err) {
    sendError(res, err);
  }
});

favoriteRouter.delete('/:propertyId', authenticate(), validate(propertyIdParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const propertyId = (req.params as { propertyId: string }).propertyId;
    await prisma.favorite.deleteMany({
      where: { userId: req.user!.id, propertyId },
    });
    await prisma.property.update({
      where: { id: propertyId },
      data: { saves: { decrement: 1 } },
    }).catch(() => {});
    send(res, null, 200, 'Removed');
  } catch (err) {
    sendError(res, err);
  }
});
