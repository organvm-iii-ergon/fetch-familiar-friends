/**
 * Multi-provider AI Service
 *
 * Supports multiple AI providers with automatic fallback:
 * 1. Claude API (primary)
 * 2. OpenAI GPT-4 (secondary)
 * 3. Hugging Face Inference API (free tier)
 */

import { supabase, isOnlineMode } from '../config/supabase';

// Provider configurations
const AI_PROVIDERS = {
  claude: {
    name: 'Claude',
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1024,
    available: !!import.meta.env.VITE_ANTHROPIC_API_KEY,
  },
  openai: {
    name: 'OpenAI',
    model: 'gpt-4o-mini',
    maxTokens: 1024,
    available: !!import.meta.env.VITE_OPENAI_API_KEY,
  },
  huggingface: {
    name: 'Hugging Face',
    model: 'meta-llama/Llama-2-70b-chat-hf',
    maxTokens: 512,
    available: true, // Always available as free fallback
  },
};

// System prompt for pet-focused conversations
const SYSTEM_PROMPT = `You are a friendly and knowledgeable pet care assistant for DogTale Daily, an app dedicated to dogs and cats. Your role is to:

1. Answer questions about pet care, health, training, and behavior
2. Provide breed-specific information when asked
3. Offer tips for pet wellness and nutrition
4. Share fun facts about dogs and cats
5. Help users understand their pet's needs

Guidelines:
- Be warm, encouraging, and supportive
- Provide accurate, helpful information
- If a question requires professional veterinary advice, recommend consulting a vet
- Keep responses concise but informative
- Use occasional dog/cat emojis to keep the tone friendly
- If you don't know something, say so rather than guessing

Remember: You're here to enhance the joy of pet ownership, not replace professional veterinary care.`;

/**
 * Check if user can send AI message (rate limiting)
 * @param {string} userId
 * @returns {Promise<{allowed: boolean, remaining: number, limit: number}>}
 */
export async function checkAiRateLimit(userId) {
  if (!isOnlineMode || !userId) {
    // Offline mode: allow unlimited for now
    return { allowed: true, remaining: Infinity, limit: Infinity };
  }

  try {
    const { data, error } = await supabase.rpc('check_ai_rate_limit', {
      p_user_id: userId,
    });

    if (error) throw error;

    return {
      allowed: data[0]?.allowed ?? true,
      remaining: (data[0]?.messages_limit ?? 5) - (data[0]?.messages_used ?? 0),
      limit: data[0]?.messages_limit ?? 5,
      used: data[0]?.messages_used ?? 0,
    };
  } catch (err) {
    console.error('Error checking rate limit:', err);
    return { allowed: true, remaining: 5, limit: 5, used: 0 };
  }
}

/**
 * Increment AI usage counter
 * @param {string} userId
 * @param {number} tokens
 */
export async function incrementAiUsage(userId, tokens = 0) {
  if (!isOnlineMode || !userId) return;

  try {
    await supabase.rpc('increment_ai_usage', {
      p_user_id: userId,
      p_tokens: tokens,
    });
  } catch (err) {
    console.error('Error incrementing AI usage:', err);
  }
}

/**
 * Save AI conversation to database
 * @param {string} userId
 * @param {string} conversationId
 * @param {Array} messages
 */
export async function saveConversation(userId, conversationId, messages) {
  if (!isOnlineMode || !userId) return;

  try {
    // Upsert conversation
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .upsert({
        id: conversationId,
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convError) throw convError;

    // Save new messages (only save user and assistant messages)
    const messagesToSave = messages
      .filter(m => m.role !== 'system' && !m.saved)
      .map(m => ({
        conversation_id: conversation.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata || {},
      }));

    if (messagesToSave.length > 0) {
      const { error: msgError } = await supabase
        .from('ai_messages')
        .insert(messagesToSave);

      if (msgError) throw msgError;
    }
  } catch (err) {
    console.error('Error saving conversation:', err);
  }
}

/**
 * Load conversation history from database
 * @param {string} userId
 * @param {string} conversationId
 * @returns {Promise<Array>}
 */
export async function loadConversation(userId, conversationId) {
  if (!isOnlineMode || !userId || !conversationId) return [];

  try {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data.map(m => ({
      role: m.role,
      content: m.content,
      metadata: m.metadata,
      saved: true,
    }));
  } catch (err) {
    console.error('Error loading conversation:', err);
    return [];
  }
}

/**
 * Call AI via Supabase Edge Function (recommended for security)
 * @param {Array} messages
 * @param {Object} options
 */
async function callAiViaEdgeFunction(messages, options = {}) {
  const { data, error } = await supabase.functions.invoke('ai-chat', {
    body: {
      messages,
      provider: options.provider || 'claude',
      maxTokens: options.maxTokens || 1024,
      breedContext: options.breedContext,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Call Claude API directly (client-side, less secure)
 * @param {Array} messages
 * @param {Object} options
 */
async function callClaudeDirectly(messages, options = {}) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY; // allow-secret
  if (!apiKey) throw new Error('Claude API key not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: AI_PROVIDERS.claude.model,
      max_tokens: options.maxTokens || AI_PROVIDERS.claude.maxTokens,
      system: SYSTEM_PROMPT + (options.breedContext ? `\n\nBreed context: ${options.breedContext}` : ''),
      messages: messages.filter(m => m.role !== 'system'),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API error');
  }

  const data = await response.json();
  return {
    content: data.content[0]?.text || '',
    provider: 'claude',
    model: AI_PROVIDERS.claude.model,
  };
}

/**
 * Call OpenAI API directly
 * @param {Array} messages
 * @param {Object} options
 */
async function callOpenAIDirectly(messages, options = {}) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // allow-secret
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const systemMessage = {
    role: 'system',
    content: SYSTEM_PROMPT + (options.breedContext ? `\n\nBreed context: ${options.breedContext}` : ''),
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_PROVIDERS.openai.model,
      max_tokens: options.maxTokens || AI_PROVIDERS.openai.maxTokens,
      messages: [systemMessage, ...messages.filter(m => m.role !== 'system')],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return {
    content: data.choices[0]?.message?.content || '',
    provider: 'openai',
    model: AI_PROVIDERS.openai.model,
  };
}

/**
 * Call Hugging Face Inference API (free fallback)
 * @param {Array} messages
 * @param {Object} options
 */
async function callHuggingFaceDirectly(messages, options = {}) {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY || ''; // allow-secret

  // Format messages for Llama-style chat
  const prompt = messages
    .filter(m => m.role !== 'system')
    .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
    .join('\n\n');

  const fullPrompt = `${SYSTEM_PROMPT}\n\n${prompt}\n\nAssistant:`;

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${AI_PROVIDERS.huggingface.model}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` }),
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: options.maxTokens || AI_PROVIDERS.huggingface.maxTokens,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Hugging Face API error');
  }

  const data = await response.json();
  return {
    content: data[0]?.generated_text || '',
    provider: 'huggingface',
    model: AI_PROVIDERS.huggingface.model,
  };
}

/**
 * Main AI chat function with provider fallback
 * @param {Array} messages - Array of {role, content} objects
 * @param {Object} options
 * @param {string} options.breedContext - Optional breed-specific context
 * @param {string} options.preferredProvider - Preferred AI provider
 * @param {boolean} options.useEdgeFunction - Use Supabase Edge Function (more secure)
 * @returns {Promise<{content: string, provider: string, model: string}>}
 */
export async function sendAiMessage(messages, options = {}) {
  const providers = [
    { key: 'claude', call: callClaudeDirectly },
    { key: 'openai', call: callOpenAIDirectly },
    { key: 'huggingface', call: callHuggingFaceDirectly },
  ];

  // If edge function is preferred and available, try it first
  if (options.useEdgeFunction && isOnlineMode) {
    try {
      return await callAiViaEdgeFunction(messages, options);
    } catch (err) {
      console.warn('Edge function failed, falling back to direct calls:', err);
    }
  }

  // Reorder providers based on preference
  if (options.preferredProvider) {
    const preferred = providers.find(p => p.key === options.preferredProvider);
    if (preferred) {
      providers.splice(providers.indexOf(preferred), 1);
      providers.unshift(preferred);
    }
  }

  // Try providers in order until one succeeds
  let lastError;
  for (const provider of providers) {
    if (!AI_PROVIDERS[provider.key]?.available && provider.key !== 'huggingface') {
      continue;
    }

    try {
      return await provider.call(messages, options);
    } catch (err) {
      console.warn(`${provider.key} failed:`, err.message);
      lastError = err;
    }
  }

  // All providers failed
  throw lastError || new Error('All AI providers failed');
}

/**
 * Generate a streaming response (for supported providers)
 * @param {Array} messages
 * @param {Function} onChunk - Callback for each text chunk
 * @param {Object} options
 */
export async function streamAiMessage(messages, onChunk, options = {}) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY; // allow-secret
  if (!apiKey) {
    // Fall back to non-streaming
    const response = await sendAiMessage(messages, options);
    onChunk(response.content, true);
    return response;
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: AI_PROVIDERS.claude.model,
      max_tokens: options.maxTokens || 1024,
      stream: true,
      system: SYSTEM_PROMPT + (options.breedContext ? `\n\nBreed context: ${options.breedContext}` : ''),
      messages: messages.filter(m => m.role !== 'system'),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Claude API error');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6); // Remove 'data: ' prefix
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          fullContent += parsed.delta.text;
          onChunk(parsed.delta.text, false);
        }
      } catch {
        // Ignore parse errors for incomplete chunks
      }
    }
  }

  onChunk('', true); // Signal completion

  return {
    content: fullContent,
    provider: 'claude',
    model: AI_PROVIDERS.claude.model,
  };
}

/**
 * Get available AI providers
 * @returns {Array}
 */
export function getAvailableProviders() {
  return Object.entries(AI_PROVIDERS)
    .filter(([, config]) => config.available)
    .map(([key, config]) => ({
      key,
      name: config.name,
      model: config.model,
    }));
}

export { AI_PROVIDERS, SYSTEM_PROMPT };
