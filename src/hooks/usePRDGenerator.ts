import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePRDStream } from "@/lib/prdGenerator";

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
      let fullContent = "";

      // Use the new direct API call generator
      for await (const chunk of generatePRDStream(requirements, platform, projectContext)) {
        fullContent += chunk;
        setPrdContent((prev) => prev + chunk);
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
