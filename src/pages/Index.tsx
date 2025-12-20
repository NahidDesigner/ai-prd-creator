import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Wand2, Zap, LogIn, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlatformSelector } from "@/components/PlatformSelector";
import { FileUpload } from "@/components/FileUpload";
import { PRDOutput } from "@/components/PRDOutput";
import { PRDHistory } from "@/components/PRDHistory";
import { UserMenu } from "@/components/UserMenu";
import { usePRDGenerator } from "@/hooks/usePRDGenerator";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const [requirements, setRequirements] = useState("");
  const [platform, setPlatform] = useState("cursor");
  const [projectContext, setProjectContext] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const { prdContent, isGenerating, generatePRD, refinePRD, setPrdContent } = usePRDGenerator();
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleGenerate = () => {
    generatePRD(requirements, platform, projectContext || undefined);
  };

  const handleSelectPRD = (prd: { requirements: string; platform: string; content: string }) => {
    setRequirements(prd.requirements);
    setPlatform(prd.platform);
    setPrdContent(prd.content);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12">
        {/* Top Navigation */}
        <nav className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg text-foreground">PRD Generator</span>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && (
              user ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setIsHistoryOpen(true)}
                    className="gap-2"
                  >
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">History</span>
                  </Button>
                  <UserMenu onHistoryClick={() => setIsHistoryOpen(true)} />
                </>
              ) : (
                <Button onClick={() => navigate("/auth")} variant="outline" className="gap-2">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              )
            )}
          </div>
        </nav>

        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered PRD Generator</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="gradient-text">Transform Ideas</span>
            <br />
            <span className="text-foreground">Into Detailed PRDs</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate comprehensive Product Requirements Documents optimized for Cursor, Lovable, and Replit. 
            Just describe what you want to build.
            {!user && !isLoading && (
              <span className="block mt-2 text-primary">
                Sign in to save and access your PRD history.
              </span>
            )}
          </p>
        </header>

        {/* Main content */}
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Input Panel */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6 space-y-6">
              {/* Platform Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileText className="w-4 h-4 text-primary" />
                  Target Platform
                </label>
                <PlatformSelector selected={platform} onSelect={setPlatform} />
              </div>

              {/* Requirements Input */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Wand2 className="w-4 h-4 text-primary" />
                  Project Requirements
                </label>
                <Textarea
                  placeholder="Describe your web app in detail...

Example: I want to build a task management app with user authentication, drag-and-drop kanban boards, team collaboration features, and real-time updates. Users should be able to create projects, assign tasks, set deadlines, and track progress."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="min-h-[200px] bg-muted/50 border-border focus:border-primary resize-none"
                />
              </div>

              {/* File Upload */}
              <FileUpload onFileContent={setProjectContext} />

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !requirements.trim()}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity glow-primary"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                    Generating PRD...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate PRD
                  </>
                )}
              </Button>
            </div>

            {/* Tips */}
            <div className="glass rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-3">💡 Tips for better results</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be specific about features and user flows</li>
                <li>• Mention any preferred technologies or frameworks</li>
                <li>• Upload existing project files for context-aware PRDs</li>
                <li>• Include authentication and database requirements</li>
              </ul>
            </div>
          </div>

          {/* Output Panel */}
          <div className="glass rounded-2xl p-6 min-h-[600px] lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
            <PRDOutput
              content={prdContent}
              isLoading={isGenerating}
              onRefine={(additionalReqs) =>
                refinePRD(prdContent, additionalReqs, platform, projectContext || undefined)
              }
            />
          </div>
        </div>
      </div>

      {/* History Modal */}
      <PRDHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleSelectPRD}
      />
    </div>
  );
};

export default Index;
