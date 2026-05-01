import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Receipt, Camera } from "lucide-react";
import { toast } from "sonner";

export default function ARAging() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [aging, setAging] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const [{ data: a }, { data: b }] = await Promise.all([
      (supabase as any).rpc("calcular_ar_aging", { _workspace_id: wsId }),
      (supabase as any).from("ar_aging_snapshots").select("*").eq("workspace_id", wsId).order("fecha_corte", { ascending: false }).limit(20),
    ]);
    setAging(a || []);
    setSnapshots(b || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [wsId]);

  const guardarSnapshot = async () => {
    if (!wsId) return;
    const map: any = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    aging.forEach(a => map[a.rango] = Number(a.monto || 0));
    const total = Object.values(map).reduce((s: number, v: any) => s + v, 0);
    const { error } = await (supabase as any).from("ar_aging_snapshots").insert({
      workspace_id: wsId,
      fecha_corte: new Date().toISOString().slice(0, 10),
      rango_0_30: map["0-30"],
      rango_31_60: map["31-60"],
      rango_61_90: map["61-90"],
      rango_90_plus: map["90+"],
      total,
      detalle: aging,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Snapshot guardado");
    cargar();
  };

  const totalActual = aging.reduce((s, a) => s + Number(a.monto || 0), 0);
  const cantTotal = aging.reduce((s, a) => s + Number(a.cantidad || 0), 0);
  const colorRango: Record<string, string> = {
    "0-30": "bg-emerald-500/10 text-emerald-700",
    "31-60": "bg-yellow-500/10 text-yellow-700",
    "61-90": "bg-orange-500/10 text-orange-700",
    "90+": "bg-destructive/20 text-destructive",
  };

  if (loading) return <div className="p-6">Cargando AR aging...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" /> AR Aging - Cuentas por Cobrar
          </h1>
          <p className="text-sm text-muted-foreground">Antigüedad de saldos pendientes</p>
        </div>
        <Button onClick={guardarSnapshot}><Camera className="h-4 w-4 mr-1" /> Guardar snapshot</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 text-center"><div className="text-2xl font-bold">${totalActual.toLocaleString()}</div><div className="text-xs text-muted-foreground">Total por cobrar</div></Card>
        {["0-30", "31-60", "61-90", "90+"].map(r => {
          const row = aging.find(a => a.rango === r);
          return (
            <Card key={r} className="p-4 text-center">
              <Badge className={colorRango[r] + " text-xs mb-1"}>{r} días</Badge>
              <div className="text-xl font-bold">${Number(row?.monto || 0).toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">{row?.cantidad || 0} facturas</div>
            </Card>
          );
        })}
      </div>

      <div>
        <h3 className="font-semibold mb-2">Aging actual ({cantTotal} facturas)</h3>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Rango</TableHead><TableHead className="text-right">Monto</TableHead><TableHead className="text-right">Facturas</TableHead><TableHead className="text-right">% del total</TableHead></TableRow></TableHeader>
            <TableBody>
              {aging.map(a => (
                <TableRow key={a.rango}>
                  <TableCell><Badge className={colorRango[a.rango]}>{a.rango} días</Badge></TableCell>
                  <TableCell className="text-right font-mono">${Number(a.monto).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{a.cantidad}</TableCell>
                  <TableCell className="text-right">{totalActual > 0 ? ((Number(a.monto) / totalActual) * 100).toFixed(1) : 0}%</TableCell>
                </TableRow>
              ))}
              {!aging.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin saldos pendientes</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Histórico de snapshots</h3>
        <Card>
          <Table>
            <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead className="text-right">0-30</TableHead><TableHead className="text-right">31-60</TableHead><TableHead className="text-right">61-90</TableHead><TableHead className="text-right">90+</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {snapshots.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.fecha_corte + "T12:00:00").toLocaleDateString()}</TableCell>
                  <TableCell className="text-right font-mono">${Number(s.rango_0_30).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${Number(s.rango_31_60).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${Number(s.rango_61_90).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">${Number(s.rango_90_plus).toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">${Number(s.total).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!snapshots.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sin snapshots</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
