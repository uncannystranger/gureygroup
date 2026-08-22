import crypto from 'node:crypto';
import mongoose from 'mongoose';

/**
 * Binary asset (product photo, avatar) stored in MongoDB.
 *
 * Keeping assets in the database — rather than on a local filesystem — is what
 * makes them survive a restart and work on a serverless deployment, where the
 * filesystem is ephemeral and per-instance. Uploads are capped well below the
 * 16 MB BSON document ceiling, and the client downscales before sending, so a
 * typical product photo lands in the low hundreds of kilobytes.
 */
const assetSchema = new mongoose.Schema({
  companyId:   { type: String, required: true, index: true },
  ownerId:     { type: String, required: true, index: true },
  kind:        { type: String, enum: ['product', 'avatar', 'logo'], required: true, index: true },
  contentType: { type: String, required: true },
  size:        { type: Number, required: true },
  checksum:    { type: String, required: true, index: true },
  data:        { type: Buffer, required: true },
  originalName:{ type: String, default: '' },
  /**
   * Capability key for the read URL.
   *
   * An <img> tag cannot send an Authorization header, so the read path needs a
   * credential it can carry in the URL. This is a 256-bit random value scoped
   * to one asset — the same model Firebase Storage download URLs use — and it
   * can be rotated to revoke access without touching the bytes.
   */
  accessKey:   { type: String, required: true, index: true, default: () => crypto.randomBytes(32).toString('hex') },
}, { timestamps: true });

// Re-uploading an identical file within a workspace reuses the stored bytes.
assetSchema.index({ companyId: 1, checksum: 1 });

export default mongoose.models.Asset || mongoose.model('Asset', assetSchema);
