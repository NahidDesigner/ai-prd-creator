import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requirements, projectContext, platform } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    console.log('Generating PRD for platform:', platform);
    console.log('Requirements length:', requirements?.length);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
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
      
      return new Response(JSON.stringify({ error: 'Failed to generate PRD' }), {
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
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
