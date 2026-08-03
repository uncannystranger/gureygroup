import fs from 'fs';
import path from 'path';

// In-memory threat event log for real-time monitoring
const securityEvents = [];
const MAX_EVENTS = 200;

/**
 * Log threat activity and suspicious requests
 */
export function logSecurityThreat(req, threatType, details = '') {
  const event = {
    id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    method: req.method,
    url: req.originalUrl,
    threatType,
    details
  };

  securityEvents.unshift(event);
  if (securityEvents.length > MAX_EVENTS) {
    securityEvents.pop();
  }

  console.warn(`[SECURITY SHIELD WARNING] [${event.threatType}] IP: ${event.ip} Path: ${event.url} - ${details}`);
}

/**
 * Get recorded security audit events
 */
export function getSecurityAuditLogs() {
  return {
    totalEventsLogged: securityEvents.length,
    threatIndexScore: Math.max(0, 100 - securityEvents.filter(e => {
      const isRecent = new Date() - new Date(e.timestamp) < 3600000;
      return isRecent;
    }).length * 5),
    events: securityEvents
  };
}

/**
 * Recursively sanitize objects against MongoDB injection operators ($ and .)
 */
function sanitizeInput(data) {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Strip script tags and dangerous HTML triggers
    let sanitized = data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/onerror\s*=/gi, '');
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }

  if (typeof data === 'object') {
    const cleanObj = {};
    for (const key of Object.keys(data)) {
      // Reject MongoDB operator injection keys starting with $ or containing .
      if (key.startsWith('$') || key.includes('.')) {
        console.warn(`[SECURITY SHIELD] Blocked MongoDB operator key injection: ${key}`);
        continue;
      }
      cleanObj[key] = sanitizeInput(data[key]);
    }
    return cleanObj;
  }

  return data;
}

/**
 * Express Middleware: Security Shield Protection
 */
export const securityShieldMiddleware = (req, res, next) => {
  // 1. Detect Path Traversal Attacks
  if (req.originalUrl.includes('../') || req.originalUrl.includes('..\\')) {
    logSecurityThreat(req, 'PATH_TRAVERSAL_ATTACK', 'Directory traversal attempt detected in URL');
    return res.status(400).json({ error: 'Security Violation: Invalid request path.' });
  }

  // 2. Detect Malicious Attack Patterns in Query & Headers
  const urlLower = req.originalUrl.toLowerCase();
  const dangerousPatterns = [
    '<script', 'eval(', 'union select', 'drop table', 'exec(', 'cmd.exe', '/bin/sh', 'etc/passwd'
  ];

  for (const pattern of dangerousPatterns) {
    if (urlLower.includes(pattern)) {
      logSecurityThreat(req, 'MALICIOUS_PAYLOAD_DETECTED', `Pattern matched: ${pattern}`);
      return res.status(403).json({ error: 'Security Violation: Malicious payload blocked.' });
    }
  }

  // 3. Sanitize req.body, req.query, req.params
  if (req.body) req.body = sanitizeInput(req.body);
  if (req.query) req.query = sanitizeInput(req.query);
  if (req.params) req.params = sanitizeInput(req.params);

  // 4. Set Hardened Security Headers on Response
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
};
