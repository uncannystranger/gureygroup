import express from 'express';
import Session from '../models/Session.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);

/**
 * POST /api/sessions
 * Record a new login session.
 */
router.post('/', async (req, res) => {
  try {
    const { uid, email } = req.user;
    const companyId = req.tenantId;
    const { device, browser, os, userName } = req.body;

    // Deactivate previous sessions for this user (optional: keep multiple active)
    // await Session.updateMany({ userId: uid, isActive: true }, { isActive: false, logoutTime: new Date() });

    const session = await Session.create({
      userId: uid,
      userName: userName || email.split('@')[0],
      companyId,
      device: device || 'Unknown',
      browser: browser || 'Unknown',
      os: os || 'Unknown',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      loginTime: new Date(),
      isActive: true,
    });

    res.status(201).json({ session });
  } catch (error) {
    console.error('Create Session Error:', error);
    res.status(500).json({ error: 'Failed to record session.' });
  }
});

/**
 * POST /api/sessions/heartbeat
 * Update lastActive timestamp for current session.
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { uid } = req.user;
    const { sessionId } = req.body;

    const filter = sessionId
      ? { _id: sessionId }
      : { userId: uid, isActive: true };

    await Session.findOneAndUpdate(filter, { lastActive: new Date() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update heartbeat.' });
  }
});

/**
 * POST /api/sessions/logout
 * Mark current session as ended.
 */
router.post('/logout', async (req, res) => {
  try {
    const { uid } = req.user;
    const { sessionId } = req.body;

    const filter = sessionId
      ? { _id: sessionId }
      : { userId: uid, isActive: true };

    await Session.updateMany(filter, {
      isActive: false,
      logoutTime: new Date(),
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Logout Session Error:', error);
    res.status(500).json({ error: 'Failed to end session.' });
  }
});

/**
 * GET /api/sessions/active
 * List currently active sessions for the org (Owner/Admin only).
 */
router.get('/active', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const sessions = await Session.find({ companyId, isActive: true })
      .sort({ lastActive: -1 });

    res.json({ sessions });
  } catch (error) {
    console.error('Active Sessions Error:', error);
    res.status(500).json({ error: 'Failed to fetch active sessions.' });
  }
});

/**
 * GET /api/sessions/history
 * Session history for the org (Owner/Admin only).
 */
router.get('/history', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { userId, limit } = req.query;

    const filter = { companyId };
    if (userId) filter.userId = userId;

    const sessions = await Session.find(filter)
      .sort({ loginTime: -1 })
      .limit(parseInt(limit) || 50);

    res.json({ sessions });
  } catch (error) {
    console.error('Session History Error:', error);
    res.status(500).json({ error: 'Failed to fetch session history.' });
  }
});

export default router;
