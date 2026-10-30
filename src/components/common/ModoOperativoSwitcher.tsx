import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useModoOperativo, ModoOperativoTipo } from "@/hooks/useModoOperativo";
import { User, Building2, Check, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

export function ModoOperativoSwitcher() {
  const { modo, setModo, isSolo, labelModo, shortLabel } = useModoOperativo();

  const handleSelect = (nuevo: ModoOperativoTipo) => {
    if (nuevo === modo) return;
    setModo(nuevo);
    toast.success(
      nuevo === "solo"
        ? "Modo Profesional Independiente activado (vista simplificada y ágil)."
        : "Modo Centro Clínico / Policlínica activado (visión multi-especialista y cabinas)."
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-xl border-border/80 px-2.5 text-xs font-medium hover:border-primary/40 shadow-none transition-colors"
          title={`Modo operativo: ${labelModo}`}
        >
          {isSolo ? (
            <User className="h-3.5 w-3.5 text-primary" />
          ) : (
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
          )}
          <span className="hidden sm:inline-block">{shortLabel}</span>
          <Badge
            variant="outline"
            className={`hidden md:inline-flex text-[9px] px-1 py-0 rounded-full font-mono font-normal ${
              isSolo ? "bg-primary/10 text-primary border-primary/30" : "bg-indigo-500/10 text-indigo-600 border-indigo-500/30"
            }`}
          >
            {isSolo ? "Solo" : "Centro"}
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2 shadow-lg border-border/80">
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Modo de Operación
        </DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => handleSelect("solo")}
          className={`flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition-colors ${
            isSolo ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary shrink-0 mt-0.5">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">Profesional Independiente</p>
              {isSolo && <Check className="h-3.5 w-3.5 text-primary" />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Consultorio privado, atención unipersonal, visitas a domicilio y cobros directos.
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1" />

        <DropdownMenuItem
          onClick={() => handleSelect("centro")}
          className={`flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition-colors ${
            !isSolo ? "bg-indigo-500/10 text-indigo-600 font-medium" : "hover:bg-muted/50"
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600 shrink-0 mt-0.5">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-foreground">Centro Clínico / Policlínica</p>
              {!isSolo && <Check className="h-3.5 w-3.5 text-indigo-600" />}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              Multi-especialistas, mapa de sillones/cabinas, comisiones de médicos y enfermería.
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
