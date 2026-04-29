import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, History, Search, Stethoscope, ArrowRight } from "lucide-react";
import DiagnosticosManager from "@/components/DiagnosticosManager";

interface Diagnostico {
  id: string;
  cie10_codigo: string;
  cie10_descripcion: string | null;
  tipo: string;
  certeza: string;
  notas: string | null;
  created_at: string;
}

interface AudItem {
  id: string;
  diagnostico_id: string | null;
  accion: string;
  cambios: Record<string, [any, any]> | null;
  motivo: string | null;
  usuario_id: string | null;
  created_at: string;
}

const CERT_COLOR: Record<string, string> = {
  confirmado: "bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400",
  provisional: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400",
  descartado: "bg-muted text-muted-foreground",
};

export function Cie10Workbench({ pacienteId }: { pacienteId: string }) {
  const [items, setItems] = useState<Diagnostico[]>([]);
  const [aud, setAud] = useState<AudItem[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: ds }, { data: as }] = await Promise.all([
      supabase.from("diagnosticos_clinicos")
        .select("id, cie10_codigo, cie10_descripcion, tipo, certeza, notas, created_at")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false }),
      (supabase.from("diagnosticos_auditoria") as any)
        .select("id, diagnostico_id, accion, cambios, motivo, usuario_id, created_at")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setItems((ds as any) || []);
    setAud((as as any) || []);

    const ids = Array.from(new Set(((as as any) || []).map((d: any) => d.usuario_id).filter(Boolean)));
    if (ids.length) {
      const { data: profs } = await (supabase.from("profiles") as any)
        .select("id, nombre, apellido").in("id", ids);
      const map: Record<string, string> = {};
      (profs || []).forEach((p: any) => { map[p.id] = `${p.nombre} ${p.apellido || ""}`.trim(); });
      setUsuarios(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [pacienteId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((d) =>
      d.cie10_codigo.toLowerCase().includes(s) ||
      (d.cie10_descripcion || "").toLowerCase().includes(s) ||
      d.tipo.toLowerCase().includes(s)
    );
  }, [q, items]);

  const audPorDiag = useMemo(() => {
    const map: Record<string, AudItem[]> = {};
    aud.forEach((a) => {
      if (!a.diagnostico_id) return;
      (map[a.diagnostico_id] ||= []).push(a);
    });
    return map;
  }, [aud]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" /> Diagnósticos CIE-10
          </CardTitle>
          <CardDescription>
            Busca y revisa diagnósticos del paciente. Cada uno muestra su historial de cambios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DiagnosticosManager pacienteId={pacienteId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2"><Search className="h-4 w-4" /> Revisión y auditoría</CardTitle>
              <CardDescription>{items.length} diagnóstico(s) registrado(s)</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, descripción o tipo…"
                className="pl-8"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && <p className="text-sm text-muted-foreground py-4 text-center">Cargando…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin resultados</p>
          )}

          {filtered.map((d) => {
            const hist = audPorDiag[d.id] || [];
            return (
              <Collapsible key={d.id} className="rounded-md border bg-card">
                <div className="flex items-start gap-2 p-3">
                  <Badge variant="outline" className="font-mono shrink-0">{d.cie10_codigo}</Badge>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{d.cie10_descripcion || "—"}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs capitalize">{d.tipo}</Badge>
                      <Badge variant="outline" className={`text-xs ${CERT_COLOR[d.certeza] || ""}`}>{d.certeza}</Badge>
                      <span className="text-xs text-muted-foreground ml-1">
                        {new Date(d.created_at).toLocaleDateString("es-DO")}
                      </span>
                    </div>
                    {d.notas && <p className="text-xs text-muted-foreground mt-1">{d.notas}</p>}
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="shrink-0">
                      <History className="h-4 w-4 mr-1" />
                      {hist.length}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="border-t px-3 py-2 bg-muted/30 space-y-2">
                    {hist.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Sin cambios registrados.</p>
                    ) : (
                      hist.map((it) => (
                        <div key={it.id} className="text-xs border rounded p-2 bg-card">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="outline" className="text-xs">{it.accion}</Badge>
                            <span className="text-muted-foreground">
                              {new Date(it.created_at).toLocaleString("es-DO")}
                              {" · "}
                              {it.usuario_id ? (usuarios[it.usuario_id] || it.usuario_id.slice(0, 8)) : "Sistema"}
                            </span>
                          </div>
                          {it.cambios && Object.keys(it.cambios).length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {Object.entries(it.cambios).map(([k, [a, b]]: any) => (
                                <div key={k} className="flex items-center gap-1">
                                  <span className="font-medium capitalize">{k}:</span>
                                  <span className="line-through text-muted-foreground">{String(a ?? "—")}</span>
                                  <ArrowRight className="h-3 w-3" />
                                  <span className="font-medium">{String(b ?? "—")}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {it.motivo && <p className="italic mt-1">Motivo: {it.motivo}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default Cie10Workbench;
