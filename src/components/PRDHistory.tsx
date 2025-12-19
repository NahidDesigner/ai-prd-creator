import { useState, useEffect } from "react";
import { History, Trash2, Eye, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface PRD {
  id: string;
  title: string;
  requirements: string;
  platform: string;
  content: string;
  created_at: string;
}

interface PRDHistoryProps {
  onSelect: (prd: PRD) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function PRDHistory({ onSelect, isOpen, onClose }: PRDHistoryProps) {
  const [prds, setPrds] = useState<PRD[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPRDs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("prds")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching PRDs:", error);
      toast.error("Failed to load PRD history");
    } else {
      setPrds(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchPRDs();
    }
  }, [isOpen]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("prds").delete().eq("id", id);
    
    if (error) {
      toast.error("Failed to delete PRD");
    } else {
      setPrds(prds.filter((prd) => prd.id !== id));
      toast.success("PRD deleted");
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "cursor": return "bg-blue-500/20 text-blue-400";
      case "lovable": return "bg-pink-500/20 text-pink-400";
      case "replit": return "bg-orange-500/20 text-orange-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">PRD History</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : prds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No PRDs saved yet</p>
              <p className="text-sm mt-1">Generate your first PRD to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prds.map((prd) => (
                <div
                  key={prd.id}
                  className="group p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer border border-border/50"
                  onClick={() => {
                    onSelect(prd);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">{prd.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {prd.requirements}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${getPlatformColor(prd.platform)}`}>
                          {prd.platform}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(prd.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(prd.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
