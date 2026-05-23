import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, FileText, Receipt } from "lucide-react";
import { useTranslation } from "react-i18next";

const TIPOS_NCF = [
  { v: "B01", l: "B01 - Crédito Fiscal" },
  { v: "B02", l: "B02 - Consumidor Final" },
  { v: "B03", l: "B03 - Nota de Débito" },
  { v: "B04", l: "B04 - Nota de Crédito" },
  { v: "B11", l: "B11 - Comprobante Proveedor Informal" },
  { v: "B13", l: "B13 - Comprobante Gastos Menores" },
  { v: "B14", l: "B14 - Régimen Especial" },
  { v: "B15", l: "B15 - Comprobante Gubernamental" },
  { v: "B16", l: "B16 - Comprobante Exportación" },
];

export default function FacturacionElectronicaRD() {
  const { t } = useTranslation(["facturacion_rd", "common"]);
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [secuencias, setSecuencias] = useState<any[]>([]);
  const [comprobantes, setComprobantes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [emitOpen, setEmitOpen] = useState(false);
  const [emitting, setEmitting] = useState(false);
  const [form, setForm] = useState({ tipo_ncf: "B02", serie: "B", inicio: 1, fin: 10000, actual: 1, fecha_vencimiento: "" });
  const [emitForm, setEmitForm] = useState({ tipo_ncf: "B02", rnc_cliente: "", subtotal: 0 });

  const load = async () => {
    if (!wsId) return;
    const [s, c] = await Promise.all([
      supabase.from("ncf_secuencias").select("*").eq("workspace_id", wsId).order("tipo_ncf"),
      supabase.from("comprobantes_fiscales").select("*").eq("workspace_id", wsId).order("created_at", { ascending: false }).limit(50),
    ]);
    setSecuencias(s.data || []); setComprobantes(c.data || []);
  };
  useEffect(() => { load(); }, [wsId]);

  const save = async () => {
    if (!wsId) return;
    const payload: any = { ...form, workspace_id: wsId, actual: form.inicio };
    if (!payload.fecha_vencimiento) delete payload.fecha_vencimiento;
    const { error } = await supabase.from("ncf_secuencias").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Secuencia registrada"); setOpen(false); load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Facturación Electrónica RD (NCF / e-CF)</h1>
      <p className="text-sm text-muted-foreground">Gestiona secuencias autorizadas por DGII y comprobantes fiscales emitidos.</p>

      <Tabs defaultValue="sec">
        <TabsList>
          <TabsTrigger value="sec">Secuencias NCF</TabsTrigger>
          <TabsTrigger value="cf">Comprobantes emitidos</TabsTrigger>
          <TabsTrigger value="info">Configuración DGII</TabsTrigger>
        </TabsList>

        <TabsContent value="sec" className="space-y-3">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nueva secuencia</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar secuencia NCF</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Tipo NCF</Label>
                    <Select value={form.tipo_ncf} onValueChange={v => setForm({ ...form, tipo_ncf: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TIPOS_NCF.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Inicio</Label><Input type="number" value={form.inicio} onChange={e => setForm({ ...form, inicio: +e.target.value })} /></div>
                    <div><Label>Fin</Label><Input type="number" value={form.fin} onChange={e => setForm({ ...form, fin: +e.target.value })} /></div>
                  </div>
                  <div><Label>Fecha vencimiento autorización</Label><Input type="date" value={form.fecha_vencimiento} onChange={e => setForm({ ...form, fecha_vencimiento: e.target.value })} /></div>
                  <Button onClick={save} className="w-full">Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Rango</TableHead><TableHead>Actual</TableHead><TableHead>Restantes</TableHead><TableHead>Vencimiento</TableHead></TableRow></TableHeader>
            <TableBody>
              {secuencias.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell><Badge>{s.tipo_ncf}</Badge></TableCell>
                  <TableCell>{s.inicio} → {s.fin}</TableCell>
                  <TableCell>{s.actual}</TableCell>
                  <TableCell>{s.fin - s.actual}</TableCell>
                  <TableCell>{s.fecha_vencimiento || "—"}</TableCell>
                </TableRow>
              ))}
              {!secuencias.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin secuencias</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="cf">
          <Card><CardContent className="pt-6"><Table>
            <TableHeader><TableRow><TableHead>NCF</TableHead><TableHead>Tipo</TableHead><TableHead>RNC</TableHead><TableHead>Total</TableHead><TableHead>ITBIS</TableHead><TableHead>Estado DGII</TableHead></TableRow></TableHeader>
            <TableBody>
              {comprobantes.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.ncf}</TableCell>
                  <TableCell><Badge>{c.tipo_ncf}</Badge></TableCell>
                  <TableCell>{c.rnc_cliente || "—"}</TableCell>
                  <TableCell>RD$ {c.total}</TableCell>
                  <TableCell>RD$ {c.itbis}</TableCell>
                  <TableCell><Badge variant={c.estado_dgii === "aceptado" ? "default" : c.estado_dgii === "rechazado" ? "destructive" : "secondary"}>{c.estado_dgii}</Badge></TableCell>
                </TableRow>
              ))}
              {!comprobantes.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin comprobantes emitidos</TableCell></TableRow>}
            </TableBody>
          </Table></CardContent></Card>
        </TabsContent>

        <TabsContent value="info">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Configuración DGII</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>1. Solicite a la DGII la autorización de secuencias NCF para cada tipo (B01, B02, etc.).</p>
              <p>2. Para emitir e-CF (factura electrónica), debe registrar el certificado digital de su empresa con la DGII.</p>
              <p>3. Una vez aprobado, configure el endpoint XML/SOAP en la sección de Integraciones.</p>
              <p className="text-muted-foreground">El envío automático de e-CF a DGII se activará cuando configure las credenciales del certificado digital.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
