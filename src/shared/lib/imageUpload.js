import { uploadAPI } from '../../services/apiService';

/**
 * Client-side image pipeline.
 *
 * Product and avatar images used to be read as base64 data URIs and posted
 * inside the JSON body, which is what produced "request entity too large":
 * base64 inflates a file by ~33%, so a single 4 MB phone photo became a ~5.4 MB
 * JSON document and body-parser rejected it before any route ran.
 *
 * Now an image is downscaled in the browser, then uploaded as multipart to
 * /api/uploads, and only the returned URL travels in JSON.
 */

/** Cached so the client validates against the server's real numbers. */
let limitsPromise = null;

export const DEFAULT_LIMITS = {
  maxFileBytes: 5 * 1024 * 1024,
  maxFilesPerProduct: 6,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

export const getUploadLimits = () => {
  if (!limitsPromise) {
    limitsPromise = uploadAPI.limits().catch(() => DEFAULT_LIMITS);
  }
  return limitsPromise;
};

export const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

/**
 * Reject unusable files before any network call, with a message that says what
 * to do rather than what failed.
 */
export const validateImageFile = (file, limits = DEFAULT_LIMITS) => {
  if (!file) return 'No file selected.';
  if (!file.type?.startsWith('image/')) {
    return 'That file is not an image. Choose a JPEG, PNG, WebP or GIF.';
  }
  if (!limits.allowedMimeTypes.includes(file.type)) {
    return `${file.type.replace('image/', '').toUpperCase()} images are not supported. Use JPEG, PNG, WebP or GIF.`;
  }
  // Guard against a file so large that even downscaling would be a bad idea.
  const preCompressionCeiling = limits.maxFileBytes * 8;
  if (file.size > preCompressionCeiling) {
    return `That image is ${formatBytes(file.size)}, which is too large to process. Please choose one under ${formatBytes(preCompressionCeiling)}.`;
  }
  return null;
};

const loadImage = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read.')); };
  img.src = url;
});

/**
 * Downscale to fit `maxEdge` and re-encode, so a 12 MP camera photo becomes a
 * few hundred kilobytes before it ever hits the network.
 * Animated GIFs are passed through untouched — re-encoding would flatten them.
 */
export const compressImage = async (file, { maxEdge = 1600, quality = 0.82 } = {}) => {
  if (file.type === 'image/gif') return file;

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));

    // Already small enough and reasonably sized: leave it alone.
    if (scale === 1 && file.size <= 900 * 1024) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // PNG screenshots keep their alpha; photographs re-encode to JPEG.
    const targetType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, targetType, quality));
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, targetType === 'image/png' ? '.png' : '.jpg'), {
      type: targetType,
      lastModified: Date.now(),
    });
  } catch {
    // Compression is an optimisation, never a gate — fall back to the original.
    return file;
  }
};

/**
 * Validate → compress → upload. Resolves to a stable, persistent URL.
 * @returns {Promise<{url: string, id: string, size: number}>}
 */
export const uploadImage = async (file, { kind = 'product', onProgress } = {}) => {
  const limits = await getUploadLimits();

  const validationError = validateImageFile(file, limits);
  if (validationError) {
    const error = new Error(validationError);
    error.userFacing = true;
    throw error;
  }

  onProgress?.({ stage: 'preparing' });
  const prepared = await compressImage(file);

  if (prepared.size > limits.maxFileBytes) {
    const error = new Error(
      `That image is still ${formatBytes(prepared.size)} after compression, over the ${formatBytes(limits.maxFileBytes)} limit. Please choose a smaller image.`
    );
    error.userFacing = true;
    throw error;
  }

  onProgress?.({ stage: 'uploading', size: prepared.size });
  const result = await uploadAPI.upload(prepared, kind);
  onProgress?.({ stage: 'done', size: prepared.size });
  return result;
};

/**
 * Bridge for flows that already produced a data URI (camera capture, crop
 * canvas) so they can join the same upload path instead of persisting the
 * inline string.
 */
export const dataUriToFile = async (dataUri, filename = 'image.jpg') => {
  const response = await fetch(dataUri);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
};
