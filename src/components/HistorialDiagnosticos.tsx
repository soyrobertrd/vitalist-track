import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, Trash2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudItem {
  id: string;
  diagnostico_id: string | null;
  accion: string;
  cie10_codigo: string | null;
  cambios: Record<string, [any, any]> | null;
  motivo: string | null;
  usuario_id: string | null;
  created_at: string;
}

const ICONS: Record<string, JSX.Element> = {
  INSERT: <Plus className="h-3.5 w-3.5 text-primary" />,
  UPDATE: <Pencil className="h-3.5 w-3.5 text-amber-500" />,
  DELETE: <Trash2 className="h-3.5 w-3.5 text-destructive" />,
};

export function HistorialDiagnosticos({ pacienteId }: { pacienteId: string }) {
  const [items, setItems] = useState<AudItem[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!show) return;
    (async () => {
      const { data } = await (supabase.from("diagnosticos_auditoria") as any)
        .select("id, diagnostico_id, accion, cie10_codigo, cambios, motivo, usuario_id, created_at")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data as any) || []);

      const ids = Array.from(new Set((data || []).map((d: any) => d.usuario_id).filter(Boolean)));
      if (ids.length > 0) {
        const { data: profs } = await (supabase.from("profiles") as any)
          .select("id, nombre, apellido").in("id", ids);
        const map: Record<string, string> = {};
        (profs || []).forEach((p: any) => { map[p.id] = `${p.nombre} ${p.apellido || ""}`.trim(); });
        setUsuarios(map);
      }
    })();
  }, [pacienteId, show]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" />Historial de cambios CIE-10</CardTitle>
          <CardDescription>Quién, cuándo y qué cambió en los diagnósticos</CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShow((s) => !s)}>
          {show ? "Ocultar" : "Mostrar"}
        </Button>
      </CardHeader>
      {show && (
        <CardContent className="space-y-2">
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Sin cambios registrados</p>
          )}
          {items.map((it) => (
            <div key={it.id} className="rounded-md border p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {ICONS[it.accion]}
                <Badge variant="outline" className="text-xs">{it.accion}</Badge>
                {it.cie10_codigo && <Badge variant="secondary" className="font-mono text-xs">{it.cie10_codigo}</Badge>}
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(it.created_at).toLocaleString("es-DO")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Por: {it.usuario_id ? usuarios[it.usuario_id] || it.usuario_id.slice(0, 8) : "Sistema"}
              </div>
              {it.cambios && Object.keys(it.cambios).length > 0 && (
                <div className="space-y-1 mt-2">
                  {Object.entries(it.cambios).map(([campo, [a, b]]: any) => (
                    <div key={campo} className="flex items-center gap-2 text-xs bg-muted/40 rounded p-1.5">
                      <span className="font-medium capitalize">{campo}:</span>
                      <span className="text-muted-foreground line-through">{String(a ?? "—")}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-medium">{String(b ?? "—")}</span>
                    </div>
                  ))}
                </div>
              )}
              {it.motivo && <p className="text-xs italic mt-1">Motivo: {it.motivo}</p>}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

export default HistorialDiagnosticos;
