import express from 'express';
import Customer from '../models/Customer.js';
import Audit from '../models/Audit.js';
import { enforceTenantIsolation, requirePermission, requireVerifiedEmail } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);
router.use(requireVerifiedEmail);

/** Customers are part of the sales surface, so they follow the sales grants. */
router.get('/', requirePermission('sales:view'), async (req, res) => {
  try {
    const customers = await Customer.find({ companyId: req.tenantId, isArchived: { $ne: true } })
      .sort({ updatedAt: -1 })
      .limit(500);
    res.json({ customers });
  } catch (error) {
    console.error('List Customers Error:', error);
    res.status(500).json({ error: 'Failed to load customers.' });
  }
});

router.post('/', requirePermission('sales:create'), async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'A customer name is required.' });

    const customer = await Customer.create({
      companyId: req.tenantId,
      name: name.trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim(),
      address: address || '',
      notes: notes || '',
      createdBy: req.user.email,
    });

    await Audit.create({
      companyId: req.tenantId,
      action: 'CUSTOMER_CREATED',
      userEmail: req.user.email,
      details: `Added customer ${customer.name}`,
    });

    res.status(201).json({ customer });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'A customer with that phone number already exists.' });
    }
    console.error('Create Customer Error:', error);
    res.status(400).json({ error: error.message || 'Failed to create customer.' });
  }
});

router.patch('/:id', requirePermission('sales:create'), async (req, res) => {
  try {
    const ALLOWED = ['name', 'phone', 'email', 'address', 'notes', 'loyaltyPoints', 'isArchived'];
    const updates = {};
    ALLOWED.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    res.json({ customer });
  } catch (error) {
    if (error.name === 'CastError') return res.status(400).json({ error: 'Invalid customer id.' });
    console.error('Update Customer Error:', error);
    res.status(400).json({ error: 'Failed to update customer.' });
  }
});

export default router;
