import mongoose from 'mongoose';

const aiMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  toolCalls: [{ type: mongoose.Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const aiConversationSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  title: { type: String, default: 'New Conversation' },
  pinned: { type: Boolean, default: false },
  messages: [aiMessageSchema],
}, {
  timestamps: true,
});

aiConversationSchema.index({ companyId: 1, updatedAt: -1 });

export default mongoose.models.AiConversation || mongoose.model('AiConversation', aiConversationSchema);
