import ReactMarkdown from "react-markdown";
import { Copy, Download, Check, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface PRDOutputProps {
  content: string;
  isLoading: boolean;
  onRefine?: (additionalRequirements: string) => void;
}

export function PRDOutput({ content, isLoading, onRefine }: PRDOutputProps) {
  const [copied, setCopied] = useState(false);
  const [showEnhanceMode, setShowEnhanceMode] = useState(false);
  const [additionalRequirements, setAdditionalRequirements] = useState("");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("PRD copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prd.md";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("PRD downloaded!");
  };

  if (!content && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 animate-float">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Your PRD will appear here</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Enter your project requirements and click generate to create a detailed PRD
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h3 className="text-lg font-semibold gradient-text">Generated PRD</h3>
        {content && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto mt-4 pr-2">
        {isLoading && !content && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Generating your PRD...</span>
          </div>
        )}
        
        <div className="markdown-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        
        {isLoading && content && (
          <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1" />
        )}
      </div>

      {/* Enhance PRD Section */}
      {content && !isLoading && !showEnhanceMode && (
        <div className="mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setShowEnhanceMode(true)}
              className="w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Enhance PRD
            </Button>
        </div>
      )}

      {showEnhanceMode && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Add More Requirements or Features
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowEnhanceMode(false);
                setAdditionalRequirements("");
              }}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            placeholder="Example: Add user authentication with email/password and Google OAuth, include payment integration with Stripe, add real-time notifications..."
            value={additionalRequirements}
            onChange={(e) => setAdditionalRequirements(e.target.value)}
            className="min-h-[120px] bg-muted/50 border-border focus:border-primary resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (onRefine && additionalRequirements.trim()) {
                  onRefine(additionalRequirements);
                  setAdditionalRequirements("");
                  setShowEnhanceMode(false);
                }
              }}
              disabled={!additionalRequirements.trim() || isLoading}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Apply Enhancement
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowEnhanceMode(false);
                setAdditionalRequirements("");
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
