import mongoose from 'mongoose';
import './env.js';

const MONGODB_URI = process.env.MONGODB_URI;

export const mongoStatus = {
  state: 'disconnected',
  lastError: null,
  connectedAt: null,
};

if (!MONGODB_URI) {
  const msg = '[FATAL CONFIG] MONGODB_URI environment variable is not set. Database features will be unavailable.';
  console.error(msg);
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    throw new Error(msg);
  } else {
    console.warn('[MongoDB Atlas] WARNING: MONGODB_URI not set. Database unavailable in development.');
  }
}

let cachedPromise = null;

export const connectMongoDB = async () => {
  if (!MONGODB_URI) {
    const err = new Error('MONGODB_URI environment variable is not set.');
    mongoStatus.state = 'disconnected';
    mongoStatus.lastError = err.message;
    throw err;
  }

  // ReadyState 1 = Connected
  if (mongoose.connection.readyState === 1) {
    mongoStatus.state = 'connected';
    return mongoose.connection;
  }

  // Reuse ongoing connection promise if present
  if (cachedPromise) {
    return cachedPromise;
  }

  mongoStatus.state = 'connecting';
  mongoStatus.lastError = null;

  cachedPromise = mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  }).then((conn) => {
    mongoStatus.state = 'connected';
    mongoStatus.connectedAt = new Date().toISOString();
    mongoStatus.lastError = null;
    console.log(`[MongoDB Atlas] Connected successfully to: ${conn.connection.host}`);
    return conn;
  }).catch((error) => {
    cachedPromise = null;
    mongoStatus.state = 'disconnected';
    mongoStatus.lastError = error.message;
    console.error(`[MongoDB Atlas Error] Connection failed: ${error.message}`);
    throw error;
  });

  return cachedPromise;
};

mongoose.connection.on('disconnected', () => {
  mongoStatus.state = 'disconnected';
  cachedPromise = null;
  console.warn('[MongoDB Atlas] Database disconnected.');
});

mongoose.connection.on('reconnected', () => {
  mongoStatus.state = 'connected';
  mongoStatus.connectedAt = new Date().toISOString();
  mongoStatus.lastError = null;
  console.log('[MongoDB Atlas] Reconnected to database.');
});

mongoose.connection.on('error', (err) => {
  mongoStatus.state = 'disconnected';
  mongoStatus.lastError = err.message;
  cachedPromise = null;
  console.error('[MongoDB Atlas] Connection error:', err.message);
});

export const requireMongoConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'MongoDB is not connected. Please verify database connection and MONGODB_URI.',
      database: mongoStatus,
    });
  }
  next();
};

