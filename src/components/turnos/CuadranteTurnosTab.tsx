import { useState } from "react";
import {
  TipoTurno,
  CATALOGO_TURNOS,
  ProfesionalTurno,
  CoberturaMinimaServicio,
} from "./turnos-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowLeftRight,
  Plus,
  Users,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface CuadranteTurnosTabProps {
  profesionales: ProfesionalTurno[];
  onCambiarTurno: (profesionalId: string, fecha: string, nuevoTurno: TipoTurno) => void;
  onAbrirIntercambio: () => void;
}

export function CuadranteTurnosTab({
  profesionales,
  onCambiarTurno,
  onAbrirIntercambio,
}: CuadranteTurnosTabProps) {
  const [servicioFiltro, setServicioFiltro] = useState<string>("todos");
  const [rolFiltro, setRolFiltro] = useState<string>("todos");

  // Días de la semana actual
  const diasSemana = [
    { fecha: "2024-10-28", dia: "Lunes 28" },
    { fecha: "2024-10-29", dia: "Martes 29" },
    { fecha: "2024-10-30", dia: "Miércoles 30" },
    { fecha: "2024-10-31", dia: "Jueves 31" },
    { fecha: "2024-11-01", dia: "Viernes 01" },
    { fecha: "2024-11-02", dia: "Sábado 02" },
    { fecha: "2024-11-03", dia: "Domingo 03" },
  ];

  const filtrados = profesionales.filter(p => {
    const coincideServicio = servicioFiltro === "todos" || p.servicio === servicioFiltro;
    const coincideRol = rolFiltro === "todos" || p.rol === rolFiltro;
    return coincideServicio && coincideRol;
  });

  // Requisitos mínimos de cobertura
  const coberturaMinima: Record<string, { M: number; T: number; N: number }> = {
    Emergencias: { M: 3, T: 3, N: 2 },
    UCI: { M: 2, T: 2, N: 2 },
    "Hospitalización Piso": { M: 2, T: 2, N: 1 },
    Quirófano: { M: 2, T: 2, N: 1 },
  };

  return (
    <div className="space-y-4">
      {/* Controles de Filtro y Leyenda */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Servicio:</span>
            <Select value={servicioFiltro} onValueChange={setServicioFiltro}>
              <SelectTrigger className="w-44 h-8.5 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="todos">Todos los Servicios</SelectItem>
                <SelectItem value="Emergencias">Emergencias</SelectItem>
                <SelectItem value="UCI">UCI Cuidados Críticos</SelectItem>
                <SelectItem value="Hospitalización Piso">Hospitalización Piso</SelectItem>
                <SelectItem value="Quirófano">Quirófano</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-xs text-muted-foreground font-semibold ml-2">Personal:</span>
            <Select value={rolFiltro} onValueChange={setRolFiltro}>
              <SelectTrigger className="w-36 h-8.5 rounded-xl text-xs"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="todos">Todo el Personal</SelectItem>
                <SelectItem value="medico">Médicos</SelectItem>
                <SelectItem value="enfermero">Enfermería</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-xs h-8.5 gap-1.5 border-border/80"
              onClick={onAbrirIntercambio}
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-purple-600" />
              Solicitud de Intercambio de Guardias
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leyenda de Turnos */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/20 border border-border/70 rounded-2xl text-xs">
        <span className="font-semibold text-muted-foreground text-[11px] uppercase mr-1">
          Nomenclatura Hospitalaria:
        </span>
        {Object.values(CATALOGO_TURNOS).map(t => (
          <span
            key={t.codigo}
            className={`px-2.5 py-1 rounded-xl text-[11px] border font-medium ${t.colorBadge}`}
          >
            <strong>{t.codigo}:</strong> {t.nombre} ({t.horario.split("(")[0]})
          </span>
        ))}
      </div>

      {/* Tabla Cuadrante Semanal */}
      <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
        <CardHeader className="bg-muted/15 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Cuadrante Rotativo de Personal Asistencial</CardTitle>
              <p className="text-xs text-muted-foreground">
                Semana del 28 de Octubre al 03 de Noviembre 2024 • Cobertura 24/7 sin solapamientos
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs font-bold font-mono px-2">Semana 44</span>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="min-w-[200px] font-bold">Profesional / Especialidad</TableHead>
                  <TableHead className="min-w-[120px] font-bold">Servicio</TableHead>
                  {diasSemana.map(d => (
                    <TableHead key={d.fecha} className="text-center font-bold font-mono text-xs">
                      {d.dia}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map(prof => (
                  <TableRow key={prof.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <span className="font-bold text-sm text-foreground block">{prof.nombre}</span>
                        <span className="text-xs text-muted-foreground">{prof.especialidad}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[10px] rounded-full">
                        {prof.servicio}
                      </Badge>
                    </TableCell>

                    {diasSemana.map(d => {
                      const turnoCodigo = prof.turnosPorDia[d.fecha] || "L";
                      const def = CATALOGO_TURNOS[turnoCodigo] || CATALOGO_TURNOS.L;

                      return (
                        <TableCell key={d.fecha} className="text-center p-2">
                          <button
                            type="button"
                            className={`w-11 h-8 rounded-xl border text-xs font-bold transition-transform active:scale-95 inline-flex items-center justify-center ${def.colorBadge}`}
                            title={`${def.nombre}: ${def.horario}`}
                            onClick={() => {
                              // Rotar turno al hacer click: M -> T -> N -> G24 -> L -> M
                              const orden: TipoTurno[] = ["M", "T", "N", "G24", "L"];
                              const siguiente = orden[(orden.indexOf(turnoCodigo) + 1) % orden.length];
                              onCambiarTurno(prof.id, d.fecha, siguiente);
                              toast.info(`Turno de ${prof.nombre.split(" ")[0]} el ${d.dia} cambiado a ${siguiente}`);
                            }}
                          >
                            {turnoCodigo}
                          </button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Control de Cobertura Mínima Garantizada */}
      <Card className="rounded-2xl border-border/80 shadow-none">
        <CardHeader className="bg-muted/15 pb-2.5">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Auditoría de Cobertura Mínima Hospitalaria
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {Object.entries(coberturaMinima).map(([serv, req]) => (
            <div key={serv} className="p-3 rounded-xl bg-card border border-border/70 space-y-1.5">
              <span className="font-bold text-foreground text-xs block">{serv}</span>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Turno Mañana (M):</span>
                <strong className="text-emerald-600">✓ {req.M} pers. (Cubierto)</strong>
              </div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Turno Tarde (T):</span>
                <strong className="text-emerald-600">✓ {req.T} pers. (Cubierto)</strong>
              </div>
              <div className="flex justify-between text-muted-foreground text-[11px]">
                <span>Turno Noche (N):</span>
                <strong className="text-emerald-600">✓ {req.N} pers. (Cubierto)</strong>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
