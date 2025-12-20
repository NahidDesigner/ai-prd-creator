// PRD Generator - Uses Edge Function with Lovable AI

import { supabase } from '@/integrations/supabase/client';

interface ApiConfig {
  provider: 'lovable' | 'openai' | 'google' | 'anthropic';
  apiKey: string;
  model: string;
  endpoint: string;
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
