import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const GlassCard = ({ children, className, onClick }: GlassCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-none transition-all",
        onClick && "cursor-pointer hover:border-primary/40",
        className
      )}
    >
      {children}
    </div>
  );
};
