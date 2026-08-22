import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

/**
 * Verifies Firebase Authentication ID tokens without requiring a service
 * account. Firebase signs ID tokens with rotating Google keys whose public
 * certificates are published; verifying the RS256 signature against those
 * certificates plus the issuer/audience/expiry claims is exactly the check
 * firebase-admin performs for `verifyIdToken`.
 */
const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let certCache = { keys: null, expiresAt: 0 };

const parseMaxAge = (cacheControl) => {
  const match = /max-age=(\d+)/.exec(cacheControl || '');
  return match ? Number(match[1]) * 1000 : 60 * 60 * 1000;
};

const fetchCertificates = async () => {
  if (certCache.keys && Date.now() < certCache.expiresAt) return certCache.keys;

  const response = await fetch(CERT_URL);
  if (!response.ok) {
    const error = new Error(`Unable to fetch Google signing certificates (${response.status}).`);
    error.status = 503;
    throw error;
  }
  const keys = await response.json();
  certCache = { keys, expiresAt: Date.now() + parseMaxAge(response.headers.get('cache-control')) };
  return keys;
};

export const isFirebaseVerificationConfigured = () => Boolean(process.env.FIREBASE_PROJECT_ID);

/**
 * @returns {Promise<{uid: string, email: string, emailVerified: boolean, name?: string, picture?: string}>}
 */
export const verifyFirebaseIdToken = async (idToken) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    const error = new Error('Server is not configured to verify Firebase identities. Set FIREBASE_PROJECT_ID.');
    error.status = 503;
    throw error;
  }
  if (!idToken || typeof idToken !== 'string') {
    const error = new Error('A Firebase ID token is required.');
    error.status = 401;
    throw error;
  }

  const decoded = jwt.decode(idToken, { complete: true });
  const kid = decoded?.header?.kid;
  if (!kid || decoded.header.alg !== 'RS256') {
    const error = new Error('Malformed Firebase ID token.');
    error.status = 401;
    throw error;
  }

  const certificates = await fetchCertificates();
  const certificate = certificates[kid];
  if (!certificate) {
    // Key rotation: drop the cache once and retry with fresh certificates.
    certCache = { keys: null, expiresAt: 0 };
    const refreshed = await fetchCertificates();
    if (!refreshed[kid]) {
      const error = new Error('Firebase ID token was signed with an unrecognised key.');
      error.status = 401;
      throw error;
    }
    return verifyWithCertificate(idToken, refreshed[kid], projectId);
  }

  return verifyWithCertificate(idToken, certificate, projectId);
};

const verifyWithCertificate = (idToken, certificate, projectId) => {
  const publicKey = crypto.createPublicKey(certificate);
  let claims;
  try {
    claims = jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });
  } catch (verifyError) {
    const error = new Error(
      verifyError.name === 'TokenExpiredError'
        ? 'Your sign-in session has expired. Please sign in again.'
        : 'Invalid Firebase ID token.'
    );
    error.status = 401;
    throw error;
  }

  if (!claims.sub || typeof claims.sub !== 'string') {
    const error = new Error('Firebase ID token is missing a subject.');
    error.status = 401;
    throw error;
  }
  if (!claims.email) {
    const error = new Error('Firebase ID token does not carry an email address.');
    error.status = 401;
    throw error;
  }

  return {
    uid: claims.sub,
    email: String(claims.email).toLowerCase(),
    emailVerified: Boolean(claims.email_verified),
    name: claims.name,
    picture: claims.picture,
    signInProvider: claims.firebase?.sign_in_provider,
  };
};
