import jwt from 'jsonwebtoken';
import '../config/env.js';
import Membership from '../models/Membership.js';
import Branch from '../models/Branch.js';
import User from '../models/User.js';
import EmployeeMember from '../models/EmployeeMember.js';

/**
 * Signing secrets must come from the environment. A committed fallback secret
 * would let anyone holding the source forge Owner tokens, so a missing secret
 * is a startup failure rather than a warning.
 */
const requireSecret = (name) => {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(
      `[Auth] ${name} is missing or too short. Set a random 64-byte hex value: ` +
      'node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }
  return value;
};

const JWT_SECRET = requireSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

/**
 * Middleware: Verify Auth Token & Enforce Tenant Isolation Scope
 *
 * Protected requests require a signed bearer token. Demo access is opt-in.
 */
export const enforceTenantIsolation = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const IS_PROD = process.env.NODE_ENV === 'production';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.ALLOW_DEMO_AUTH !== 'true' || IS_PROD) {
      return res.status(401).json({ error: 'Unauthorized: Bearer token required.' });
    }
    // Explicit local-only demo mode for development tooling.
    const companyId = req.headers['x-company-id'];
    if (!companyId) {
      return res.status(401).json({ error: 'Unauthorized: x-company-id header required in development mode.' });
    }
    req.tenantId = companyId;
    req.user = {
      uid: 'usr_demo',
      email: 'owner@gureygroup.com',
      role: 'Owner',
      companyId,
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const requestedTenant = req.headers['x-company-id'];
    const tokenTenant = decoded.companyId;
    const tenantId = requestedTenant || tokenTenant;

    if (!tenantId) {
      return res.status(403).json({ error: 'Access Denied: Missing valid company workspace binding.' });
    }

    if (requestedTenant && tokenTenant && requestedTenant !== tokenTenant) {
      const membership = await Membership.findOne({
        userId: decoded.uid,
        companyId: requestedTenant,
        status: 'active',
      });
      if (!membership) {
        return res.status(403).json({ error: 'Forbidden: User is not a member of this organization.' });
      }
      req.tenantId = requestedTenant;
      req.membership = membership;
      req.user = {
        ...decoded,
        companyId: requestedTenant,
        role: membership.role,
        permissions: membership.permissions || [],
      };
      return next();
    }

    const membership = await Membership.findOne({
      userId: decoded.uid,
      companyId: tenantId,
      status: 'active',
    });

    if (!membership) {
      return res.status(403).json({ error: 'Forbidden: Active organization membership is required.' });
    }

    req.tenantId = tenantId;
    req.membership = membership;
    req.user = {
      ...decoded,
      companyId: tenantId,
      role: membership.role,
      permissions: membership.permissions || decoded.permissions || [],
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Access token has expired. Please refresh.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid access token.' });
    }
    console.error('[Auth Middleware Error]', err);
    return res.status(500).json({
      error: 'Authentication verification service error',
      message: process.env.NODE_ENV === 'production' ? 'Authentication failed due to internal service error.' : err.message,
    });
  }
};

/**
 * Middleware: require a confirmed email address.
 *
 * Authentication proves who the caller is; it does not prove they control the
 * address. The state is read from the database on every request rather than
 * from the JWT, so revoking verification takes effect immediately and a token
 * minted before verification cannot be replayed for access afterwards.
 */
export const requireVerifiedEmail = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No authenticated user.' });
    }

    const account = req.user.accountType === 'employee'
      ? await EmployeeMember.findOne({ employeeId: req.user.uid }).select('emailVerified email')
      : await User.findOne({ firebaseUid: req.user.uid }).select('emailVerified email');

    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (!account.emailVerified) {
      return res.status(403).json({
        error: 'Confirm your email address to continue.',
        // The client keys off this code to route to the verification screen
        // rather than showing a generic permission error.
        code: 'EMAIL_NOT_VERIFIED',
        email: account.email,
      });
    }

    req.emailVerified = true;
    next();
  } catch (error) {
    console.error('[Verification Guard Error]', error);
    return res.status(500).json({ error: 'Unable to verify account status.' });
  }
};

/**
 * Middleware: Role Guard
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No authenticated user.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Role '${req.user.role}' cannot access this resource. Required: ${allowedRoles.join(', ')}.`,
      });
    }
    next();
  };
};

export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No authenticated user.' });
    }
    const permissions = req.user.permissions || [];
    const employeeRestrictedPermissions = [
      'org:edit', 'org:delete', 'org:manage_subscription',
      'team:view', 'team:invite', 'team:remove', 'team:edit_roles',
      'settings:view', 'settings:manage',
    ];
    if (req.user.accountType === 'employee' && employeeRestrictedPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden: Employee accounts cannot access owner administration.' });
    }
    if (req.user.role === 'Owner' || permissions.includes('ALL') || permissions.includes(permission)) {
      return next();
    }
    return res.status(403).json({ error: `Forbidden: Missing permission '${permission}'.` });
  };
};

/**
 * Resolves and verifies a requested branch. Owners and Admins may work across
 * their organization; every other role is locked to its membership branch.
 */
export const requireBranchAccess = async (req, branchId) => {
  if (!branchId) {
    const error = new Error('A branch workspace must be selected.');
    error.status = 400;
    throw error;
  }
  const branch = await Branch.findOne({ _id: branchId, companyId: req.tenantId, status: 'active' }).select('_id');
  if (!branch) {
    const error = new Error('Selected branch is not active or does not belong to this organization.');
    error.status = 403;
    throw error;
  }
  if (['Owner', 'Admin'].includes(req.user.role)) return branchId;
  if (!req.membership?.branchId || req.membership.branchId !== branchId) {
    const error = new Error('Forbidden: You can only access your assigned branch.');
    error.status = 403;
    throw error;
  }
  return branchId;
};

export { JWT_SECRET, JWT_REFRESH_SECRET };
