import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  BedDouble,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export interface CajetinUnidosis {
  id: string;
  camaNumero: string;
  servicio: string;
  pacienteNombre: string;
  medicamentos: Array<{
    nombre: string;
    dosis: string;
    horario: string; // "08:00", "14:00", "20:00"
    estado: "preparado" | "validado_farmacia" | "entregado_enfermeria";
  }>;
  validadoPorFarmaceutico: boolean;
  farmaceuticoNombre: string;
}

const DEFAULT_CAJETINES: CajetinUnidosis[] = [
  {
    id: "uni-1",
    camaNumero: "Cama 201",
    servicio: "Medicina Interna",
    pacienteNombre: "Ramón Arturo Gómez",
    validadoPorFarmaceutico: true,
    farmaceuticoNombre: "Dra. Laura Batista (Reg. Farm. 1892)",
    medicamentos: [
      { nombre: "Ceftriaxona 1g IV", dosis: "1 vial reconstituido", horario: "08:00", estado: "validado_farmacia" },
      { nombre: "Omeprazol 40mg IV", dosis: "1 ampolla", horario: "08:00", estado: "validado_farmacia" },
      { nombre: "Enoxaparina 40mg SC", dosis: "1 jeringa prellenada", horario: "20:00", estado: "preparado" },
    ],
  },
  {
    id: "uni-2",
    camaNumero: "Cama 304",
    servicio: "Cirugía General",
    pacienteNombre: "Elena Vásquez Ramos",
    validadoPorFarmaceutico: true,
    farmaceuticoNombre: "Dra. Laura Batista",
    medicamentos: [
      { nombre: "Metronidazol 500mg IV", dosis: "1 frasco 100ml", horario: "08:00", estado: "entregado_enfermeria" },
      { nombre: "Ketorolaco 30mg IV", dosis: "1 ampolla", horario: "14:00", estado: "validado_farmacia" },
      { nombre: "Metronidazol 500mg IV", dosis: "1 frasco 100ml", horario: "16:00", estado: "preparado" },
    ],
  },
  {
    id: "uni-3",
    camaNumero: "UCI Cama 02",
    servicio: "Cuidados Críticos",
    pacienteNombre: "Carlos Domínguez",
    validadoPorFarmaceutico: false,
    farmaceuticoNombre: "Pendiente Revisión",
    medicamentos: [
      { nombre: "Meropenem 1g IV", dosis: "1 vial perfusión 3h", horario: "08:00", estado: "preparado" },
      { nombre: "Vancomicina 1g IV", dosis: "1 vial perfusión lenta", horario: "12:00", estado: "preparado" },
    ],
  },
];

export const UnidosisHospitalariaTab: React.FC = () => {
  const [cajetines, setCajetines] = useState<CajetinUnidosis[]>(DEFAULT_CAJETINES);
  const [busqueda, setBusqueda] = useState("");

  const handleValidarCarro = (id: string) => {
    setCajetines(
      cajetines.map((c) =>
        c.id === id
          ? {
              ...c,
              validadoPorFarmaceutico: true,
              farmaceuticoNombre: "Dra. Laura Batista (Validado)",
              medicamentos: c.medicamentos.map((m) => ({ ...m, estado: "validado_farmacia" })),
            }
          : c
      )
    );
    toast.success("Carro de unidosis validado farmacoterapéuticamente");
  };

  const handleEntregarEnfermeria = (id: string) => {
    setCajetines(
      cajetines.map((c) =>
        c.id === id
          ? {
              ...c,
              medicamentos: c.medicamentos.map((m) => ({ ...m, estado: "entregado_enfermeria" })),
            }
          : c
      )
    );
    toast.success("Cajetines entregados a enfermería de piso");
  };

  const filtered = cajetines.filter(
    (c) =>
      c.pacienteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.camaNumero.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.servicio.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por paciente, cama o servicio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
            SDMDU Ciclo 24 Horas Activo
          </Badge>
        </div>
      </div>

      {/* Grid de Cajetines de Medicación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <Card key={c.id} className="rounded-2xl border-border/80 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    <BedDouble className="h-3 w-3 mr-1 text-primary" /> {c.camaNumero}
                  </Badge>
                  <CardTitle className="text-sm font-bold mt-1 text-foreground">
                    {c.pacienteNombre}
                  </CardTitle>
                  <CardDescription className="text-xs">{c.servicio}</CardDescription>
                </div>
                {c.validadoPorFarmaceutico ? (
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Validado
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px]">
                    <AlertCircle className="h-3 w-3 mr-1" /> Por Validar
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs">
              <div className="space-y-1.5 p-2.5 bg-muted/30 rounded-xl border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Dosis Unitarias Preparadas (Próximas 24h)
                </span>
                {c.medicamentos.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs border-b border-border/40 last:border-none pb-1 last:pb-0">
                    <div>
                      <span className="font-semibold text-foreground">{m.nombre}</span>
                      <p className="text-[11px] text-muted-foreground">{m.dosis}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[11px] font-bold text-primary flex items-center gap-0.5 justify-end">
                        <Clock className="h-2.5 w-2.5" /> {m.horario}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">{m.estado.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-muted-foreground">
                Farmacéutico Regente: <strong className="text-foreground">{c.farmaceuticoNombre}</strong>
              </div>

              <div className="pt-1 flex gap-2">
                {!c.validadoPorFarmaceutico ? (
                  <Button
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => handleValidarCarro(c.id)}
                  >
                    Validar Farmacoterapia
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-7 text-emerald-600"
                    onClick={() => handleEntregarEnfermeria(c.id)}
                  >
                    <Truck className="h-3 w-3 mr-1" /> Entregar a Enfermería
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
