import express from 'express';
import crypto from 'node:crypto';
import multer from 'multer';
import Asset from '../models/Asset.js';
import { enforceTenantIsolation, requireVerifiedEmail } from '../middleware/auth.js';

const router = express.Router();

/**
 * Upload limits.
 *
 * These are the single source of truth for the whole stack: the frontend reads
 * them from GET /api/uploads/limits so its client-side check can never drift
 * from what the server actually enforces.
 *
 * 5 MB is comfortably above a downscaled product photo (typically 150-400 KB
 * after the client resizes to 1600px) while staying far below the 16 MB BSON
 * document ceiling.
 */
export const UPLOAD_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxFilesPerProduct: 6,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_LIMITS.maxFileBytes, files: 1 },
});

/**
 * Identify the format from the file's own leading bytes.
 *
 * The browser-supplied MIME type is attacker-controlled, so it is only used as
 * a first filter — this magic-number check is what actually decides whether the
 * upload is stored, which stops an executable being passed off as a PNG.
 */
const sniffImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  const gif = buffer.subarray(0, 6).toString('ascii');
  if (gif === 'GIF87a' || gif === 'GIF89a') return 'image/gif';
  return null;
};

/** Published so the client validates against the same numbers the server uses. */
router.get('/limits', (req, res) => res.json(UPLOAD_LIMITS));

/**
 * GET /api/uploads/:id?k=<accessKey>
 *
 * Registered before the auth middleware because image elements cannot send an
 * Authorization header. Access is proved either by the per-asset capability
 * key in the query string or by a normal authenticated session.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ error: 'Image not found.' });

    const providedKey = typeof req.query.k === 'string' ? req.query.k : '';
    // Constant-time compare so the key cannot be recovered byte by byte.
    const keyMatches = providedKey.length === asset.accessKey.length
      && crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(asset.accessKey));

    if (!keyMatches) {
      // No capability key: fall through to the authenticated handler below,
      // which enforces the workspace scope.
      req.assetForSession = asset;
      return next();
    }

    return sendAsset(res, asset, req);
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid image id.' });
    console.error('[Upload] Read error:', error);
    return res.status(500).json({ error: 'Unable to load that image.' });
  }
});

function sendAsset(res, asset, req) {
  // Content is immutable — the id refers to one specific upload — so it can be
  // cached hard, with the checksum as the validator.
  res.setHeader('Content-Type', asset.contentType);
  res.setHeader('Content-Length', asset.size);
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
  res.setHeader('ETag', `"${asset.checksum}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Stored bytes are served as data, never rendered as a document.
  res.setHeader('Content-Disposition', 'inline');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");

  if (req.headers['if-none-match'] === `"${asset.checksum}"`) return res.status(304).end();
  return res.send(asset.data);
}

router.use(enforceTenantIsolation);
router.use(requireVerifiedEmail);

/**
 * Authenticated fallback for a read without a capability key — scoped to the
 * caller's workspace.
 */
router.get('/:id', async (req, res) => {
  const asset = req.assetForSession;
  if (!asset || asset.companyId !== req.tenantId) {
    return res.status(404).json({ error: 'Image not found.' });
  }
  return sendAsset(res, asset, req);
});

/**
 * POST /api/uploads
 * multipart/form-data: file=<binary>, kind=product|avatar|logo
 */
router.post('/', (req, res) => {
  upload.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      // Turn multer's internal codes into something a person can act on.
      if (uploadError.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `That image is larger than the ${Math.round(UPLOAD_LIMITS.maxFileBytes / 1024 / 1024)} MB limit. Please choose a smaller image.`,
          code: 'FILE_TOO_LARGE',
          maxFileBytes: UPLOAD_LIMITS.maxFileBytes,
        });
      }
      console.error('[Upload] Multer error:', uploadError);
      return res.status(400).json({ error: 'That file could not be uploaded.', code: 'UPLOAD_FAILED' });
    }

    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'No file was included in the request.', code: 'NO_FILE' });

      const kind = ['product', 'avatar', 'logo'].includes(req.body?.kind) ? req.body.kind : 'product';

      const sniffed = sniffImageType(file.buffer);
      if (!sniffed || !UPLOAD_LIMITS.allowedMimeTypes.includes(sniffed)) {
        return res.status(415).json({
          error: 'Only JPEG, PNG, WebP or GIF images can be uploaded.',
          code: 'UNSUPPORTED_TYPE',
        });
      }

      const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

      // Identical bytes already in this workspace: reuse rather than duplicate.
      const existing = await Asset.findOne({ companyId: req.tenantId, checksum }).select('_id contentType size');
      const asset = existing || await Asset.create({
        companyId: req.tenantId,
        ownerId: req.user.uid,
        kind,
        contentType: sniffed,
        size: file.size,
        checksum,
        data: file.buffer,
        // Never trust or reflect the client's filename into a path.
        originalName: String(file.originalname || '').replace(/[^\w.\-]/g, '_').slice(0, 120),
      });

      res.status(201).json({
        id: String(asset._id),
        url: `/api/uploads/${asset._id}?k=${asset.accessKey}`,
        contentType: asset.contentType,
        size: asset.size,
        reused: Boolean(existing),
      });
    } catch (error) {
      console.error('[Upload] Store error:', error);
      res.status(500).json({ error: 'The image could not be saved. Please try again.', code: 'UPLOAD_STORE_FAILED' });
    }
  });
});

export default router;
