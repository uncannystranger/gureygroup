import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Organization from '../models/Organization.js';
import Membership from '../models/Membership.js';
import Invitation from '../models/Invitation.js';
import Audit from '../models/Audit.js';
import EmployeeMember from '../models/EmployeeMember.js';
import { enforceTenantIsolation, JWT_SECRET } from '../middleware/auth.js';
import { getPermissionsForRole } from '../rbac/permissions.js';

const router = express.Router();

/**
 * POST /api/auth/google
 * Synchronize Google OAuth User & Company Workspace
 */
router.post('/google', async (req, res) => {
  try {
    const { firebaseUid, email, displayName, photoURL } = req.body;
    
    if (!email || !firebaseUid) {
      return res.status(400).json({ error: 'Missing required credentials' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    let company;

    // Employee credentials belong to the isolated employee flow. Never allow
    // an invited employee email to be provisioned as a new owner via Firebase.
    const employeeAccount = await EmployeeMember.findOne({ email: email.toLowerCase() });
    if (employeeAccount && !user) {
      return res.status(403).json({ error: 'This email is an employee account. Please use Employee Login.' });
    }

    if (!user) {
      // 1 Gmail = 1 Company Rule
      const newCompanyId = `comp_gurey_${Date.now().toString(36)}`;
      company = await Company.create({
        companyId: newCompanyId,
        name: `${displayName ? displayName.split(' ')[0] : 'Gurey Group'} HQ`,
        ownerUid: firebaseUid,
        ownerEmail: email.toLowerCase(),
        subscriptionTier: 'Enterprise SaaS'
      });

      user = await User.create({
        firebaseUid,
        email: email.toLowerCase(),
        displayName: displayName || 'Store Owner',
        photoURL: photoURL || '',
        companyId: newCompanyId,
        role: 'Owner',
        permissions: getPermissionsForRole('Owner')
      });

      await Organization.findOneAndUpdate(
        { companyId: newCompanyId },
        {
          companyId: newCompanyId,
          name: company.name,
          ownerId: firebaseUid,
          ownerEmail: email.toLowerCase(),
          currency: 'USD',
          currencySymbol: '$',
          timezone: 'UTC',
          subscription: { plan: 'Enterprise', status: 'active' },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await Membership.findOneAndUpdate(
        { companyId: newCompanyId, userId: firebaseUid },
        {
          companyId: newCompanyId,
          userId: firebaseUid,
          role: 'Owner',
          permissions: getPermissionsForRole('Owner'),
          status: 'active',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await Audit.create({
        companyId: newCompanyId,
        action: 'COMPANY_INITIALIZED',
        userEmail: email,
        details: `Created new SaaS workspace for companyId: ${newCompanyId}`
      });
    } else {
      const activeMembership = await Membership.findOne({ userId: user.firebaseUid, status: 'active' }).sort({ updatedAt: -1 });
      if (activeMembership) {
        user.companyId = activeMembership.companyId;
        user.role = activeMembership.role;
      }
      company = await Company.findOne({ companyId: user.companyId })
        || await Organization.findOne({ companyId: user.companyId });
      // Sync photoURL from Firebase Auth if user doesn't have a custom one yet
      if (photoURL && (!user.photoURL || user.photoURL === '')) {
        user.photoURL = photoURL;
      }
      user.lastLogin = new Date();
      await user.save();
    }

    const membership = await Membership.findOne({
      userId: user.firebaseUid,
      companyId: user.companyId,
      status: 'active',
    });

    const token = jwt.sign(
      {
        uid: user.firebaseUid,
        email: user.email,
        accountType: 'owner',
        companyId: membership?.companyId || user.companyId,
        role: membership?.role || user.role,
        permissions: membership?.permissions || user.permissions || [],
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        uid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        accountType: 'owner',
        role: membership?.role || user.role,
        permissions: membership?.permissions || user.permissions || [],
        companyId: membership?.companyId || user.companyId
      },
      company
    });

  } catch (error) {
    console.error('API Google Auth Error:', error);
    res.status(500).json({ error: 'Internal Server Error during auth sync' });
  }
});

/**
 * GET /api/auth/me
 * Fetch current authenticated user & company context
 */
router.get('/me', enforceTenantIsolation, async (req, res) => {
  try {
    const { uid, companyId } = req.user;
    const user = await User.findOne({ firebaseUid: uid })
      || await EmployeeMember.findOne({ employeeId: uid });
    const membership = await Membership.findOne({
      userId: uid,
      companyId,
      status: 'active',
    });
    const company = await Company.findOne({ companyId })
      || await Organization.findOne({ companyId });

    if (!user || !membership || !company) {
      return res.status(404).json({ error: 'Authenticated workspace could not be resolved.' });
    }

    res.json({ user, company, membership });
  } catch (error) {
    res.status(401).json({ error: 'Session expired or invalid' });
  }
});

/**
 * PATCH /api/auth/profile
 * Update authenticated user's profile fields.
 * All writes are scoped to the JWT-authenticated user's own record —
 * a user can only update their own profile.
 */
router.patch('/profile', enforceTenantIsolation, async (req, res) => {
  try {
    const { uid } = req.user;
    if (!uid) return res.status(401).json({ error: 'Unauthorized' });

    // Allowed profile fields — prevent mass-assignment of sensitive fields
    const ALLOWED_FIELDS = [
      'displayName', 'firstName', 'lastName', 'photoURL',
      'phone', 'address', 'dateOfBirth', 'gender', 'jobTitle', 'businessName', 'country', 'city',
      'preferredLanguage', 'timezone', 'dateFormat', 'timeFormat',
      'currency', 'theme', 'accentColor', 'language',
      'emailNotifications', 'browserNotifications'
    ];

    const updates = {};
    ALLOWED_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    await Audit.create({
      companyId: user.companyId,
      action: 'PROFILE_UPDATED',
      userEmail: user.email,
      details: `Profile fields updated: ${Object.keys(updates).join(', ')}`
    });

    res.json({
      success: true,
      user: {
        uid: user.firebaseUid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        companyId: user.companyId,
        ...updates
      }
    });

  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
