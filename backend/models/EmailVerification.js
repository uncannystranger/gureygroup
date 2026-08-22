import crypto from 'node:crypto';
import mongoose from 'mongoose';

/**
 * A single-use, expiring email-verification challenge.
 *
 * Only the SHA-256 hash of the token is stored. The raw token exists solely
 * inside the link that is emailed to the user, so a database leak cannot be
 * replayed to verify somebody else's address.
 */
const emailVerificationSchema = new mongoose.Schema({
  // The account this challenge belongs to (User.firebaseUid or EmployeeMember.employeeId)
  userKey:    { type: String, required: true, index: true },
  accountType:{ type: String, enum: ['owner', 'employee'], default: 'owner' },
  email:      { type: String, required: true, lowercase: true, trim: true, index: true },
  tokenHash:  { type: String, required: true, unique: true, index: true },
  expiresAt:  { type: Date, required: true },
  consumedAt: { type: Date, default: null },
  // Superseded when a newer link is requested, so old links stop working.
  supersededAt: { type: Date, default: null },
  requestedIp:{ type: String, default: '' },
}, { timestamps: true });

// Expired documents are reaped automatically; consumed ones are kept until then
// so "this link was already used" can be reported accurately rather than as
// "invalid link".
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** 32 random bytes, URL-safe. */
export const generateVerificationToken = () => crypto.randomBytes(32).toString('base64url');

export const hashVerificationToken = (token) =>
  crypto.createHash('sha256').update(String(token)).digest('hex');

export default mongoose.models.EmailVerification
  || mongoose.model('EmailVerification', emailVerificationSchema);
