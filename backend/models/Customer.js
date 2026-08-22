import mongoose from 'mongoose';

/**
 * A customer of the workspace.
 *
 * Previously this lived only in the browser's localStorage, so a customer
 * added at the till vanished on another device and could not be reported on.
 */
const customerSchema = new mongoose.Schema({
  companyId:     { type: String, required: true, index: true },
  name:          { type: String, required: true, trim: true },
  phone:         { type: String, default: '', trim: true },
  email:         { type: String, default: '', lowercase: true, trim: true },
  address:       { type: String, default: '' },
  notes:         { type: String, default: '' },
  loyaltyPoints: { type: Number, default: 0, min: 0 },
  totalSpent:    { type: Number, default: 0, min: 0 },
  visits:        { type: Number, default: 0, min: 0 },
  lastPurchaseAt:{ type: Date, default: null },
  createdBy:     { type: String, default: '' },
  isArchived:    { type: Boolean, default: false, index: true },
}, { timestamps: true });

customerSchema.index({ companyId: 1, name: 1 });
// A phone number identifies a customer at the till, so keep it unique per
// workspace when one is supplied.
// partialFilterExpression accepts only a restricted operator set — $ne is not
// among them — so non-empty strings are selected with $gt: ''.
customerSchema.index(
  { companyId: 1, phone: 1 },
  { unique: true, partialFilterExpression: { phone: { $type: 'string', $gt: '' } } }
);

export default mongoose.models.Customer || mongoose.model('Customer', customerSchema);
