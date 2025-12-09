import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOGTICBarrios } from "@/hooks/useOGTICBarrios";

interface BarrioComboboxProps {
  zona: string | null | undefined;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function BarrioCombobox({ zona, value, onChange, disabled }: BarrioComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);
  const { barrios, loading } = useOGTICBarrios(zona || null);

  // Update search value when value prop changes
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  const filteredBarrios = barrios.filter(barrio => 
    barrio.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (selectedBarrio: string) => {
    onChange(selectedBarrio);
    setSearchValue(selectedBarrio);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setSearchValue(newValue);
    // Allow manual entry - update the value as user types
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || !zona}
        >
          <span className="truncate">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </span>
            ) : (
              value || "Seleccionar o escribir barrio..."
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={loading ? "Cargando barrios del municipio..." : "Buscar o escribir barrio..."} 
            value={searchValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando barrios...</span>
              </div>
            )}
            
            {!loading && searchValue && filteredBarrios.length === 0 && (
              <CommandEmpty>
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    No se encontró "{searchValue}" en la lista
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      onChange(searchValue);
                      setOpen(false);
                    }}
                  >
                    Usar "{searchValue}"
                  </Button>
                </div>
              </CommandEmpty>
            )}
            
            {!loading && filteredBarrios.length > 0 && (
              <CommandGroup heading={`Barrios en ${zona ? 'este municipio' : ''} (${filteredBarrios.length})`}>
                {filteredBarrios.map((barrio) => (
                  <CommandItem
                    key={barrio}
                    value={barrio}
                    onSelect={() => handleSelect(barrio)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === barrio ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {barrio}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
