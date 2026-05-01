import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, FileText, Send, DollarSign, AlertCircle } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const TIPOS_NCF: Record<string, string> = {
  B01: "Crédito Fiscal", B02: "Consumidor Final", B04: "Nota de Crédito",
  B14: "Régimen Especial", B15: "Gubernamental", B16: "Exportación", B17: "Compras",
};

export default function VerticalFacturacionElectronicaTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    tipo_comprobante: "B02", rnc_cedula_cliente: "", nombre_cliente: "",
    subtotal: "", itbis: "", total: "",
  });

  const { data: facturas = [], refetch } = useQuery({
    queryKey: ["facturas_electronicas_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("facturas_electronicas_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: reportes = [], refetch: refetchRep } = useQuery({
    queryKey: ["reportes_fiscales_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("reportes_fiscales_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const calcularITBIS = (sub: string) => {
    const s = parseFloat(sub) || 0;
    const itbis = s * 0.18;
    setForm(f => ({ ...f, subtotal: sub, itbis: itbis.toFixed(2), total: (s + itbis).toFixed(2) }));
  };

  const crear = async () => {
    if (!wsId || !form.subtotal) return;
    const { error } = await (supabase.from("facturas_electronicas_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo,
      tipo_comprobante: form.tipo_comprobante,
      rnc_cedula_cliente: form.rnc_cedula_cliente || null,
      nombre_cliente: form.nombre_cliente || null,
      subtotal: parseFloat(form.subtotal), itbis: parseFloat(form.itbis) || 0,
      total: parseFloat(form.total) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Factura electrónica creada");
    setOpen(false);
    setForm({ tipo_comprobante: "B02", rnc_cedula_cliente: "", nombre_cliente: "", subtotal: "", itbis: "", total: "" });
    refetch();
  };

  const totalFacturado = facturas.filter((f: any) => f.estado_dgii !== "anulado").reduce((s: number, f: any) => s + parseFloat(f.total || 0), 0);
  const totalITBIS = facturas.filter((f: any) => f.estado_dgii !== "anulado").reduce((s: number, f: any) => s + parseFloat(f.itbis || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><div className="text-2xl font-bold">{facturas.length}</div><div className="text-xs text-muted-foreground">Comprobantes</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">RD${totalFacturado.toLocaleString()}</div><div className="text-xs text-muted-foreground">Total facturado</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-orange-600">RD${totalITBIS.toLocaleString()}</div><div className="text-xs text-muted-foreground">ITBIS recaudado</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-red-600">{facturas.filter((f: any) => f.estado_dgii === "rechazado").length}</div><div className="text-xs text-muted-foreground">Rechazados DGII</div></Card>
      </div>

      <Tabs defaultValue="facturas">
        <TabsList>
          <TabsTrigger value="facturas">Comprobantes e-CF</TabsTrigger>
          <TabsTrigger value="reportes">Reportes 606/607</TabsTrigger>
        </TabsList>

        <TabsContent value="facturas">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Comprobantes Fiscales Electrónicos</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo comprobante</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Emitir comprobante fiscal</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Tipo de comprobante</Label>
                    <Select value={form.tipo_comprobante} onValueChange={v => setForm({ ...form, tipo_comprobante: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIPOS_NCF).map(([k, v]) => <SelectItem key={k} value={k}>{k} — {v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>RNC / Cédula</Label><Input value={form.rnc_cedula_cliente} onChange={e => setForm({ ...form, rnc_cedula_cliente: e.target.value })} /></div>
                    <div><Label>Nombre cliente</Label><Input value={form.nombre_cliente} onChange={e => setForm({ ...form, nombre_cliente: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label>Subtotal</Label><Input type="number" value={form.subtotal} onChange={e => calcularITBIS(e.target.value)} /></div>
                    <div><Label>ITBIS (18%)</Label><Input type="number" value={form.itbis} readOnly className="bg-muted" /></div>
                    <div><Label>Total</Label><Input type="number" value={form.total} readOnly className="bg-muted font-bold" /></div>
                  </div>
                  <Button onClick={crear}><FileText className="h-4 w-4 mr-1" />Emitir</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No. Factura</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>ITBIS</TableHead>
                  <TableHead>Estado DGII</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-sm">{f.numero_factura}</TableCell>
                    <TableCell><Badge variant="outline">{f.tipo_comprobante}</Badge></TableCell>
                    <TableCell>{f.nombre_cliente || f.rnc_cedula_cliente || "—"}</TableCell>
                    <TableCell className="font-medium">RD${parseFloat(f.total).toLocaleString()}</TableCell>
                    <TableCell>RD${parseFloat(f.itbis).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={f.estado_dgii === "aceptado" ? "default" : f.estado_dgii === "rechazado" ? "destructive" : "secondary"}>
                        {f.estado_dgii === "rechazado" && <AlertCircle className="h-3 w-3 mr-1" />}
                        {f.estado_dgii}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!facturas.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin comprobantes</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="reportes">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reportes Fiscales</h3>
            {reportes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportes.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell><Badge variant="outline">{r.tipo_reporte}</Badge></TableCell>
                      <TableCell>{r.periodo}</TableCell>
                      <TableCell>{r.cantidad_registros}</TableCell>
                      <TableCell>RD${parseFloat(r.monto_total || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={r.estado === "enviado" || r.estado === "aceptado" ? "default" : "secondary"}>{r.estado}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">Sin reportes generados. Los reportes 606/607 se generan automáticamente al cierre de cada período.</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
