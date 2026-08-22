import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  companyId:     { type: String, required: true, index: true },
  companyName:   { type: String, required: true, trim: true },
  contactName:   { type: String, default: '' },
  email:         { type: String, default: '', lowercase: true, trim: true },
  phone:         { type: String, default: '', trim: true },
  address:       { type: String, default: '' },
  category:      { type: String, default: '' },
  paymentTerms:  { type: String, default: '' },
  notes:         { type: String, default: '' },
  isArchived:    { type: Boolean, default: false, index: true },
  createdBy:     { type: String, default: '' },
}, { timestamps: true });

supplierSchema.index({ companyId: 1, companyName: 1 }, { unique: true });

export default mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);
