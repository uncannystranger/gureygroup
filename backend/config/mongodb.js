import mongoose from 'mongoose';
import './env.js';

mongoose.set('bufferCommands', false);

const MONGODB_URI = process.env.MONGODB_URI;
export const mongoStatus = {
  state: 'disconnected',
  lastError: null,
  connectedAt: null,
};

if (!MONGODB_URI) {
  console.error('[MongoDB Atlas] FATAL: MONGODB_URI environment variable is not set.');
  console.error('[MongoDB Atlas] Create a .env file with MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

let retryCount = 0;
const MAX_RETRIES = 5;

export const connectMongoDB = async () => {
  try {
    mongoStatus.state = 'connecting';
    mongoStatus.lastError = null;
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    retryCount = 0;
    mongoStatus.state = 'connected';
    mongoStatus.connectedAt = new Date().toISOString();
    console.log(`[MongoDB Atlas] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    retryCount++;
    mongoStatus.state = 'disconnected';
    mongoStatus.lastError = error.message;
    console.error(`[MongoDB Atlas Error] Connection failed (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`);
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // exponential backoff
      console.log(`[MongoDB Atlas] Retrying in ${delay / 1000}s...`);
      setTimeout(connectMongoDB, delay);
    } else {
      console.error('[MongoDB Atlas] Max retries reached. API will stay online in degraded mode.');
    }
  }
};

mongoose.connection.on('disconnected', () => {
  mongoStatus.state = 'disconnected';
  console.warn('[MongoDB Atlas] Database disconnected. Attempting reconnect...');
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
  console.error('[MongoDB Atlas] Connection error:', err.message);
});

export const requireMongoConnection = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: 'Database unavailable',
      message: 'MongoDB is not connected. Check MongoDB Atlas network access/IP allowlist and MONGODB_URI.',
      database: mongoStatus,
    });
  }
  next();
};
