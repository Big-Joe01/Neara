import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import {
  comparePassword,
  createOtp,
  clearOtp,
  hashPassword,
  hashToken,
  generateResetToken,
  issueTokens,
  verifyRefreshToken,
  signAccessToken,
} from '../lib/auth.js';
import {
  badRequest,
  conflict,
  notFound,
  unauthorized,
  ErrorCodes,
} from '../lib/errors.js';
import { send, sendError } from '../lib/response.js';
import { validate } from '../middleware/validate.js';
import {
  loginSchema,
  otpSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  refreshSchema,
  registerSchema,
} from '@neara/validation';
import { mapUser } from '../mappers/index.js';
import { notify } from '../lib/notify.js';
import { appConfig } from '@neara/config';
import type { AuthedRequest } from '../middleware/auth.js';
import type { Response } from 'express';

export const authRouter = Router();

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  const secure = appConfig.api.url.startsWith('https');
  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

authRouter.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const body = req.body as {
      email: string;
      phone: string;
      password: string;
      role: 'CUSTOMER' | 'LANDLORD' | 'AGENT' | 'ADMIN';
      displayName: string;
    };

    if (body.role === 'ADMIN') {
      // Admin accounts are created by super_admin via admin endpoints, not self-register.
      throw badRequest('Admin accounts cannot be self-registered.');
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: body.email }, { phone: body.phone }] },
    });
    if (existing) throw conflict('An account with this email or phone already exists.');

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email,
        phone: body.phone,
        passwordHash,
        role: body.role,
        displayName: body.displayName,
        status: 'pending',
        customerProfile: body.role === 'CUSTOMER' ? { create: {} } : undefined,
        landlordProfile: body.role === 'LANDLORD' ? { create: {} } : undefined,
        agentProfile: body.role === 'AGENT' ? { create: {} } : undefined,
      },
    });

    // Issue OTPs for email + phone verification
    const emailOtp = await createOtp(user.id, 'email');
    const phoneOtp = await createOtp(user.id, 'phone');

    const tokens = issueTokens(user.id, user.role);
    setAuthCookies(res, tokens);

    // In production these are sent via SMS/email providers.
    const dev = process.env.NODE_ENV !== 'production';
    await notify(user.id, 'account', 'Welcome to NEARA', 'Verify your email and phone to continue.');

    send(
      res,
      {
        user: mapUser(user),
        tokens,
        ...(dev ? { emailOtp, phoneOtp } : {}),
      },
      201,
      'Account created. Verify your email and phone.',
    );
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { identifier, password } = req.body as { identifier: string; password: string };
    const isEmail = identifier.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier.toLowerCase() } : { phone: identifier },
    });
    if (!user) throw unauthorized('Invalid credentials');
    if (user.status === 'suspended') throw unauthorized('Account suspended');
    if (user.deletedAt) throw unauthorized('Account deleted');

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw unauthorized('Invalid credentials');

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = issueTokens(user.id, user.role);
    setAuthCookies(res, tokens);
    send(res, { user: mapUser(user), tokens }, 200, 'Logged in');
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/verify-otp', validate(otpSchema), async (req, res) => {
  try {
    const { identifier, code, purpose } = req.body as {
      identifier: string;
      code: string;
      purpose: 'email' | 'phone' | 'password_reset';
    };
    const isEmail = identifier.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier.toLowerCase() } : { phone: identifier },
    });
    if (!user) throw notFound('Account not found');

    if (user.otpCode !== code || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      throw badRequest('Invalid or expired OTP');
    }
    if (user.otpPurpose !== purpose) {
      throw badRequest('OTP purpose mismatch');
    }

    const updates: Record<string, unknown> = {};
    if (purpose === 'email') updates.isEmailVerified = true;
    if (purpose === 'phone') {
      updates.isPhoneVerified = true;
      // activate account once phone verified
      updates.status = 'active';
    }
    await prisma.user.update({ where: { id: user.id }, data: { ...updates, otpCode: null, otpExpiresAt: null, otpPurpose: null } });

    const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    send(res, { user: mapUser(fresh) }, 200, `${purpose} verified`);
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/resend-otp', async (req, res) => {
  try {
    const { identifier, purpose } = req.body as { identifier: string; purpose: 'email' | 'phone' };
    const isEmail = identifier.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier.toLowerCase() } : { phone: identifier },
    });
    if (!user) throw notFound('Account not found');
    const code = await createOtp(user.id, purpose);
    const dev = process.env.NODE_ENV !== 'production';
    send(res, { ...(dev ? { code } : {}) }, 200, 'OTP resent');
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/refresh', validate(refreshSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw unauthorized('Invalid refresh token');
    }
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status === 'suspended') throw unauthorized('Invalid session');

    const accessToken = signAccessToken(user.id, user.role);
    setAuthCookies(res, { accessToken, refreshToken });
    send(res, { accessToken, refreshToken }, 200);
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  send(res, null, 200, 'Logged out');
});

authRouter.post('/password-reset/request', validate(passwordResetRequestSchema), async (req, res) => {
  try {
    const { identifier } = req.body as { identifier: string };
    const isEmail = identifier.includes('@');
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: identifier.toLowerCase() } : { phone: identifier },
    });
    if (!user) {
      // do not reveal account existence
      send(res, null, 200, 'If the account exists, a reset link has been sent.');
      return;
    }
    const token = generateResetToken();
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: await hashToken(token), resetTokenExpiresAt: expires },
    });
    const dev = process.env.NODE_ENV !== 'production';
    send(
      res,
      { ...(dev ? { resetToken: token } : {}) },
      200,
      'If the account exists, a reset link has been sent.',
    );
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/password-reset/confirm', validate(passwordResetSchema), async (req, res) => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    const hashed = await hashToken(token);
    const users = await prisma.user.findMany({
      where: { resetToken: hashed, resetTokenExpiresAt: { gt: new Date() } },
    });
    const user = users[0];
    if (!user) throw badRequest('Invalid or expired reset token');

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
        refreshTokenHash: null,
      },
    });
    send(res, null, 200, 'Password reset successful');
  } catch (err) {
    sendError(res, err);
  }
});

export { setAuthCookies };
