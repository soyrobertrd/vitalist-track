import { EdificioHospital } from "./edificacion-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Phone, Bed, CheckCircle2 } from "lucide-react";

interface DirectorioAreasTabProps {
  edificios: EdificioHospital[];
}

export function DirectorioAreasTab({ edificios }: DirectorioAreasTabProps) {
  // Aplanar alas y servicios
  const servicios = edificios.flatMap(ed =>
    ed.pisos.flatMap(p =>
      p.alas.map(a => ({
        ...a,
        edificioNombre: ed.nombre,
        pisoNombre: p.nombre,
        camasOcupadas: a.camas.filter(c => c.estado === "ocupada" || c.estado === "aislamiento").length,
        camasLibres: a.camas.filter(c => c.estado === "libre").length,
      }))
    )
  );

  return (
    <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
      <CardHeader className="bg-muted/15 pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Directorio Tabular de Áreas, Pisos & Servicios Hospitalarios
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Estructura organizativa, jefaturas de servicio, capacidad instalada y contacto interno
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-bold">Servicio / Ala Asistencial</TableHead>
                <TableHead className="font-bold">Ubicación (Piso / Torre)</TableHead>
                <TableHead className="font-bold">Jefatura Médica</TableHead>
                <TableHead className="font-bold">Contacto Interno</TableHead>
                <TableHead className="text-center font-bold">Capacidad Camas</TableHead>
                <TableHead className="text-center font-bold">Ocupadas</TableHead>
                <TableHead className="text-center font-bold">Disponibles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicios.map(s => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell>
                    <span className="font-bold text-sm text-foreground block">{s.nombre}</span>
                    <Badge variant="outline" className="text-[10px] rounded-full uppercase">
                      {s.tipo}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground block">{s.pisoNombre.split("—")[0]}</span>
                    <span>{s.edificioNombre}</span>
                  </TableCell>

                  <TableCell className="text-xs text-foreground font-medium">
                    {s.jefeServicio}
                  </TableCell>

                  <TableCell className="text-xs font-mono text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3 text-primary" /> {s.telefonoInterno}
                    </span>
                  </TableCell>

                  <TableCell className="text-center font-mono font-bold text-xs">
                    {s.capacidadTotalCamas}
                  </TableCell>

                  <TableCell className="text-center font-mono font-bold text-xs text-blue-600">
                    {s.camasOcupadas}
                  </TableCell>

                  <TableCell className="text-center font-mono font-bold text-xs text-emerald-600">
                    {s.camasLibres}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
