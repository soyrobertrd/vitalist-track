import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Lock, Calculator, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { useLocale } from "@/hooks/useLocale";
import { resolveCurrency, formatCurrency } from "@/lib/currency";

interface Cierre {
  id: string;
  fecha: string;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_otros: number;
  total_cobrado: number;
  total_devoluciones: number;
  total_neto: number;
  cantidad_facturas: number;
  cantidad_pagos: number;
  estado: string;
  notas: string | null;
  cerrado_en: string | null;
}

export function CierreCaja() {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const { countryCode } = useLocale();
  const currency = resolveCurrency(countryCode);
  const [cierres, setCierres] = useState<Cierre[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewDate, setPreviewDate] = useState(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCierres = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("cierres_caja")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(30);
    if (currentWorkspace) q = q.eq("workspace_id", currentWorkspace.id);
    if (activeSucursalId) q = q.eq("sucursal_id", activeSucursalId);
    const { data } = await q;
    setCierres((data || []) as unknown as Cierre[]);
    setLoading(false);
  }, [currentWorkspace, activeSucursalId]);

  useEffect(() => { fetchCierres(); }, [fetchCierres]);

  const calcularPreview = async () => {
    if (!currentWorkspace) { toast.error("Sin workspace activo"); return; }
    const { data, error } = await supabase.rpc("calcular_cierre_caja", {
      _fecha: previewDate,
      _workspace_id: currentWorkspace.id,
      _sucursal_id: activeSucursalId || null,
    });
    if (error) { toast.error(error.message); return; }
    setPreview(data);
    setPreviewOpen(true);
  };

  const confirmarCierre = async () => {
    if (!preview || !currentWorkspace) return;
    setSaving(true);
    const payload = {
      fecha: previewDate,
      workspace_id: currentWorkspace.id,
      sucursal_id: activeSucursalId || null,
      total_efectivo: preview.total_efectivo,
      total_tarjeta: preview.total_tarjeta,
      total_transferencia: preview.total_transferencia,
      total_otros: preview.total_otros,
      total_cobrado: preview.total_cobrado,
      total_devoluciones: preview.total_devoluciones,
      total_neto: preview.total_neto,
      cantidad_facturas: preview.cantidad_facturas,
      cantidad_pagos: preview.cantidad_pagos,
      estado: "cerrado" as any,
      cerrado_por: (await supabase.auth.getUser()).data.user?.id,
      cerrado_en: new Date().toISOString(),
      notas: notas || null,
    };

    const { error } = await supabase.from("cierres_caja").upsert(payload, {
      onConflict: "fecha,sucursal_id,workspace_id",
    });
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success("Cierre de caja registrado");
    setPreviewOpen(false);
    setNotas("");
    fetchCierres();
    setSaving(false);
  };

  const fmt = (n: number) => formatCurrency(n, currency, countryCode);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cierre de Caja
            </CardTitle>
            <div className="flex gap-2 items-end">
              <div>
                <Label className="text-xs">Fecha</Label>
                <Input type="date" value={previewDate} onChange={e => setPreviewDate(e.target.value)} className="w-[160px]" />
              </div>
              <Button size="sm" onClick={calcularPreview}>
                <Calculator className="h-4 w-4 mr-1" /> Calcular
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
          ) : cierres.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay cierres registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Efectivo</TableHead>
                  <TableHead className="text-right">Tarjeta</TableHead>
                  <TableHead className="text-right">Transferencia</TableHead>
                  <TableHead className="text-right">Devol.</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead className="text-right">Facturas</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierres.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{new Date(c.fecha + "T12:00:00").toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{fmt(c.total_efectivo)}</TableCell>
                    <TableCell className="text-right">{fmt(c.total_tarjeta)}</TableCell>
                    <TableCell className="text-right">{fmt(c.total_transferencia)}</TableCell>
                    <TableCell className="text-right text-destructive">{fmt(c.total_devoluciones)}</TableCell>
                    <TableCell className="text-right font-semibold">{fmt(c.total_neto)}</TableCell>
                    <TableCell className="text-right">{c.cantidad_facturas}</TableCell>
                    <TableCell>
                      <Badge variant={c.estado === "cerrado" ? "default" : "secondary"}>
                        {c.estado === "cerrado" ? <><Lock className="h-3 w-3 mr-1" />Cerrado</> : "Abierto"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Cierre de Caja — {new Date(previewDate + "T12:00:00").toLocaleDateString()}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Efectivo:</span><span className="text-right font-medium">{fmt(preview.total_efectivo)}</span>
                <span className="text-muted-foreground">Tarjeta:</span><span className="text-right font-medium">{fmt(preview.total_tarjeta)}</span>
                <span className="text-muted-foreground">Transferencia:</span><span className="text-right font-medium">{fmt(preview.total_transferencia)}</span>
                <span className="text-muted-foreground">Otros:</span><span className="text-right font-medium">{fmt(preview.total_otros)}</span>
                <hr className="col-span-2" />
                <span className="text-muted-foreground">Total cobrado:</span><span className="text-right font-semibold">{fmt(preview.total_cobrado)}</span>
                <span className="text-muted-foreground text-destructive">Devoluciones:</span><span className="text-right text-destructive">{fmt(preview.total_devoluciones)}</span>
                <hr className="col-span-2" />
                <span className="font-semibold">NETO:</span><span className="text-right font-bold text-lg">{fmt(preview.total_neto)}</span>
                <span className="text-muted-foreground">Facturas:</span><span className="text-right">{preview.cantidad_facturas}</span>
                <span className="text-muted-foreground">Pagos:</span><span className="text-right">{preview.cantidad_pagos}</span>
              </div>
              <div>
                <Label>Notas (opcional)</Label>
                <Textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancelar</Button>
            <Button onClick={confirmarCierre} disabled={saving}>
              <Lock className="h-4 w-4 mr-1" /> {saving ? "Guardando..." : "Cerrar caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
