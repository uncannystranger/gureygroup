import express from 'express';
import AiConversation from '../models/AiConversation.js';
import Product from '../models/Product.js';
import Sale from '../models/Sale.js';
import Membership from '../models/Membership.js';
import { enforceTenantIsolation } from '../middleware/auth.js';

const router = express.Router();
router.use(enforceTenantIsolation);

const buildWorkspaceContext = async (companyId) => {
  const [productCount, lowStockCount, salesCount, employeeCount] = await Promise.all([
    Product.countDocuments({ companyId, isArchived: { $ne: true } }),
    Product.countDocuments({ companyId, isArchived: { $ne: true }, status: 'Low Stock' }),
    Sale.countDocuments({ companyId }),
    Membership.countDocuments({ companyId, status: 'active' }),
  ]);

  return { productCount, lowStockCount, salesCount, employeeCount };
};

const callConfiguredProvider = async ({ prompt, context }) => {
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        input: [
          {
            role: 'system',
            content: 'You are an operations assistant for a multi-tenant SaaS POS, inventory, employee, and branch management platform. Use the supplied workspace facts. Do not invent live database values.',
          },
          {
            role: 'user',
            content: `Workspace context: ${JSON.stringify(context)}\n\nUser request: ${prompt}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI provider error: ${response.status}`);
    }
    const data = await response.json();
    return data.output_text || 'No response text returned by provider.';
  }

  if (process.env.GEMINI_API_KEY) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `Workspace context: ${JSON.stringify(context)}\n\n${prompt}` }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini provider error: ${response.status}`);
    }
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text returned by provider.';
  }

  return `AI provider is not configured. Current workspace facts: ${context.productCount} products, ${context.lowStockCount} low-stock products, ${context.salesCount} sales records, ${context.employeeCount} active employees.`;
};

router.get('/conversations', async (req, res) => {
  try {
    const conversations = await AiConversation.find({ companyId: req.tenantId, userId: req.user.uid })
      .sort({ pinned: -1, updatedAt: -1 })
      .limit(50);
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load AI conversations.' });
  }
});

router.post('/conversations', async (req, res) => {
  try {
    const conversation = await AiConversation.create({
      companyId: req.tenantId,
      userId: req.user.uid,
      title: req.body.title || 'New Conversation',
      messages: [],
    });
    res.status(201).json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create AI conversation.' });
  }
});

router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'Message content is required.' });

    const conversation = await AiConversation.findOne({ _id: req.params.id, companyId: req.tenantId, userId: req.user.uid });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });

    const context = await buildWorkspaceContext(req.tenantId);
    conversation.messages.push({ role: 'user', content: content.trim() });

    const reply = await callConfiguredProvider({ prompt: content.trim(), context });
    conversation.messages.push({ role: 'assistant', content: reply });
    if (conversation.title === 'New Conversation') {
      conversation.title = content.trim().slice(0, 60);
    }
    await conversation.save();

    res.json({ conversation, message: conversation.messages[conversation.messages.length - 1] });
  } catch (error) {
    console.error('AI Message Error:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI message.' });
  }
});

router.patch('/conversations/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.pinned !== undefined) updates.pinned = !!req.body.pinned;
    const conversation = await AiConversation.findOneAndUpdate(
      { _id: req.params.id, companyId: req.tenantId, userId: req.user.uid },
      { $set: updates },
      { new: true }
    );
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    res.json({ conversation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update AI conversation.' });
  }
});

router.delete('/conversations/:id', async (req, res) => {
  try {
    const conversation = await AiConversation.findOneAndDelete({
      _id: req.params.id,
      companyId: req.tenantId,
      userId: req.user.uid,
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete AI conversation.' });
  }
});

export default router;
