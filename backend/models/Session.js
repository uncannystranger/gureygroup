import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId:       { type: String, required: true, index: true },
  userName:     { type: String, default: '' },
  companyId:    { type: String, required: true, index: true },
  device:       { type: String, default: 'Unknown' },
  browser:      { type: String, default: 'Unknown' },
  os:           { type: String, default: 'Unknown' },
  ipAddress:    { type: String, default: '' },
  location:     { type: String, default: 'Unknown' },
  remembered:   { type: Boolean, default: false },
  suspicious:   { type: Boolean, default: false },
  loginTime:    { type: Date, default: Date.now },
  logoutTime:   { type: Date, default: null },
  lastActive:   { type: Date, default: Date.now },
  isActive:     { type: Boolean, default: true },
}, {
  timestamps: true,
});

sessionSchema.index({ companyId: 1, isActive: 1 });
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ companyId: 1, loginTime: -1 });

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);
