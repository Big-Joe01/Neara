import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, type AuthedRequest } from '../middleware/auth.js';
import { send, sendError } from '../lib/response.js';
import { notFound } from '../lib/errors.js';
import {
  mapAdminProfile,
  mapAgentProfile,
  mapCustomerProfile,
  mapLandlordProfile,
  mapUser,
} from '../mappers/index.js';

export const userRouter = Router();

userRouter.get('/me', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
    send(res, mapUser(user));
  } catch (err) {
    sendError(res, err);
  }
});

userRouter.patch('/me', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const { displayName, avatarUrl } = req.body as { displayName?: string; avatarUrl?: string };
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(displayName ? { displayName } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    });
    send(res, mapUser(user), 200, 'Profile updated');
  } catch (err) {
    sendError(res, err);
  }
});

userRouter.get('/me/profile', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        customerProfile: true,
        landlordProfile: true,
        agentProfile: true,
        adminProfile: true,
      },
    });
    if (user.role === 'CUSTOMER') {
      const count = await prisma.property.count({
        where: { landlordId: user.id },
      });
      void count;
      send(res, mapCustomerProfile(user, user.customerProfile));
      return;
    }
    if (user.role === 'LANDLORD') {
      const totalProperties = await prisma.property.count({
        where: { landlordId: user.id },
      });
      send(res, mapLandlordProfile(user, user.landlordProfile, totalProperties));
      return;
    }
    if (user.role === 'AGENT') {
      const activeAuthorizations = await prisma.agentAuthorization.count({
        where: { agentId: user.id, status: 'verified' },
      });
      send(res, mapAgentProfile(user, user.agentProfile, activeAuthorizations));
      return;
    }
    send(res, mapAdminProfile(user, user.adminProfile));
  } catch (err) {
    sendError(res, err);
  }
});

userRouter.patch('/me/profile', authenticate(), async (req: AuthedRequest, res) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.user!.id },
      include: {
        customerProfile: true,
        landlordProfile: true,
        agentProfile: true,
      },
    });
    if (user.role === 'CUSTOMER' && user.customerProfile) {
      const { occupation, employer, monthlyIncome, preferredLocations, bio } = req.body as {
        occupation?: string;
        employer?: string;
        monthlyIncome?: number;
        preferredLocations?: string[];
        bio?: string;
      };
      const updated = await prisma.customerProfile.update({
        where: { userId: user.id },
        data: {
          ...(occupation !== undefined ? { occupation } : {}),
          ...(employer !== undefined ? { employer } : {}),
          ...(monthlyIncome !== undefined ? { monthlyIncome } : {}),
          ...(preferredLocations !== undefined
            ? { preferredLocations: JSON.stringify(preferredLocations) }
            : {}),
          ...(bio !== undefined ? { bio } : {}),
        },
      });
      send(res, mapCustomerProfile(user, updated), 200, 'Profile updated');
      return;
    }
    if (user.role === 'LANDLORD' && user.landlordProfile) {
      const { companyName, bio } = req.body as { companyName?: string; bio?: string };
      const updated = await prisma.landlordProfile.update({
        where: { userId: user.id },
        data: {
          ...(companyName !== undefined ? { companyName } : {}),
          ...(bio !== undefined ? { bio } : {}),
        },
      });
      const totalProperties = await prisma.property.count({
        where: { landlordId: user.id },
      });
      send(res, mapLandlordProfile(user, updated, totalProperties), 200, 'Profile updated');
      return;
    }
    if (user.role === 'AGENT' && user.agentProfile) {
      const { agencyName, licenseNumber, bio } = req.body as {
        agencyName?: string;
        licenseNumber?: string;
        bio?: string;
      };
      const updated = await prisma.agentProfile.update({
        where: { userId: user.id },
        data: {
          ...(agencyName !== undefined ? { agencyName } : {}),
          ...(licenseNumber !== undefined ? { licenseNumber } : {}),
          ...(bio !== undefined ? { bio } : {}),
        },
      });
      const activeAuthorizations = await prisma.agentAuthorization.count({
        where: { agentId: user.id, status: 'verified' },
      });
      send(res, mapAgentProfile(user, updated, activeAuthorizations), 200, 'Profile updated');
      return;
    }
    throw notFound('Profile not found');
  } catch (err) {
    sendError(res, err);
  }
});
