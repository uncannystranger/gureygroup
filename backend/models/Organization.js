import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  companyId:    { type: String, required: true, unique: true, index: true },
  name:         { type: String, required: true, trim: true },
  ownerId:      { type: String, required: true },
  ownerEmail:   { type: String, required: true, lowercase: true },
  businessType: { type: String, default: 'Retail' },
  logo:         { type: String, default: '' },
  country:      { type: String, default: '' },
  currency:     { type: String, default: 'USD' },
  currencySymbol:{ type: String, default: '$' },
  timezone:     { type: String, default: 'UTC' },
  phone:        { type: String, default: '' },
  address:      { type: String, default: '' },
  taxNumber:    { type: String, default: '' },
  subscription: {
    plan:   { type: String, enum: ['Free', 'Starter', 'Professional', 'Enterprise'], default: 'Free' },
    status: { type: String, enum: ['active', 'trial', 'suspended', 'cancelled'], default: 'active' },
    expiresAt: { type: Date, default: null },
  },
  settings: {
    lowStockThreshold: { type: Number, default: 10 },
    enableTax:         { type: Boolean, default: true },
    defaultTaxRate:    { type: Number, default: 0 },
    // Mobile-money merchant number used by the QR payment flow. Previously a
    // hardcoded default in frontend source with a localStorage override, so it
    // was neither per-workspace nor durable.
    merchantNumber:    { type: String, default: '' },
    receipt: {
      showCashierName: { type: Boolean, default: true },
      showEmployeeId:  { type: Boolean, default: false },
      showBranch:      { type: Boolean, default: true },
      showCashierRole: { type: Boolean, default: false },
    },
  },
  status: { type: String, enum: ['Active', 'Suspended', 'Deleted'], default: 'Active' },
}, {
  timestamps: true,
});

export default mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
