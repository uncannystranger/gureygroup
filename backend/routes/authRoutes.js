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
import { verifyFirebaseIdToken } from '../services/firebaseTokenVerifier.js';
import { resolveWorkspace } from '../services/workspace.js';
import {
  issueVerificationChallenge,
  consumeVerificationToken,
  markEmailVerified,
  VERIFICATION_RESULT,
} from '../services/emailVerification.js';
import { getMailerStatus } from '../services/mailer.js';
import { getPermissionsForRole } from '../rbac/permissions.js';

const router = express.Router();

/**
 * The employee record carries a smaller profile surface than a full user, so
 * only the fields it actually models are written to it.
 */
const EMPLOYEE_PROFILE_FIELDS = ['displayName', 'photoURL'];
const pickEmployeeFields = (updates) => Object.fromEntries(
  Object.entries(updates).filter(([key]) => EMPLOYEE_PROFILE_FIELDS.includes(key))
);

/**
 * POST /api/auth/google
 * Exchange a verified Firebase ID token for a workspace session.
 *
 * The caller's identity is taken *only* from the cryptographically verified
 * ID token. Body-supplied uid/email are ignored — trusting them would let
 * anyone mint an Owner session for any address they can guess.
 */
router.post('/google', async (req, res) => {
  try {
    let identity;
    try {
      identity = await verifyFirebaseIdToken(req.body?.idToken);
    } catch (verifyError) {
      return res.status(verifyError.status || 401).json({ error: verifyError.message });
    }

    const firebaseUid = identity.uid;
    const email = identity.email;
    const displayName = identity.name || req.body?.displayName || email.split('@')[0];
    const photoURL = identity.picture || req.body?.photoURL || '';

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
        permissions: getPermissionsForRole('Owner'),
        emailVerified: Boolean(identity.emailVerified),
        emailVerifiedAt: identity.emailVerified ? new Date() : null,
        emailVerificationMethod: identity.emailVerified ? 'provider' : null,
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
      // The verified email is authoritative. If Firebase issued a new uid for
      // the same verified address (account recreated), re-bind the record and
      // its membership so downstream uid lookups stay consistent.
      if (user.firebaseUid !== firebaseUid) {
        await Membership.updateMany({ userId: user.firebaseUid }, { $set: { userId: firebaseUid } });
        user.firebaseUid = firebaseUid;
      }
      const activeMembership = await Membership.findOne({ userId: user.firebaseUid, status: 'active' }).sort({ updatedAt: -1 });
      if (activeMembership) {
        user.companyId = activeMembership.companyId;
        user.role = activeMembership.role;
      }
      company = await resolveWorkspace(user.companyId);
      // Sync photoURL from Firebase Auth if user doesn't have a custom one yet
      if (photoURL && (!user.photoURL || user.photoURL === '')) {
        user.photoURL = photoURL;
      }
      // Google (and any provider that asserts email_verified on a signed token)
      // is proof enough for the address itself. We persist that decision so the
      // rest of the system reads one authoritative flag.
      if (identity.emailVerified && !user.emailVerified) {
        user.emailVerified = true;
        user.emailVerifiedAt = new Date();
        user.emailVerificationMethod = 'provider';
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
        emailVerified: Boolean(user.emailVerified),
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
        emailVerified: Boolean(user.emailVerified),
        role: membership?.role || user.role,
        permissions: membership?.permissions || user.permissions || [],
        companyId: membership?.companyId || user.companyId
      },
      company
    });

  } catch (error) {
    console.error('API Google Auth Error:', error);
    res.status(500).json({
      error: 'Internal Server Error during auth sync',
      message: process.env.NODE_ENV === 'production' ? 'Authentication sync failed. Please try again.' : error.message,
    });
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
    const company = await resolveWorkspace(companyId);

    if (!user || !membership || !company) {
      return res.status(404).json({ error: 'Authenticated workspace could not be resolved.' });
    }

    res.json({ user, company, membership });
  } catch (error) {
    console.error('API Auth Me Error:', error);
    res.status(500).json({
      error: 'Failed to resolve session context',
      message: process.env.NODE_ENV === 'production' ? 'Unable to retrieve user workspace.' : error.message,
    });
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
    const { uid, accountType } = req.user;
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

    // An avatar must be a reference, never the image itself. Inlining a data:
    // URI here put megabytes into the user document and into every subsequent
    // /auth/me response, and blew the JSON body limit on save.
    if (typeof updates.photoURL === 'string' && updates.photoURL.startsWith('data:')) {
      return res.status(400).json({
        error: 'Upload the image to /api/uploads first, then save the returned URL.',
        code: 'INLINE_IMAGE_REJECTED',
      });
    }
    if (typeof updates.photoURL === 'string' && updates.photoURL.length > 2048) {
      return res.status(400).json({ error: 'That image URL is too long.', code: 'PHOTO_URL_TOO_LONG' });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    // Employees live in their own collection. The previous version only looked
    // in `User`, so every employee profile save failed with 404 and their
    // avatar silently never persisted.
    const isEmployee = accountType === 'employee';
    const account = isEmployee
      ? await EmployeeMember.findOneAndUpdate(
          { employeeId: uid },
          { $set: pickEmployeeFields(updates) },
          { new: true, runValidators: true }
        )
      : await User.findOneAndUpdate(
          { firebaseUid: uid },
          { $set: updates },
          { new: true, runValidators: true }
        );

    if (!account) return res.status(404).json({ error: 'Account not found' });

    await Audit.create({
      companyId: account.companyId,
      action: 'PROFILE_UPDATED',
      userEmail: account.email,
      details: `Profile fields updated: ${Object.keys(updates).join(', ')}`
    });

    res.json({
      success: true,
      user: {
        uid: isEmployee ? account.employeeId : account.firebaseUid,
        email: account.email,
        displayName: account.displayName,
        photoURL: account.photoURL,
        role: account.role,
        companyId: account.companyId,
        accountType: isEmployee ? 'employee' : 'owner',
        emailVerified: Boolean(account.emailVerified),
        ...updates
      }
    });

  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/auth/verification/status
 * The authoritative verification state for the signed-in account.
 */
router.get('/verification/status', enforceTenantIsolation, async (req, res) => {
  try {
    const account = req.user.accountType === 'employee'
      ? await EmployeeMember.findOne({ employeeId: req.user.uid })
      : await User.findOne({ firebaseUid: req.user.uid });

    if (!account) return res.status(404).json({ error: 'Account not found.' });

    res.json({
      email: account.email,
      emailVerified: Boolean(account.emailVerified),
      verifiedAt: account.emailVerifiedAt || null,
      method: account.emailVerificationMethod || null,
      mailer: getMailerStatus().transport,
    });
  } catch (error) {
    console.error('Verification Status Error:', error);
    res.status(500).json({ error: 'Unable to read verification status.' });
  }
});

/**
 * POST /api/auth/verification/request
 * Issue (or re-issue) a verification link for the signed-in account.
 */
router.post('/verification/request', enforceTenantIsolation, async (req, res) => {
  try {
    const account = req.user.accountType === 'employee'
      ? await EmployeeMember.findOne({ employeeId: req.user.uid })
      : await User.findOne({ firebaseUid: req.user.uid });

    if (!account) return res.status(404).json({ error: 'Account not found.' });
    if (account.emailVerified) {
      return res.json({ alreadyVerified: true, email: account.email });
    }

    const challenge = await issueVerificationChallenge({
      userKey: req.user.uid,
      accountType: req.user.accountType === 'employee' ? 'employee' : 'owner',
      email: account.email,
      ip: req.ip || '',
    });

    await Audit.create({
      companyId: req.tenantId,
      action: 'EMAIL_VERIFICATION_REQUESTED',
      userEmail: account.email,
      details: `Verification link issued (delivery: ${challenge.delivery.transport}).`,
    });

    res.json({
      sent: true,
      email: account.email,
      delivered: challenge.delivery.delivered,
      transport: challenge.delivery.transport,
      // Present only outside production, so the flow can be completed locally
      // when no SMTP server is configured.
      ...(challenge.devToken ? { devToken: challenge.devToken, devLink: challenge.link } : {}),
    });
  } catch (error) {
    console.error('Verification Request Error:', error);
    res.status(500).json({ error: 'Unable to send a verification email right now.' });
  }
});

/**
 * POST /api/auth/verification/confirm
 * Public: exchanges a verification token for a verified account.
 * Deliberately unauthenticated — the link is opened from an email client and
 * the token itself is the proof.
 */
router.post('/verification/confirm', async (req, res) => {
  try {
    const { token } = req.body || {};
    const { result, email } = await consumeVerificationToken(token);

    const responses = {
      [VERIFICATION_RESULT.VERIFIED]: [200, { verified: true, status: result, email, message: 'Your email address is confirmed.' }],
      [VERIFICATION_RESULT.ALREADY_VERIFIED]: [200, { verified: true, status: result, email, message: 'This address was already confirmed.' }],
      [VERIFICATION_RESULT.EXPIRED]: [410, { verified: false, status: result, error: 'This verification link has expired. Request a new one to continue.' }],
      [VERIFICATION_RESULT.USED]: [409, { verified: false, status: result, error: 'This verification link has already been used. Request a new one to continue.' }],
      [VERIFICATION_RESULT.SUPERSEDED]: [409, { verified: false, status: result, error: 'A newer verification link was sent. Please open the most recent email.' }],
      [VERIFICATION_RESULT.INVALID]: [400, { verified: false, status: result, error: 'This verification link is not valid.' }],
    };

    const [status, body] = responses[result] || responses[VERIFICATION_RESULT.INVALID];
    return res.status(status).json(body);
  } catch (error) {
    console.error('Verification Confirm Error:', error);
    res.status(500).json({ error: 'Unable to confirm this verification link.' });
  }
});

export default router;
