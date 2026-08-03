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
    const { name, sku, category, costPrice, sellingPrice, stock, images, primaryImage } = req.body;
    
    const newProduct = await Product.create({
      companyId: req.tenantId,
      name,
      sku: sku || `SKU-${Date.now().toString(36).toUpperCase()}`,
      category: category || 'Cosmetics',
      costPrice: Number(costPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      stock: Number(stock) || 0,
      images: images || [],
      primaryImage: primaryImage || (images && images[0]) || '',
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

export default router;
