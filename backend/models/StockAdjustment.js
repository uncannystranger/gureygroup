import mongoose from 'mongoose';

/**
 * An immutable record of every stock movement.
 *
 * This previously lived only in the browser, so the inventory audit trail was
 * per-device, unverifiable, and lost on cache clear.
 */
const stockAdjustmentSchema = new mongoose.Schema({
  companyId:   { type: String, required: true, index: true },
  branchId:    { type: String, required: true, index: true },
  productId:   { type: String, required: true, index: true },
  productName: { type: String, default: '' },
  sku:         { type: String, default: '' },
  // Signed change: negative for a sale or write-off, positive for intake.
  delta:       { type: Number, required: true },
  stockAfter:  { type: Number, default: null },
  reason:      { type: String, required: true, default: 'Manual adjustment' },
  source:      { type: String, enum: ['sale', 'manual', 'bulk', 'refund', 'correction'], default: 'manual', index: true },
  userId:      { type: String, default: '' },
  userName:    { type: String, default: '' },
}, { timestamps: true });

stockAdjustmentSchema.index({ companyId: 1, branchId: 1, createdAt: -1 });

export default mongoose.models.StockAdjustment || mongoose.model('StockAdjustment', stockAdjustmentSchema);
