import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://abdallahmadm_db_user:qFEzCvg8xeM3XoCX@saas1.x4qrp3x.mongodb.net/?appName=saas1';

export const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Atlas Error] Connection failed: ${error.message}`);
    console.log(`[MongoDB Atlas] Retrying connection in 5 seconds...`);
    setTimeout(connectMongoDB, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Atlas Warning] Database disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Atlas] Reconnected to database.');
});
