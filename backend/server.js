import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectMongoDB } from './config/mongodb.js';
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
const PORT = process.env.PORT || 5000;

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
    database: 'MongoDB Atlas Connected'
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

// Initialize MongoDB & Start Express Server
connectMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Gurey Group Backend Server] Running on port ${PORT}`);
    console.log(`[Gurey Group Backend Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
