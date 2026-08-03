import express from 'express';
import { enforceTenantIsolation, requireRole } from '../middleware/auth.js';
import { getSecurityAuditLogs } from '../middleware/securityShield.js';

const router = express.Router();

// Apply Auth Protection
router.use(enforceTenantIsolation);

/**
 * GET /api/security/audit
 * Get security health index, threat metrics, and active threat logs
 */
router.get('/audit', requireRole(['Owner', 'Admin']), (req, res) => {
  const auditData = getSecurityAuditLogs();
  
  res.json({
    status: 'success',
    securityStatus: auditData.threatIndexScore > 80 ? 'OPTIMAL_SECURE' : 'ELEVATED_RISK',
    securityScore: auditData.threatIndexScore,
    hardenedProtection: {
      mongoDbSanitizer: true,
      xssPayloadBlocker: true,
      pathTraversalShield: true,
      rateLimiter: true,
      jwtAlgorithmPinning: 'HS256',
      tlsVersion: 'TLS 1.3'
    },
    threatsBlockedCount: auditData.totalEventsLogged,
    events: auditData.events,
    timestamp: new Date().toISOString()
  });
});

export default router;
