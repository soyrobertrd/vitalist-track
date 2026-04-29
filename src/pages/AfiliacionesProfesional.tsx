import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, AlertTriangle, Crown, Plus, Trash2 } from "lucide-react";

interface Afiliacion {
  id: string;
  workspace_id: string | null;
  centro_nombre: string | null;
  rol: string | null;
  estado: string;
  created_at: string;
}

interface Workspace { id: string; nombre: string }

export default function AfiliacionesProfesional() {
  const [userId, setUserId] = useState<string | null>(null);
  const [afiliaciones, setAfiliaciones] = useState<Afiliacion[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [maxCentros, setMaxCentros] = useState(1);
  const [planCodigo, setPlanCodigo] = useState<string>("free");
  const [selWs, setSelWs] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);

      const { data: limite } = await supabase.rpc("limite_centros_profesional", { _user_id: u.user.id });
      setMaxCentros(limite || 1);

      const { data: ws } = await (supabase.from("workspaces") as any).select("id, nombre, plan_codigo").eq("owner_user_id", u.user.id).maybeSingle();
      if (ws?.plan_codigo) setPlanCodigo(ws.plan_codigo);

      const { data: afs } = await (supabase
        .from("afiliaciones_profesional") as any)
        .select("id, workspace_id, tipo, estado, created_at")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });

      // Map workspace name from workspaces list
      const { data: allWs } = await (supabase.from("workspaces") as any).select("id, nombre");
      setWorkspaces((allWs as any) || []);
      const wsMap = new Map((allWs || []).map((w: any) => [w.id, w.nombre]));
      const enriched = (afs || []).map((a: any) => ({
        ...a,
        rol: a.tipo,
        centro_nombre: wsMap.get(a.workspace_id) || "Centro",
      }));
      setAfiliaciones(enriched);
      setLoading(false);
    })();
  }, []);

  const activas = afiliaciones.filter((a) => a.estado === "activa").length;
  const porcentaje = Math.min(100, (activas / maxCentros) * 100);
  const cerca = activas >= maxCentros - 1;
  const lleno = activas >= maxCentros;

  const agregar = async () => {
    if (!selWs || !userId) return;
    // lookup profesional_id from personal_salud
    const { data: prof } = await (supabase.from("personal_salud") as any)
      .select("id").eq("user_id", userId).maybeSingle();
    if (!prof?.id) { toast.error("No se encontró tu perfil profesional"); return; }
    const { error } = await (supabase.from("afiliaciones_profesional") as any).insert({
      user_id: userId,
      profesional_id: prof.id,
      workspace_id: selWs,
      tipo: "medico",
      estado: "activa",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Afiliación agregada");
    setSelWs("");
    location.reload();
  };

  const eliminar = async (id: string) => {
    const { error } = await supabase.from("afiliaciones_profesional").update({ estado: "inactiva" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Afiliación desactivada");
    setAfiliaciones((p) => p.map((a) => a.id === id ? { ...a, estado: "inactiva" } : a));
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis afiliaciones</h1>
        <p className="text-muted-foreground">Centros donde puedes agendar pacientes según tu plan</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" />Plan {planCodigo.toUpperCase()}</CardTitle>
              <CardDescription>{activas} de {maxCentros} centros activos</CardDescription>
            </div>
            <Badge variant={lleno ? "destructive" : cerca ? "default" : "secondary"}>
              {lleno ? "Límite alcanzado" : `${maxCentros - activas} disponibles`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={porcentaje} />
          {cerca && !lleno && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Estás cerca del límite</AlertTitle>
              <AlertDescription>Te queda {maxCentros - activas} cupo. Considera actualizar tu plan para acceder a más centros.</AlertDescription>
            </Alert>
          )}
          {lleno && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Límite alcanzado</AlertTitle>
              <AlertDescription>
                Tu plan {planCodigo} permite máximo {maxCentros} centros. {planCodigo === "free" ? "Actualiza a Pro para hasta 5 centros." : "Desactiva uno para agregar otro."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Centros afiliados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!lleno && (
            <div className="flex gap-2">
              <Select value={selWs} onValueChange={setSelWs}>
                <SelectTrigger><SelectValue placeholder="Selecciona un centro" /></SelectTrigger>
                <SelectContent>
                  {workspaces
                    .filter((w) => !afiliaciones.some((a) => a.workspace_id === w.id && a.estado === "activa"))
                    .map((w) => <SelectItem key={w.id} value={w.id}>{w.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={agregar} disabled={!selWs}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
            </div>
          )}

          {afiliaciones.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sin afiliaciones</p>
          ) : (
            <div className="space-y-2">
              {afiliaciones.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">{a.centro_nombre || "Centro"}</div>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{a.rol}</Badge>
                      <Badge variant={a.estado === "activa" ? "default" : "secondary"} className="text-xs">{a.estado}</Badge>
                    </div>
                  </div>
                  {a.estado === "activa" && (
                    <Button variant="ghost" size="icon" onClick={() => eliminar(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
