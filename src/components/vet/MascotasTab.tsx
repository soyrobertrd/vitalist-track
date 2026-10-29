import { useState } from "react";
import { Mascota, ESPECIE_ICONOS, ESPECIES_VET, EspecieVet } from "./vet-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Phone, Mail, Syringe, Stethoscope, QrCode, Filter } from "lucide-react";
import { differenceInMonths } from "date-fns";

interface MascotasTabProps {
  mascotas: Mascota[];
  onNuevaMascota: () => void;
  onVerCarnet: (mascota: Mascota) => void;
  onNuevaConsulta: (mascota: Mascota) => void;
  onNuevaVacuna: (mascota: Mascota) => void;
}

const calcularEdad = (fecha: string) => {
  if (!fecha) return "—";
  const m = differenceInMonths(new Date(), new Date(fecha));
  if (m < 1) return "< 1 mes";
  if (m < 12) return `${m} meses`;
  const anios = Math.floor(m / 12);
  const remMeses = m % 12;
  return remMeses > 0 ? `${anios} a ${remMeses} m` : `${anios} años`;
};

export function MascotasTab({
  mascotas,
  onNuevaMascota,
  onVerCarnet,
  onNuevaConsulta,
  onNuevaVacuna,
}: MascotasTabProps) {
  const [busqueda, setBusqueda] = useState("");
  const [especieFiltro, setEspecieFiltro] = useState<string>("todas");

  const mascotasFiltradas = mascotas.filter(m => {
    const coincideTexto =
      m.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.raza.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.tutor_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.microchip && m.microchip.includes(busqueda));

    const coincideEspecie = especieFiltro === "todas" || m.especie === especieFiltro;

    return coincideTexto && coincideEspecie;
  });

  return (
    <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
      <CardHeader className="bg-muted/15 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">Directorio de Pacientes Mascotas</CardTitle>
            <p className="text-xs text-muted-foreground">
              {mascotasFiltradas.length} de {mascotas.length} mascotas registradas
            </p>
          </div>
          <Button size="sm" className="rounded-xl shadow-none gap-1.5" onClick={onNuevaMascota}>
            <Plus className="h-4 w-4" /> Nueva Mascota
          </Button>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre de mascota, tutor, raza o chip..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-border/80"
            />
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Button
              type="button"
              size="sm"
              variant={especieFiltro === "todas" ? "default" : "outline"}
              className="rounded-xl text-xs h-9 px-3"
              onClick={() => setEspecieFiltro("todas")}
            >
              Todas
            </Button>
            {ESPECIES_VET.map(esp => (
              <Button
                key={esp}
                type="button"
                size="sm"
                variant={especieFiltro === esp ? "default" : "outline"}
                className="rounded-xl text-xs h-9 px-2.5 gap-1 capitalize"
                onClick={() => setEspecieFiltro(esp)}
              >
                <span>{ESPECIE_ICONOS[esp]}</span>
                <span className="hidden md:inline">{esp}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {mascotasFiltradas.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron mascotas que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mascota & Especie</TableHead>
                  <TableHead>Raza / Color</TableHead>
                  <TableHead>Edad & Peso</TableHead>
                  <TableHead>Tutor & Contacto</TableHead>
                  <TableHead>Condiciones / Alergias</TableHead>
                  <TableHead className="text-right">Acciones Rápidas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mascotasFiltradas.map(m => (
                  <TableRow key={m.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl flex items-center justify-center h-10 w-10 rounded-2xl bg-muted/70 shrink-0 border border-border/60">
                          {ESPECIE_ICONOS[m.especie] || "🐾"}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-sm">{m.nombre}</span>
                            <Badge variant="outline" className="text-[10px] rounded-full uppercase">
                              {m.sexo}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                            <span className="capitalize">{m.especie}</span>
                            {m.esterilizado && (
                              <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium">
                                • Esterilizado
                              </span>
                            )}
                            {m.microchip && (
                              <span className="font-mono text-[10px] text-muted-foreground/80">
                                • Chip: {m.microchip.slice(-6)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs font-medium text-foreground block">{m.raza}</span>
                      {m.color_pelaje && (
                        <span className="text-[11px] text-muted-foreground">{m.color_pelaje}</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold tabular-nums text-foreground block">
                          {calcularEdad(m.fecha_nacimiento)}
                        </span>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {m.peso_kg ? `${m.peso_kg} kg` : "—"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-foreground block">{m.tutor_nombre}</span>
                        {m.tutor_telefono && (
                          <a
                            href={`tel:${m.tutor_telefono}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline tabular-nums"
                          >
                            <Phone className="h-3 w-3" /> {m.tutor_telefono}
                          </a>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {m.alergias_condiciones ? (
                        <Badge
                          variant="outline"
                          className="text-[11px] rounded-lg border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-normal py-0.5"
                        >
                          {m.alergias_condiciones}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/70">Sin alertas</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs rounded-xl gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          title="Carnet de Vacunación"
                          onClick={() => onVerCarnet(m)}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">Carnet</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs rounded-xl gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          title="Nueva Vacuna"
                          onClick={() => onNuevaVacuna(m)}
                        >
                          <Syringe className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">Vacuna</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-xs rounded-xl gap-1"
                          onClick={() => onNuevaConsulta(m)}
                        >
                          <Stethoscope className="h-3.5 w-3.5" />
                          <span>Consulta</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
