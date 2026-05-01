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
import { toast } from "sonner";
import { Plus, CreditCard, DollarSign } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const METODOS = ["tarjeta", "transferencia", "paypal", "stripe", "efectivo", "mixto"];

export default function VerticalPagosTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ monto: "", metodo: "tarjeta", concepto: "", referencia_externa: "" });

  const { data: pagos = [], refetch } = useQuery({
    queryKey: ["pagos_online_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("pagos_online_vertical") as any).select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.monto) return;
    const { error } = await (supabase.from("pagos_online_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo, monto: parseFloat(form.monto),
      metodo: form.metodo, concepto: form.concepto || null, referencia_externa: form.referencia_externa || null,
      estado: "completado",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Pago registrado");
    setOpen(false);
    setForm({ monto: "", metodo: "tarjeta", concepto: "", referencia_externa: "" });
    refetch();
  };

  const totalCompletados = pagos.filter((p: any) => p.estado === "completado").reduce((s: number, p: any) => s + parseFloat(p.monto), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600"><DollarSign className="h-5 w-5 inline" />RD${totalCompletados.toLocaleString()}</div><div className="text-xs text-muted-foreground">Total cobrado</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold">{pagos.length}</div><div className="text-xs text-muted-foreground">Transacciones</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold">{pagos.filter((p: any) => p.estado === "pendiente").length}</div><div className="text-xs text-muted-foreground">Pendientes</div></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pagos Online</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Registrar pago</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar pago</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Monto (RD$)</Label><Input type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} /></div>
                <div>
                  <Label>Método</Label>
                  <Select value={form.metodo} onValueChange={v => setForm({ ...form, metodo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{METODOS.map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Concepto</Label><Input value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} /></div>
              <div><Label>Referencia externa</Label><Input value={form.referencia_externa} onChange={e => setForm({ ...form, referencia_externa: e.target.value })} placeholder="ID transacción Stripe/PayPal" /></div>
              <Button onClick={crear}><CreditCard className="h-4 w-4 mr-1" />Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{p.concepto || "—"}</TableCell>
                <TableCell><Badge variant="outline">{p.metodo}</Badge></TableCell>
                <TableCell className="font-medium">RD${parseFloat(p.monto).toLocaleString()}</TableCell>
                <TableCell><Badge variant={p.estado === "completado" ? "default" : p.estado === "fallido" ? "destructive" : "secondary"}>{p.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {!pagos.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin pagos</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
