import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

async function getApiConfig(supabase: any, userId: string | null): Promise<ApiConfig> {
  console.log('=== getApiConfig called ===');
  console.log('User ID:', userId);
  
  // Try Lovable AI first (always available in Lovable Cloud)
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY') || '';
  const lovableConfig: ApiConfig = {
    provider: 'lovable',
    apiKey: lovableApiKey,
    model: 'google/gemini-2.5-flash',
    endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
  };

  // Fallback to Google Gemini
  const defaultConfig: ApiConfig = {
    provider: 'google',
    apiKey: Deno.env.get('GOOGLE_API_KEY') || Deno.env.get('GEMINI_API_KEY') || '',
    model: 'gemini-2.0-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  };

  console.log('Environment check:', {
    hasLovableKey: !!lovableApiKey,
    hasGoogleKey: !!defaultConfig.apiKey
  });

  try {
    // First, check if user has their own API key
    if (userId) {
      console.log('Checking for user API key...');
      const { data: userKey, error: userKeyError } = await supabase
        .from('api_keys')
        .select('key_type, api_key')
        .eq('user_id', userId)
        .eq('is_global', false)
        .limit(1)
        .maybeSingle();

      if (userKeyError) {
        console.error('Error fetching user API key:', userKeyError);
      } else if (userKey?.api_key) {
        console.log('✅ Found user API key:', userKey.key_type);
        return getProviderConfig(userKey.key_type, userKey.api_key);
      } else {
        console.log('No user API key found');
      }
    }

    // Then, check for admin global API key (using service role to bypass RLS)
    console.log('Checking for admin global API key...');
    const { data: globalKey, error: globalKeyError } = await supabase
      .from('api_keys')
      .select('key_type, api_key')
      .eq('is_global', true)
      .limit(1)
      .maybeSingle();

    if (globalKeyError) {
      console.error('Error fetching global API key:', globalKeyError);
    } else if (globalKey?.api_key) {
      console.log('✅ Found admin global API key:', globalKey.key_type);
      return getProviderConfig(globalKey.key_type, globalKey.api_key);
    } else {
      console.log('No admin global API key found');
    }
  } catch (error) {
    console.error('Error fetching API keys from database:', error);
  }

  // Fall back to Lovable AI if API key is available
  if (lovableApiKey && lovableApiKey.trim() !== '') {
    console.log('Using default Lovable AI');
    return lovableConfig;
  }

  // Use Google Gemini as final fallback
  if (defaultConfig.apiKey && defaultConfig.apiKey.trim() !== '') {
    console.log('Using Google Gemini API');
    return defaultConfig;
  }

  // Return Lovable config as last resort (will use LOVABLE_API_KEY)
  console.log('Using Lovable AI endpoint');
  return lovableConfig;
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
      return {
        provider: 'lovable',
        apiKey: Deno.env.get('LOVABLE_API_KEY') || '',
        model: 'google/gemini-2.5-flash',
        endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
      };
  }
}

async function callAI(config: ApiConfig, systemPrompt: string, userMessage: string): Promise<Response> {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requirements, projectContext, platform } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables:', {
        hasSupabaseUrl: !!supabaseUrl,
        hasSupabaseKey: !!supabaseKey
      });
      return new Response(JSON.stringify({ 
        error: 'Server configuration error' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header if present
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        userId = user.id;
        console.log('Authenticated user:', userId);
      } else {
        console.log('No valid user token, proceeding without user context');
      }
    }
    
    console.log('=== PRD Generation Debug ===');
    console.log('User ID:', userId);
    
    // Get API configuration (user key > admin key > lovable/gemini default)
    const apiConfig = await getApiConfig(supabase, userId);
    
    console.log('API Config Selected:', {
      provider: apiConfig.provider,
      model: apiConfig.model,
      hasApiKey: !!apiConfig.apiKey,
      apiKeyLength: apiConfig.apiKey ? apiConfig.apiKey.length : 0,
      apiKeyPrefix: apiConfig.apiKey ? apiConfig.apiKey.substring(0, 10) + '...' : 'empty'
    });

    // Validate that we have an API key
    if (!apiConfig.apiKey || apiConfig.apiKey.trim() === '') {
      console.error('No API key configured');
      return new Response(JSON.stringify({ 
        error: 'AI API key not configured. The LOVABLE_API_KEY should be automatically available.',
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    console.log('Generating PRD');
    console.log('Platform:', platform);
    console.log('Using provider:', apiConfig.provider, 'model:', apiConfig.model);

    const response = await callAI(apiConfig, systemPrompt, userMessage);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({ error: 'Failed to generate PRD. Check your API key configuration.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Error in generate-prd:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', error);
    return new Response(JSON.stringify({ 
      error: message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
