import express from 'express';
import Branch from '../models/Branch.js';
import Membership from '../models/Membership.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);

/**
 * GET /api/branches
 * List branches for the organization.
 * Managers only see their assigned branch; Owner/Admin see all.
 */
router.get('/', async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { uid } = req.user;
    const userRole = req.user.role;

    let branches;
    if (['Owner', 'Admin'].includes(userRole)) {
      branches = await Branch.find({ companyId }).sort({ createdAt: 1 });
    } else {
      // Get user's assigned branch
      const membership = await Membership.findOne({ companyId, userId: uid });
      if (membership?.branchId) {
        branches = await Branch.find({ companyId, _id: membership.branchId });
      } else {
        branches = await Branch.find({ companyId }).limit(1); // Default to first branch
      }
    }

    // Enrich with employee count
    const enriched = await Promise.all(branches.map(async (b) => {
      const employeeCount = await Membership.countDocuments({ companyId, branchId: b._id.toString() });
      return { ...b.toObject(), employeeCount };
    }));

    res.json({ branches: enriched });
  } catch (error) {
    console.error('List Branches Error:', error);
    res.status(500).json({ error: 'Failed to fetch branches.' });
  }
});

/**
 * POST /api/branches
 * Create a new branch (Owner/Admin only).
 */
router.post('/', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { name, code, address, city, phone, managerId, managerName } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Branch name is required.' });
    }

    const branchCount = await Branch.countDocuments({ companyId });
    const branch = await Branch.create({
      companyId,
      name,
      code: code || `BR-${String(branchCount + 1).padStart(2, '0')}`,
      address: address || '',
      city: city || '',
      phone: phone || '',
      managerId: managerId || null,
      managerName: managerName || '',
    });

    await Audit.create({
      companyId,
      action: 'BRANCH_CREATED',
      userEmail: req.user.email,
      details: `Created branch "${name}" (${branch.code})`,
    });

    res.status(201).json({ branch });
  } catch (error) {
    console.error('Create Branch Error:', error);
    res.status(500).json({ error: 'Failed to create branch.' });
  }
});

/**
 * PATCH /api/branches/:id
 * Update a branch (Owner/Admin only).
 */
router.patch('/:id', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, address, city, phone, managerId, managerName, status } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (address !== undefined) updates.address = address;
    if (city !== undefined) updates.city = city;
    if (phone !== undefined) updates.phone = phone;
    if (managerId !== undefined) updates.managerId = managerId;
    if (managerName !== undefined) updates.managerName = managerName;
    if (status !== undefined) updates.status = status;

    const branch = await Branch.findByIdAndUpdate(id, { $set: updates }, { new: true });
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    await Audit.create({
      companyId: req.tenantId,
      action: 'BRANCH_UPDATED',
      userEmail: req.user.email,
      details: `Updated branch "${branch.name}": ${Object.keys(updates).join(', ')}`,
    });

    res.json({ branch });
  } catch (error) {
    console.error('Update Branch Error:', error);
    res.status(500).json({ error: 'Failed to update branch.' });
  }
});

/**
 * DELETE /api/branches/:id
 * Deactivate a branch (Owner only).
 */
router.delete('/:id', requireRole(['Owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });

    if (!branch) {
      return res.status(404).json({ error: 'Branch not found.' });
    }

    await Audit.create({
      companyId: req.tenantId,
      action: 'BRANCH_DEACTIVATED',
      userEmail: req.user.email,
      details: `Deactivated branch "${branch.name}"`,
    });

    res.json({ success: true, branch });
  } catch (error) {
    console.error('Delete Branch Error:', error);
    res.status(500).json({ error: 'Failed to deactivate branch.' });
  }
});

export default router;
