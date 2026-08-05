import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, required: true },

  // Profile identity fields
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  photoURL: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  dateOfBirth: { type: String, default: '' },
  gender: { type: String, default: '' },
  pinHash: { type: String, default: '' },
  securityPinHash: { type: String, default: '' },
  jobTitle: { type: String, default: 'Account Owner' },
  businessName: { type: String, default: '' },
  country: { type: String, default: '' },
  city: { type: String, default: '' },

  // Default/last active workspace. Access is authorized through Membership.
  companyId: { type: String, default: '', index: true },
  role: {
    type: String,
    enum: ['Owner', 'Admin', 'Manager', 'Cashier', 'Inventory Staff', 'Accountant', 'Viewer', 'Employee'],
    default: 'Employee'
  },
  permissions: [{ type: String }],
  status: { type: String, enum: ['Active', 'Suspended', 'Pending'], default: 'Active' },

  // Preferences — persisted per user
  theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
  accentColor: { type: String, default: 'indigo' },
  language: { type: String, default: 'en' },
  preferredLanguage: { type: String, default: 'English (US)' },
  timezone: { type: String, default: 'UTC' },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  timeFormat: { type: String, enum: ['12-hour', '24-hour'], default: '12-hour' },
  currency: { type: String, default: 'USD ($)' },
  emailNotifications: { type: Boolean, default: true },
  browserNotifications: { type: Boolean, default: true },

  // Activity
  lastLogin: { type: Date, default: Date.now }
}, {
  timestamps: true
});

userSchema.index({ companyId: 1, email: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema);
