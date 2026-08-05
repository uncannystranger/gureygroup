const providerConfig = () => ({
  openai: Boolean(process.env.OPENAI_API_KEY),
  gemini: Boolean(process.env.GEMINI_API_KEY),
});

const generateWithOpenAI = async ({ prompt, context }) => {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', input: [
      { role: 'system', content: 'You are a multi-tenant operations assistant. Use only the supplied controlled workspace facts. Never invent live values or claim access to data not provided.' },
      { role: 'user', content: `Controlled workspace context: ${JSON.stringify(context)}\n\nUser request: ${prompt}` },
    ] }),
  });
  if (!response.ok) throw new Error(`OpenAI provider error: ${response.status}`);
  const data = await response.json();
  return data.output_text || 'No response text returned by provider.';
};

const generateWithGemini = async ({ prompt, context }) => {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `You are a multi-tenant operations assistant. Use only these controlled workspace facts: ${JSON.stringify(context)}\n\n${prompt}` }] }] }),
  });
  if (!response.ok) throw new Error(`Gemini provider error: ${response.status}`);
  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response text returned by provider.';
};

export const getAiProviderStatus = () => {
  const configured = providerConfig();
  const selected = process.env.AI_PROVIDER || (configured.openai ? 'openai' : configured.gemini ? 'gemini' : null);
  return { provider: selected, configured: Boolean(selected && configured[selected]), available: Boolean(selected && configured[selected]) };
};

export const generateResponse = async ({ prompt, context }) => {
  const status = getAiProviderStatus();
  if (!status.available) {
    const error = new Error('Assistant temporarily unavailable.');
    error.code = 'AI_PROVIDER_UNAVAILABLE';
    error.status = 503;
    throw error;
  }
  if (status.provider === 'gemini') return generateWithGemini({ prompt, context });
  return generateWithOpenAI({ prompt, context });
};
