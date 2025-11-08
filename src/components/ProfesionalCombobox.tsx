import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  especialidad?: string;
}

interface ProfesionalComboboxProps {
  profesionales: Profesional[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function ProfesionalCombobox({
  profesionales,
  value,
  onValueChange,
  placeholder = "Seleccionar profesional...",
  required = false,
}: ProfesionalComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedProfesional = profesionales.find((p) => p.id === value);

  // Sort profesionales alphabetically
  const sortedProfesionales = [...profesionales].sort((a, b) => {
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProfesional
            ? `${selectedProfesional.nombre} ${selectedProfesional.apellido}${
                selectedProfesional.especialidad ? ` - ${selectedProfesional.especialidad}` : ""
              }`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar profesional..." />
          <CommandEmpty>No se encontró profesional.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {sortedProfesionales.map((profesional) => (
              <CommandItem
                key={profesional.id}
                value={`${profesional.nombre} ${profesional.apellido} ${profesional.especialidad || ""}`}
                onSelect={() => {
                  onValueChange(profesional.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === profesional.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {profesional.nombre} {profesional.apellido}
                {profesional.especialidad && (
                  <span className="ml-2 text-muted-foreground text-sm">
                    {profesional.especialidad}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
