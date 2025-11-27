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
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOGTICZonas } from "@/hooks/useOGTICZonas";
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
  const { zonas } = useOGTICZonas();
  
  const zonaData = zonas.find(z => z.value === zona);
  const municipalityId = zonaData?.municipalityId || null;
  const { barrios, loading } = useOGTICBarrios(municipalityId);

  // Update search value when value prop changes
  useState(() => {
    setSearchValue(value);
  });

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
          {value || "Seleccionar o escribir barrio..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={loading ? "Cargando barrios..." : "Buscar o escribir barrio..."} 
            value={searchValue}
            onValueChange={(newValue) => {
              setSearchValue(newValue);
              onChange(newValue);
            }}
          />
          <CommandList>
            {!loading && searchValue && barrios.length === 0 && (
              <CommandEmpty>
                Presione Enter para usar "{searchValue}"
              </CommandEmpty>
            )}
            {barrios.length > 0 && (
              <CommandGroup heading="Barrios disponibles en esta zona">
                {barrios
                  .filter(barrio => 
                    barrio.toLowerCase().includes(searchValue.toLowerCase())
                  )
                  .map((barrio) => (
                    <CommandItem
                      key={barrio}
                      value={barrio}
                      onSelect={(currentValue) => {
                        onChange(currentValue);
                        setSearchValue(currentValue);
                        setOpen(false);
                      }}
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
