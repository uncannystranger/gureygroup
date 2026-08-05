import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Membership from '../models/Membership.js';
import Branch from '../models/Branch.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  console.error('[Auth Middleware] FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

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
    const decoded = jwt.verify(token, JWT_SECRET);
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
    return res.status(401).json({ error: 'Unauthorized: Invalid access token.' });
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
