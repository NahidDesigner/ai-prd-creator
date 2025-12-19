import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, History, User, Key, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { UserApiKeys } from "@/components/UserApiKeys";
import { toast } from "sonner";

interface UserMenuProps {
  onHistoryClick: () => void;
}

export function UserMenu({ onHistoryClick }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="hidden md:inline text-sm text-muted-foreground truncate max-w-[150px]">
              {user.email}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 glass border-border">
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer text-primary">
                <Shield className="w-4 h-4 mr-2" />
                Admin Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem onClick={onHistoryClick} className="cursor-pointer">
            <History className="w-4 h-4 mr-2" />
            PRD History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsApiKeysOpen(true)} className="cursor-pointer">
            <Key className="w-4 h-4 mr-2" />
            My API Keys
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <UserApiKeys isOpen={isApiKeysOpen} onClose={() => setIsApiKeysOpen(false)} />
    </>
  );
}
