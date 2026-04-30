import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, DollarSign, Receipt, CreditCard } from "lucide-react";
import { formatCurrency, resolveCurrency } from "@/lib/currency";

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  parcial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  pagada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  anulada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  en_seguro: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function VerticalFacturacionTab() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);
  const [open, setOpen] = useState(false);
  const [openPago, setOpenPago] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<string | null>(null);
  const [form, setForm] = useState({ descripcion: "", monto_total: 0, paciente_id: "" });
  const [pagoForm, setPagoForm] = useState({ monto: 0, metodo: "efectivo" });

  const { data: facturas = [], refetch } = useQuery({
    queryKey: ["facturas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("facturas").select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes_factura", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase.from("pacientes").select("id, nombre, apellido").eq("workspace_id", wsId!).eq("activo", true).order("nombre").limit(500);
      return data || [];
    },
  });

  const crearFactura = async () => {
    if (!wsId || !form.monto_total) return;
    const { error } = await supabase.from("facturas").insert({
      workspace_id: wsId,
      paciente_id: form.paciente_id || null,
      descripcion: form.descripcion || null,
      monto_total: form.monto_total,
      monto_pagado: 0,
      estado: "pendiente",
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Factura creada");
    setOpen(false);
    setForm({ descripcion: "", monto_total: 0, paciente_id: "" });
    refetch();
  };

  const registrarPago = async () => {
    if (!selectedFactura || !pagoForm.monto) return;
    const { error } = await supabase.from("pagos").insert({
      factura_id: selectedFactura,
      monto: pagoForm.monto,
      metodo: pagoForm.metodo || "efectivo",
      fecha_pago: new Date().toISOString(),
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Pago registrado");
    setOpenPago(false);
    setSelectedFactura(null);
    setPagoForm({ monto: 0, metodo: "efectivo" });
    refetch();
  };

  const totalPendiente = facturas.filter((f: any) => f.estado === "pendiente" || f.estado === "parcial").reduce((s: number, f: any) => s + (f.monto_total - (f.monto_pagado || 0)), 0);
  const totalCobrado = facturas.reduce((s: number, f: any) => s + (f.monto_pagado || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Total facturado</p><p className="text-2xl font-bold">{fmt(facturas.reduce((s: number, f: any) => s + f.monto_total, 0))}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Cobrado</p><p className="text-2xl font-bold text-green-600">{fmt(totalCobrado)}</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-xs text-muted-foreground">Pendiente</p><p className="text-2xl font-bold text-yellow-600">{fmt(totalPendiente)}</p></CardContent></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Facturación</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva factura</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva factura</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Paciente</Label>
                <Select value={form.paciente_id} onValueChange={v => setForm({ ...form, paciente_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{pacientes.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido || ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Descripción</Label><Input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} /></div>
              <div><Label>Monto total</Label><Input type="number" value={form.monto_total} onChange={e => setForm({ ...form, monto_total: +e.target.value })} /></div>
              <Button onClick={crearFactura}>Crear factura</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pago dialog */}
      <Dialog open={openPago} onOpenChange={setOpenPago}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pago</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label>Monto</Label><Input type="number" value={pagoForm.monto} onChange={e => setPagoForm({ ...pagoForm, monto: +e.target.value })} /></div>
            <div>
              <Label>Método</Label>
              <Select value={pagoForm.metodo} onValueChange={v => setPagoForm({ ...pagoForm, metodo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={registrarPago}>Registrar pago</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Paciente</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Pagado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.map((f: any) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-xs">{f.numero_factura || f.id.slice(0, 8)}</TableCell>
                <TableCell>{f.pacientes ? `${f.pacientes.nombre} ${f.pacientes.apellido || ""}` : "—"}</TableCell>
                <TableCell>{f.descripcion || "—"}</TableCell>
                <TableCell className="text-right">{fmt(f.monto_total)}</TableCell>
                <TableCell className="text-right">{fmt(f.monto_pagado || 0)}</TableCell>
                <TableCell><Badge className={ESTADO_COLORS[f.estado] || ""}>{f.estado}</Badge></TableCell>
                <TableCell>
                  {f.estado !== "pagada" && f.estado !== "anulada" && (
                    <Button size="sm" variant="outline" onClick={() => { setSelectedFactura(f.id); setPagoForm({ monto: f.monto_total - (f.monto_pagado || 0), metodo: "efectivo" }); setOpenPago(true); }}>
                      <CreditCard className="h-3 w-3 mr-1" /> Pagar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!facturas.length && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sin facturas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
