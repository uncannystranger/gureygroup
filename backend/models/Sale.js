import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number, required: true }
});

const saleSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  invoiceNumber: { type: String, required: true },
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String, default: '' },
  cashierName: { type: String, required: true },
  items: [saleItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Credit Card', 'Mobile Money', 'Gift Card'], default: 'Credit Card' },
  status: { type: String, enum: ['Completed', 'Refunded', 'Pending'], default: 'Completed' }
}, {
  timestamps: true
});

saleSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
saleSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.models.Sale || mongoose.model('Sale', saleSchema);
