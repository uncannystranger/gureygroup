import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  console.error('[Auth Middleware] FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}

/**
 * Middleware: Verify Auth Token & Enforce Tenant Isolation Scope
 *
 * In development without a token, a demo scope is applied.
 * In production (NODE_ENV=production), ALL requests MUST include a valid Bearer token.
 */
export const enforceTenantIsolation = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const IS_PROD = process.env.NODE_ENV === 'production';

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In production, reject unauthenticated requests entirely
    if (IS_PROD) {
      return res.status(401).json({ error: 'Unauthorized: Bearer token required.' });
    }
    // Dev/demo fallback: allow through with company-id header scope
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
    req.user = decoded;
    req.tenantId = decoded.companyId || req.headers['x-company-id'];

    if (!req.tenantId) {
      return res.status(403).json({ error: 'Access Denied: Missing valid company workspace binding.' });
    }

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

export { JWT_SECRET, JWT_REFRESH_SECRET };
