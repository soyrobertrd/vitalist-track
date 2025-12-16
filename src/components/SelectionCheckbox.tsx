import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SelectionCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

export function SelectionCheckbox({ checked, onCheckedChange, className }: SelectionCheckboxProps) {
  return (
    <div 
      className={cn("absolute top-2 left-2 z-10", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-5 w-5 border-2 bg-background/80 backdrop-blur-sm"
      />
    </div>
  );
}
