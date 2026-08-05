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
];

// Strict Helmet Configuration (Anti-Clickjacking, HSTS, Content Security Policy)
app.use(helmet({
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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Global Security Shield (Injection, XSS, Path Traversal Sanitizer & Threat Logger)
app.use(securityShieldMiddleware);

// Strict Auth Endpoint Brute-Force Rate Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Security Protection: Too many login/authentication attempts from this IP. Please try again in 15 minutes.' }
});
app.use('/api/auth', authLimiter);
app.use('/api/team/auth/employee-login', authLimiter);
app.use('/api/team/invitations/accept', authLimiter);

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 350,
  message: { error: 'Too many API requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? 'healthy' : 'degraded',
    securityShield: 'ACTIVE',
    service: 'Gurey Group Enterprise Multi-Tenant SaaS API',
    timestamp: new Date().toISOString(),
    database: connected ? 'MongoDB Atlas Connected' : 'MongoDB Atlas Disconnected',
    mongoStatus,
    routes: REGISTERED_API_ROUTES,
    version: '2.5.0'
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

// ─── 404 Catch-all ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = !IS_PROD;

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
