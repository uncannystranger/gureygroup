import app from './app.js';
import { connectMongoDB } from './config/mongodb.js';

const PORT = process.env.PORT || 5000;

// Initialize MongoDB & Start Express Server
connectMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[Gurey Group Backend Server] Running on port ${PORT}`);
    console.log(`[Gurey Group Backend Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Gurey Group Backend Server] Health: http://localhost:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error('[Gurey Group Backend Server] Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
