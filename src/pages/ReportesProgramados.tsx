import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Mail, Trash2, CalendarClock, FileText, Download, Send } from "lucide-react";
import {
  useReportesProgramados,
  useCrearReporteProgramado,
  useToggleReporte,
  useEliminarReporte,
  type FrecuenciaReporte,
  type FormatoReporte,
  type TipoReporte,
} from "@/hooks/useReportesProgramados";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TIPOS: { value: TipoReporte; label: string }[] = [
  { value: "kpi_profesionales", label: "KPIs por profesional" },
  { value: "comparativo_sucursales", label: "Comparativo por sucursal" },
  { value: "visitas_resumen", label: "Resumen de visitas" },
  { value: "llamadas_resumen", label: "Resumen de llamadas" },
  { value: "facturacion", label: "Facturación" },
  { value: "pacientes_estado", label: "Estado de pacientes" },
  { value: "auditoria_accesos", label: "Auditoría de accesos" },
];

export default function ReportesProgramados() {
  const { isAdmin } = useUserRole();
  const { data: reportes = [], isLoading } = useReportesProgramados();
  const crear = useCrearReporteProgramado();
  const toggle = useToggleReporte();
  const eliminar = useEliminarReporte();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    tipo_reporte: "kpi_profesionales" as TipoReporte,
    frecuencia: "mensual" as FrecuenciaReporte,
    formato: "pdf" as FormatoReporte,
    destinatariosTexto: "",
    hora_envio: "08:00",
  });

  const handleCrear = async () => {
    const destinatarios = form.destinatariosTexto
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.includes("@"));
    if (!form.nombre.trim() || destinatarios.length === 0) return;
    await crear.mutateAsync({
      nombre: form.nombre,
      tipo_reporte: form.tipo_reporte,
      frecuencia: form.frecuencia,
      formato: form.formato,
      destinatarios: destinatarios as any,
      hora_envio: form.hora_envio,
    });
    setOpen(false);
    setForm({ ...form, nombre: "", destinatariosTexto: "" });
  };

  const ejecutarAhora = async (r: any, soloDescargar: boolean) => {
    toast.loading(soloDescargar ? "Generando reporte…" : "Generando y enviando…", { id: "gen-rep" });
    const { data, error } = await supabase.functions.invoke("generar-reporte", {
      body: {
        workspace_id: r.workspace_id,
        tipo_reporte: r.tipo_reporte,
        filtros: r.filtros ?? {},
        destinatarios: r.destinatarios ?? [],
        enviar_email: !soloDescargar,
        reporte_id: soloDescargar ? null : r.id,
      },
    });
    toast.dismiss("gen-rep");
    if (error || !data?.ok) {
      toast.error("No se pudo generar el reporte");
      return;
    }
    // Descargar siempre
    const blob = new Blob([data.csv ?? ""], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = data.filename ?? "reporte.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(
      soloDescargar
        ? `Reporte descargado (${data.filas} filas)`
        : `Enviado a ${(r.destinatarios ?? []).length} destinatarios`
    );
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
          <CardDescription>Solo administradores pueden gestionar reportes programados.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-primary" /> Reportes programados
          </h1>
          <p className="text-muted-foreground text-sm">
            Envía reportes automáticos por email con la frecuencia que necesites.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nuevo reporte</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Programar envío automático</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Nombre interno</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="KPIs mensuales gerencia" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de reporte</Label>
                  <Select value={form.tipo_reporte} onValueChange={(v) => setForm({ ...form, tipo_reporte: v as TipoReporte })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Frecuencia</Label>
                  <Select value={form.frecuencia} onValueChange={(v) => setForm({ ...form, frecuencia: v as FrecuenciaReporte })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diario</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Formato</Label>
                  <Select value={form.formato} onValueChange={(v) => setForm({ ...form, formato: v as FormatoReporte })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora de envío</Label>
                  <Input type="time" value={form.hora_envio} onChange={(e) => setForm({ ...form, hora_envio: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Destinatarios (separados por coma)</Label>
                <Input
                  value={form.destinatariosTexto}
                  onChange={(e) => setForm({ ...form, destinatariosTexto: e.target.value })}
                  placeholder="director@clinica.com, gerencia@clinica.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCrear} disabled={crear.isPending}>Crear</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Destinatarios</TableHead>
                <TableHead>Último envío</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (<TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Cargando…</TableCell></TableRow>)}
              {!isLoading && reportes.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Sin reportes programados aún.</TableCell></TableRow>
              )}
              {reportes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{r.nombre}</TableCell>
                  <TableCell><Badge variant="secondary">{TIPOS.find((t) => t.value === r.tipo_reporte)?.label ?? r.tipo_reporte}</Badge></TableCell>
                  <TableCell className="capitalize">{r.frecuencia}</TableCell>
                  <TableCell className="text-xs"><Mail className="h-3 w-3 inline mr-1" />{(r.destinatarios as any[])?.length ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.ultimo_envio ? format(new Date(r.ultimo_envio), "dd MMM yyyy", { locale: es }) : "Nunca"}
                  </TableCell>
                  <TableCell>
                    <Switch checked={r.activo} onCheckedChange={(v) => toggle.mutate({ id: r.id, activo: v })} />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => eliminar.mutate(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Los envíos se procesan automáticamente por un cron en segundo plano. Puedes desactivar/eliminar sin afectar los reportes ya enviados.
      </p>
    </div>
  );
}
