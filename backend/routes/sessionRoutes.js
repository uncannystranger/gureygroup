import express from 'express';
import Session from '../models/Session.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requirePermission } from '../middleware/auth.js';

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
    const { device, browser, os, userName, location, remembered } = req.body;

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
      location: location || 'Unknown',
      remembered: !!remembered,
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
 * POST /api/sessions/logout-other-devices
 * End every active session for the current user except the current session.
 */
router.post('/logout-other-devices', async (req, res) => {
  try {
    const { uid } = req.user;
    const { currentSessionId } = req.body;

    const filter = { userId: uid, isActive: true };
    if (currentSessionId) filter._id = { $ne: currentSessionId };

    const result = await Session.updateMany(filter, {
      isActive: false,
      logoutTime: new Date(),
    });

    await Audit.create({
      companyId: req.tenantId,
      action: 'OTHER_SESSIONS_TERMINATED',
      userEmail: req.user.email,
      details: `Terminated ${result.modifiedCount || 0} other active session(s).`,
    });

    res.json({ success: true, terminated: result.modifiedCount || 0 });
  } catch (error) {
    console.error('Logout Other Sessions Error:', error);
    res.status(500).json({ error: 'Failed to end other sessions.' });
  }
});

/**
 * GET /api/sessions/active
 * List currently active sessions for the org (Owner/Admin only).
 */
router.get('/active', requirePermission('sessions:view'), async (req, res) => {
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
 * DELETE /api/sessions/:id
 * Terminate a specific active session in the current organization.
 */
router.delete('/:id', requirePermission('sessions:view'), async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId },
      { isActive: false, logoutTime: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    await Audit.create({
      companyId: req.tenantId,
      action: 'SESSION_TERMINATED',
      userEmail: req.user.email,
      details: `Terminated session ${session._id} for ${session.userName || session.userId}.`,
    });

    res.json({ success: true, session });
  } catch (error) {
    console.error('Terminate Session Error:', error);
    res.status(500).json({ error: 'Failed to terminate session.' });
  }
});

/**
 * GET /api/sessions/history
 * Session history for the org (Owner/Admin only).
 */
router.get('/history', requirePermission('sessions:view'), async (req, res) => {
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
