// Supabase Edge Function for AI Chat
// This runs on Deno Deploy and handles AI API calls securely

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  provider?: 'claude' | 'openai';
  maxTokens?: number;
  breedContext?: string;
}

async function callClaude(messages: Array<{ role: string; content: string }>, options: { maxTokens?: number; breedContext?: string }) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY'); // allow-secret
  if (!apiKey) throw new Error('Claude API key not configured');

  const systemPrompt = options.breedContext
    ? `${SYSTEM_PROMPT}\n\nBreed context: ${options.breedContext}`
    : SYSTEM_PROMPT;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens || 1024,
      system: systemPrompt,
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
    model: 'claude-3-5-sonnet-20241022',
    usage: data.usage,
  };
}

async function callOpenAI(messages: Array<{ role: string; content: string }>, options: { maxTokens?: number; breedContext?: string }) {
  const apiKey = Deno.env.get('OPENAI_API_KEY'); // allow-secret
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const systemPrompt = options.breedContext
    ? `${SYSTEM_PROMPT}\n\nBreed context: ${options.breedContext}`
    : SYSTEM_PROMPT;

  const systemMessage = { role: 'system', content: systemPrompt };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: options.maxTokens || 1024,
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
    model: 'gpt-4o-mini',
    usage: data.usage,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check rate limit
    const { data: rateLimitData } = await supabaseClient.rpc('check_ai_rate_limit', {
      p_user_id: user.id,
    });

    if (rateLimitData && !rateLimitData[0]?.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          remaining: 0,
          limit: rateLimitData[0]?.messages_limit || 5,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const body: ChatRequest = await req.json();
    const { messages, provider = 'claude', maxTokens, breedContext } = body;

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    // Try primary provider, fall back to secondary
    let result;
    const providers = provider === 'claude'
      ? [callClaude, callOpenAI]
      : [callOpenAI, callClaude];

    for (const providerFn of providers) {
      try {
        result = await providerFn(messages, { maxTokens, breedContext });
        break;
      } catch (err) {
        console.error(`Provider failed:`, err.message);
        // Continue to next provider
      }
    }

    if (!result) {
      throw new Error('All AI providers failed');
    }

    // Increment usage
    await supabaseClient.rpc('increment_ai_usage', {
      p_user_id: user.id,
      p_tokens: result.usage?.total_tokens || 0,
    });

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
