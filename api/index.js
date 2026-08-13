import app from '../backend/app.js';
import { connectMongoDB } from '../backend/config/mongodb.js';

export default async function handler(req, res) {
  try {
    if (process.env.MONGODB_URI) {
      try {
        await connectMongoDB();
      } catch (dbErr) {
        console.error('[Vercel Serverless] MongoDB connection error:', dbErr.message);
      }
    }
    return await app(req, res);
  } catch (err) {
    console.error('[Vercel Serverless Fatal Exception]', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
    return res.status(500).json({
      error: 'Serverless Function Execution Error',
      message: err.message,
      route: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  }
}

