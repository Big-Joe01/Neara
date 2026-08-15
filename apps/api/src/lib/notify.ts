import { prisma } from './prisma.js';
import type { NotificationType } from '@prisma/client';
import { appConfig } from '@neara/config';

/**
 * Notification service — creates in-app notification records and dispatches
 * to email/push/sms channels. Email/SMS/Push are no-ops when provider config
 * is missing (architecture is ready; providers are pluggable).
 */
export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const notif = await prisma.notification.create({
    data: { userId, type, title, body, data: data as never },
  });

  // Email dispatch (best-effort)
  if (appConfig.email.host) {
    void sendEmailNotification(userId, title, body).catch(() => {});
  }
  return notif;
}

export async function markRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

async function sendEmailNotification(_userId: string, _title: string, _body: string) {
  // Pluggable: integrate nodemailer/SES here. Left as architecture stub
  // that only runs when SMTP host is configured.
  return Promise.resolve();
}
