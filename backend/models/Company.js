import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  logo: { type: String, default: '' },
  ownerUid: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  country: { type: String, default: 'United States' },
  currency: { type: String, default: 'USD ($)' },
  timezone: { type: String, default: 'EST (UTC-5)' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  taxNumber: { type: String, default: '' },
  subscriptionTier: { type: String, enum: ['Basic', 'Professional', 'Enterprise SaaS'], default: 'Enterprise SaaS' },
  status: { type: String, enum: ['Active', 'Trial', 'Suspended'], default: 'Active' },
  settings: {
    lowStockThreshold: { type: Number, default: 10 },
    enableTax: { type: Boolean, default: true },
    defaultTaxRate: { type: Number, default: 8.5 },
    currencySymbol: { type: String, default: '$' }
  }
}, {
  timestamps: true
});

export default mongoose.models.Company || mongoose.model('Company', companySchema);
