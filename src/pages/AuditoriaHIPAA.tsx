import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Eye, Download, FileText, Save, AlertTriangle, FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AlertasAuditoriaPanel } from "@/components/AlertasAuditoriaPanel";

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

const ACCION_BADGE: Record<string, string> = {
  view: "bg-blue-500/10 text-blue-700 border-blue-300",
  edit: "bg-amber-500/10 text-amber-700 border-amber-300",
  export: "bg-orange-500/10 text-orange-700 border-orange-300",
  download: "bg-orange-500/10 text-orange-700 border-orange-300",
  print: "bg-orange-500/10 text-orange-700 border-orange-300",
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
  const [generandoPdf, setGenerandoPdf] = useState(false);

  // filtros
  const [filterUser, setFilterUser] = useState("");
  const [filterPaciente, setFilterPaciente] = useState("");
  const [filterAccion, setFilterAccion] = useState<string>("todas");
  const [filterDesde, setFilterDesde] = useState<string>("");
  const [filterHasta, setFilterHasta] = useState<string>("");
  const [pagina, setPagina] = useState(1);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          .limit(1000),
        (supabase as any)
          .from("politicas_retencion")
          .select("*")
          .eq("workspace_id", currentWorkspace!.id)
          .maybeSingle(),
      ]);

      if (logsRes.error) throw logsRes.error;
      const logsData = (logsRes.data ?? []) as AccesoLog[];
      setLogs(logsData);

      const userIds = [...new Set(logsData.map((l) => l.user_id))];
      const pacIds = [...new Set(logsData.map((l) => l.paciente_id))];

      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id,nombre,apellido,email").in("id", userIds);
        setUsuarios(
          Object.fromEntries(
            (profs ?? []).map((p: any) => [p.id, `${p.nombre ?? ""} ${p.apellido ?? ""}`.trim() || p.email])
          )
        );
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

  const aplicarFiltros = (l: AccesoLog) => {
    if (filterUser && !(usuarios[l.user_id] ?? l.user_id).toLowerCase().includes(filterUser.toLowerCase())) return false;
    if (filterPaciente && !(pacientes[l.paciente_id] ?? l.paciente_id).toLowerCase().includes(filterPaciente.toLowerCase())) return false;
    if (filterAccion !== "todas" && l.accion !== filterAccion) return false;
    if (filterDesde && new Date(l.created_at) < new Date(filterDesde + "T00:00:00")) return false;
    if (filterHasta && new Date(l.created_at) > new Date(filterHasta + "T23:59:59")) return false;
    return true;
  };

  const filtrados = logs.filter(aplicarFiltros);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginados = filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const exportarCSV = () => {
    const rows = [
      ["Fecha", "Usuario", "Paciente", "Recurso", "Acción", "IP"],
      ...filtrados.map((l) => [
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

  const generarPDFFirmado = async () => {
    if (!currentWorkspace?.id) return;
    setGenerandoPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke("exportar-auditoria-pdf", {
        body: {
          workspace_id: currentWorkspace.id,
          fecha_inicio: filterDesde || null,
          fecha_fin: filterHasta || null,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const html = (data as any).html as string;
      const w = window.open("", "_blank");
      if (!w) {
        toast.error("Permite ventanas emergentes para descargar el PDF");
        return;
      }
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
      toast.success(`PDF generado · ${(data as any).total} registros · firma SHA-256 registrada`);
    } catch (e: any) {
      toast.error("Error generando PDF: " + e.message);
    } finally {
      setGenerandoPdf(false);
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-7 w-7 text-primary" /> Auditoría y cumplimiento
        </h1>
        <p className="text-muted-foreground text-sm">
          Logs de acceso a fichas clínicas, alertas de acceso sospechoso y política de retención (HIPAA-like).
        </p>
      </div>

      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs"><Eye className="h-4 w-4 mr-1" /> Logs</TabsTrigger>
          <TabsTrigger value="alertas"><AlertTriangle className="h-4 w-4 mr-1" /> Alertas</TabsTrigger>
          <TabsTrigger value="retencion"><FileText className="h-4 w-4 mr-1" /> Retención</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <div className="grid gap-2 md:grid-cols-5">
            <Input
              placeholder="Filtrar por usuario…"
              value={filterUser}
              onChange={(e) => { setFilterUser(e.target.value); setPagina(1); }}
            />
            <Input
              placeholder="Filtrar por paciente…"
              value={filterPaciente}
              onChange={(e) => { setFilterPaciente(e.target.value); setPagina(1); }}
            />
            <Select value={filterAccion} onValueChange={(v) => { setFilterAccion(v); setPagina(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las acciones</SelectItem>
                <SelectItem value="view">Vista</SelectItem>
                <SelectItem value="edit">Edición</SelectItem>
                <SelectItem value="export">Exporte</SelectItem>
                <SelectItem value="download">Descarga</SelectItem>
                <SelectItem value="print">Impresión</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterDesde}
              onChange={(e) => { setFilterDesde(e.target.value); setPagina(1); }}
              placeholder="Desde"
            />
            <Input
              type="date"
              value={filterHasta}
              onChange={(e) => { setFilterHasta(e.target.value); setPagina(1); }}
              placeholder="Hasta"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {filtrados.length} resultado(s){logs.length >= 1000 ? " · mostrando últimos 1000" : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportarCSV} disabled={!filtrados.length}>
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
              <Button size="sm" onClick={generarPDFFirmado} disabled={generandoPdf || !filtrados.length}>
                {generandoPdf ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                PDF firmado
              </Button>
            </div>
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
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Cargando…
                    </TableCell></TableRow>
                  )}
                  {!loading && paginados.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p>Sin registros con estos filtros.</p>
                      {logs.length === 0 && (
                        <p className="text-xs mt-1">Los accesos a fichas clínicas se registran automáticamente.</p>
                      )}
                    </TableCell></TableRow>
                  )}
                  {paginados.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(l.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {usuarios[l.user_id] ?? <span className="text-muted-foreground font-mono text-xs">{l.user_id.slice(0, 8)}…</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pacientes[l.paciente_id] ?? <span className="text-muted-foreground font-mono text-xs">{l.paciente_id.slice(0, 8)}…</span>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{l.recurso}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs capitalize ${ACCION_BADGE[l.accion] ?? ""}`}>
                          {l.accion}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {filtrados.length > PAGE_SIZE && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Página {pagina} de {totalPaginas}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
                  Anterior
                </Button>
                <Button size="sm" variant="outline" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="alertas">
          <AlertasAuditoriaPanel />
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
