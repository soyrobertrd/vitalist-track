import { useState } from "react";
import { RegistroVacunaDesparasitacion } from "./vet-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Syringe, Plus, Search, AlertTriangle, CheckCircle2, Clock, Bug, ShieldCheck, Printer } from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";

interface VacunasTabProps {
  registros: RegistroVacunaDesparasitacion[];
  onNuevoRegistro: () => void;
  onImprimirCarnet?: (registro: RegistroVacunaDesparasitacion) => void;
}

export function VacunasDesparasitacionTab({
  registros,
  onNuevoRegistro,
  onImprimirCarnet,
}: VacunasTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");

  const hoy = new Date();

  const getEstado = (proximaDosis: string | null) => {
    if (!proximaDosis) return { label: "Al día", color: "emerald", code: "al_dia" };
    const fecha = new Date(proximaDosis + "T12:00:00");
    if (isBefore(fecha, hoy)) return { label: "Vencida", color: "rose", code: "vencida" };
    if (isBefore(fecha, addDays(hoy, 15))) return { label: "Próxima (≤15d)", color: "amber", code: "proxima" };
    return { label: "Al día", color: "emerald", code: "al_dia" };
  };

  const filtrados = registros.filter(r => {
    const coincideTexto =
      r.mascota_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
      (r.lote && r.lote.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideTipo = filtroTipo === "todos" || r.tipo === filtroTipo;

    const estadoObj = getEstado(r.proxima_dosis);
    const coincideEstado = filtroEstado === "todos" || estadoObj.code === filtroEstado;

    return coincideTexto && coincideTipo && coincideEstado;
  });

  return (
    <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
      <CardHeader className="bg-muted/15 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Carnet de Vacunación & Control Antiparasitario</CardTitle>
            <p className="text-xs text-muted-foreground">
              Inmunizaciones activas, refuerzos anuales y desparasitación interna / externa
            </p>
          </div>
          <Button size="sm" className="rounded-xl shadow-none gap-1.5" onClick={onNuevoRegistro}>
            <Plus className="h-4 w-4" /> Registrar Dosis
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por mascota, producto o lote..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-border/80"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              type="button"
              size="sm"
              variant={filtroTipo === "todos" ? "default" : "outline"}
              className="rounded-xl text-xs h-9 px-3"
              onClick={() => setFiltroTipo("todos")}
            >
              Todos
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filtroTipo === "vacuna" ? "default" : "outline"}
              className="rounded-xl text-xs h-9 px-3 gap-1"
              onClick={() => setFiltroTipo("vacuna")}
            >
              <Syringe className="h-3.5 w-3.5 text-blue-500" />
              Vacunas
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filtroTipo === "desparasitacion_interna" ? "default" : "outline"}
              className="rounded-xl text-xs h-9 px-3 gap-1"
              onClick={() => setFiltroTipo("desparasitacion_interna")}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Interna
            </Button>
            <Button
              type="button"
              size="sm"
              variant={filtroTipo === "desparasitacion_externa" ? "default" : "outline"}
              className="rounded-xl text-xs h-9 px-3 gap-1"
              onClick={() => setFiltroTipo("desparasitacion_externa")}
            >
              <Bug className="h-3.5 w-3.5 text-amber-500" />
              Externa
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtrados.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No hay registros de vacunación o desparasitación que coincidan con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mascota</TableHead>
                  <TableHead>Tipo & Producto</TableHead>
                  <TableHead>Fecha Aplicada</TableHead>
                  <TableHead>Próxima Dosis / Refuerzo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Veterinario / Lote</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map(r => {
                  const est = getEstado(r.proxima_dosis);
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-semibold text-foreground text-sm">
                        {r.mascota_nombre}
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="text-xs font-semibold text-foreground block">{r.producto}</span>
                          <Badge variant="outline" className="text-[10px] rounded-full uppercase tracking-wider">
                            {r.tipo === "vacuna"
                              ? "Vacuna"
                              : r.tipo === "desparasitacion_interna"
                              ? "Antiparasitario Interno"
                              : "Antipulgas / Garrapatas"}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="tabular-nums text-xs text-muted-foreground">
                        {format(new Date(r.fecha_aplicada + "T12:00:00"), "dd MMM yyyy", { locale: es })}
                      </TableCell>

                      <TableCell className="tabular-nums text-xs font-semibold text-foreground">
                        {r.proxima_dosis
                          ? format(new Date(r.proxima_dosis + "T12:00:00"), "dd MMM yyyy", { locale: es })
                          : "Dosis única / Permanente"}
                      </TableCell>

                      <TableCell>
                        {est.code === "vencida" ? (
                          <Badge className="rounded-full text-[11px] bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 gap-1 font-medium">
                            <AlertTriangle className="h-3 w-3" /> Vencida
                          </Badge>
                        ) : est.code === "proxima" ? (
                          <Badge className="rounded-full text-[11px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 gap-1 font-medium">
                            <Clock className="h-3 w-3" /> Próxima (≤15d)
                          </Badge>
                        ) : (
                          <Badge className="rounded-full text-[11px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 gap-1 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> Al día
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-foreground block">{r.veterinario}</span>
                        {r.lote && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            Lote: {r.lote}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
