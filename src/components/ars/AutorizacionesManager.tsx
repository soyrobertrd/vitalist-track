import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, ClipboardCheck } from "lucide-react";
import { PacienteCombobox } from "@/components/PacienteCombobox";
import { ProfesionalCombobox } from "@/components/ProfesionalCombobox";
import { useLocale } from "@/hooks/useLocale";
import { resolveCurrency, formatCurrency } from "@/lib/currency";
import { localeFromCountry } from "@/lib/dateFormat";

const estadoColor: Record<string, string> = {
  solicitada: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  en_revision: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  aprobada: "bg-green-500/10 text-green-700 border-green-500/30",
  rechazada: "bg-red-500/10 text-red-700 border-red-500/30",
  vencida: "bg-gray-500/10 text-gray-700 border-gray-500/30",
  cancelada: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

interface Autorizacion {
  id: string;
  numero_autorizacion: string | null;
  estado: string;
  procedimiento: string;
  codigo_procedimiento: string | null;
  diagnostico_cie10: string | null;
  monto_solicitado: number | null;
  monto_autorizado: number | null;
  fecha_solicitud: string;
  fecha_respuesta: string | null;
  fecha_vencimiento: string | null;
  motivo_rechazo: string | null;
  notas: string | null;
  paciente_id: string;
  aseguradora_id: string;
  medico_solicitante: string | null;
  aseguradoras?: { nombre: string } | null;
  pacientes?: { nombre: string; apellido: string } | null;
}

const emptyForm = {
  paciente_id: "",
  aseguradora_id: "",
  procedimiento: "",
  codigo_procedimiento: "",
  diagnostico_cie10: "",
  monto_solicitado: "",
  medico_solicitante: "",
  notas: "",
};

export function AutorizacionesManager() {
  const { currentWorkspace } = useWorkspace();
  const wsId = (currentWorkspace as any)?.id;
  const { countryCode } = useLocale();
  const currency = resolveCurrency(currentWorkspace, countryCode);
  const locale = localeFromCountry(countryCode);
  const fmt = (n: number | string | null) => n != null ? formatCurrency(n, currency, locale) : "—";

  const [items, setItems] = useState<Autorizacion[]>([]);
  const [aseguradoras, setAseguradoras] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const { data } = await supabase
      .from("autorizaciones_medicas")
      .select("*, aseguradoras(nombre), pacientes(nombre, apellido)")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false });
    setItems((data as any[]) || []);

    const { data: asegs } = await supabase
      .from("aseguradoras")
      .select("id, nombre")
      .eq("workspace_id", wsId)
      .eq("activa", true)
      .order("nombre");
    setAseguradoras((asegs as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [wsId]);

  const crear = async () => {
    if (!form.paciente_id || !form.aseguradora_id || !form.procedimiento.trim()) {
      toast({ title: "Paciente, aseguradora y procedimiento requeridos", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("autorizaciones_medicas").insert({
      workspace_id: wsId,
      paciente_id: form.paciente_id,
      aseguradora_id: form.aseguradora_id,
      procedimiento: form.procedimiento,
      codigo_procedimiento: form.codigo_procedimiento || null,
      diagnostico_cie10: form.diagnostico_cie10 || null,
      monto_solicitado: form.monto_solicitado ? parseFloat(form.monto_solicitado) : null,
      medico_solicitante: form.medico_solicitante || null,
      notas: form.notas || null,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Autorización solicitada" });
    setOpen(false);
    setForm(emptyForm);
    cargar();
  };

  const actualizarEstado = async (id: string, estado: string, extra?: Record<string, any>) => {
    const payload: any = { estado, ...extra };
    if (estado === "aprobada" || estado === "rechazada") payload.fecha_respuesta = new Date().toISOString().split("T")[0];
    await supabase.from("autorizaciones_medicas").update(payload).eq("id", id);
    toast({ title: `Autorización ${estado}` });
    cargar();
  };

  const filtered = filtroEstado === "todos" ? items : items.filter(i => i.estado === filtroEstado);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" /> Autorizaciones Médicas
        </h3>
        <div className="flex items-center gap-2">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="solicitada">Solicitada</SelectItem>
              <SelectItem value="en_revision">En revisión</SelectItem>
              <SelectItem value="aprobada">Aprobada</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
              <SelectItem value="vencida">Vencida</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Solicitar</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nueva Autorización</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Paciente *</Label>
                  <PacienteCombobox value={form.paciente_id} onValueChange={v => setForm({ ...form, paciente_id: v })} />
                </div>
                <div>
                  <Label>Aseguradora *</Label>
                  <Select value={form.aseguradora_id} onValueChange={v => setForm({ ...form, aseguradora_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {aseguradoras.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Procedimiento *</Label><Input value={form.procedimiento} onChange={e => setForm({ ...form, procedimiento: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Código proc.</Label><Input value={form.codigo_procedimiento} onChange={e => setForm({ ...form, codigo_procedimiento: e.target.value })} /></div>
                  <div><Label>CIE-10</Label><Input value={form.diagnostico_cie10} onChange={e => setForm({ ...form, diagnostico_cie10: e.target.value })} /></div>
                </div>
                <div><Label>Monto solicitado</Label><Input type="number" step="0.01" value={form.monto_solicitado} onChange={e => setForm({ ...form, monto_solicitado: e.target.value })} /></div>
                <div>
                  <Label>Médico solicitante</Label>
                  <ProfesionalCombobox value={form.medico_solicitante} onValueChange={v => setForm({ ...form, medico_solicitante: v })} />
                </div>
                <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={crear}>Solicitar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay autorizaciones.</CardContent></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Aseguradora</TableHead>
              <TableHead>Procedimiento</TableHead>
              <TableHead>Solicitado</TableHead>
              <TableHead>Autorizado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {(a as any).pacientes?.nombre} {(a as any).pacientes?.apellido}
                </TableCell>
                <TableCell>{(a as any).aseguradoras?.nombre}</TableCell>
                <TableCell>{a.procedimiento}</TableCell>
                <TableCell>{fmt(a.monto_solicitado)}</TableCell>
                <TableCell>{fmt(a.monto_autorizado)}</TableCell>
                <TableCell><Badge variant="outline" className={estadoColor[a.estado]}>{a.estado}</Badge></TableCell>
                <TableCell>{a.fecha_solicitud}</TableCell>
                <TableCell className="text-right space-x-1">
                  {a.estado === "solicitada" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => actualizarEstado(a.id, "en_revision")}>En revisión</Button>
                    </>
                  )}
                  {(a.estado === "solicitada" || a.estado === "en_revision") && (
                    <>
                      <Button size="sm" variant="default" onClick={() => {
                        const num = prompt("N° autorización:");
                        const monto = prompt("Monto autorizado:");
                        if (num) actualizarEstado(a.id, "aprobada", { numero_autorizacion: num, monto_autorizado: monto ? parseFloat(monto) : null });
                      }}>Aprobar</Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                        const motivo = prompt("Motivo de rechazo:");
                        actualizarEstado(a.id, "rechazada", { motivo_rechazo: motivo });
                      }}>Rechazar</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
