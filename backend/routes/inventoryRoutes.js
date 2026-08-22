import express from 'express';
import StockAdjustment from '../models/StockAdjustment.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Audit from '../models/Audit.js';
import {
  enforceTenantIsolation,
  requirePermission,
  requireVerifiedEmail,
  requireBranchAccess,
} from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);
router.use(requireVerifiedEmail);

/* ─── Stock adjustments ─────────────────────────────────────────────────── */

/**
 * The ledger is append-only and derived from real stock movements; there is no
 * endpoint to edit or delete an entry, because an audit trail that can be
 * rewritten is not an audit trail.
 */
router.get('/stock-adjustments', requirePermission('inventory:view'), async (req, res) => {
  try {
    const branchId = await requireBranchAccess(req, req.query.branchId || req.headers['x-branch-id']);
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const filter = { companyId: req.tenantId, branchId };
    if (req.query.productId) filter.productId = req.query.productId;

    const adjustments = await StockAdjustment.find(filter).sort({ createdAt: -1 }).limit(limit);
    res.json({ adjustments });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to load stock history.' });
  }
});

/**
 * Manual intake / write-off. The product row and the ledger entry are written
 * together so the recorded stock and its explanation cannot diverge.
 */
router.post('/stock-adjustments', requirePermission('inventory:manage'), async (req, res) => {
  try {
    const branchId = await requireBranchAccess(req, req.body.branchId || req.headers['x-branch-id']);
    const { productId, reason } = req.body;
    const delta = Number(req.body.delta);

    if (!productId) return res.status(400).json({ error: 'A product is required.' });
    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ error: 'Enter a non-zero quantity to add or remove.' });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'A reason is required for every stock adjustment.' });
    }

    const product = await Product.findOne({ _id: productId, companyId: req.tenantId, branchId });
    if (!product) return res.status(404).json({ error: 'Product not found in this branch.' });

    const nextStock = product.stock + delta;
    if (nextStock < 0) {
      return res.status(409).json({
        error: `That would take "${product.name}" below zero — only ${product.stock} in stock.`,
      });
    }

    product.stock = nextStock;
    product.status = nextStock === 0
      ? 'Out of Stock'
      : (nextStock <= product.minStockThreshold ? 'Low Stock' : 'In Stock');
    await product.save();

    const adjustment = await StockAdjustment.create({
      companyId: req.tenantId,
      branchId,
      productId: String(product._id),
      productName: product.name,
      sku: product.sku,
      delta,
      stockAfter: nextStock,
      reason: String(reason).trim(),
      source: 'manual',
      userId: req.user.uid,
      userName: req.user.email,
    });

    await Audit.create({
      companyId: req.tenantId,
      action: 'STOCK_ADJUSTED',
      userEmail: req.user.email,
      details: `${delta > 0 ? '+' : ''}${delta} × ${product.name} (${reason})`,
    });

    res.status(201).json({ adjustment, product });
  } catch (error) {
    console.error('Stock Adjustment Error:', error);
    res.status(error.status || 400).json({ error: error.message || 'Failed to record the adjustment.' });
  }
});

/* ─── Suppliers ─────────────────────────────────────────────────────────── */

router.get('/suppliers', requirePermission('products:view'), async (req, res) => {
  try {
    const suppliers = await Supplier.find({ companyId: req.tenantId, isArchived: { $ne: true } })
      .sort({ companyName: 1 })
      .limit(500);
    res.json({ suppliers });
  } catch (error) {
    console.error('List Suppliers Error:', error);
    res.status(500).json({ error: 'Failed to load suppliers.' });
  }
});

router.post('/suppliers', requirePermission('products:create'), async (req, res) => {
  try {
    const { companyName, contactName, email, phone, address, category, paymentTerms, notes } = req.body;
    if (!companyName?.trim()) return res.status(400).json({ error: 'A supplier name is required.' });

    const supplier = await Supplier.create({
      companyId: req.tenantId,
      companyName: companyName.trim(),
      contactName: contactName || '',
      email: (email || '').trim(),
      phone: (phone || '').trim(),
      address: address || '',
      category: category || '',
      paymentTerms: paymentTerms || '',
      notes: notes || '',
      createdBy: req.user.email,
    });
    res.status(201).json({ supplier });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'A supplier with that name already exists.' });
    }
    console.error('Create Supplier Error:', error);
    res.status(400).json({ error: 'Failed to create supplier.' });
  }
});

router.patch('/suppliers/:id', requirePermission('products:edit'), async (req, res) => {
  try {
    const ALLOWED = ['companyName', 'contactName', 'email', 'phone', 'address', 'category', 'paymentTerms', 'notes', 'isArchived'];
    const updates = {};
    ALLOWED.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No valid fields to update.' });

    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ error: 'Supplier not found.' });
    res.json({ supplier });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid supplier id.' });
    res.status(400).json({ error: 'Failed to update supplier.' });
  }
});

/* ─── Purchase orders ───────────────────────────────────────────────────── */

router.get('/purchase-orders', requirePermission('products:view'), async (req, res) => {
  try {
    const orders = await PurchaseOrder.find({ companyId: req.tenantId })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ purchaseOrders: orders });
  } catch (error) {
    console.error('List Purchase Orders Error:', error);
    res.status(500).json({ error: 'Failed to load purchase orders.' });
  }
});

router.post('/purchase-orders', requirePermission('inventory:manage'), async (req, res) => {
  try {
    const { supplierId, supplierName, notes, expectedAt } = req.body;
    const rawItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (rawItems.length === 0) return res.status(400).json({ error: 'A purchase order needs at least one line.' });

    // Totals are computed here, never taken from the client.
    const items = rawItems.map((item) => {
      const quantity = Math.floor(Number(item.quantity));
      const unitCost = Number(item.unitCost);
      if (!item.productName) throw Object.assign(new Error('Every line needs a product name.'), { status: 400 });
      if (!Number.isFinite(quantity) || quantity < 1) throw Object.assign(new Error('Every line needs a quantity of at least 1.'), { status: 400 });
      if (!Number.isFinite(unitCost) || unitCost < 0) throw Object.assign(new Error('Every line needs a valid unit cost.'), { status: 400 });
      return {
        productId: item.productId || '',
        productName: item.productName,
        sku: item.sku || '',
        quantity,
        unitCost,
        lineTotal: Number((quantity * unitCost).toFixed(2)),
      };
    });

    const totalCost = Number(items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2));
    const reference = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const order = await PurchaseOrder.create({
      companyId: req.tenantId,
      branchId: req.body.branchId || req.headers['x-branch-id'] || null,
      reference,
      supplierId: supplierId || null,
      supplierName: supplierName || '',
      items,
      totalCost,
      status: 'Draft',
      expectedAt: expectedAt ? new Date(expectedAt) : null,
      notes: notes || '',
      createdBy: req.user.email,
    });

    await Audit.create({
      companyId: req.tenantId,
      action: 'PURCHASE_ORDER_CREATED',
      userEmail: req.user.email,
      details: `${reference} — ${items.length} line(s), total ${totalCost}`,
    });

    res.status(201).json({ purchaseOrder: order });
  } catch (error) {
    console.error('Create Purchase Order Error:', error);
    res.status(error.status || 400).json({ error: error.message || 'Failed to create purchase order.' });
  }
});

export default router;
