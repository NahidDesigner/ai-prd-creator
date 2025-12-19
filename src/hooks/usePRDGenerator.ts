import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prd`;

export function usePRDGenerator() {
  const [prdContent, setPrdContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePRD = useCallback(async (
    requirements: string,
    platform: string,
    projectContext?: string
  ) => {
    if (!requirements.trim()) {
      toast.error("Please enter your project requirements");
      return;
    }

    setIsGenerating(true);
    setPrdContent("");

    try {
      // Get the user's session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to generate PRDs");
        setIsGenerating(false);
        return;
      }

      const response = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          requirements,
          platform,
          projectContext,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate PRD");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

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
              fullContent += content;
              setPrdContent((prev) => prev + content);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save to database if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user && fullContent) {
        const title = generateTitle(requirements);
        const { error } = await supabase.from("prds").insert({
          user_id: user.id,
          title,
          requirements,
          platform,
          content: fullContent,
        });

        if (error) {
          console.error("Failed to save PRD:", error);
        }
      }

      toast.success("PRD generated successfully!");
    } catch (error) {
      console.error("Error generating PRD:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate PRD");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    prdContent,
    isGenerating,
    generatePRD,
    setPrdContent,
    clearPRD: () => setPrdContent(""),
  };
}

function generateTitle(requirements: string): string {
  const words = requirements.split(/\s+/).slice(0, 6).join(" ");
  return words.length > 50 ? words.slice(0, 50) + "..." : words || "Untitled PRD";
}
