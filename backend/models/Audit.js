import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  action: { type: String, required: true }, // e.g. "USER_LOGIN", "PRODUCT_CREATED", "SALE_COMPLETED"
  userEmail: { type: String, required: true },
  userRole: { type: String, default: 'Owner' },
  details: { type: String, required: true },
  ipAddress: { type: String, default: '127.0.0.1' }
}, {
  timestamps: true
});

auditSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.models.Audit || mongoose.model('Audit', auditSchema);
