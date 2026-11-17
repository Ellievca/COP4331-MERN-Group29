import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { authRoutes, authentication, csrf, requireAdmin } from './auth.js';
import { workspaceRoutes } from './workspace.js';
import { adminRoutes } from './admin.js';
import { accountRoutes } from './account.js';
import { reviewRoutes } from './reviews.js';
import { imageRoutes } from './images.js';
import { errorHandler, HttpError } from './errors.js';

export async function createApp({ db, config, frontendPath, onError, sendMail, googleVerifier }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(
    helmet({
      contentSecurityPolicy: config.production
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://fonts.googleapis.com',
                'https://accounts.google.com/gsi/style',
              ],
              fontSrc: ["'self'", 'https://fonts.gstatic.com'],
              imgSrc: ["'self'", 'data:'],
              connectSrc: ["'self'", 'https://accounts.google.com'],
              scriptSrc: ["'self'", 'https://accounts.google.com/gsi/client'],
              frameSrc: ["'self'", 'https://accounts.google.com'],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      strictTransportSecurity: config.production ? undefined : false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin) return callback(null, false);
        if (config.allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new HttpError(403, 'This origin is not allowed.', 'origin_not_allowed'));
      },
    }),
  );
  app.use(cookieParser());
  app.use(
    '/api/card-images',
    express.raw({ type: ['image/png', 'image/jpeg', 'image/webp'], limit: '2mb' }),
  );
  app.use(express.json({ limit: '32kb' }));
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      const origin = req.get('Origin');
      if (origin && !config.allowedOrigins.includes(origin))
        throw new HttpError(403, 'This origin is not allowed.', 'origin_not_allowed');
      const hasBody =
        Number(req.get('Content-Length') || 0) > 0 || Boolean(req.get('Transfer-Encoding'));
      if (
        hasBody &&
        !req.is('application/json') &&
        !(
          req.path === '/card-images' &&
          ['image/png', 'image/jpeg', 'image/webp'].includes(req.get('Content-Type'))
        )
      )
        throw new HttpError(415, 'Send requests as application/json.', 'unsupported_media_type');
    }
    next();
  });
  app.get('/api/health', async (req, res) => {
    await db.command({ ping: 1 });
    res.json({ status: 'ok', database: 'connected' });
  });
  if (config.rateLimits) {
    app.use(
      ['/api/auth/email', '/api/auth/password', '/api/auth/google'],
      rateLimit({
        windowMs: 15 * 60000,
        limit: 40,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (req, res) =>
          res
            .status(429)
            .json({ error: 'Too many attempts. Please try again later.', code: 'rate_limited' }),
      }),
    );
    app.use(
      '/api/auth/login',
      rateLimit({
        windowMs: 15 * 60000,
        limit: 30,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (req, res) =>
          res.status(429).json({
            error: 'Too many sign-in attempts. Please try again later.',
            code: 'rate_limited',
          }),
      }),
    );
    app.use(
      '/api/auth/register',
      rateLimit({
        windowMs: 60 * 60000,
        limit: 20,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (req, res) =>
          res.status(429).json({
            error: 'Too many registration attempts. Please try again later.',
            code: 'rate_limited',
          }),
      }),
    );
  }
  app.use('/api/auth', await authRoutes(db, config, { sendMail }));
  app.use('/api/auth', accountRoutes(db, config, { sendMail, googleVerifier }));
  app.use('/api', authentication(db, config), (req, res, next) =>
    ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) ? csrf(req, res, next) : next(),
  );
  app.use('/api/admin', requireAdmin, adminRoutes(db));
  app.use('/api', reviewRoutes(db));
  app.use('/api', imageRoutes(db));
  app.use('/api', workspaceRoutes(db));
  app.use('/api', (req, res) =>
    res.status(404).json({ error: 'This API route could not be found.', code: 'not_found' }),
  );
  if (frontendPath && existsSync(join(frontendPath, 'index.html'))) {
    app.use(express.static(frontendPath, { index: false }));
    app.use((req, res, next) =>
      req.method === 'GET' && !req.path.startsWith('/api')
        ? res.sendFile('index.html', { root: frontendPath })
        : next(),
    );
  }
  app.use((req, res) =>
    res.status(404).json({ error: 'This page could not be found.', code: 'not_found' }),
  );
  app.use((error, req, res, next) => {
    onError?.(error);
    errorHandler(error, req, res, next);
  });
  return app;
}
