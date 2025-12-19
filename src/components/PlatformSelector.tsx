import { cn } from "@/lib/utils";

const platforms = [
  {
    id: "cursor",
    name: "Cursor",
    description: "AI-powered code editor",
    icon: "⚡",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "lovable",
    name: "Lovable",
    description: "AI full-stack builder",
    icon: "💜",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "replit",
    name: "Replit",
    description: "Cloud development platform",
    icon: "🔥",
    gradient: "from-orange-500 to-amber-600",
  },
];

interface PlatformSelectorProps {
  selected: string;
  onSelect: (platform: string) => void;
}

export function PlatformSelector({ selected, onSelect }: PlatformSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {platforms.map((platform) => (
        <button
          key={platform.id}
          onClick={() => onSelect(platform.id)}
          className={cn(
            "relative p-4 rounded-xl border-2 transition-all duration-300 text-left group",
            selected === platform.id
              ? "border-primary bg-primary/10 glow-primary"
              : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{platform.icon}</span>
            <span className="font-semibold text-foreground">{platform.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">{platform.description}</p>
          {selected === platform.id && (
            <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}
