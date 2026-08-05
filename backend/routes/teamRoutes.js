import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Membership from '../models/Membership.js';
import Invitation from '../models/Invitation.js';
import User from '../models/User.js';
import EmployeeMember from '../models/EmployeeMember.js';
import Organization from '../models/Organization.js';
import Company from '../models/Company.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requirePermission, JWT_SECRET } from '../middleware/auth.js';
import { normalizePermissions, getPermissionsForRole } from '../rbac/permissions.js';

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
      employeeName: invitation.employeeName,
      companyName: invitation.companyName,
      organizationName: invitation.companyName,
      role: invitation.role,
      permissions: invitation.permissions?.length ? invitation.permissions : getPermissionsForRole(invitation.role),
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
    const { email, displayName, photoURL, pin, password, activationCode } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Invitation email is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Employee password must be at least 6 characters long.' });
    }

    const invitation = await Invitation.findOne({ token, status: 'pending' }).select('+activationCode');
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found, expired, or already used.' });
    }

    if (new Date() > invitation.expiresAt) {
      await Invitation.findByIdAndUpdate(invitation._id, { status: 'expired' });
      return res.status(400).json({ error: 'Invitation has expired.' });
    }

    if (invitation.email && invitation.email !== email.toLowerCase()) {
      return res.status(403).json({ error: 'This invitation was issued for a different email address.' });
    }

    if (!activationCode || activationCode !== invitation.activationCode) {
      return res.status(400).json({ error: 'The activation code is incorrect.' });
    }

    const hashedPin = pin ? await bcrypt.hash(pin, 12) : '';
    const passwordHash = await bcrypt.hash(password, 12);

    const permissions = normalizePermissions(invitation.role, invitation.permissions);
    const org = await Organization.findOne({ companyId: invitation.companyId })
      || await Company.findOne({ companyId: invitation.companyId });
    if (!org) {
      return res.status(404).json({ error: 'The organization for this invitation no longer exists.' });
    }
    const existingEmployee = await EmployeeMember.findOne({
      email: email.toLowerCase(),
      companyId: invitation.companyId,
    });
    if (existingEmployee) {
      return res.status(409).json({ error: 'An employee account already exists for this invitation email in this workspace.' });
    }
    const employee = await EmployeeMember.create({
      employeeId: `emp_${Invitation.generateToken().slice(0, 24)}`,
      email: email.toLowerCase(),
      displayName: displayName || invitation.employeeName || email.split('@')[0],
      passwordHash,
      photoURL: photoURL || '', companyId: invitation.companyId, branchId: invitation.branchId || null,
      organizationId: org._id?.toString() || invitation.companyId,
      ownerId: org.ownerId || org.ownerUid || invitation.invitedBy, role: invitation.role,
      permissions, securityPinHash: hashedPin, invitedBy: invitation.invitedBy,
    });

    const membership = await Membership.findOneAndUpdate(
      { userId: employee.employeeId, companyId: invitation.companyId },
      {
        userId: employee.employeeId,
        companyId: invitation.companyId,
        role: invitation.role,
        branchId: invitation.branchId,
        permissions,
        securityPinHash: hashedPin,
        status: 'active',
        invitedBy: invitation.invitedBy,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = employee.employeeId;
    invitation.activatedAt = new Date();
    invitation.activationCodeVerified = true;
    await invitation.save();

    const authToken = jwt.sign(
      {
        uid: employee.employeeId,
        email: employee.email,
        accountType: 'employee',
        companyId: invitation.companyId,
        role: membership.role,
        permissions: membership.permissions || [],
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await Audit.create({
      companyId: invitation.companyId,
      action: 'INVITATION_ACCEPTED',
      userEmail: email,
      details: `${displayName || email} accepted invitation as ${invitation.role}`,
    });

    res.json({
      success: true,
      organization: org,
      token: authToken,
      user: {
        uid: employee.employeeId,
        email: employee.email,
        displayName: employee.displayName,
        photoURL: employee.photoURL,
        role: membership.role,
        permissions: membership.permissions || [],
        companyId: invitation.companyId,
        accountType: 'employee',
      },
      role: invitation.role,
      permissions: membership.permissions || [],
      branchId: invitation.branchId,
    });
  } catch (error) {
    console.error('Accept Invitation Error:', error);
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'This invitation has already created an employee account.' });
    }
    res.status(500).json({
      error: 'Invitation acceptance failed.',
      message: process.env.NODE_ENV === 'production'
        ? 'The invitation could not be completed. Please try again.'
        : error.message,
    });
  }
});

/** Employee credentials are intentionally separate from Firebase owner auth. */
router.post('/auth/employee-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const employee = await EmployeeMember.findOne({ email: email.toLowerCase(), status: 'active' }).select('+passwordHash');
    if (!employee || !(await bcrypt.compare(password, employee.passwordHash))) {
      return res.status(401).json({ error: 'Invalid employee email or password.' });
    }
    const membership = await Membership.findOne({ userId: employee.employeeId, companyId: employee.companyId, status: 'active' });
    if (!membership) return res.status(403).json({ error: 'Your organization membership is inactive.' });
    const token = jwt.sign({ uid: employee.employeeId, email: employee.email, accountType: 'employee', companyId: employee.companyId, role: membership.role, permissions: membership.permissions || [] }, JWT_SECRET, { expiresIn: '7d' });
    const organization = await Organization.findOne({ companyId: employee.companyId })
      || await Company.findOne({ companyId: employee.companyId });
    if (!organization) return res.status(404).json({ error: 'Your organization workspace could not be found.' });
    res.json({ token, organization, user: { uid: employee.employeeId, email: employee.email, displayName: employee.displayName, photoURL: employee.photoURL, accountType: 'employee', authType: 'employee', emailVerified: true, requiresEmailVerification: false, role: membership.role, permissions: membership.permissions || [], companyId: membership.companyId } });
  } catch (error) {
    console.error('Employee Login Error:', error);
    res.status(500).json({ error: 'Employee login is temporarily unavailable.' });
  }
});

router.use(enforceTenantIsolation);

// ─── Team Members ─────────────────────────────────────────────────────────────

/**
 * GET /api/team/members
 * List all members of the current organization.
 */
router.get('/members', requirePermission('team:view'), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const memberships = await Membership.find({ companyId }).sort({ createdAt: 1 });

    // Enrich with user details
    const members = await Promise.all(memberships.map(async (m) => {
      const user = await User.findOne({ firebaseUid: m.userId });
      const employee = user ? null : await EmployeeMember.findOne({ employeeId: m.userId });
      const profile = user || employee;
      return {
        membershipId: m._id,
        userId: m.userId,
        companyId: m.companyId,
        role: m.role,
        permissions: m.permissions || [],
        branchId: m.branchId,
        status: m.status,
        joinedAt: m.joinedAt,
        displayName: profile?.displayName || 'Unknown',
        email: profile?.email || '',
        photoURL: profile?.photoURL || '',
        phone: profile?.phone || '',
        lastLogin: profile?.lastLogin || null,
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
router.patch('/members/:userId', requirePermission('team:edit_roles'), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { userId } = req.params;
    const { role, branchId, status, permissions } = req.body;

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
    if (permissions !== undefined) updates.permissions = normalizePermissions(role || targetMembership.role, permissions);

    const updated = await Membership.findOneAndUpdate(
      { companyId, userId },
      { $set: updates },
      { new: true }
    );

    // Also sync role to User model
    if (role || permissions !== undefined) {
      await User.findOneAndUpdate({ firebaseUid: userId }, { $set: { ...(role ? { role } : {}) } });
      await EmployeeMember.findOneAndUpdate(
        { employeeId: userId, companyId },
        { $set: { ...(role ? { role } : {}), ...(permissions !== undefined ? { permissions: updates.permissions } : {}) } }
      );
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
router.delete('/members/:userId', requirePermission('team:remove'), async (req, res) => {
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
    await EmployeeMember.findOneAndUpdate({ employeeId: userId, companyId }, { $set: { status: 'suspended' } });

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
router.post('/invitations', requirePermission('team:invite'), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const { email, employeeName, role, branchId, permissions } = req.body;

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
    const activationCode = Invitation.generateActivationCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const assignedRole = role || 'Employee';
    const assignedPermissions = normalizePermissions(assignedRole, permissions);

    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      employeeName: employeeName || '',
      companyId,
      companyName: org?.name || 'Organization',
      role: assignedRole,
      branchId: branchId || null,
      permissions: assignedPermissions,
      token,
      activationCode,
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
      details: `Invited ${email} as ${assignedRole}`,
    });

    res.status(201).json({
      invitation: { ...invitation.toObject(), activationCode },
      inviteUrl,
      activationCode,
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
router.get('/invitations', requirePermission('team:invite'), async (req, res) => {
  try {
    const companyId = req.tenantId;
    const invitations = await Invitation.find({ companyId }).select('+activationCode').sort({ createdAt: -1 });
    res.json({ invitations });
  } catch (error) {
    console.error('List Invitations Error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations.' });
  }
});

router.post('/invitations/:id/regenerate-code', requirePermission('team:invite'), async (req, res) => {
  try {
    const activationCode = Invitation.generateActivationCode();
    const invitation = await Invitation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId, status: 'pending' },
      { activationCode, activationCodeVerified: false },
      { new: true }
    ).select('+activationCode');
    if (!invitation) return res.status(404).json({ error: 'Pending invitation not found.' });
    res.json({ activationCode, invitation });
  } catch (error) {
    console.error('Regenerate Invitation Code Error:', error);
    res.status(500).json({ error: 'Failed to regenerate activation code.' });
  }
});

/**
 * DELETE /api/team/invitations/:id
 * Revoke a pending invitation (Owner/Admin only).
 */
router.delete('/invitations/:id', requirePermission('team:invite'), async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findOneAndUpdate(
      { _id: id, companyId: req.tenantId },
      { status: 'revoked' },
      { new: true }
    );

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
