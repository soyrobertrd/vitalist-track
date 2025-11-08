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

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
}

interface PacienteComboboxProps {
  pacientes: Paciente[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function PacienteCombobox({
  pacientes,
  value,
  onValueChange,
  placeholder = "Seleccionar paciente...",
  required = false,
}: PacienteComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedPaciente = pacientes.find((p) => p.id === value);

  // Sort pacientes alphabetically
  const sortedPacientes = [...pacientes].sort((a, b) => {
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
          {selectedPaciente
            ? `${selectedPaciente.nombre} ${selectedPaciente.apellido} - ${selectedPaciente.cedula}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar paciente..." />
          <CommandEmpty>No se encontró paciente.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {sortedPacientes.map((paciente) => (
              <CommandItem
                key={paciente.id}
                value={`${paciente.nombre} ${paciente.apellido} ${paciente.cedula}`}
                onSelect={() => {
                  onValueChange(paciente.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === paciente.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {paciente.nombre} {paciente.apellido} - {paciente.cedula}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
