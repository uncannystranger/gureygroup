import app from '../backend/app.js';
import { connectMongoDB } from '../backend/config/mongodb.js';

// ─── Production Environment Validation (runs once on cold start) ─────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`[FATAL CONFIG] Missing required environment variables: ${missingEnv.join(', ')}. Configure these in Vercel Dashboard → Settings → Environment Variables.`);
}

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
    // Internal failure details stay in the platform logs above, never in the
    // response body.
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}

