import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true },
  barcode: { type: String, default: '' },
  brand: { type: String, default: 'Gurey Group' },
  category: { type: String, required: true },
  supplier: { type: String, default: 'Gurey Group Direct' },
  description: { type: String, default: '' },
  costPrice: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  profitMargin: { type: Number, default: 0 },
  taxRate: { type: Number, default: 8.5 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  minStockThreshold: { type: Number, default: 5 },
  images: [{ type: String }],
  primaryImage: { type: String, default: '' },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock'], default: 'In Stock' },
  isArchived: { type: Boolean, default: false, index: true },
  createdBy: { type: String, default: 'System' }
}, {
  timestamps: true
});

productSchema.index({ companyId: 1, sku: 1 }, { unique: true });
productSchema.index({ companyId: 1, name: 'text', category: 'text' });

export default mongoose.models.Product || mongoose.model('Product', productSchema);
