import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);

const makeNumber = (prefix) => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

router.get('/', async (req, res) => {
  try {
    const { branchId, limit = 100 } = req.query;
    const filter = { companyId: req.tenantId };
    if (branchId) filter.branchId = branchId;

    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 100, 500));

    res.json({ sales });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sales.' });
  }
});

router.post('/', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const companyId = req.tenantId;
    const branch = req.body.branchId
      ? await Branch.findOne({ _id: req.body.branchId, companyId }).session(session)
      : null;

    const items = (req.body.items || []).map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku || '',
      unitPrice: Number(item.unitPrice ?? item.price) || 0,
      quantity: Number(item.quantity) || 1,
      totalPrice: Number(item.totalPrice ?? item.total) || ((Number(item.unitPrice ?? item.price) || 0) * (Number(item.quantity) || 1)),
    }));

    if (items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Sale must include at least one item.' });
    }

    const receiptNumber = req.body.receiptNumber || makeNumber('REC');
    const invoiceNumber = req.body.invoiceNumber || makeNumber('INV');

    const sale = await Sale.create([{
      companyId,
      branchId: req.body.branchId || null,
      branchName: branch?.name || req.body.branchName || '',
      posTerminalId: req.body.posTerminalId || 'web-pos',
      receiptNumber,
      invoiceNumber,
      cashierId: req.user.uid,
      cashierName: req.body.cashierName || req.user.email,
      employeeId: req.body.employeeId || req.user.uid,
      customerId: req.body.customerId || null,
      customerName: req.body.customerName || 'Walk-in Customer',
      customerPhone: req.body.customerPhone || '',
      items,
      subtotal: Number(req.body.subtotal) || 0,
      discount: Number(req.body.discount) || 0,
      tax: Number(req.body.tax) || 0,
      taxRate: Number(req.body.taxRate) || 0,
      totalAmount: Number(req.body.totalAmount ?? req.body.total) || 0,
      paymentMethod: req.body.paymentMethod || 'Credit Card',
      managerApproval: req.body.managerApproval || { required: false },
      status: 'Completed',
    }], { session });

    await Product.bulkWrite(items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, companyId },
        update: { $inc: { stock: -item.quantity } },
      },
    })), { session });

    await Audit.create([{
      companyId,
      action: 'SALE_COMPLETED',
      userEmail: req.user.email,
      details: `Completed sale ${receiptNumber} / ${invoiceNumber}`,
    }], { session });

    await session.commitTransaction();
    res.status(201).json({ sale: sale[0] });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create Sale Error:', error);
    res.status(400).json({ error: error.message || 'Failed to complete sale.' });
  } finally {
    session.endSession();
  }
});

export default router;
