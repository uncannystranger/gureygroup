import app, { REGISTERED_API_ROUTES } from './app.js';
import { BACKEND_PORT } from './config/env.js';
import { connectMongoDB, mongoStatus } from './config/mongodb.js';
import { runMigrations } from './migrations/runner.js';

const PORT = BACKEND_PORT;

// Initialize MongoDB & Start Express Server
connectMongoDB().then(async () => {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`[Gurey Group Backend Server] Running on port ${PORT}`);
    console.log(`[Gurey Group Backend Server] Listening: http://127.0.0.1:${PORT}`);
    console.log(`[Gurey Group Backend Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Gurey Group Backend Server] MongoDB status: ${mongoStatus.state}${mongoStatus.lastError ? ` (${mongoStatus.lastError})` : ''}`);
    console.log(`[Gurey Group Backend Server] Health: http://127.0.0.1:${PORT}/api/health`);
    console.log(`[Gurey Group Backend Server] Registered API routes: ${REGISTERED_API_ROUTES.join(', ')}`);
  });
}).catch((err) => {
  console.error('[Gurey Group Backend Server] Failed to connect to MongoDB:', err.message);
  process.exit(1);
});
