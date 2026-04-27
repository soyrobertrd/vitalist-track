import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Shield, Eye, Download, FileText, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface AccesoLog {
  id: string;
  user_id: string;
  paciente_id: string;
  recurso: string;
  accion: string;
  ip_address: string | null;
  created_at: string;
  metadata: any;
}

interface PoliticaRetencion {
  id?: string;
  workspace_id?: string;
  retencion_anos: number;
  anonimizar_inactivos_meses: number;
  notificar_antes_dias: number;
  activo: boolean;
  notas: string | null;
}

const POLITICA_DEFAULT: PoliticaRetencion = {
  retencion_anos: 7,
  anonimizar_inactivos_meses: 60,
  notificar_antes_dias: 30,
  activo: true,
  notas: null,
};

export default function AuditoriaHIPAA() {
  const { currentWorkspace } = useWorkspace();
  const { isAdmin } = useUserRole();
  const [logs, setLogs] = useState<AccesoLog[]>([]);
  const [usuarios, setUsuarios] = useState<Record<string, string>>({});
  const [pacientes, setPacientes] = useState<Record<string, string>>({});
  const [politica, setPolitica] = useState<PoliticaRetencion>(POLITICA_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [savingPolitica, setSavingPolitica] = useState(false);
  const [filterUser, setFilterUser] = useState("");

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    loadData();
  }, [currentWorkspace?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, polRes] = await Promise.all([
        (supabase as any)
          .from("acceso_fichas_log")
          .select("*")
          .eq("workspace_id", currentWorkspace!.id)
          .order("created_at", { ascending: false })
          .limit(500),
        (supabase as any)
          .from("politicas_retencion")
          .select("*")
          .eq("workspace_id", currentWorkspace!.id)
          .maybeSingle(),
      ]);

      if (logsRes.error) throw logsRes.error;
      const logsData = (logsRes.data ?? []) as AccesoLog[];
      setLogs(logsData);

      // Resolver nombres de usuarios y pacientes
      const userIds = [...new Set(logsData.map((l) => l.user_id))];
      const pacIds = [...new Set(logsData.map((l) => l.paciente_id))];

      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id,nombre,apellido,email").in("id", userIds);
        setUsuarios(Object.fromEntries((profs ?? []).map((p: any) => [p.id, `${p.nombre} ${p.apellido}`.trim() || p.email])));
      }
      if (pacIds.length > 0) {
        const { data: pacs } = await supabase.from("pacientes").select("id,nombre,apellido").in("id", pacIds);
        setPacientes(Object.fromEntries((pacs ?? []).map((p: any) => [p.id, `${p.nombre} ${p.apellido}`])));
      }

      if (polRes.data) setPolitica(polRes.data as PoliticaRetencion);
    } catch (e: any) {
      toast.error("Error al cargar auditoría: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolitica = async () => {
    if (!currentWorkspace?.id) return;
    setSavingPolitica(true);
    try {
      const payload = {
        workspace_id: currentWorkspace.id,
        retencion_anos: politica.retencion_anos,
        anonimizar_inactivos_meses: politica.anonimizar_inactivos_meses,
        notificar_antes_dias: politica.notificar_antes_dias,
        activo: politica.activo,
        notas: politica.notas,
      };
      const { error } = await (supabase as any)
        .from("politicas_retencion")
        .upsert(payload, { onConflict: "workspace_id" });
      if (error) throw error;
      toast.success("Política de retención guardada");
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setSavingPolitica(false);
    }
  };

  const exportarCSV = () => {
    const filtered = filterUser
      ? logs.filter((l) => (usuarios[l.user_id] ?? l.user_id).toLowerCase().includes(filterUser.toLowerCase()))
      : logs;
    const rows = [
      ["Fecha", "Usuario", "Paciente", "Recurso", "Acción", "IP"],
      ...filtered.map((l) => [
        format(new Date(l.created_at), "yyyy-MM-dd HH:mm:ss"),
        usuarios[l.user_id] ?? l.user_id,
        pacientes[l.paciente_id] ?? l.paciente_id,
        l.recurso,
        l.accion,
        l.ip_address ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `auditoria_accesos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast.success("CSV exportado");
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
          <CardDescription>Solo administradores pueden acceder a la auditoría.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const filtered = filterUser
    ? logs.filter((l) => (usuarios[l.user_id] ?? l.user_id).toLowerCase().includes(filterUser.toLowerCase()))
    : logs;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" /> Auditoría y cumplimiento
        </h1>
        <p className="text-muted-foreground text-sm">
          Logs de acceso a fichas clínicas y política de retención de datos (HIPAA-like).
        </p>
      </div>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs"><Eye className="h-4 w-4 mr-1" /> Logs de acceso</TabsTrigger>
          <TabsTrigger value="retencion"><FileText className="h-4 w-4 mr-1" /> Retención</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Filtrar por usuario…"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="max-w-xs"
            />
            <Button variant="outline" onClick={exportarCSV}>
              <Download className="h-4 w-4 mr-2" /> Exportar CSV
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando…</TableCell></TableRow>
                  )}
                  {!loading && filtered.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin registros aún. Los accesos se registran automáticamente.</TableCell></TableRow>
                  )}
                  {filtered.slice(0, 200).map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(l.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm">{usuarios[l.user_id] ?? <span className="text-muted-foreground font-mono text-xs">{l.user_id.slice(0, 8)}…</span>}</TableCell>
                      <TableCell className="text-sm">{pacientes[l.paciente_id] ?? <span className="text-muted-foreground font-mono text-xs">{l.paciente_id.slice(0, 8)}…</span>}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{l.recurso}</Badge></TableCell>
                      <TableCell>
                        <Badge
                          variant={l.accion === "view" ? "secondary" : "default"}
                          className="text-xs capitalize"
                        >
                          {l.accion}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {filtered.length > 200 && (
            <p className="text-xs text-muted-foreground text-center">
              Mostrando los 200 más recientes de {filtered.length}. Exporta el CSV para verlos todos.
            </p>
          )}
        </TabsContent>

        <TabsContent value="retencion">
          <Card>
            <CardHeader>
              <CardTitle>Política de retención y anonimización</CardTitle>
              <CardDescription>
                Configura cuánto tiempo se conservan los datos clínicos y cuándo se anonimizan los pacientes inactivos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Retención (años)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={politica.retencion_anos}
                    onChange={(e) => setPolitica({ ...politica, retencion_anos: Number(e.target.value) || 7 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Mínimo legal típico: 5–10 años.</p>
                </div>
                <div>
                  <Label>Anonimizar inactivos (meses)</Label>
                  <Input
                    type="number"
                    min={6}
                    max={240}
                    value={politica.anonimizar_inactivos_meses}
                    onChange={(e) => setPolitica({ ...politica, anonimizar_inactivos_meses: Number(e.target.value) || 60 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Sin actividad registrada durante este tiempo.</p>
                </div>
                <div>
                  <Label>Notificar antes (días)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={365}
                    value={politica.notificar_antes_dias}
                    onChange={(e) => setPolitica({ ...politica, notificar_antes_dias: Number(e.target.value) || 30 })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Política activa</Label>
                  <p className="text-xs text-muted-foreground">Cuando está desactivada no se aplican los plazos.</p>
                </div>
                <Switch
                  checked={politica.activo}
                  onCheckedChange={(v) => setPolitica({ ...politica, activo: v })}
                />
              </div>
              <div>
                <Label>Notas internas</Label>
                <Input
                  value={politica.notas ?? ""}
                  onChange={(e) => setPolitica({ ...politica, notas: e.target.value })}
                  placeholder="Justificación regulatoria, referencias…"
                />
              </div>
              <Button onClick={handleSavePolitica} disabled={savingPolitica}>
                <Save className="h-4 w-4 mr-2" /> Guardar política
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
