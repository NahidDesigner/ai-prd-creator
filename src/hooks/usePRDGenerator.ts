import { useState, useCallback } from "react";
import { toast } from "sonner";

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
      const response = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
              setPrdContent((prev) => prev + content);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
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
    clearPRD: () => setPrdContent(""),
  };
}
