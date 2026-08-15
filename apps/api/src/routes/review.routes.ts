import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { badRequest, notFound } from '../lib/errors.js';
import { createReviewSchema, uuidParamSchema } from '@neara/validation';
import { mapReview } from '../mappers/index.js';
import { audit } from '../lib/audit.js';

export const reviewRouter = Router();

// Public: list reviews for property/landlord/agent
reviewRouter.get('/', async (req, res) => {
  try {
    const propertyId = qstr(req, "propertyId"); const  landlordId = qstr(req, "landlordId"); const  agentId = qstr(req, "agentId");
    const where: Record<string, string> = {};
    if (propertyId) where.propertyId = propertyId;
    if (landlordId) where.landlordId = landlordId;
    if (agentId) where.agentId = agentId;
    if (Object.keys(where).length === 0) throw badRequest('Provide propertyId, landlordId, or agentId.');
    const reviews = await prisma.review.findMany({
      where,
      include: { reviewer: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    send(res, reviews.map(mapReview));
  } catch (err) {
    sendError(res, err);
  }
});

reviewRouter.post('/', authenticate(), validate(createReviewSchema), async (req: AuthedRequest, res) => {
  try {
    const { propertyId, landlordId, agentId, rating, comment } = req.body as {
      propertyId?: string;
      landlordId?: string;
      agentId?: string;
      rating: number;
      comment: string;
    };
    if (!propertyId && !landlordId && !agentId) {
      throw badRequest('Review must target a property, landlord, or agent.');
    }
    // Verified transaction review: only if user has a successful payment
    let isVerifiedTransaction = false;
    if (propertyId) {
      const payment = await prisma.payment.findFirst({
        where: { propertyId, customerId: req.user!.id, status: 'successful' },
      });
      isVerifiedTransaction = Boolean(payment);
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: req.user!.id,
        propertyId: propertyId ?? null,
        landlordId: landlordId ?? null,
        agentId: agentId ?? null,
        rating,
        comment,
        isVerifiedTransaction,
      },
      include: { reviewer: { select: { displayName: true } } },
    });

    // update aggregate ratings
    if (propertyId) {
      const agg = await prisma.review.aggregate({
        where: { propertyId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          ratingAverage: agg._avg.rating ?? 0,
          ratingCount: agg._count.rating,
        },
      });
    }
    if (agentId) {
      const agg = await prisma.review.aggregate({
        where: { agentId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await prisma.agentProfile.update({
        where: { userId: agentId },
        data: {
          ratingAverage: agg._avg.rating ?? 0,
          ratingCount: agg._count.rating,
        },
      });
    }

    await audit(req, 'review.create', 'review', review.id, { propertyId, rating });
    send(res, mapReview(review), 201, 'Review posted');
  } catch (err) {
    sendError(res, err);
  }
});

reviewRouter.delete('/:id', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    const review = await prisma.review.findUnique({ where: { id: pstr(req, "id") } });
    if (!review) throw notFound('Review not found');
    if (review.reviewerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw badRequest('You can only delete your own reviews.');
    }
    await prisma.review.delete({ where: { id: pstr(req, "id") } });
    send(res, null, 200, 'Review deleted');
  } catch (err) {
    sendError(res, err);
  }
});
