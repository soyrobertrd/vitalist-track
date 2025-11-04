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
        "rounded-lg backdrop-blur-md bg-white/10 dark:bg-black/20",
        "border border-white/20 dark:border-white/10",
        "shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]",
        onClick && "cursor-pointer hover:bg-white/20 dark:hover:bg-black/30 transition-all",
        className
      )}
    >
      {children}
    </div>
  );
};
