import express from 'express';
import Product from '../models/Product.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation } from '../middleware/auth.js';

const router = express.Router();

// Apply Multi-Tenant Isolation Middleware to all product routes
router.use(enforceTenantIsolation);

/**
 * GET /api/products
 * Fetch products scoped to current tenant
 */
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ companyId: req.tenantId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tenant products' });
  }
});

/**
 * POST /api/products
 * Create product strictly bound to tenant
 */
router.post('/', async (req, res) => {
  try {
    const { name, sku, barcode, brand, category, supplier, description, costPrice, sellingPrice, stock, quantity, minStockThreshold, lowStockLevel, images, primaryImage } = req.body;
    const stockValue = Number(stock ?? quantity) || 0;
    const minStock = Number(minStockThreshold ?? lowStockLevel) || 5;
    const cost = Number(costPrice) || 0;
    const price = Number(sellingPrice) || 0;
    const status = stockValue === 0 ? 'Out of Stock' : (stockValue <= minStock ? 'Low Stock' : 'In Stock');
    
    const newProduct = await Product.create({
      companyId: req.tenantId,
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
router.patch('/:id', async (req, res) => {
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

    if (updates.costPrice !== undefined) updates.costPrice = Number(updates.costPrice) || 0;
    if (updates.sellingPrice !== undefined) updates.sellingPrice = Number(updates.sellingPrice) || 0;
    if (updates.stock !== undefined) updates.stock = Number(updates.stock) || 0;
    if (updates.minStockThreshold !== undefined) updates.minStockThreshold = Number(updates.minStockThreshold) || 0;

    const existing = await Product.findOne({ _id: req.params.id, companyId: req.tenantId });
    if (!existing) return res.status(404).json({ error: 'Product not found.' });

    const nextCost = updates.costPrice ?? existing.costPrice;
    const nextPrice = updates.sellingPrice ?? existing.sellingPrice;
    const nextStock = updates.stock ?? existing.stock;
    const nextMin = updates.minStockThreshold ?? existing.minStockThreshold;

    updates.profitMargin = nextPrice > 0 ? Number((((nextPrice - nextCost) / nextPrice) * 100).toFixed(1)) : 0;
    updates.status = nextStock === 0 ? 'Out of Stock' : (nextStock <= nextMin ? 'Low Stock' : 'In Stock');

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    );

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
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId },
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
