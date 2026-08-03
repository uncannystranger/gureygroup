import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  companyId:   { type: String, required: true, index: true },
  name:        { type: String, required: true, trim: true },
  code:        { type: String, default: '' },
  address:     { type: String, default: '' },
  city:        { type: String, default: '' },
  phone:       { type: String, default: '' },
  managerId:   { type: String, default: null },
  managerName: { type: String, default: '' },
  status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
}, {
  timestamps: true,
});

branchSchema.index({ companyId: 1, name: 1 });

export default mongoose.models.Branch || mongoose.model('Branch', branchSchema);
