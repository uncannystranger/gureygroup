import express from 'express';
import Organization from '../models/Organization.js';
import Membership from '../models/Membership.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);

/**
 * POST /api/organizations
 * Create a new organization (called during registration).
 * The creator becomes the Owner automatically.
 */
router.post('/', async (req, res) => {
  try {
    const { name, businessType, country, currency, timezone } = req.body;
    const { uid, email } = req.user;

    if (!name) {
      return res.status(400).json({ error: 'Organization name is required.' });
    }

    const companyId = `comp_${Date.now().toString(36)}_${uid.slice(0, 6)}`;

    // Create organization
    const org = await Organization.create({
      companyId,
      name,
      ownerId: uid,
      ownerEmail: email,
      businessType: businessType || 'Retail',
      country: country || '',
      currency: currency || 'USD',
      currencySymbol: currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$',
      timezone: timezone || 'UTC',
    });

    // Create owner membership
    await Membership.create({
      userId: uid,
      companyId,
      role: 'Owner',
      status: 'active',
    });

    // Create default "Main Branch"
    const branch = await Branch.create({
      companyId,
      name: 'Main Branch',
      code: 'BR-01',
      status: 'active',
    });

    // Update user record with companyId
    await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: { companyId, role: 'Owner', permissions: ['ALL'] } },
      { upsert: false }
    );

    // Audit log
    await Audit.create({
      companyId,
      action: 'ORGANIZATION_CREATED',
      userEmail: email,
      details: `Created organization "${name}" (${companyId})`,
    });

    res.status(201).json({
      organization: org,
      membership: { userId: uid, companyId, role: 'Owner', status: 'active' },
      branch,
    });
  } catch (error) {
    console.error('Create Organization Error:', error);
    res.status(500).json({ error: 'Failed to create organization.' });
  }
});

/**
 * GET /api/organizations/me
 * Get the current user's organization details.
 */
router.get('/me', async (req, res) => {
  try {
    const { uid } = req.user;
    const membership = await Membership.findOne({ userId: uid, status: 'active' });
    if (!membership) {
      return res.status(404).json({ error: 'No organization found.', needsOnboarding: true });
    }

    const org = await Organization.findOne({ companyId: membership.companyId });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    res.json({ organization: org, membership });
  } catch (error) {
    console.error('Get Organization Error:', error);
    res.status(500).json({ error: 'Failed to fetch organization.' });
  }
});

/**
 * PATCH /api/organizations
 * Update organization settings (Owner/Admin only).
 */
router.patch('/', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const ALLOWED_FIELDS = ['name', 'businessType', 'logo', 'country', 'currency',
      'currencySymbol', 'timezone', 'phone', 'address', 'taxNumber', 'settings'];

    const updates = {};
    ALLOWED_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const org = await Organization.findOneAndUpdate(
      { companyId },
      { $set: updates },
      { new: true }
    );

    await Audit.create({
      companyId,
      action: 'ORGANIZATION_UPDATED',
      userEmail: req.user.email,
      details: `Updated fields: ${Object.keys(updates).join(', ')}`,
    });

    res.json({ organization: org });
  } catch (error) {
    console.error('Update Organization Error:', error);
    res.status(500).json({ error: 'Failed to update organization.' });
  }
});

/**
 * DELETE /api/organizations
 * Delete organization (Owner only — DANGER ZONE).
 */
router.delete('/', requireRole(['Owner']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    await Organization.findOneAndUpdate({ companyId }, { $set: { status: 'Deleted' } });

    await Audit.create({
      companyId,
      action: 'ORGANIZATION_DELETED',
      userEmail: req.user.email,
      details: `Organization ${companyId} marked as deleted.`,
    });

    res.json({ success: true, message: 'Organization deleted.' });
  } catch (error) {
    console.error('Delete Organization Error:', error);
    res.status(500).json({ error: 'Failed to delete organization.' });
  }
});

export default router;
