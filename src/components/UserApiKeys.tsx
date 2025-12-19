import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Eye, EyeOff, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  key_type: string;
  api_key: string;
  is_global: boolean;
  created_at: string;
}

interface UserApiKeysProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_KEY_TYPES = [
  { value: "openai", label: "OpenAI (ChatGPT)" },
  { value: "google", label: "Google AI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
];

export function UserApiKeys({ isOpen, onClose }: UserApiKeysProps) {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  
  // New key form
  const [newKeyType, setNewKeyType] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchApiKeys = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_global", false)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch your API keys");
      console.error(error);
    } else {
      setApiKeys(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchApiKeys();
    }
  }, [isOpen, user]);

  const handleSaveKey = async () => {
    if (!user) return;
    
    if (!newKeyType || !newApiKey.trim()) {
      toast.error("Please select a key type and enter an API key");
      return;
    }

    setIsSaving(true);

    // Check if key type already exists for this user
    const existingKey = apiKeys.find(k => k.key_type === newKeyType);
    
    if (existingKey) {
      // Update existing key
      const { error } = await supabase
        .from("api_keys")
        .update({ api_key: newApiKey.trim() })
        .eq("id", existingKey.id);

      if (error) {
        toast.error("Failed to update API key");
        console.error(error);
      } else {
        toast.success("API key updated successfully");
        setNewKeyType("");
        setNewApiKey("");
        fetchApiKeys();
      }
    } else {
      // Insert new key
      const { error } = await supabase
        .from("api_keys")
        .insert({
          user_id: user.id,
          key_type: newKeyType,
          api_key: newApiKey.trim(),
          is_global: false,
        });

      if (error) {
        toast.error("Failed to save API key");
        console.error(error);
      } else {
        toast.success("API key saved successfully");
        setNewKeyType("");
        setNewApiKey("");
        fetchApiKeys();
      }
    }

    setIsSaving(false);
  };

  const handleDeleteKey = async (id: string) => {
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete API key");
      console.error(error);
    } else {
      toast.success("API key deleted successfully");
      fetchApiKeys();
    }
  };

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            My API Keys
          </DialogTitle>
          <DialogDescription>
            Add your own API keys to use instead of the default ones. Your keys are encrypted and stored securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Key Form */}
          <div className="space-y-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
            <div className="space-y-2">
              <Label>API Provider</Label>
              <Select value={newKeyType} onValueChange={setNewKeyType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {API_KEY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                className="bg-background"
              />
            </div>
            <Button onClick={handleSaveKey} disabled={isSaving} size="sm" className="gap-2">
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Key
            </Button>
          </div>

          {/* Existing Keys */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Your Keys</h4>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : apiKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No personal API keys configured
              </p>
            ) : (
              <div className="space-y-2">
                {apiKeys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {API_KEY_TYPES.find(t => t.value === key.key_type)?.label || key.key_type}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {showKey[key.id] ? key.api_key : maskKey(key.api_key)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleShowKey(key.id)}
                      >
                        {showKey[key.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteKey(key.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
