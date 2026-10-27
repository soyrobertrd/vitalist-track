import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FolderOpen, Plus, LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    to?: string;
    icon?: LucideIcon;
  };
  secondaryAction?: {
    label: string;
    onClick?: () => void;
    to?: string;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  const navigate = useNavigate();

  const handleActionClick = () => {
    if (action?.onClick) {
      action.onClick();
    } else if (action?.to) {
      navigate(action.to);
    }
  };

  const handleSecondaryClick = () => {
    if (secondaryAction?.onClick) {
      secondaryAction.onClick();
    } else if (secondaryAction?.to) {
      navigate(secondaryAction.to);
    }
  };

  const ActionIcon = action?.icon || Plus;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-xl border border-dashed border-border/80 bg-muted/20 ${className}`}
    >
      <div className="h-12 w-12 rounded-full bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-3.5 shadow-none">
        <Icon className="h-6 w-6 stroke-[1.75]" />
      </div>

      <h3 className="font-semibold text-base text-foreground tracking-tight mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {action && (
            <Button size="sm" onClick={handleActionClick} className="gap-1.5 shadow-none text-xs">
              <ActionIcon className="h-3.5 w-3.5" />
              {action.label}
            </Button>
          )}

          {secondaryAction && (
            <Button size="sm" variant="outline" onClick={handleSecondaryClick} className="shadow-none text-xs">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
