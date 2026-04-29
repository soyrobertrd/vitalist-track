import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldAlert, RefreshCw, Calendar, ExternalLink, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ResumenAuditoria() {
  const [resumenes, setResumenes] = useState<any[]>([]);
  const [generando, setGenerando] = useState(false);

  const cargar = async () => {
    const { data } = await (supabase.from("auditoria_resumenes") as any)
      .select("*").order("created_at", { ascending: false }).limit(10);
    setResumenes(data || []);
  };

  useEffect(() => { cargar(); }, []);

  const generar = async (periodo: "diario" | "semanal") => {
    setGenerando(true);
    const { error } = await (supabase as any).rpc("generar_resumen_auditoria", { _periodo: periodo });
    setGenerando(false);
    if (error) return toast.error(error.message);
    toast.success(`Resumen ${periodo} generado`);
    cargar();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" />Resúmenes de auditoría</CardTitle>
          <CardDescription>Snapshots con acciones sospechosas</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => generar("diario")} disabled={generando}>
            <RefreshCw className={`h-4 w-4 mr-1 ${generando ? "animate-spin" : ""}`} />Diario
          </Button>
          <Button size="sm" variant="outline" onClick={() => generar("semanal")} disabled={generando}>
            <Calendar className="h-4 w-4 mr-1" />Semanal
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resumenes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Sin resúmenes — genera uno arriba</p>
        )}
        {resumenes.map((r) => (
          <div key={r.id} className="rounded border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant={r.periodo === "semanal" ? "default" : "secondary"}>{r.periodo}</Badge>
                <span className="text-xs text-muted-foreground ml-2">
                  {new Date(r.fecha_inicio).toLocaleDateString("es-DO")} → {new Date(r.fecha_fin).toLocaleDateString("es-DO")}
                </span>
              </div>
              <div className="flex gap-2 text-sm">
                <span><strong>{r.total_eventos}</strong> eventos</span>
                <span className="text-destructive"><strong>{r.total_alertas}</strong> alertas</span>
              </div>
            </div>
            {r.acciones_sospechosas?.length > 0 && (
              <div className="space-y-1 mt-2">
                <p className="text-xs font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Acciones sospechosas:</p>
                {r.acciones_sospechosas.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex items-start gap-2 text-xs rounded bg-muted/40 p-2">
                    <Badge variant={a.severidad === "alta" ? "destructive" : "default"} className="text-[10px]">{a.severidad}</Badge>
                    <div className="flex-1">
                      <div>{a.descripcion}</div>
                      <div className="text-muted-foreground">{new Date(a.created_at).toLocaleString("es-DO")}</div>
                    </div>
                    <Link to={`/auditoria?alerta=${a.id}`}>
                      <Button size="icon" variant="ghost" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button>
                    </Link>
                  </div>
                ))}
                {r.acciones_sospechosas.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{r.acciones_sospechosas.length - 5} más</p>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
