import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, RotateCcw, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { useLocale } from "@/hooks/useLocale";
import { resolveCurrency, formatCurrency } from "@/lib/currency";

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  aprobada: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  aplicada: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  rechazada: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface NotaCredito {
  id: string;
  numero_nota: string;
  factura_id: string;
  paciente_id: string;
  monto: number;
  motivo: string;
  estado: string;
  notas: string | null;
  created_at: string;
  fecha_aprobacion: string | null;
  facturas?: { numero_factura: string } | null;
  pacientes?: { nombre: string; apellido: string } | null;
}

interface Props {
  pacienteId?: string; // optional: filter by patient
}

export function NotasCredito({ pacienteId }: Props) {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const { countryCode } = useLocale();
  const currency = resolveCurrency(countryCode);
  const [notas, setNotas] = useState<NotaCredito[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [facturas, setFacturas] = useState<{ id: string; numero_factura: string; monto_total: number; paciente_id: string }[]>([]);

  const fetchNotas = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("notas_credito")
      .select("*, facturas:factura_id(numero_factura), pacientes:paciente_id(nombre, apellido)")
      .order("created_at", { ascending: false });
    if (currentWorkspace) q = q.eq("workspace_id", currentWorkspace.id);
    if (activeSucursalId) q = q.eq("sucursal_id", activeSucursalId);
    if (pacienteId) q = q.eq("paciente_id", pacienteId);
    const { data } = await q;
    setNotas((data || []) as unknown as NotaCredito[]);
    setLoading(false);
  }, [currentWorkspace, activeSucursalId, pacienteId]);

  useEffect(() => { fetchNotas(); }, [fetchNotas]);

  useEffect(() => {
    const loadFacturas = async () => {
      let q = supabase.from("facturas").select("id, numero_factura, monto_total, paciente_id").order("fecha_emision", { ascending: false }).limit(200);
      if (currentWorkspace) q = q.eq("workspace_id", currentWorkspace.id);
      if (pacienteId) q = q.eq("paciente_id", pacienteId);
      const { data } = await q;
      setFacturas(data || []);
    };
    loadFacturas();
  }, [currentWorkspace, pacienteId]);

  const save = async () => {
    if (!editing.factura_id || !editing.monto || !editing.motivo) {
      toast.error("Complete factura, monto y motivo"); return;
    }
    const factura = facturas.find(f => f.id === editing.factura_id);
    const payload = {
      factura_id: editing.factura_id,
      paciente_id: pacienteId || factura?.paciente_id,
      monto: parseFloat(editing.monto),
      motivo: editing.motivo,
      notas: editing.notas || null,
      workspace_id: currentWorkspace?.id || null,
      sucursal_id: activeSucursalId || null,
      creada_por: (await supabase.auth.getUser()).data.user?.id,
    };
    const { error } = await supabase.from("notas_credito").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Nota de crédito creada");
    setDialogOpen(false);
    fetchNotas();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    const update: any = { estado };
    if (estado === "aprobada" || estado === "aplicada") {
      update.aprobada_por = (await supabase.auth.getUser()).data.user?.id;
      update.fecha_aprobacion = new Date().toISOString();
    }
    await supabase.from("notas_credito").update(update).eq("id", id);
    toast.success("Estado actualizado");
    fetchNotas();
  };

  const fmt = (n: number) => formatCurrency(n, currency, countryCode);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Notas de Crédito / Devoluciones
          </CardTitle>
          <Button size="sm" onClick={() => { setEditing({}); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nueva NC
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
        ) : notas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay notas de crédito</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NC #</TableHead>
                <TableHead>Factura</TableHead>
                {!pacienteId && <TableHead>Paciente</TableHead>}
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notas.map(n => (
                <TableRow key={n.id}>
                  <TableCell className="font-mono text-sm">{n.numero_nota}</TableCell>
                  <TableCell className="text-sm">{(n.facturas as any)?.numero_factura || "—"}</TableCell>
                  {!pacienteId && (
                    <TableCell className="text-sm">
                      {n.pacientes ? `${(n.pacientes as any).nombre} ${(n.pacientes as any).apellido}` : "—"}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-medium">{fmt(n.monto)}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{n.motivo}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ESTADO_COLORS[n.estado] || ""}>{n.estado}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(n.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {n.estado === "pendiente" && (
                        <>
                          <Button size="icon" variant="ghost" title="Aprobar" onClick={() => cambiarEstado(n.id, "aprobada")}>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Rechazar" onClick={() => cambiarEstado(n.id, "rechazada")}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      {n.estado === "aprobada" && (
                        <Button size="sm" variant="outline" onClick={() => cambiarEstado(n.id, "aplicada")}>
                          Aplicar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nueva Nota de Crédito</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Factura *</Label>
              <Select value={editing.factura_id || ""} onValueChange={v => setEditing((p: any) => ({ ...p, factura_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar factura..." /></SelectTrigger>
                <SelectContent>
                  {facturas.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.numero_factura} — {fmt(f.monto_total)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Monto *</Label>
              <Input type="number" step="0.01" min="0" value={editing.monto || ""} onChange={e => setEditing((p: any) => ({ ...p, monto: e.target.value }))} />
            </div>
            <div>
              <Label>Motivo *</Label>
              <Textarea value={editing.motivo || ""} onChange={e => setEditing((p: any) => ({ ...p, motivo: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>Notas adicionales</Label>
              <Textarea value={editing.notas || ""} onChange={e => setEditing((p: any) => ({ ...p, notas: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Crear NC</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
