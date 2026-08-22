import EmailVerification, {
  TOKEN_TTL_MS,
  generateVerificationToken,
  hashVerificationToken,
} from '../models/EmailVerification.js';
import User from '../models/User.js';
import EmployeeMember from '../models/EmployeeMember.js';
import { sendMail } from './mailer.js';

const appUrl = () =>
  (process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

/**
 * Issue a fresh verification link, invalidating any outstanding ones so a
 * resend cannot leave several usable links in circulation.
 */
export const issueVerificationChallenge = async ({ userKey, accountType = 'owner', email, ip = '' }) => {
  await EmailVerification.updateMany(
    { userKey, consumedAt: null, supersededAt: null },
    { $set: { supersededAt: new Date() } }
  );

  const token = generateVerificationToken();
  await EmailVerification.create({
    userKey,
    accountType,
    email: email.toLowerCase(),
    tokenHash: hashVerificationToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    requestedIp: ip,
  });

  const link = `${appUrl()}/verify-email/${token}`;
  const hours = Math.round(TOKEN_TTL_MS / 3_600_000);

  const delivery = await sendMail({
    to: email,
    subject: 'Confirm your Gurey Group email address',
    text:
      `Confirm your email address to finish setting up your Gurey Group workspace.\n\n${link}\n\n` +
      `This link expires in ${hours} hours and can only be used once. ` +
      `If you did not request it you can ignore this message.`,
    html:
      `<p>Confirm your email address to finish setting up your Gurey Group workspace.</p>` +
      `<p><a href="${link}">Confirm my email address</a></p>` +
      `<p>This link expires in ${hours} hours and can only be used once.</p>`,
  });

  // The raw token is returned only so a development environment without SMTP
  // can still complete the flow; it is never exposed over the API in production.
  return { link, delivery, devToken: process.env.NODE_ENV === 'production' ? undefined : token };
};

/**
 * Mark an account's address as verified.
 * @param {'provider'|'link'} method
 */
export const markEmailVerified = async ({ userKey, accountType = 'owner', method }) => {
  const update = {
    emailVerified: true,
    emailVerifiedAt: new Date(),
    emailVerificationMethod: method,
  };
  if (accountType === 'employee') {
    return EmployeeMember.findOneAndUpdate({ employeeId: userKey }, { $set: update }, { new: true });
  }
  return User.findOneAndUpdate({ firebaseUid: userKey }, { $set: update }, { new: true });
};

export const VERIFICATION_RESULT = {
  VERIFIED: 'verified',
  ALREADY_VERIFIED: 'already_verified',
  EXPIRED: 'expired',
  USED: 'used',
  SUPERSEDED: 'superseded',
  INVALID: 'invalid',
};

/**
 * Validate a raw token and, when valid, consume it and flip the account to
 * verified. Every failure mode is distinguished so the UI can say what
 * actually happened instead of a blanket "invalid link".
 */
export const consumeVerificationToken = async (rawToken) => {
  if (!rawToken || typeof rawToken !== 'string') {
    return { result: VERIFICATION_RESULT.INVALID };
  }

  const record = await EmailVerification.findOne({ tokenHash: hashVerificationToken(rawToken) });
  if (!record) return { result: VERIFICATION_RESULT.INVALID };

  if (record.consumedAt) {
    // A second click on a link that already did its job is a success for the
    // user, provided the account is still verified.
    const account = record.accountType === 'employee'
      ? await EmployeeMember.findOne({ employeeId: record.userKey })
      : await User.findOne({ firebaseUid: record.userKey });
    return {
      result: account?.emailVerified ? VERIFICATION_RESULT.ALREADY_VERIFIED : VERIFICATION_RESULT.USED,
      email: record.email,
    };
  }

  if (record.supersededAt) return { result: VERIFICATION_RESULT.SUPERSEDED, email: record.email };
  if (record.expiresAt.getTime() < Date.now()) return { result: VERIFICATION_RESULT.EXPIRED, email: record.email };

  // Single-use: the atomic guard on consumedAt means two concurrent clicks
  // cannot both consume the same challenge.
  const claimed = await EmailVerification.findOneAndUpdate(
    { _id: record._id, consumedAt: null },
    { $set: { consumedAt: new Date() } },
    { new: true }
  );
  if (!claimed) return { result: VERIFICATION_RESULT.USED, email: record.email };

  await markEmailVerified({
    userKey: record.userKey,
    accountType: record.accountType,
    method: 'link',
  });

  return { result: VERIFICATION_RESULT.VERIFIED, email: record.email };
};
