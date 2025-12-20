// PRD Generator - Direct API calls from frontend (no Edge Functions needed!)

const systemPrompt = `You are an expert product manager and technical architect. Your task is to create detailed, professional Product Requirements Documents (PRDs) that are specifically formatted for AI coding assistants like Cursor, Lovable, and Replit.

When generating a PRD, you should:

1. **Understand the Context**: Analyze the user's requirements thoroughly. If they've uploaded project files, understand the existing architecture.

2. **Structure the PRD Properly** with these sections:
   - **Project Overview**: Brief description, goals, and target users
   - **Technical Stack**: Recommended technologies, frameworks, and tools
   - **Core Features**: Detailed breakdown of features with acceptance criteria
   - **User Stories**: Clear user stories in "As a [user], I want [feature], so that [benefit]" format
   - **Database Schema**: If applicable, include table structures and relationships
   - **API Endpoints**: RESTful endpoints with methods, parameters, and responses
   - **UI/UX Requirements**: Page layouts, components, and user flows
   - **Step-by-Step Implementation Plan**: Numbered steps for the AI to follow
   - **Testing Requirements**: What should be tested and how
   - **Edge Cases & Error Handling**: Potential issues and how to handle them

3. **Format for AI Assistants**:
   - Use clear markdown formatting
   - Include code snippets where helpful
   - Be specific and actionable
   - Avoid ambiguity
   - Include file structure recommendations

4. **Platform-Specific Formatting**:
   - For **Cursor**: Include file paths and detailed code comments
   - For **Lovable**: Focus on component structure and visual requirements
   - For **Replit**: Include environment setup and deployment notes

Be thorough but concise. Every instruction should be clear enough that an AI coding assistant can follow it without additional clarification.`;

interface ApiConfig {
  provider: 'lovable' | 'openai' | 'google' | 'anthropic';
  apiKey: string;
  model: string;
  endpoint: string;
}

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
  const { supabase } = await import('@/integrations/supabase/client');
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Please sign in to generate PRDs');
  }

  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  // Get API configuration
  const apiConfig = await getApiConfig(supabase, userId);
  if (!apiConfig) {
    throw new Error(
      'No API key configured. Please add an API key in the Admin Dashboard, or configure VITE_GOOGLE_API_KEY or VITE_LOVABLE_API_KEY environment variable.'
    );
  }

  if (onConfig) {
    onConfig(apiConfig);
  }

  const userMessage = `
Generate a detailed PRD for the following project requirements. This PRD will be used with ${platform || 'AI coding assistants'}.

**User Requirements:**
${requirements}

${projectContext ? `**Existing Project Context:**
${projectContext}

Please analyze this existing project and create a PRD that builds upon or improves the current architecture.` : ''}

Please generate a comprehensive, well-structured PRD that an AI coding assistant can follow step-by-step to implement this project.
`;

  // Call AI API
  const response = await callAI(apiConfig, systemPrompt, userMessage);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Failed to generate PRD';
    let errorDetails: any = null;
    
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.error?.message || error.message || errorMessage;
      errorDetails = error.error || error;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    if (response.status === 429) {
      // Rate limit - provide more helpful message
      const details = errorDetails ? ` Details: ${JSON.stringify(errorDetails)}` : '';
      throw new Error(`Rate limit exceeded. This can happen if:
1. Your API key has hit its quota limit
2. Your IP address was rate-limited
3. Google's free tier has daily limits

Please try again in 5-10 minutes, or check your Google Cloud Console quotas.${details}`);
    }
    if (response.status === 402) {
      throw new Error('Usage limit reached. Please add credits to your Google Cloud account.');
    }
    if (response.status === 403) {
      throw new Error('API key is invalid or doesn\'t have permission. Please check your Google Cloud Console API key settings.');
    }
    
    throw new Error(errorMessage || `Failed to generate PRD (Status: ${response.status}). Check your API key configuration.`);
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

