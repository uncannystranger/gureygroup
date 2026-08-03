import app from '../backend/app.js';
import { connectMongoDB } from '../backend/config/mongodb.js';

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    try {
      await connectMongoDB();
      isConnected = true;
    } catch (error) {
      console.error('[Vercel Serverless] MongoDB connection error:', error);
    }
  }
  return app(req, res);
}
