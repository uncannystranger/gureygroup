import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[MongoDB Atlas] FATAL: MONGODB_URI environment variable is not set.');
  console.error('[MongoDB Atlas] Create a .env file with MONGODB_URI=mongodb+srv://...');
  process.exit(1);
}

let retryCount = 0;
const MAX_RETRIES = 5;

export const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    retryCount = 0;
    console.log(`[MongoDB Atlas] Connected successfully to: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    retryCount++;
    console.error(`[MongoDB Atlas Error] Connection failed (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`);
    if (retryCount < MAX_RETRIES) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // exponential backoff
      console.log(`[MongoDB Atlas] Retrying in ${delay / 1000}s...`);
      setTimeout(connectMongoDB, delay);
    } else {
      console.error('[MongoDB Atlas] Max retries reached. Exiting.');
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Atlas] Database disconnected. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Atlas] Reconnected to database.');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB Atlas] Connection error:', err.message);
});
