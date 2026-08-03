import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  userId:         { type: String, required: true, index: true },
  companyId:      { type: String, required: true, index: true },
  role:           { type: String, required: true, default: 'Employee',
                    enum: ['Owner', 'Admin', 'Manager', 'Cashier', 'Inventory Staff', 'Employee'] },
  branchId:       { type: String, default: null },
  permissions:    [{ type: String }],        // Optional per-user overrides
  status:         { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
  joinedAt:       { type: Date, default: Date.now },
  invitedBy:      { type: String, default: null },
}, {
  timestamps: true,
});

membershipSchema.index({ companyId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ companyId: 1, role: 1 });
membershipSchema.index({ companyId: 1, branchId: 1 });

export default mongoose.models.Membership || mongoose.model('Membership', membershipSchema);
