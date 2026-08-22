import express from 'express';
import Product from '../models/Product.js';
import Audit from '../models/Audit.js';
import StockAdjustment from '../models/StockAdjustment.js';
import { enforceTenantIsolation, requirePermission, requireBranchAccess, requireVerifiedEmail } from '../middleware/auth.js';

const router = express.Router();

/**
 * Product images are references, never payloads.
 *
 * Inlining a data: URI here is what made product creation fail with "request
 * entity too large": base64 inflates a file ~33%, so one phone photo could
 * exceed the JSON body limit on its own. Images go to POST /api/uploads and
 * the product stores the returned URL.
 */
const MAX_IMAGE_REFS = 6;
const MAX_REF_LENGTH = 2048;

const validateImageRefs = (value) => {
  if (value === undefined) return null;
  const list = Array.isArray(value) ? value : [value];
  if (list.length > MAX_IMAGE_REFS) {
    return `A product can have at most ${MAX_IMAGE_REFS} images.`;
  }
  for (const ref of list) {
    if (typeof ref !== 'string') return 'Image references must be URLs.';
    if (ref.startsWith('data:')) {
      return 'Upload images to /api/uploads first, then reference the returned URL.';
    }
    if (ref.length > MAX_REF_LENGTH) return 'That image URL is too long.';
  }
  return null;
};

// Apply Multi-Tenant Isolation Middleware to all product routes
router.use(enforceTenantIsolation);
router.use(requireVerifiedEmail);

/**
 * GET /api/products
 * Fetch products scoped to current tenant
 */
router.get('/', requirePermission('products:view'), async (req, res) => {
  try {
    const branchId = await requireBranchAccess(req, req.query.branchId || req.headers['x-branch-id']);
    // Archived products are soft-deleted; they must not reappear in the catalogue.
    const includeArchived = req.query.includeArchived === 'true';
    const filter = { companyId: req.tenantId, branchId };
    if (!includeArchived) filter.isArchived = { $ne: true };
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to fetch tenant products' });
  }
});

/**
 * POST /api/products
 * Create product strictly bound to tenant
 */
router.post('/', requirePermission('products:create'), async (req, res) => {
  try {
    const { name, sku, barcode, brand, category, supplier, description, costPrice, sellingPrice, stock, quantity, minStockThreshold, lowStockLevel, images, primaryImage } = req.body;

    const imageError = validateImageRefs(images) || validateImageRefs(primaryImage);
    if (imageError) {
      return res.status(400).json({ error: imageError, code: 'INLINE_IMAGE_REJECTED' });
    }
    const branchId = await requireBranchAccess(req, req.body.branchId || req.headers['x-branch-id']);
    const stockValue = Number(stock ?? quantity) || 0;
    const minStock = Number(minStockThreshold ?? lowStockLevel) || 5;
    const cost = Number(costPrice) || 0;
    const price = Number(sellingPrice) || 0;
    const status = stockValue === 0 ? 'Out of Stock' : (stockValue <= minStock ? 'Low Stock' : 'In Stock');
    
    const newProduct = await Product.create({
      companyId: req.tenantId,
      branchId,
      name,
      sku,
      barcode: barcode || '',
      brand: brand || 'Gurey Group',
      category,
      supplier: supplier || 'Gurey Group Direct',
      description: description || '',
      costPrice: cost,
      sellingPrice: price,
      profitMargin: price > 0 ? Number((((price - cost) / price) * 100).toFixed(1)) : 0,
      stock: stockValue,
      minStockThreshold: minStock,
      images: images || [],
      primaryImage: primaryImage || (images && images[0]) || '',
      status,
      isArchived: false,
      createdBy: req.user.email
    });

    await Audit.create({
      companyId: req.tenantId,
      action: 'PRODUCT_CREATED',
      userEmail: req.user.email,
      details: `Added new product: ${name} (SKU: ${newProduct.sku})`
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(400).json({ error: error.message || 'Failed to create product' });
  }
});

/**
 * PATCH /api/products/:id
 * Update a tenant-scoped product.
 */
router.patch('/:id', requirePermission('products:edit'), async (req, res) => {
  try {
    const allowed = [
      'name', 'sku', 'barcode', 'brand', 'category', 'supplier', 'description',
      'costPrice', 'sellingPrice', 'stock', 'quantity', 'minStockThreshold',
      'lowStockLevel', 'images', 'primaryImage', 'status', 'isArchived'
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.quantity !== undefined && updates.stock === undefined) {
      updates.stock = updates.quantity;
    }
    delete updates.quantity;

    if (updates.lowStockLevel !== undefined && updates.minStockThreshold === undefined) {
      updates.minStockThreshold = updates.lowStockLevel;
    }
    delete updates.lowStockLevel;

    const imageError = validateImageRefs(updates.images) || validateImageRefs(updates.primaryImage);
    if (imageError) {
      return res.status(400).json({ error: imageError, code: 'INLINE_IMAGE_REJECTED' });
    }

    if (updates.costPrice !== undefined) updates.costPrice = Number(updates.costPrice) || 0;
    if (updates.sellingPrice !== undefined) updates.sellingPrice = Number(updates.sellingPrice) || 0;
    if (updates.stock !== undefined) updates.stock = Number(updates.stock) || 0;
    if (updates.minStockThreshold !== undefined) updates.minStockThreshold = Number(updates.minStockThreshold) || 0;

    const branchId = await requireBranchAccess(req, req.headers['x-branch-id']);
    const existing = await Product.findOne({ _id: req.params.id, companyId: req.tenantId, branchId });
    if (!existing) return res.status(404).json({ error: 'Product not found.' });

    const nextCost = updates.costPrice ?? existing.costPrice;
    const nextPrice = updates.sellingPrice ?? existing.sellingPrice;
    const nextStock = updates.stock ?? existing.stock;
    const nextMin = updates.minStockThreshold ?? existing.minStockThreshold;

    updates.profitMargin = nextPrice > 0 ? Number((((nextPrice - nextCost) / nextPrice) * 100).toFixed(1)) : 0;
    updates.status = nextStock === 0 ? 'Out of Stock' : (nextStock <= nextMin ? 'Low Stock' : 'In Stock');

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId, branchId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    // A stock edit is a stock movement — record it like any other.
    if (updates.stock !== undefined && updates.stock !== existing.stock) {
      const delta = updates.stock - existing.stock;
      await StockAdjustment.create({
        companyId: req.tenantId,
        branchId,
        productId: String(product._id),
        productName: product.name,
        sku: product.sku,
        delta,
        stockAfter: product.stock,
        reason: req.body.adjustmentReason || 'Manual stock edit',
        source: 'correction',
        userId: req.user.uid,
        userName: req.user.email,
      });
    }

    await Audit.create({
      companyId: req.tenantId,
      action: 'PRODUCT_UPDATED',
      userEmail: req.user.email,
      details: `Updated product: ${product.name} (${Object.keys(updates).join(', ')})`
    });

    res.json(product);
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(400).json({ error: error.message || 'Failed to update product' });
  }
});

/**
 * DELETE /api/products/:id
 * Archive a tenant-scoped product.
 */
router.delete('/:id', requirePermission('products:delete'), async (req, res) => {
  try {
    const branchId = await requireBranchAccess(req, req.headers['x-branch-id']);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId, branchId },
      { $set: { isArchived: true } },
      { new: true }
    );

    if (!product) return res.status(404).json({ error: 'Product not found.' });

    await Audit.create({
      companyId: req.tenantId,
      action: 'PRODUCT_ARCHIVED',
      userEmail: req.user.email,
      details: `Archived product: ${product.name}`
    });

    res.json({ success: true, product });
  } catch (error) {
    console.error('Archive Product Error:', error);
    res.status(500).json({ error: 'Failed to archive product' });
  }
});

export default router;
