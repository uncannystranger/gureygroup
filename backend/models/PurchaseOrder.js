import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  productId:   { type: String, default: '' },
  productName: { type: String, required: true },
  sku:         { type: String, default: '' },
  quantity:    { type: Number, required: true, min: 1 },
  unitCost:    { type: Number, required: true, min: 0 },
  lineTotal:   { type: Number, required: true, min: 0 },
}, { _id: false });

const purchaseOrderSchema = new mongoose.Schema({
  companyId:   { type: String, required: true, index: true },
  branchId:    { type: String, default: null, index: true },
  reference:   { type: String, required: true },
  supplierId:  { type: String, default: null, index: true },
  supplierName:{ type: String, default: '' },
  items:       { type: [purchaseOrderItemSchema], default: [] },
  totalCost:   { type: Number, required: true, min: 0, default: 0 },
  status:      { type: String, enum: ['Draft', 'Ordered', 'Received', 'Cancelled'], default: 'Draft', index: true },
  expectedAt:  { type: Date, default: null },
  receivedAt:  { type: Date, default: null },
  notes:       { type: String, default: '' },
  createdBy:   { type: String, default: '' },
}, { timestamps: true });

purchaseOrderSchema.index({ companyId: 1, reference: 1 }, { unique: true });
purchaseOrderSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);
