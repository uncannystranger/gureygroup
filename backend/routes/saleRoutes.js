import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';
import Audit from '../models/Audit.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import EmployeeMember from '../models/EmployeeMember.js';
import { enforceTenantIsolation, requirePermission, requireBranchAccess } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);

const makeNumber = (prefix) => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

router.get('/', requirePermission('sales:view'), async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const branchId = await requireBranchAccess(req, req.query.branchId || req.headers['x-branch-id']);
    const filter = { companyId: req.tenantId, branchId };

    const sales = await Sale.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 100, 500));

    res.json({ sales });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message || 'Failed to fetch sales.' });
  }
});

router.post('/', requirePermission('sales:create'), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const companyId = req.tenantId;
    const branchId = await requireBranchAccess(req, req.body.branchId || req.headers['x-branch-id']);
    const branch = await Branch.findOne({ _id: branchId, companyId, status: 'active' }).session(session);
    if (!branch) throw new Error('Selected branch is not active or no longer exists.');

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

    const requestedCashierId = req.body.cashierId || req.user.uid;
    const cashierMembership = await Membership.findOne({
      userId: requestedCashierId,
      companyId,
      status: 'active',
    }).session(session);
    const canAssign = ['Owner', 'Admin', 'Manager'].includes(req.user.role) || req.user.permissions?.includes('sales:assign_cashier');
    if (requestedCashierId !== req.user.uid && !canAssign) {
      throw new Error('Forbidden: only managers can assign another cashier.');
    }
    if (!cashierMembership && requestedCashierId !== req.user.uid) {
      throw new Error('Selected cashier is not an active employee in this organization.');
    }
    const cashierProfile = requestedCashierId === req.user.uid
      ? null
      : await User.findOne({ firebaseUid: requestedCashierId }).select('displayName email').session(session)
        || await EmployeeMember.findOne({ employeeId: requestedCashierId, companyId, status: 'active' }).select('displayName email').session(session);
    const cashier = requestedCashierId === req.user.uid
      ? { id: req.user.uid, name: req.body.cashierName || req.user.displayName || req.user.email, role: req.user.role }
      : { id: requestedCashierId, name: cashierProfile?.displayName || cashierProfile?.email || cashierMembership.email, role: cashierMembership.role };

    const sale = await Sale.create([{
      companyId,
      branchId,
      branchName: branch?.name || req.body.branchName || '',
      posTerminalId: req.body.posTerminalId || 'web-pos',
      receiptNumber,
      invoiceNumber,
      cashierId: cashier.id,
      cashierName: cashier.name,
      cashierRole: cashier.role,
      employeeId: req.body.employeeId || cashier.id,
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
        filter: { _id: item.productId, companyId, branchId },
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
