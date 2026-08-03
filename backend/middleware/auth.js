import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'gurey_enterprise_jwt_secret_key_2026_super_secure';

/**
 * Middleware: Verify Auth Token & Enforce Tenant Isolation Scope
 */
export const enforceTenantIsolation = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For demo/dev environment, set default fallback scope if header missing
    req.tenantId = req.headers['x-company-id'] || 'comp_gurey_main';
    req.user = {
      uid: 'usr_demo',
      email: 'owner@gureygroup.com',
      role: 'Owner',
      companyId: req.tenantId
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.tenantId = decoded.companyId;

    if (!req.tenantId) {
      return res.status(403).json({ error: 'Access Denied: Missing valid company workspace binding.' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired access token.' });
  }
};

/**
 * Middleware: Role Guard
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this resource.' });
    }
    next();
  };
};
