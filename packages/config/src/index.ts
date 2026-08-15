import { brandTokens } from '@neara/brand';

export const appConfig = {
  name: 'NEARA',
  motto: 'One tap from home',
  version: '0.1.0',
  brand: brandTokens.brand,
  api: {
    prefix: '/api',
    port: Number(process.env.PORT ?? 4000),
    url: process.env.APP_URL ?? 'http://localhost:4000',
  },
  web: {
    url: process.env.WEB_URL ?? 'http://localhost:5173',
  },
  admin: {
    url: process.env.ADMIN_URL ?? 'http://localhost:5174',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev_jwt_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_jwt_refresh_secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
    otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 10),
  },
  db: {
    url: process.env.DATABASE_URL ?? 'mysql://neara:neara_password@localhost:3306/neara',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY ?? '',
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET ?? '',
    baseUrl: process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co',
    testMode: (process.env.PAYSTACK_SECRET_KEY ?? '').startsWith('sk_test'),
  },
  map: {
    provider: process.env.MAP_PROVIDER ?? 'google',
    key: process.env.MAP_PROVIDER_KEY ?? '',
  },
  email: {
    provider: process.env.EMAIL_PROVIDER ?? 'smtp',
    from: process.env.EMAIL_FROM ?? 'hello@neara.app',
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
  },
  sms: {
    provider: process.env.SMS_PROVIDER ?? '',
    apiKey: process.env.SMS_API_KEY ?? '',
  },
  push: {
    config: process.env.PUSH_NOTIFICATION_CONFIG ?? '',
  },
  upload: {
    maxImageBytes: 8 * 1024 * 1024,
    maxVideoBytes: 60 * 1024 * 1024,
    maxDocumentBytes: 10 * 1024 * 1024,
    allowedImageMime: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    allowedVideoMime: ['video/mp4', 'video/webm', 'video/quicktime'],
    allowedDocMime: ['application/pdf', 'image/jpeg', 'image/png'],
  },
  rateLimit: {
    authWindowMs: 15 * 60 * 1000,
    authMax: 10,
    apiWindowMs: 60 * 1000,
    apiMax: 120,
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
} as const;

export type AppConfig = typeof appConfig;
export default appConfig;
