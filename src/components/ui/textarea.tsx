import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-border/80 bg-background px-3.5 py-2.5 text-sm text-foreground shadow-none transition-all duration-150 placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
