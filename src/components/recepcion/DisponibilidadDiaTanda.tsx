import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Sun, Sunset, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Profesional {
  id: string;
  nombre: string;
  apellido: string;
  especialidad?: string | null;
}

const TANDAS = [
  { id: "manana", label: "Mañana", icon: Sun, h_ini: 7, h_fin: 12 },
  { id: "tarde", label: "Tarde", icon: Sunset, h_ini: 12, h_fin: 18 },
  { id: "noche", label: "Noche", icon: Sunset, h_ini: 18, h_fin: 22 },
] as const;

export function DisponibilidadDiaTanda() {
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profId, setProfId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [agenda, setAgenda] = useState<any[]>([]);
  const [ausencias, setAusencias] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("personal_salud")
      .select("id, nombre, apellido, especialidad")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => setProfesionales(data || []));
  }, []);

  const cargar = async () => {
    if (!profId) return;
    setLoading(true);
    const inicio = `${fecha}T00:00:00`;
    const fin = `${fecha}T23:59:59`;

    const [visitasRes, llamadasRes, ausRes] = await Promise.all([
      supabase
        .from("visitas")
        .select("id, fecha_hora_visita, duracion_minutos, estado, motivo_visita, pacientes(nombre, apellido)")
        .eq("profesional_id", profId)
        .gte("fecha_hora_visita", inicio)
        .lte("fecha_hora_visita", fin),
      supabase
        .from("registro_llamadas")
        .select("id, fecha_agendada, estado, motivo, pacientes(nombre, apellido)")
        .eq("profesional_id", profId)
        .gte("fecha_agendada", inicio)
        .lte("fecha_agendada", fin),
      supabase
        .from("ausencias_profesionales")
        .select("fecha_inicio, fecha_fin, motivo, tipo")
        .eq("profesional_id", profId)
        .lte("fecha_inicio", fin)
        .gte("fecha_fin", inicio),
    ]);

    const items = [
      ...(visitasRes.data || []).map((v: any) => ({
        ...v,
        tipo: "visita",
        fecha: v.fecha_hora_visita,
      })),
      ...(llamadasRes.data || []).map((l: any) => ({
        ...l,
        tipo: "llamada",
        fecha: l.fecha_agendada,
      })),
    ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    setAgenda(items);
    setAusencias(ausRes.data || []);
    setLoading(false);
  };

  const porTanda = (h_ini: number, h_fin: number) =>
    agenda.filter((a) => {
      const h = new Date(a.fecha).getHours();
      return h >= h_ini && h < h_fin;
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5" /> Disponibilidad por día y tanda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label>Profesional</Label>
            <Select value={profId} onValueChange={setProfId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                {profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Dr. {p.nombre} {p.apellido}
                    {p.especialidad ? ` — ${p.especialidad}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Fecha</Label>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={cargar} disabled={!profId || loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Consultar
            </Button>
          </div>
        </div>

        {ausencias.length > 0 && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <p className="font-semibold text-destructive">⚠ Profesional con ausencia/licencia este día</p>
            {ausencias.map((a, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                {a.tipo}: {a.motivo || "Sin motivo"}
              </p>
            ))}
          </div>
        )}

        {agenda.length > 0 && (
          <div className="grid md:grid-cols-3 gap-3">
            {TANDAS.map((t) => {
              const items = porTanda(t.h_ini, t.h_fin);
              return (
                <div key={t.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold flex items-center gap-1 text-sm">
                      <t.icon className="h-4 w-4" /> {t.label}
                    </p>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin citas</p>
                  ) : (
                    items.map((a) => (
                      <div key={a.id} className="text-xs bg-background border rounded p-2">
                        <div className="flex justify-between">
                          <span className="font-mono">{format(new Date(a.fecha), "HH:mm")}</span>
                          <Badge variant="outline" className="text-[10px]">{a.tipo}</Badge>
                        </div>
                        <p className="font-medium truncate">
                          {a.pacientes?.nombre} {a.pacientes?.apellido}
                        </p>
                        {(a.motivo_visita || a.motivo) && (
                          <p className="text-muted-foreground truncate">{a.motivo_visita || a.motivo}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {profId && !loading && agenda.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Sin citas agendadas para este día.</p>
        )}
      </CardContent>
    </Card>
  );
}
