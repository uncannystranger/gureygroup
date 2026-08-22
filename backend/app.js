import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import './config/env.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';

import { securityShieldMiddleware } from './middleware/securityShield.js';
import { mongoStatus, requireMongoConnection } from './config/mongodb.js';

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';
export const REGISTERED_API_ROUTES = [
  'GET /api/health',
  'POST /api/auth/google',
  'GET /api/auth/me',
  'PATCH /api/auth/profile',
  '/api/products',
  '/api/sales',
  '/api/organizations',
  '/api/team',
  '/api/attendance',
  '/api/audit',
  '/api/branches',
  '/api/sessions',
  '/api/security',
  '/api/ai',
  '/api/uploads',
  '/api/customers',
  '/api/inventory',
];

// Strict Helmet Configuration (Anti-Clickjacking, HSTS, Content Security Policy)
app.use(helmet({
  hidePoweredBy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com", "https://*.firebaseio.com", "https://*.googleapis.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true }
}));

// Reflecting any origin with credentials enabled lets a hostile page make
// authenticated calls on a signed-in user's behalf. Allow only known origins.
const allowedOrigins = new Set(
  [process.env.FRONTEND_URL, process.env.PUBLIC_APP_URL]
    .filter(Boolean)
    .map((origin) => origin.replace(/\/$/, ''))
);
const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Same-origin and non-browser callers (curl, health probes) send no Origin.
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, '');
    if (allowedOrigins.has(normalized)) return callback(null, true);
    if (!IS_PROD && devOriginPattern.test(normalized)) return callback(null, true);
    return callback(null, false);
  },
}));
/**
 * JSON bodies are metadata only. Images are uploaded separately as multipart
 * to /api/uploads and referenced by URL, so this ceiling can stay small — a
 * large product payload is now a bug, not a normal request.
 */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Global Security Shield (Injection, XSS, Path Traversal Sanitizer & Threat Logger)
app.use(securityShieldMiddleware);

// Auth Endpoint Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 30 : 500,
  message: { error: 'Too many login/authentication attempts from this IP. Please try again in 15 minutes.' }
});
app.use('/api/auth', authLimiter);
app.use('/api/team/auth/employee-login', authLimiter);
app.use('/api/team/invitations/accept', authLimiter);

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 350 : 2000,
  message: { error: 'Too many API requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  // Connection errors can echo the cluster host and credentials-bearing URI,
  // and the route inventory is reconnaissance material — keep both internal.
  res.status(connected ? 200 : 503).json({
    status: connected ? 'healthy' : 'degraded',
    service: 'Gurey Group Enterprise Multi-Tenant SaaS API',
    timestamp: new Date().toISOString(),
    database: connected ? 'connected' : 'disconnected',
    version: '2.5.0',
    ...(IS_PROD ? {} : { mongoStatus, routes: REGISTERED_API_ROUTES }),
  });
});

// API Routes
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  return requireMongoConnection(req, res, next);
});
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);

// ─── 404 Catch-all ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = !IS_PROD;

  // body-parser surfaces oversized bodies as "request entity too large", which
  // is meaningless to a user. Translate it once, here, for every route.
  if (err.type === 'entity.too.large' || status === 413) {
    console.warn(`[Gurey Group] Oversized payload rejected on ${req.method} ${req.originalUrl}`);
    return res.status(413).json({
      error: 'That request is too large. Images are uploaded separately — please attach a smaller image and try again.',
      code: 'PAYLOAD_TOO_LARGE',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body could not be read.', code: 'BAD_JSON' });
  }

  console.error(`[Gurey Group Error] ${req.method} ${req.originalUrl}`, {
    status,
    message: err.message,
    stack: isDev ? err.stack : undefined,
  });

  res.status(status).json({
    error: IS_PROD && status === 500 ? 'Internal server error' : err.message,
    ...(isDev && { stack: err.stack }),
  });
});

export default app;
