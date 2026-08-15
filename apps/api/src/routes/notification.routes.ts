import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { markAllRead, markRead } from '../lib/notify.js';
import { mapNotification } from '../mappers/index.js';
import { uuidParamSchema } from '@neara/validation';
import { validate } from '../middleware/validate.js';

export const notificationRouter = Router();

notificationRouter.get('/', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const unread = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });
    send(res, { items: notifications.map(mapNotification), unread });
  } catch (err) {
    sendError(res, err);
  }
});

notificationRouter.patch('/:id/read', authenticate(), validate(uuidParamSchema, 'params'), async (req: AuthedRequest, res) => {
  try {
    await markRead(pstr(req, "id"), req.user!.id);
    send(res, null, 200, 'Marked read');
  } catch (err) {
    sendError(res, err);
  }
});

notificationRouter.patch('/read-all', authenticate(), async (req: AuthedRequest, res) => {
  try {
    await markAllRead(req.user!.id);
    send(res, null, 200, 'All marked read');
  } catch (err) {
    sendError(res, err);
  }
});
