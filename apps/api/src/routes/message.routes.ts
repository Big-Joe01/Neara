import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { send, sendError } from '../lib/response.js';
import { pstr, qstr } from '../utils/query.js';
import { badRequest, notFound, forbidden } from '../lib/errors.js';
import { sendMessageSchema, startConversationSchema } from '@neara/validation';
import { mapConversation, mapMessage } from '../mappers/index.js';
import { notify } from '../lib/notify.js';
import { maskPhone, maskEmail } from '@neara/utils';

export const messageRouter = Router();

// List conversations
messageRouter.get('/conversations', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId: req.user!.id },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: { id: true, displayName: true, avatarUrl: true, role: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });
    send(
      res,
      participations.map((p) => mapConversation(p.conversation, req.user!.id)),
    );
  } catch (err) {
    sendError(res, err);
  }
});

// Start / fetch conversation between two parties
messageRouter.post('/conversations', authenticate(), validate(startConversationSchema), async (req: AuthedRequest, res) => {
  try {
    const { participantId, propertyId } = req.body as { participantId: string; propertyId?: string };
    if (participantId === req.user!.id) throw badRequest('Cannot start a conversation with yourself.');

    // find existing conversation between the two
    const existing = await prisma.conversation.findFirst({
      where: {
        propertyId: propertyId ?? null,
        AND: [
          { participants: { some: { userId: req.user!.id } } },
          { participants: { some: { userId: participantId } } },
        ],
      },
      include: {
        participants: { include: { user: { select: { id: true, displayName: true, avatarUrl: true, role: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (existing) {
      send(res, mapConversation(existing, req.user!.id));
      return;
    }
    const conversation = await prisma.conversation.create({
      data: {
        propertyId: propertyId ?? null,
        participants: {
          create: [{ userId: req.user!.id }, { userId: participantId }],
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, displayName: true, avatarUrl: true, role: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    send(res, mapConversation(conversation, req.user!.id), 201);
  } catch (err) {
    sendError(res, err);
  }
});

// List messages in a conversation
messageRouter.get('/conversations/:id/messages', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: pstr(req, "id"), userId: req.user!.id } },
    });
    if (!participation) throw forbidden('You are not in this conversation.');
    const messages = await prisma.message.findMany({
      where: { conversationId: pstr(req, "id") },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    // mark read
    await prisma.conversationParticipant.update({
      where: { id: participation.id },
      data: { lastReadAt: new Date() },
    });
    send(res, messages.map(mapMessage));
  } catch (err) {
    sendError(res, err);
  }
});

// Send message
messageRouter.post('/conversations/:id/messages', authenticate(), validate(sendMessageSchema), async (req: AuthedRequest, res) => {
  try {
    const { content, attachments } = req.body as {
      conversationId: string;
      content: string;
      attachments?: { url: string; type: string }[];
    };
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId: pstr(req, "id"), userId: req.user!.id } },
    });
    if (!participation) throw forbidden('You are not in this conversation.');

    const message = await prisma.message.create({
      data: {
        conversationId: pstr(req, "id"),
        senderId: req.user!.id,
        content,
        attachments: attachments ? (JSON.stringify(attachments) as never) : undefined,
        readBy: JSON.stringify([]) as never,
      },
    });
    await prisma.conversation.update({
      where: { id: pstr(req, "id") },
      data: { lastMessageAt: new Date() },
    });
    // notify other participant
    const others = await prisma.conversationParticipant.findMany({
      where: { conversationId: pstr(req, "id"), userId: { not: req.user!.id } },
      select: { userId: true },
    });
    for (const o of others) {
      await notify(o.userId, 'message', 'New message', content.slice(0, 100), {
        conversationId: pstr(req, "id"),
      });
    }
    send(res, mapMessage(message), 201);
  } catch (err) {
    sendError(res, err);
  }
});

// Contact info — only revealed if product allows; masked by default
messageRouter.get('/contact/:userId', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: pstr(req, "userId") },
      select: { phone: true, email: true, displayName: true, role: true },
    });
    if (!user) throw notFound('User not found');
    // Mask contact details unless an active transaction links them.
    send(res, {
      displayName: user.displayName,
      role: user.role,
      phone: maskPhone(user.phone),
      email: maskEmail(user.email),
      fullyRevealed: false,
    });
  } catch (err) {
    sendError(res, err);
  }
});
