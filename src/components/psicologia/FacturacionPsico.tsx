import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function FacturacionPsico({ pacientes }: { pacientes: any[] }) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ paciente_id: "", numero: "", subtotal: 0, itbis: 0, metodo_pago: "efectivo", nota: "" });

  const { data: facturas = [], refetch } = useQuery({
    queryKey: ["facturas_psico", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("facturas_psicologia" as any) as any)
        .select("*, pacientes(nombre, apellido)").eq("workspace_id", wsId!).order("created_at", { ascending: false }).limit(200);
      return (data || []) as any[];
    },
  });

  const crear = async () => {
    if (!wsId || !form.paciente_id || !form.numero) { toast.error("Paciente y número requeridos"); return; }
    const total = Number(form.subtotal) + Number(form.itbis);
    const { error } = await (supabase.from("facturas_psicologia" as any) as any).insert({ workspace_id: wsId, ...form, total });
    if (error) { toast.error(error.message); return; }
    toast.success("Factura emitida"); setOpen(false); refetch();
  };

  const marcarPagada = async (id: string) => {
    const { error } = await (supabase.from("facturas_psicologia" as any) as any).update({ estado: "pagada", fecha_pago: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Marcada como pagada"); refetch();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nueva factura</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Emitir factura</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Paciente</Label>
                <Select value={form.paciente_id} onValueChange={v=>setForm({...form, paciente_id:v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger>
                  <SelectContent>{pacientes.map((p:any)=><SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Número</Label><Input value={form.numero} onChange={e=>setForm({...form, numero:e.target.value})} placeholder="B0100000001" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Subtotal</Label><Input type="number" value={form.subtotal} onChange={e=>setForm({...form, subtotal:Number(e.target.value)})} /></div>
                <div><Label>ITBIS</Label><Input type="number" value={form.itbis} onChange={e=>setForm({...form, itbis:Number(e.target.value)})} /></div>
              </div>
              <div><Label>Método de pago</Label>
                <Select value={form.metodo_pago} onValueChange={v=>setForm({...form, metodo_pago:v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="seguro">Seguro/ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nota</Label><Input value={form.nota} onChange={e=>setForm({...form, nota:e.target.value})} /></div>
              <Button className="w-full" onClick={crear}>Emitir</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {facturas.length === 0
        ? <Card><CardContent className="py-8 text-center text-muted-foreground">Sin facturas</CardContent></Card>
        : facturas.map((f:any)=>(
          <Card key={f.id}><CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{f.numero} — {f.pacientes?.nombre} {f.pacientes?.apellido}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(f.fecha_emision), "dd/MM/yyyy")} · RD${Number(f.total).toFixed(2)} · {f.metodo_pago}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={f.estado === "pagada" ? "default" : "secondary"}>{f.estado}</Badge>
              {f.estado !== "pagada" && <Button size="sm" variant="outline" onClick={()=>marcarPagada(f.id)}><Check className="h-4 w-4 mr-1" />Pagar</Button>}
            </div>
          </CardContent></Card>
        ))}
    </div>
  );
}
