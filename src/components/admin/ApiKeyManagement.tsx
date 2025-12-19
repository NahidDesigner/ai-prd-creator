import { useState, useEffect } from "react";
import { Key, Plus, Trash2, Eye, EyeOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const API_KEY_TYPES = [
  { value: "openai", label: "OpenAI (ChatGPT)" },
  { value: "google", label: "Google AI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
];

export function ApiKeyManagement() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [deleteKeyId, setDeleteKeyId] = useState<string | null>(null);
  
  // New key form
  const [newKeyType, setNewKeyType] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchApiKeys = async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("is_global", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch API keys");
      console.error(error);
    } else {
      setApiKeys(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleSaveKey = async () => {
    if (!newKeyType || !newApiKey.trim()) {
      toast.error("Please select a key type and enter an API key");
      return;
    }

    setIsSaving(true);

    // Check if key type already exists
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
          user_id: user?.id,
          key_type: newKeyType,
          api_key: newApiKey.trim(),
          is_global: true,
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

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return;

    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", deleteKeyId);

    if (error) {
      toast.error("Failed to delete API key");
      console.error(error);
    } else {
      toast.success("API key deleted successfully");
      fetchApiKeys();
    }
    setDeleteKeyId(null);
  };

  const toggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return "••••••••";
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Global API Keys</h2>
      </div>

      {/* Add New Key Form */}
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            Add New API Key
          </CardTitle>
          <CardDescription>
            Add global API keys that will be used as defaults for all users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
          <Button onClick={handleSaveKey} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save API Key
          </Button>
        </CardContent>
      </Card>

      {/* Existing Keys */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Configured Keys</h3>
        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-border rounded-lg bg-muted/30">
            No API keys configured yet
          </div>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((key) => (
              <Card key={key.id} className="bg-muted/30">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Key className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {API_KEY_TYPES.find(t => t.value === key.key_type)?.label || key.key_type}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {showKey[key.id] ? key.api_key : maskKey(key.api_key)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
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
                      size="sm"
                      onClick={() => setDeleteKeyId(key.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? This may affect PRD generation for all users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
