import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generatePRDStream, refinePRDStream } from "@/lib/prdGenerator";

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

  const refinePRD = useCallback(async (
    existingPRD: string,
    additionalRequirements: string,
    platform: string,
    projectContext?: string
  ) => {
    if (!additionalRequirements.trim()) {
      toast.error("Please enter additional requirements");
      return;
    }

    if (!existingPRD.trim()) {
      toast.error("No existing PRD to refine. Please generate a PRD first.");
      return;
    }

    setIsGenerating(true);
    setPrdContent(""); // Clear existing content to show refined version

    try {
      let fullContent = "";

      // Use the refine stream generator
      for await (const chunk of refinePRDStream(
        existingPRD,
        additionalRequirements,
        platform,
        projectContext
      )) {
        fullContent += chunk;
        setPrdContent((prev) => prev + chunk);
      }

      // Update saved PRD in database if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user && fullContent) {
        const title = generateTitle(additionalRequirements);
        const { error } = await supabase.from("prds").insert({
          user_id: user.id,
          title: `${title} (Enhanced)`,
          requirements: `${existingPRD}\n\n--- Additional Requirements ---\n${additionalRequirements}`,
          platform,
          content: fullContent,
        });

        if (error) {
          console.error("Failed to save refined PRD:", error);
        }
      }

      toast.success("PRD enhanced successfully!");
    } catch (error) {
      console.error("Error refining PRD:", error);
      toast.error(error instanceof Error ? error.message : "Failed to refine PRD");
      // Restore original PRD on error
      setPrdContent(existingPRD);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    prdContent,
    isGenerating,
    generatePRD,
    refinePRD,
    setPrdContent,
    clearPRD: () => setPrdContent(""),
  };
}

function generateTitle(requirements: string): string {
  const words = requirements.split(/\s+/).slice(0, 6).join(" ");
  return words.length > 50 ? words.slice(0, 50) + "..." : words || "Untitled PRD";
}
