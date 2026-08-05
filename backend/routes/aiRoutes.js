import express from 'express';
import AiConversation from '../models/AiConversation.js';
import { enforceTenantIsolation } from '../middleware/auth.js';
import { generateResponse, getAiProviderStatus } from '../services/aiService.js';
import { buildAiWorkspaceContext } from '../services/aiWorkspaceContext.js';

const router = express.Router();
router.use(enforceTenantIsolation);

router.get('/status', (req, res) => res.json({ status: getAiProviderStatus().available ? 'connected' : 'unavailable', ...(req.user.role === 'Owner' || req.user.role === 'Admin' ? { diagnostic: getAiProviderStatus() } : {}) }));

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

    const context = await buildAiWorkspaceContext({ companyId: req.tenantId, user: req.user, branchId: req.headers['x-branch-id'] });
    conversation.messages.push({ role: 'user', content: content.trim() });

    const reply = await generateResponse({ prompt: content.trim(), context });
    conversation.messages.push({ role: 'assistant', content: reply });
    if (conversation.title === 'New Conversation') {
      conversation.title = content.trim().slice(0, 60);
    }
    await conversation.save();

    res.json({ conversation, message: conversation.messages[conversation.messages.length - 1] });
  } catch (error) {
    console.error('AI Message Error:', error);
    res.status(error.status || 500).json({ error: error.code === 'AI_PROVIDER_UNAVAILABLE' ? 'Assistant temporarily unavailable.' : 'Failed to process AI message.', code: error.code });
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
