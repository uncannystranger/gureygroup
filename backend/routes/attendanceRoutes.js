import express from 'express';
import Attendance from '../models/Attendance.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requirePermission } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);

/**
 * POST /api/attendance/check-in
 * Employee checks in for the day.
 */
router.post('/check-in', requirePermission('attendance:check_in'), async (req, res) => {
  try {
    const { uid, email } = req.user;
    const companyId = req.tenantId;
    const { branchId, userName, userRole } = req.body;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if already checked in today
    const existing = await Attendance.findOne({ userId: uid, date: today });
    if (existing) {
      if (existing.checkIn && !existing.checkOut) {
        return res.status(400).json({ error: 'Already checked in. Please check out first.' });
      }
      if (existing.checkOut) {
        return res.status(400).json({ error: 'Already completed attendance for today.' });
      }
    }

    const now = new Date();
    const checkInHour = now.getHours();
    // Consider "late" if after 9 AM (configurable later)
    const isLate = checkInHour >= 9;

    const attendance = await Attendance.findOneAndUpdate(
      { userId: uid, date: today },
      {
        $set: {
          userId: uid,
          userName: userName || email.split('@')[0],
          userRole: userRole || req.user.role || 'Employee',
          companyId,
          branchId: branchId || null,
          date: today,
          checkIn: now,
          status: isLate ? 'late' : 'present',
        }
      },
      { upsert: true, new: true }
    );

    await Audit.create({
      companyId,
      action: 'ATTENDANCE_CHECK_IN',
      userEmail: email,
      details: `${userName || email} checked in at ${now.toLocaleTimeString()}${isLate ? ' (LATE)' : ''}`,
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Check-In Error:', error);
    res.status(500).json({ error: 'Failed to check in.' });
  }
});

/**
 * POST /api/attendance/check-out
 * Employee checks out for the day.
 */
router.post('/check-out', async (req, res) => {
  try {
    const { uid, email } = req.user;
    const today = new Date().toISOString().split('T')[0];

    const attendance = await Attendance.findOne({ userId: uid, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ error: 'You have not checked in today.' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ error: 'Already checked out for today.' });
    }

    const now = new Date();
    const workingMinutes = Math.round((now - attendance.checkIn) / (1000 * 60));

    attendance.checkOut = now;
    attendance.workingHours = workingMinutes;
    await attendance.save();

    await Audit.create({
      companyId: req.tenantId,
      action: 'ATTENDANCE_CHECK_OUT',
      userEmail: email,
      details: `Checked out at ${now.toLocaleTimeString()}. Worked ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m.`,
    });

    res.json({ attendance });
  } catch (error) {
    console.error('Check-Out Error:', error);
    res.status(500).json({ error: 'Failed to check out.' });
  }
});

/**
 * GET /api/attendance/today
 * Get today's attendance for the entire organization (Owner/Admin/Manager).
 */
router.get('/today', requirePermission('attendance:view_all'), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const today = new Date().toISOString().split('T')[0];
    const { branchId } = req.query;

    const filter = { companyId, date: today };
    if (branchId) filter.branchId = branchId;

    const records = await Attendance.find(filter).sort({ checkIn: 1 });
    res.json({ attendance: records, date: today });
  } catch (error) {
    console.error('Today Attendance Error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
});

/**
 * GET /api/attendance/my
 * Get current user's attendance history.
 */
router.get('/my', async (req, res) => {
  try {
    const { uid } = req.user;
    const { from, to, limit } = req.query;

    const filter = { userId: uid };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit) || 30);

    res.json({ attendance: records });
  } catch (error) {
    console.error('My Attendance Error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance.' });
  }
});

/**
 * GET /api/attendance/history
 * Get attendance history for the organization (Owner/Admin/Manager).
 */
router.get('/history', requirePermission('attendance:view_all'), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { from, to, branchId, userId, limit } = req.query;

    const filter = { companyId };
    if (branchId) filter.branchId = branchId;
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const records = await Attendance.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit) || 100);

    res.json({ attendance: records });
  } catch (error) {
    console.error('Attendance History Error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance history.' });
  }
});

export default router;
