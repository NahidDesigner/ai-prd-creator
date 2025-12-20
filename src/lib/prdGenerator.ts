// PRD Generator - Direct API calls from frontend (no Edge Functions needed!)

interface ApiConfig {
  provider: 'lovable' | 'openai' | 'google' | 'anthropic';
  apiKey: string;
  model: string;
  endpoint: string;
}

<<<<<<< HEAD
export async function getApiConfig(
  supabase: any,
  userId: string | null
): Promise<ApiConfig | null> {
  try {
    // First, check if user has their own API key
    if (userId) {
      const { data: userKey } = await supabase
        .from('api_keys')
        .select('key_type, api_key')
        .eq('user_id', userId)
        .eq('is_global', false)
        .order('key_type', { ascending: true }) // Prioritize 'openai' over 'google'
        .limit(1)
        .maybeSingle();

      if (userKey?.api_key) {
        console.log('✅ Using user API key:', userKey.key_type, '(prefix:', userKey.api_key.substring(0, 10) + '...)');
        return getProviderConfig(userKey.key_type, userKey.api_key);
      }
    }

    // Then, check for admin global API key - prioritize OpenAI
    const { data: globalKeys } = await supabase
      .from('api_keys')
      .select('key_type, api_key')
      .eq('is_global', true)
      .order('key_type', { ascending: true }) // 'openai' comes before 'google' alphabetically
      .limit(10);

    if (globalKeys && globalKeys.length > 0) {
      // Prioritize OpenAI if available
      const openaiKey = globalKeys.find(k => k.key_type === 'openai');
      if (openaiKey?.api_key) {
        console.log('✅ Using global OpenAI API key (prefix:', openaiKey.api_key.substring(0, 10) + '...)');
        return getProviderConfig('openai', openaiKey.api_key);
      }
      
      // Fallback to first available key
      const firstKey = globalKeys[0];
      if (firstKey?.api_key) {
        console.log('✅ Using global admin API key:', firstKey.key_type, '(prefix:', firstKey.api_key.substring(0, 10) + '...)');
        return getProviderConfig(firstKey.key_type, firstKey.api_key);
      }
    }

    console.log('⚠️ No API keys found in database');

    // Fallback to environment variables (if available in frontend) - prioritize OpenAI
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openaiKey) {
      console.log('✅ Using OpenAI API key from environment variable (prefix:', openaiKey.substring(0, 10) + '...)');
      return {
        provider: 'openai',
        apiKey: openaiKey,
        model: 'gpt-4o',
        endpoint: 'https://api.openai.com/v1/chat/completions',
      };
    }

    const googleKey = import.meta.env.VITE_GOOGLE_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
    if (googleKey) {
      console.log('✅ Using Google API key from environment variable (prefix:', googleKey.substring(0, 10) + '...)');
      return {
        provider: 'google',
        apiKey: googleKey,
        model: 'gemini-2.0-flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      };
    }

    const lovableKey = import.meta.env.VITE_LOVABLE_API_KEY;
    if (lovableKey) {
      console.log('✅ Using Lovable API key from environment variable');
      return {
        provider: 'lovable',
        apiKey: lovableKey,
        model: 'google/gemini-2.5-flash',
        endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
      };
    }

    return null; // No API key found
  } catch (error) {
    console.error('Error fetching API config:', error);
    return null;
  }
}

function getProviderConfig(keyType: string, apiKey: string): ApiConfig {
  switch (keyType) {
    case 'openai':
      return {
        provider: 'openai',
        apiKey,
        model: 'gpt-4o',
        endpoint: 'https://api.openai.com/v1/chat/completions',
      };
    case 'google':
      return {
        provider: 'google',
        apiKey,
        model: 'gemini-2.0-flash',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      };
    case 'anthropic':
      return {
        provider: 'anthropic',
        apiKey,
        model: 'claude-sonnet-4-20250514',
        endpoint: 'https://api.anthropic.com/v1/messages',
      };
    default:
      // Default to Lovable
      return {
        provider: 'lovable',
        apiKey,
        model: 'google/gemini-2.5-flash',
        endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
      };
  }
}

export async function callAI(
  config: ApiConfig,
  systemPrompt: string,
  userMessage: string
): Promise<Response> {
  if (config.provider === 'anthropic') {
    // Anthropic has a different API format
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
        stream: true,
      }),
    });
    return response;
  }

  // OpenAI-compatible APIs (OpenAI, Google, Lovable)
  const response = await fetch(config.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: true,
    }),
  });

  return response;
}

export async function* generatePRDStream(
  requirements: string,
  platform: string,
  projectContext?: string,
  onConfig?: (config: ApiConfig) => void
): AsyncGenerator<string, void, unknown> {
  // Get current session for auth token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Please sign in to generate PRDs');
  }

  // Call the edge function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/generate-prd`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      requirements,
      platform,
      projectContext,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to generate PRD';
    
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 402) {
      throw new Error('Usage limit reached. Please add credits to continue.');
    }
    
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  // Stream the response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Invalid JSON, skip this line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Legacy export for compatibility
export async function getApiConfig(
  supabase: any,
  userId: string | null
): Promise<ApiConfig | null> {
  // This is now handled server-side in the edge function
  return null;
}

export async function callAI(
  config: ApiConfig,
  systemPrompt: string,
  userMessage: string
): Promise<Response> {
  // This is now handled server-side in the edge function
  throw new Error('Direct AI calls are not supported. Use generatePRDStream instead.');
}
