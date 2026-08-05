import express from 'express';
import Membership from '../models/Membership.js';
import Invitation from '../models/Invitation.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/team/invitations/verify/:token
 * Verify an invitation token (public — no auth required).
 */
router.get('/invitations/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or expired.' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: `Invitation has already been ${invitation.status}.` });
    }

    if (new Date() > invitation.expiresAt) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return res.status(400).json({ error: 'Invitation has expired.' });
    }

    res.json({
      valid: true,
      email: invitation.email,
      companyName: invitation.companyName,
      role: invitation.role,
      branchName: invitation.branchName,
      invitedByName: invitation.invitedByName,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error('Verify Invitation Error:', error);
    res.status(500).json({ error: 'Failed to verify invitation.' });
  }
});

/**
 * POST /api/team/invitations/accept/:token
 * Accept an invitation — joins the user to the organization.
 */
router.post('/invitations/accept/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { firebaseUid, email, displayName, photoURL } = req.body;

    if (!firebaseUid || !email) {
      return res.status(400).json({ error: 'User credentials are required.' });
    }

    const invitation = await Invitation.findOne({ token, status: 'pending' });
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found, expired, or already used.' });
    }

    if (new Date() > invitation.expiresAt) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return res.status(400).json({ error: 'Invitation has expired.' });
    }

    let user = await User.findOne({ firebaseUid });
    if (!user) {
      user = await User.create({
        firebaseUid,
        email: email.toLowerCase(),
        displayName: displayName || email.split('@')[0],
        photoURL: photoURL || '',
        companyId: invitation.companyId,
        role: invitation.role,
        status: 'Active',
      });
    } else {
      user.companyId = invitation.companyId;
      user.role = invitation.role;
      await user.save();
    }

    await Membership.findOneAndUpdate(
      { userId: firebaseUid, companyId: invitation.companyId },
      {
        userId: firebaseUid,
        companyId: invitation.companyId,
        role: invitation.role,
        branchId: invitation.branchId,
        status: 'active',
        invitedBy: invitation.invitedBy,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = firebaseUid;
    await invitation.save();

    const org = await Organization.findOne({ companyId: invitation.companyId });

    await Audit.create({
      companyId: invitation.companyId,
      action: 'INVITATION_ACCEPTED',
      userEmail: email,
      details: `${displayName || email} accepted invitation as ${invitation.role}`,
    });

    res.json({
      success: true,
      organization: org,
      role: invitation.role,
      branchId: invitation.branchId,
    });
  } catch (error) {
    console.error('Accept Invitation Error:', error);
    res.status(500).json({ error: 'Failed to accept invitation.' });
  }
});

router.use(enforceTenantIsolation);

// ─── Team Members ─────────────────────────────────────────────────────────────

/**
 * GET /api/team/members
 * List all members of the current organization.
 */
router.get('/members', requireRole(['Owner', 'Admin', 'Manager']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const memberships = await Membership.find({ companyId }).sort({ createdAt: 1 });

    // Enrich with user details
    const members = await Promise.all(memberships.map(async (m) => {
      const user = await User.findOne({ firebaseUid: m.userId });
      return {
        membershipId: m._id,
        userId: m.userId,
        companyId: m.companyId,
        role: m.role,
        branchId: m.branchId,
        status: m.status,
        joinedAt: m.joinedAt,
        displayName: user?.displayName || 'Unknown',
        email: user?.email || '',
        photoURL: user?.photoURL || '',
        phone: user?.phone || '',
        lastLogin: user?.lastLogin || null,
      };
    }));

    res.json({ members, total: members.length });
  } catch (error) {
    console.error('List Members Error:', error);
    res.status(500).json({ error: 'Failed to fetch team members.' });
  }
});

/**
 * PATCH /api/team/members/:userId
 * Update a member's role or branch (Owner/Admin only).
 */
router.patch('/members/:userId', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { userId } = req.params;
    const { role, branchId, status } = req.body;

    // Prevent changing the Owner's role
    const targetMembership = await Membership.findOne({ companyId, userId });
    if (!targetMembership) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    if (targetMembership.role === 'Owner' && role && role !== 'Owner') {
      return res.status(403).json({ error: 'Cannot change the Owner\'s role.' });
    }

    const updates = {};
    if (role) updates.role = role;
    if (branchId !== undefined) updates.branchId = branchId;
    if (status) updates.status = status;

    const updated = await Membership.findOneAndUpdate(
      { companyId, userId },
      { $set: updates },
      { new: true }
    );

    // Also sync role to User model
    if (role) {
      await User.findOneAndUpdate({ firebaseUid: userId }, { $set: { role } });
    }

    await Audit.create({
      companyId,
      action: 'MEMBER_UPDATED',
      userEmail: req.user.email,
      details: `Updated member ${userId}: ${JSON.stringify(updates)}`,
    });

    res.json({ membership: updated });
  } catch (error) {
    console.error('Update Member Error:', error);
    res.status(500).json({ error: 'Failed to update member.' });
  }
});

/**
 * DELETE /api/team/members/:userId
 * Remove a member from the organization (Owner/Admin only).
 */
router.delete('/members/:userId', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { userId } = req.params;

    const membership = await Membership.findOne({ companyId, userId });
    if (!membership) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    if (membership.role === 'Owner') {
      return res.status(403).json({ error: 'Cannot remove the organization owner.' });
    }

    await Membership.deleteOne({ companyId, userId });

    // Clear companyId from User record
    await User.findOneAndUpdate({ firebaseUid: userId }, { $set: { companyId: '', role: 'Employee' } });

    await Audit.create({
      companyId,
      action: 'MEMBER_REMOVED',
      userEmail: req.user.email,
      details: `Removed member ${userId} from organization.`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove Member Error:', error);
    res.status(500).json({ error: 'Failed to remove member.' });
  }
});

// ─── Invitations ──────────────────────────────────────────────────────────────

/**
 * POST /api/team/invitations
 * Create an invitation to join the organization.
 */
router.post('/invitations', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { email, role, branchId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const existingMembership = await Membership.findOne({ companyId, userId: existingUser.firebaseUid });
      if (existingMembership) {
        return res.status(409).json({ error: 'This user is already a member of your organization.' });
      }
    }

    // Check for pending invitation to same email
    const existingInvite = await Invitation.findOne({
      companyId, email: email.toLowerCase(), status: 'pending'
    });
    if (existingInvite) {
      return res.status(409).json({ error: 'An invitation is already pending for this email.' });
    }

    const org = await Organization.findOne({ companyId });
    const inviter = await User.findOne({ firebaseUid: req.user.uid });

    const token = Invitation.generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      companyId,
      companyName: org?.name || 'Organization',
      role: role || 'Employee',
      branchId: branchId || null,
      token,
      invitedBy: req.user.uid,
      invitedByName: inviter?.displayName || req.user.email,
      expiresAt,
    });

    const origin = req.headers.origin || process.env.FRONTEND_URL || (req.headers.host ? `${req.protocol || 'https'}://${req.headers.host}` : null);
    if (!origin) {
      return res.status(500).json({ error: 'FRONTEND_URL is required to generate invitation links.' });
    }
    const inviteUrl = `${origin}/invite/${token}`;


    await Audit.create({
      companyId,
      action: 'INVITATION_SENT',
      userEmail: req.user.email,
      details: `Invited ${email} as ${role || 'Employee'}`,
    });

    res.status(201).json({
      invitation,
      inviteUrl,
    });
  } catch (error) {
    console.error('Create Invitation Error:', error);
    res.status(500).json({ error: 'Failed to create invitation.' });
  }
});

/**
 * GET /api/team/invitations
 * List all invitations for the current organization.
 */
router.get('/invitations', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const invitations = await Invitation.find({ companyId }).sort({ createdAt: -1 });
    res.json({ invitations });
  } catch (error) {
    console.error('List Invitations Error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations.' });
  }
});

/**
 * DELETE /api/team/invitations/:id
 * Revoke a pending invitation (Owner/Admin only).
 */
router.delete('/invitations/:id', requireRole(['Owner', 'Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findByIdAndUpdate(id, { status: 'revoked' }, { new: true });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }

    await Audit.create({
      companyId: req.tenantId,
      action: 'INVITATION_REVOKED',
      userEmail: req.user.email,
      details: `Revoked invitation for ${invitation.email}`,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Revoke Invitation Error:', error);
    res.status(500).json({ error: 'Failed to revoke invitation.' });
  }
});

export default router;
