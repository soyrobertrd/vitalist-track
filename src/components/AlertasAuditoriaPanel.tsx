/**
 * Panel de alertas de auditoría (acceso sospechoso).
 * Permite ver, filtrar por severidad y resolver alertas.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, ShieldCheck, Scan, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface Alerta {
  id: string;
  user_id: string;
  tipo: string;
  severidad: "baja" | "media" | "alta" | "critica";
  descripcion: string;
  metadata: any;
  resuelto: boolean;
  resuelto_at: string | null;
  notas_resolucion: string | null;
  created_at: string;
}

const SEV_COLOR: Record<string, string> = {
  baja: "bg-blue-500/10 text-blue-700 border-blue-300",
  media: "bg-amber-500/10 text-amber-700 border-amber-300",
  alta: "bg-orange-500/10 text-orange-700 border-orange-300",
  critica: "bg-destructive/10 text-destructive border-destructive/40",
};

const TIPO_LABEL: Record<string, string> = {
  fuera_horario: "Acceso fuera de horario",
  acceso_masivo: "Acceso masivo",
  descarga_excesiva: "Descargas excesivas",
  paciente_no_asignado: "Paciente no asignado",
};

export function AlertasAuditoriaPanel() {
  const { currentWorkspace } = useWorkspace();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "abiertas" | "resueltas">("abiertas");
  const [selected, setSelected] = useState<Alerta | null>(null);
  const [notas, setNotas] = useState("");

  const load = async () => {
    setLoading(true);
    let q = (supabase as any)
      .from("auditoria_alertas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (currentWorkspace?.id) q = q.eq("workspace_id", currentWorkspace.id);

    const { data, error } = await q;
    if (error) {
      toast.error("Error al cargar alertas");
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Alerta[];
    setAlertas(list);

    const userIds = [...new Set(list.map((a) => a.user_id))];
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,nombre,apellido,email")
        .in("id", userIds);
      setUsuarios(
        Object.fromEntries(
          (profs ?? []).map((p: any) => [p.id, `${p.nombre ?? ""} ${p.apellido ?? ""}`.trim() || p.email])
        )
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const { data, error } = await (supabase as any).rpc("detectar_accesos_sospechosos", {
        _workspace_id: currentWorkspace?.id ?? null,
      });
      if (error) throw error;
      toast.success(data > 0 ? `${data} alerta(s) nueva(s) detectada(s)` : "Sin nuevas alertas");
      load();
    } catch (e: any) {
      toast.error("Error al ejecutar análisis: " + e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleResolver = async () => {
    if (!selected) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from("auditoria_alertas")
      .update({
        resuelto: true,
        resuelto_at: new Date().toISOString(),
        resuelto_por: user?.id,
        notas_resolucion: notas || null,
      })
      .eq("id", selected.id);
    if (error) {
      toast.error("Error al resolver");
      return;
    }
    toast.success("Alerta resuelta");
    setSelected(null);
    setNotas("");
    load();
  };

  const filtradas = alertas.filter((a) =>
    filtro === "abiertas" ? !a.resuelto : filtro === "resueltas" ? a.resuelto : true
  );

  const abiertas = alertas.filter((a) => !a.resuelto).length;
  const criticas = alertas.filter((a) => !a.resuelto && a.severidad === "critica").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {(["abiertas", "resueltas", "todas"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                filtro === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-muted"
              }`}
            >
              {f === "abiertas" ? `Abiertas (${abiertas})` : f === "resueltas" ? "Resueltas" : "Todas"}
            </button>
          ))}
        </div>
        <Button onClick={handleScan} disabled={scanning} size="sm" variant="outline">
          {scanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Scan className="h-4 w-4 mr-2" />}
          Analizar accesos ahora
        </Button>
      </div>

      {criticas > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <span>
            <strong>{criticas}</strong> alerta(s) crítica(s) sin resolver requieren atención inmediata.
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin inline mr-2" /> Cargando alertas…
            </div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {filtro === "abiertas" ? "Sin alertas abiertas. Todo en orden." : "Sin alertas en este filtro."}
              </p>
              <Button onClick={handleScan} disabled={scanning} size="sm" variant="ghost" className="mt-2">
                <RefreshCw className="h-3 w-3 mr-1" /> Ejecutar análisis
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {filtradas.map((a) => (
                <li key={a.id} className="p-4 hover:bg-muted/30 transition">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className={SEV_COLOR[a.severidad]}>
                          {a.severidad}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {TIPO_LABEL[a.tipo] ?? a.tipo}
                        </Badge>
                        {a.resuelto && (
                          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-300">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Resuelta
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{a.descripcion}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Usuario: <strong>{usuarios[a.user_id] ?? a.user_id.slice(0, 8) + "…"}</strong>
                        {" · "}
                        {format(new Date(a.created_at), "d MMM yyyy HH:mm", { locale: es })}
                      </p>
                      {a.notas_resolucion && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Resolución: {a.notas_resolucion}
                        </p>
                      )}
                    </div>
                    {!a.resuelto && (
                      <Button size="sm" variant="outline" onClick={() => setSelected(a)}>
                        Resolver
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar alerta como resuelta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{selected?.descripcion}</p>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas de resolución (opcional): ¿qué se investigó, conclusión?"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={handleResolver}>Marcar como resuelta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
