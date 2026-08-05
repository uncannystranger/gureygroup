import express from 'express';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requirePermission } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);

/**
 * GET /api/audit
 * Fetch audit logs for the organization (Owner/Admin only).
 */
router.get('/', requirePermission('audit:view'), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { action, userEmail, from, to, limit, page } = req.query;

    const filter = { companyId };
    if (action) filter.action = action;
    if (userEmail) filter.userEmail = { $regex: userEmail, $options: 'i' };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const pageNum = parseInt(page) || 1;
    const pageSize = Math.min(parseInt(limit) || 50, 200);
    const skip = (pageNum - 1) * pageSize;

    const [logs, total] = await Promise.all([
      Audit.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Audit.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Audit Logs Error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
});

/**
 * GET /api/audit/actions
 * List all distinct action types for filtering UI.
 */
router.get('/actions', requirePermission('audit:view'), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const actions = await Audit.distinct('action', { companyId });
    res.json({ actions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch action types.' });
  }
});

export default router;
