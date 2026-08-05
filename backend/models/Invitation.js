import mongoose from 'mongoose';
import crypto from 'crypto';

const invitationSchema = new mongoose.Schema({
  email:          { type: String, required: true, lowercase: true, trim: true },
  companyId:      { type: String, required: true, index: true },
  companyName:    { type: String, default: '' },
  role:           { type: String, required: true, default: 'Employee',
                    enum: ['Admin', 'Manager', 'Cashier', 'Inventory Staff', 'Employee'] },
  branchId:       { type: String, default: null },
  branchName:     { type: String, default: '' },
  token:          { type: String, required: true, unique: true, index: true },
  status:         { type: String, enum: ['pending', 'accepted', 'expired', 'revoked'], default: 'pending' },
  invitedBy:      { type: String, required: true },       // userId of inviter
  invitedByName:  { type: String, default: '' },
  expiresAt:      { type: Date, required: true },
  acceptedAt:     { type: Date, default: null },
  acceptedBy:     { type: String, default: null },         // userId of acceptor
}, {
  timestamps: true,
});

invitationSchema.index({ companyId: 1, email: 1 });
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-cleanup

/**
 * Generate a cryptographically secure invitation token.
 */
invitationSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString('hex');
};

export default mongoose.models.Invitation || mongoose.model('Invitation', invitationSchema);
