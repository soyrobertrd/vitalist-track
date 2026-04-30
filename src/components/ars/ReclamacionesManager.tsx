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
import { Plus, FileText, Send, CheckCircle2 } from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { resolveCurrency, formatCurrency } from "@/lib/currency";
import { localeFromCountry } from "@/lib/dateFormat";

const estadoColor: Record<string, string> = {
  borrador: "bg-gray-500/10 text-gray-700 border-gray-500/30",
  enviada: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  en_revision: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  pagada: "bg-green-500/10 text-green-700 border-green-500/30",
  rechazada: "bg-red-500/10 text-red-700 border-red-500/30",
  parcial: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  anulada: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

interface Reclamacion {
  id: string;
  numero_reclamacion: string | null;
  numero_lote: string | null;
  estado: string;
  fecha_envio: string | null;
  fecha_respuesta: string | null;
  monto_reclamado: number;
  monto_aprobado: number;
  monto_rechazado: number;
  cantidad_casos: number;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  motivo_rechazo: string | null;
  notas: string | null;
  aseguradora_id: string;
  aseguradoras?: { nombre: string } | null;
}

const emptyForm = {
  aseguradora_id: "",
  numero_lote: "",
  monto_reclamado: "",
  cantidad_casos: "",
  periodo_desde: "",
  periodo_hasta: "",
  notas: "",
};

export function ReclamacionesManager() {
  const { currentWorkspace } = useWorkspace();
  const wsId = (currentWorkspace as any)?.id;
  const { countryCode } = useLocale();
  const currency = resolveCurrency(currentWorkspace, countryCode);
  const locale = localeFromCountry(countryCode);
  const fmt = (n: number | string | null) => n != null ? formatCurrency(n, currency, locale) : "—";

  const [items, setItems] = useState<Reclamacion[]>([]);
  const [aseguradoras, setAseguradoras] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const { data } = await supabase
      .from("reclamaciones_ars")
      .select("*, aseguradoras(nombre)")
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
    if (!form.aseguradora_id) { toast({ title: "Aseguradora requerida", variant: "destructive" }); return; }
    const { error } = await supabase.from("reclamaciones_ars").insert({
      workspace_id: wsId,
      aseguradora_id: form.aseguradora_id,
      numero_lote: form.numero_lote || null,
      monto_reclamado: parseFloat(form.monto_reclamado) || 0,
      cantidad_casos: parseInt(form.cantidad_casos) || 0,
      periodo_desde: form.periodo_desde || null,
      periodo_hasta: form.periodo_hasta || null,
      notas: form.notas || null,
    } as any);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Reclamación creada" });
    setOpen(false);
    setForm(emptyForm);
    cargar();
  };

  const actualizarEstado = async (id: string, estado: string, extra?: Record<string, any>) => {
    const payload: any = { estado, ...extra };
    if (estado === "enviada") payload.fecha_envio = new Date().toISOString().split("T")[0];
    if (["pagada", "rechazada", "parcial"].includes(estado)) payload.fecha_respuesta = new Date().toISOString().split("T")[0];
    await supabase.from("reclamaciones_ars").update(payload).eq("id", id);
    toast({ title: `Reclamación ${estado}` });
    cargar();
  };

  const filtered = filtroEstado === "todos" ? items : items.filter(i => i.estado === filtroEstado);

  const totalReclamado = items.reduce((s, r) => s + Number(r.monto_reclamado), 0);
  const totalAprobado = items.reduce((s, r) => s + Number(r.monto_aprobado), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div><p className="text-xs text-muted-foreground">Reclamaciones</p><p className="text-xl font-bold">{items.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <Send className="h-8 w-8 text-blue-600" />
          <div><p className="text-xs text-muted-foreground">Total reclamado</p><p className="text-xl font-bold">{fmt(totalReclamado)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
          <div><p className="text-xs text-muted-foreground">Total aprobado</p><p className="text-xl font-bold">{fmt(totalAprobado)}</p></div>
        </CardContent></Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Reclamaciones ARS
        </h3>
        <div className="flex items-center gap-2">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="en_revision">En revisión</SelectItem>
              <SelectItem value="pagada">Pagada</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="rechazada">Rechazada</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva Reclamación</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Aseguradora *</Label>
                  <Select value={form.aseguradora_id} onValueChange={v => setForm({ ...form, aseguradora_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {aseguradoras.map(a => <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>N° Lote</Label><Input value={form.numero_lote} onChange={e => setForm({ ...form, numero_lote: e.target.value })} /></div>
                  <div><Label>Monto reclamado</Label><Input type="number" step="0.01" value={form.monto_reclamado} onChange={e => setForm({ ...form, monto_reclamado: e.target.value })} /></div>
                </div>
                <div><Label>Cantidad de casos</Label><Input type="number" value={form.cantidad_casos} onChange={e => setForm({ ...form, cantidad_casos: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Período desde</Label><Input type="date" value={form.periodo_desde} onChange={e => setForm({ ...form, periodo_desde: e.target.value })} /></div>
                  <div><Label>Período hasta</Label><Input type="date" value={form.periodo_hasta} onChange={e => setForm({ ...form, periodo_hasta: e.target.value })} /></div>
                </div>
                <div><Label>Notas</Label><Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={crear}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Cargando...</p> : filtered.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay reclamaciones.</CardContent></Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>N° Reclamación</TableHead>
              <TableHead>Aseguradora</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Reclamado</TableHead>
              <TableHead>Aprobado</TableHead>
              <TableHead>Casos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.numero_reclamacion || "—"}</TableCell>
                <TableCell>{(r as any).aseguradoras?.nombre}</TableCell>
                <TableCell>{r.numero_lote || "—"}</TableCell>
                <TableCell>{fmt(r.monto_reclamado)}</TableCell>
                <TableCell>{fmt(r.monto_aprobado)}</TableCell>
                <TableCell>{r.cantidad_casos}</TableCell>
                <TableCell><Badge variant="outline" className={estadoColor[r.estado]}>{r.estado}</Badge></TableCell>
                <TableCell className="text-right space-x-1">
                  {r.estado === "borrador" && (
                    <Button size="sm" variant="outline" onClick={() => actualizarEstado(r.id, "enviada")}>
                      <Send className="h-3 w-3 mr-1" />Enviar
                    </Button>
                  )}
                  {r.estado === "enviada" && (
                    <Button size="sm" variant="outline" onClick={() => actualizarEstado(r.id, "en_revision")}>En revisión</Button>
                  )}
                  {(r.estado === "enviada" || r.estado === "en_revision") && (
                    <>
                      <Button size="sm" variant="default" onClick={() => {
                        const monto = prompt("Monto aprobado:");
                        if (monto) actualizarEstado(r.id, "pagada", { monto_aprobado: parseFloat(monto) });
                      }}>Pagada</Button>
                      <Button size="sm" variant="secondary" onClick={() => {
                        const monto = prompt("Monto aprobado parcial:");
                        const rechazado = prompt("Monto rechazado:");
                        actualizarEstado(r.id, "parcial", {
                          monto_aprobado: monto ? parseFloat(monto) : 0,
                          monto_rechazado: rechazado ? parseFloat(rechazado) : 0,
                        });
                      }}>Parcial</Button>
                      <Button size="sm" variant="destructive" onClick={() => {
                        const motivo = prompt("Motivo de rechazo:");
                        actualizarEstado(r.id, "rechazada", { motivo_rechazo: motivo, monto_rechazado: r.monto_reclamado });
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
