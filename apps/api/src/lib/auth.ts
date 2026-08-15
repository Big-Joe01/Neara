import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { appConfig } from '@neara/config';
import { generateOtp } from '@neara/utils';
import type { AuthTokens, UserRole } from '@neara/types';
import { prisma } from './prisma.js';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export function signAccessToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role, type: 'access' }, appConfig.jwt.secret, {
    expiresIn: appConfig.jwt.accessTtl as unknown as number,
  });
}

export function signRefreshToken(userId: string, role: UserRole): string {
  return jwt.sign({ sub: userId, role, type: 'refresh' }, appConfig.jwt.refreshSecret, {
    expiresIn: appConfig.jwt.refreshTtl as unknown as number,
  });
}

export function issueTokens(userId: string, role: UserRole): AuthTokens {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, role);
  const decoded = jwt.decode(accessToken) as JwtPayload;
  return {
    accessToken,
    refreshToken,
    expiresIn: decoded?.exp ? decoded.exp - (decoded.iat ?? 0) : 900,
  };
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, appConfig.jwt.secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, appConfig.jwt.refreshSecret) as JwtPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, appConfig.jwt.bcryptRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashToken(token: string): Promise<string> {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createOtp(
  userId: string,
  purpose: 'email' | 'phone' | 'password_reset',
): Promise<string> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + appConfig.jwt.otpTtlMinutes * 60 * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { otpCode: code, otpExpiresAt: expiresAt, otpPurpose: purpose },
  });
  return code;
}

export function clearOtp(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { otpCode: null, otpExpiresAt: null, otpPurpose: null },
  });
}
