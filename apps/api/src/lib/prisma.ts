import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __nearaPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__nearaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__nearaPrisma = prisma;
}

export default prisma;
