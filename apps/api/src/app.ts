import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import { appConfig } from '@neara/config';
import { sendError } from './lib/response.js';
import { AppError, ErrorCodes } from './lib/errors.js';

import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { propertyRouter } from './routes/property.routes.js';
import { authorizationRouter } from './routes/authorization.routes.js';
import { inspectionRouter } from './routes/inspection.routes.js';
import { applicationRouter } from './routes/application.routes.js';
import { paymentRouter } from './routes/payment.routes.js';
import { agreementRouter } from './routes/agreement.routes.js';
import { messageRouter } from './routes/message.routes.js';
import { notificationRouter } from './routes/notification.routes.js';
import { reviewRouter } from './routes/review.routes.js';
import { reportRouter } from './routes/report.routes.js';
import { disputeRouter } from './routes/dispute.routes.js';
import { favoriteRouter } from './routes/favorite.routes.js';
import { verificationRouter } from './routes/verification.routes.js';
import { lookupRouter } from './routes/lookup.routes.js';
import { adminRouter } from './routes/admin.routes.js';

export function createApp() {
  const app = express();

  // Trust proxy for accurate IPs behind reverse proxy / load balancer
  app.set('trust proxy', 1);

  // Security headers
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS
  const allowedOrigins = [appConfig.web.url, appConfig.admin.url].filter(Boolean);
  app.use(
    cors({
      origin(origin, cb) {
        // allow same-origin / non-browser (curl, mobile) and configured origins
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(null, true); // permissive in dev; tighten in production via env
      },
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(cookieParser());

  // Raw body capture for Paystack webhook signature verification
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: Request & { rawBody?: string }, _res, buf) => {
        if (req.originalUrl?.endsWith('/api/payments/webhook')) {
          req.rawBody = buf.toString('utf8');
        }
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Global rate limiting
  app.use(
    '/api',
    rateLimit({
      windowMs: appConfig.rateLimit.apiWindowMs,
      max: appConfig.rateLimit.apiMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: { code: ErrorCodes.RATE_LIMITED, message: 'Too many requests.' } },
    }),
  );

  // Auth-specific stricter rate limit
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: appConfig.rateLimit.authWindowMs,
      max: appConfig.rateLimit.authMax,
      standardHeaders: true,
      legacyHeaders: false,
      message: { success: false, error: { code: ErrorCodes.RATE_LIMITED, message: 'Too many auth attempts.' } },
    }),
  );

  // Health
  app.get('/health', (_req, res) => res.json({ status: 'ok', name: 'NEARA', motto: 'One tap from home' }));

  // Routes
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/properties', propertyRouter);
  app.use('/api/authorizations', authorizationRouter);
  app.use('/api/inspections', inspectionRouter);
  app.use('/api/applications', applicationRouter);
  app.use('/api/payments', paymentRouter);
  app.use('/api/agreements', agreementRouter);
  app.use('/api/messages', messageRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/reviews', reviewRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/disputes', disputeRouter);
  app.use('/api/favorites', favoriteRouter);
  app.use('/api/verifications', verificationRouter);
  app.use('/api/lookups', lookupRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/search', propertyRouter); // alias

  // 404
  app.use((req, _res, next) => {
    next(new AppError(404, ErrorCodes.NOT_FOUND, `Route not found: ${req.method} ${req.path}`));
  });

  // Centralized error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    sendError(res, err);
  });

  return app;
}

export default createApp;
