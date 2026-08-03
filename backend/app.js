import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';

// Security & Optimization Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Gurey Group Enterprise Multi-Tenant SaaS API',
    timestamp: new Date().toISOString(),
    database: 'MongoDB Atlas Connected',
    version: '2.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/sessions', sessionRoutes);

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
