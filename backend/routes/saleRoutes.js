import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import Branch from '../models/Branch.js';
import Audit from '../models/Audit.js';
import Membership from '../models/Membership.js';
import Customer from '../models/Customer.js';
import StockAdjustment from '../models/StockAdjustment.js';
import User from '../models/User.js';
import EmployeeMember from '../models/EmployeeMember.js';
import { enforceTenantIsolation, requirePermission, requireBranchAccess, requireVerifiedEmail } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);
router.use(requireVerifiedEmail);

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Mobile Money', 'Gift Card'];

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

    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (requestedItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Sale must include at least one item.' });
    }

    // Prices, names and line totals are resolved from the catalogue, never from
    // the request body — otherwise a caller could sell a $500 item for $0.01.
    // Stock is checked in the same transaction so a sale can never oversell.
    const catalogue = await Product.find({
      _id: { $in: requestedItems.map((item) => item.productId).filter(Boolean) },
      companyId,
      branchId,
      isArchived: false,
    }).session(session);
    const catalogueById = new Map(catalogue.map((product) => [String(product._id), product]));

    const items = requestedItems.map((item) => {
      const product = catalogueById.get(String(item.productId));
      if (!product) {
        const error = new Error(`Product "${item.productName || item.productId}" is not available in this branch.`);
        error.status = 400;
        throw error;
      }
      const quantity = Math.floor(Number(item.quantity));
      if (!Number.isFinite(quantity) || quantity < 1) {
        const error = new Error(`Invalid quantity for "${product.name}".`);
        error.status = 400;
        throw error;
      }
      if (product.stock < quantity) {
        const error = new Error(`Insufficient stock for "${product.name}" — ${product.stock} remaining.`);
        error.status = 409;
        throw error;
      }
      return {
        productId: String(product._id),
        productName: product.name,
        sku: product.sku || '',
        unitPrice: product.sellingPrice,
        quantity,
        totalPrice: Number((product.sellingPrice * quantity).toFixed(2)),
      };
    });

    // Money is recomputed server-side from the resolved lines.
    const subtotal = Number(items.reduce((sum, item) => sum + item.totalPrice, 0).toFixed(2));
    const requestedDiscount = Math.max(0, Number(req.body.discount) || 0);
    const discount = Number(Math.min(requestedDiscount, subtotal).toFixed(2));
    const taxRate = Math.max(0, Number(req.body.taxRate) || 0);
    const tax = Number(((subtotal - discount) * (taxRate / 100)).toFixed(2));
    const totalAmount = Number((subtotal - discount + tax).toFixed(2));

    // Validate against the contract here so the client gets a readable message
    // instead of a raw schema-validation dump.
    const paymentMethod = req.body.paymentMethod || 'Cash';
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      const error = new Error(`Unsupported payment method. Use one of: ${PAYMENT_METHODS.join(', ')}.`);
      error.status = 400;
      throw error;
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
      subtotal,
      discount,
      tax,
      taxRate,
      totalAmount,
      paymentMethod,
      managerApproval: req.body.managerApproval || { required: false },
      status: 'Completed',
    }], { session });

    const stockResult = await Product.bulkWrite(items.map((item) => ({
      updateOne: {
        // The stock guard in the filter makes the decrement atomic: a racing
        // sale that already consumed the units simply fails to match.
        filter: { _id: item.productId, companyId, branchId, stock: { $gte: item.quantity } },
        update: { $inc: { stock: -item.quantity } },
      },
    })), { session });

    if ((stockResult.modifiedCount || 0) !== items.length) {
      const error = new Error('Stock changed while completing this sale. Please review the cart and try again.');
      error.status = 409;
      throw error;
    }

    // Every stock movement is written to the ledger inside the same
    // transaction, so the audit trail cannot drift from the recorded stock.
    await StockAdjustment.insertMany(items.map((item) => ({
      companyId,
      branchId,
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      delta: -item.quantity,
      reason: `Sale ${receiptNumber}`,
      source: 'sale',
      userId: req.user.uid,
      userName: req.user.email,
    })), { session });

    // Keep the derived stock status in step with the new quantities so the
    // catalogue and dashboard do not keep showing sold-out items as in stock.
    await Product.bulkWrite(items.map((item) => ({
      updateOne: {
        filter: { _id: item.productId, companyId, branchId },
        update: [{
          $set: {
            status: {
              $switch: {
                branches: [
                  { case: { $lte: ['$stock', 0] }, then: 'Out of Stock' },
                  { case: { $lte: ['$stock', '$minStockThreshold'] }, then: 'Low Stock' },
                ],
                default: 'In Stock',
              },
            },
          },
        }],
      },
    })), { session });

    // Customer totals are derived from the sale that just happened, inside the
    // same transaction, so they can never drift from the recorded revenue and
    // cannot be set by the client.
    if (req.body.customerId) {
      await Customer.updateOne(
        { _id: req.body.customerId, companyId },
        {
          $inc: {
            loyaltyPoints: Math.floor(totalAmount),
            totalSpent: totalAmount,
            visits: 1,
          },
          $set: { lastPurchaseAt: new Date() },
        },
        { session }
      );
    }

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
    res.status(error.status || 400).json({ error: error.message || 'Failed to complete sale.' });
  } finally {
    session.endSession();
  }
});

export default router;
