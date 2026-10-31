import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  /** Texto accesible y del tooltip; obligatorio porque el botón solo muestra un icono. */
  label: string;
  size?: "icon" | "icon-sm";
}

/** Botón de solo icono con nombre accesible y tooltip. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = "icon", variant = "ghost", ...props }, ref) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button ref={ref} size={size} variant={variant} aria-label={label} {...props} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  ),
);
IconButton.displayName = "IconButton";
