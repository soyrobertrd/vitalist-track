import React, { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/integrations/db/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Lock,
  Calculator,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  Building2,
  FileText,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { useLocale } from "@/hooks/useLocale";
import { resolveCurrency, formatCurrency } from "@/lib/currency";

export interface CierreCajaRegistro {
  id: string;
  fecha: string;
  turno: "Matutino (07:00 - 15:00)" | "Vespertino (15:00 - 23:00)" | "Nocturno / 24h (23:00 - 07:00)";
  cajero_nombre: string;
  total_efectivo: number;
  total_tarjeta: number;
  total_transferencia: number;
  total_otros: number;
  total_cobrado: number;
  total_devoluciones: number;
  total_neto: number;
  efectivo_declarado: number;
  tarjeta_declarada: number;
  transferencia_declarada: number;
  diferencia: number; // declarado - neto
  cantidad_facturas: number;
  cantidad_pagos: number;
  estado: "cerrado" | "abierto" | "auditado";
  lote_datáfono?: string;
  notas: string | null;
  cerrado_en: string | null;
}

const MOCK_HISTORIAL_CIERRES: CierreCajaRegistro[] = [
  {
    id: "cie-101",
    fecha: "2026-10-28",
    turno: "Vespertino (15:00 - 23:00)",
    cajero_nombre: "Lic. Ana Paula Rosario",
    total_efectivo: 38400,
    total_tarjeta: 64200,
    total_transferencia: 18500,
    total_otros: 0,
    total_cobrado: 121100,
    total_devoluciones: 1500,
    total_neto: 119600,
    efectivo_declarado: 38400,
    tarjeta_declarada: 64200,
    transferencia_declarada: 18500,
    diferencia: 0,
    cantidad_facturas: 42,
    cantidad_pagos: 44,
    estado: "auditado",
    lote_datáfono: "LOTE-CardNet-8841",
    notas: "Arqueo cuadrado sin discrepancias. Se envía bulto de efectivo a bóveda principal.",
    cerrado_en: "2026-10-28T23:05:00Z",
  },
  {
    id: "cie-102",
    fecha: "2026-10-28",
    turno: "Matutino (07:00 - 15:00)",
    cajero_nombre: "Carlos Santana (Recepción Central)",
    total_efectivo: 45200,
    total_tarjeta: 89000,
    total_transferencia: 31000,
    total_otros: 0,
    total_cobrado: 165200,
    total_devoluciones: 0,
    total_neto: 165200,
    efectivo_declarado: 45200,
    tarjeta_declarada: 89000,
    transferencia_declarada: 31000,
    diferencia: 0,
    cantidad_facturas: 58,
    cantidad_pagos: 60,
    estado: "cerrado",
    lote_datáfono: "LOTE-CardNet-8840",
    notas: "Cierre de turno matutino regular. Copagos ARS conciliados con portal web.",
    cerrado_en: "2026-10-28T15:10:00Z",
  },
];

export function CierreCaja() {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const { countryCode } = useLocale();
  const currency = resolveCurrency(countryCode);

  const [cierres, setCierres] = useState<CierreCajaRegistro[]>(MOCK_HISTORIAL_CIERRES);
  const [loading, setLoading] = useState(false);
  const [arqueoModalOpen, setArqueoModalOpen] = useState(false);
  const [actaModalOpen, setActaModalOpen] = useState(false);
  const [selectedCierre, setSelectedCierre] = useState<CierreCajaRegistro | null>(null);
  const [fechaArqueo, setFechaArqueo] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  // Formulario de arqueo físico por turno
  const [arqueoForm, setArqueoForm] = useState({
    turno: "Matutino (07:00 - 15:00)" as CierreCajaRegistro["turno"],
    cajero_nombre: "Lic. Yomaira Gómez (Caja Principal)",
    // Esperado por sistema
    esperado_efectivo: 32500,
    esperado_tarjeta: 58400,
    esperado_transferencia: 14000,
    esperado_devoluciones: 0,
    cantidad_facturas: 28,
    cantidad_pagos: 30,
    // Conteo Físico Declarado
    declarado_efectivo: 32500,
    declarado_tarjeta: 58400,
    declarado_transferencia: 14000,
    lote_datáfono: "LOTE-Visanet-4419",
    justificacion_diferencia: "",
  });

  const fetchCierres = useCallback(async () => {
    setLoading(true);
    try {
      let q = db
        .from("cierres_caja")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(30);

      if (currentWorkspace) q = q.eq("workspace_id", currentWorkspace.id);
      if (activeSucursalId) q = q.eq("sucursal_id", activeSucursalId);
      const { data, error } = await q;

      if (!error && data && data.length > 0) {
        const mapped: CierreCajaRegistro[] = data.map((c: any) => ({
          id: c.id,
          fecha: c.fecha,
          turno: c.turno || "Matutino (07:00 - 15:00)",
          cajero_nombre: c.cajero_nombre || "Cajero en Turno",
          total_efectivo: Number(c.total_efectivo || 0),
          total_tarjeta: Number(c.total_tarjeta || 0),
          total_transferencia: Number(c.total_transferencia || 0),
          total_otros: Number(c.total_otros || 0),
          total_cobrado: Number(c.total_cobrado || 0),
          total_devoluciones: Number(c.total_devoluciones || 0),
          total_neto: Number(c.total_neto || 0),
          efectivo_declarado: Number(c.efectivo_declarado ?? c.total_efectivo ?? 0),
          tarjeta_declarada: Number(c.tarjeta_declarada ?? c.total_tarjeta ?? 0),
          transferencia_declarada: Number(c.transferencia_declarada ?? c.total_transferencia ?? 0),
          diferencia: Number(c.diferencia || 0),
          cantidad_facturas: Number(c.cantidad_facturas || 0),
          cantidad_pagos: Number(c.cantidad_pagos || 0),
          estado: (c.estado as any) || "cerrado",
          lote_datáfono: c.lote_datáfono,
          notas: c.notas,
          cerrado_en: c.cerrado_en,
        }));
        setCierres(mapped);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace, activeSucursalId]);

  useEffect(() => {
    fetchCierres();
  }, [fetchCierres]);

  const fmt = (n: number) => formatCurrency(n, currency, countryCode);

  // Totales esperados vs declarados en modal
  const esperadoTotalNeto = useMemo(() => {
    return (
      arqueoForm.esperado_efectivo +
      arqueoForm.esperado_tarjeta +
      arqueoForm.esperado_transferencia -
      arqueoForm.esperado_devoluciones
    );
  }, [arqueoForm]);

  const declaradoTotalFisico = useMemo(() => {
    return (
      Number(arqueoForm.declarado_efectivo) +
      Number(arqueoForm.declarado_tarjeta) +
      Number(arqueoForm.declarado_transferencia)
    );
  }, [arqueoForm]);

  const diferenciaArqueo = useMemo(() => {
    return declaradoTotalFisico - esperadoTotalNeto;
  }, [declaradoTotalFisico, esperadoTotalNeto]);

  const handleAbrirArqueo = async () => {
    // Si hay RPC en Supabase calcular con la BD, de lo contrario mantener estado
    if (currentWorkspace) {
      try {
        const { data } = await db.rpc("calcular_cierre_caja", {
          _fecha: fechaArqueo,
          _workspace_id: currentWorkspace.id,
          _sucursal_id: activeSucursalId || null,
        });
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const r = data as Record<string, unknown>;
          const ef = Number(r.total_efectivo || 0);
          const tj = Number(r.total_tarjeta || 0);
          const tr = Number(r.total_transferencia || 0);
          const dev = Number(r.total_devoluciones || 0);
          setArqueoForm((prev) => ({
            ...prev,
            esperado_efectivo: ef,
            esperado_tarjeta: tj,
            esperado_transferencia: tr,
            esperado_devoluciones: dev,
            declarado_efectivo: ef,
            declarado_tarjeta: tj,
            declarado_transferencia: tr,
            cantidad_facturas: Number(r.cantidad_facturas || 0),
            cantidad_pagos: Number(r.cantidad_pagos || 0),
          }));
        }
      } catch {
        // Fallback local
      }
    }
    setArqueoModalOpen(true);
  };

  const handleConfirmarArqueo = async () => {
    setSaving(true);
    const nuevoRegistro: CierreCajaRegistro = {
      id: `cie-${Date.now()}`,
      fecha: fechaArqueo,
      turno: arqueoForm.turno,
      cajero_nombre: arqueoForm.cajero_nombre,
      total_efectivo: arqueoForm.esperado_efectivo,
      total_tarjeta: arqueoForm.esperado_tarjeta,
      total_transferencia: arqueoForm.esperado_transferencia,
      total_otros: 0,
      total_cobrado:
        arqueoForm.esperado_efectivo +
        arqueoForm.esperado_tarjeta +
        arqueoForm.esperado_transferencia,
      total_devoluciones: arqueoForm.esperado_devoluciones,
      total_neto: esperadoTotalNeto,
      efectivo_declarado: Number(arqueoForm.declarado_efectivo),
      tarjeta_declarada: Number(arqueoForm.declarado_tarjeta),
      transferencia_declarada: Number(arqueoForm.declarado_transferencia),
      diferencia: diferenciaArqueo,
      cantidad_facturas: arqueoForm.cantidad_facturas,
      cantidad_pagos: arqueoForm.cantidad_pagos,
      estado: "cerrado",
      lote_datáfono: arqueoForm.lote_datáfono,
      notas: arqueoForm.justificacion_diferencia || "Cierre de caja completado.",
      cerrado_en: new Date().toISOString(),
    };

    // Intentar upsert en Supabase
    if (currentWorkspace) {
      try {
        await db.from("cierres_caja").upsert(
          {
            fecha: fechaArqueo,
            workspace_id: currentWorkspace.id,
            sucursal_id: activeSucursalId || null,
            total_efectivo: nuevoRegistro.total_efectivo,
            total_tarjeta: nuevoRegistro.total_tarjeta,
            total_transferencia: nuevoRegistro.total_transferencia,
            total_cobrado: nuevoRegistro.total_cobrado,
            total_devoluciones: nuevoRegistro.total_devoluciones,
            total_neto: nuevoRegistro.total_neto,
            cantidad_facturas: nuevoRegistro.cantidad_facturas,
            cantidad_pagos: nuevoRegistro.cantidad_pagos,
            estado: "cerrado" as any,
            cerrado_en: nuevoRegistro.cerrado_en,
            notas: nuevoRegistro.notas,
          },
          { onConflict: "fecha,sucursal_id,workspace_id" }
        );
      } catch {
        // Fallback local
      }
    }

    setCierres([nuevoRegistro, ...cierres]);
    toast.success("Arqueo y Cierre de Caja registrado con éxito");
    setArqueoModalOpen(false);
    setSaving(false);
  };

  const handleVerActa = (cierre: CierreCajaRegistro) => {
    setSelectedCierre(cierre);
    setActaModalOpen(true);
  };

  // Métricas acumuladas
  const totalNetoHistorico = useMemo(
    () => cierres.reduce((s, c) => s + c.total_neto, 0),
    [cierres]
  );
  const totalEfectivoHistorico = useMemo(
    () => cierres.reduce((s, c) => s + c.total_efectivo, 0),
    [cierres]
  );
  const totalTarjetasHistorico = useMemo(
    () => cierres.reduce((s, c) => s + c.total_tarjeta, 0),
    [cierres]
  );

  return (
    <div className="space-y-6">
      {/* Sub-tarjetas de Resumen de Arqueos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-sm p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Recaudación Neta Registrada</div>
              <div className="text-xl font-bold text-foreground">{fmt(totalNetoHistorico)}</div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-sm p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Tarjetas & Datáfonos (POS)</div>
              <div className="text-xl font-bold text-foreground">{fmt(totalTarjetasHistorico)}</div>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-sm p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium">Efectivo en Bóveda / Caja</div>
              <div className="text-xl font-bold text-foreground">{fmt(totalEfectivoHistorico)}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Control Principal & Tabla de Cierres */}
      <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-4 border-b border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-600" /> Arqueos Diarios & Cierres de Turno
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Conciliación física vs sistema por recepcionista y punto de cobro
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Input
              type="date"
              value={fechaArqueo}
              onChange={(e) => setFechaArqueo(e.target.value)}
              className="w-[145px] h-8 rounded-xl border-border/80 text-xs"
            />
            <Button
              size="sm"
              onClick={handleAbrirArqueo}
              className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
            >
              <Calculator className="h-3.5 w-3.5" /> Realizar Arqueo de Turno
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchCierres}
              className="h-8 rounded-xl border-border/80 text-xs"
              title="Refrescar datos"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-muted/10">
                  <TableHead className="text-xs font-semibold">Fecha / Turno</TableHead>
                  <TableHead className="text-xs font-semibold">Cajero Responsable</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Efectivo</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Tarjeta</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Transferencia</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Devoluciones</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Neto Cobrado</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Diferencia</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Estado</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Acta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 text-muted-foreground text-xs">
                      Cargando registros de arqueo...
                    </TableCell>
                  </TableRow>
                ) : cierres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 text-muted-foreground text-xs">
                      No hay cierres de caja registrados en esta sucursal.
                    </TableCell>
                  </TableRow>
                ) : (
                  cierres.map((c) => (
                    <TableRow key={c.id} className="hover:bg-muted/20 text-xs">
                      <TableCell>
                        <div className="font-semibold text-foreground">{c.fecha}</div>
                        <div className="text-[10px] text-muted-foreground">{c.turno}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{c.cajero_nombre}</div>
                        {c.lote_datáfono && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            {c.lote_datáfono}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(c.total_efectivo)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(c.total_tarjeta)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(c.total_transferencia)}</TableCell>
                      <TableCell className="text-right text-rose-600">
                        {c.total_devoluciones > 0 ? `-${fmt(c.total_devoluciones)}` : "$0.00"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {fmt(c.total_neto)}
                      </TableCell>
                      <TableCell className="text-center">
                        {c.diferencia === 0 ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                            Cuadrada
                          </Badge>
                        ) : c.diferencia > 0 ? (
                          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                            +{fmt(c.diferencia)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                            {fmt(c.diferencia)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            c.estado === "auditado"
                              ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          }`}
                        >
                          <Lock className="w-2.5 h-2.5 mr-1 inline" />
                          {c.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVerActa(c)}
                          className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                          title="Ver e Imprimir Acta de Arqueo"
                        >
                          <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Realizar Arqueo Físico vs Sistema */}
      <Dialog open={arqueoModalOpen} onOpenChange={setArqueoModalOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calculator className="w-5 h-5 text-emerald-600" /> Arqueo de Caja & Conciliación de Turno
            </DialogTitle>
            <DialogDescription>
              Fecha: {fechaArqueo}. Compare el monto teórico reportado por el sistema con el conteo físico de ventanilla.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Metadatos del Turno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/30 rounded-xl border border-border/80">
              <div className="space-y-1">
                <Label className="text-xs">Turno de Atención</Label>
                <Select
                  value={arqueoForm.turno}
                  onValueChange={(v: any) => setArqueoForm({ ...arqueoForm, turno: v })}
                >
                  <SelectTrigger className="rounded-xl border-border/80 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matutino (07:00 - 15:00)">Matutino (07:00 - 15:00)</SelectItem>
                    <SelectItem value="Vespertino (15:00 - 23:00)">Vespertino (15:00 - 23:00)</SelectItem>
                    <SelectItem value="Nocturno / 24h (23:00 - 07:00)">Nocturno / 24h (23:00 - 07:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Cajero / Recepcionista</Label>
                <Input
                  value={arqueoForm.cajero_nombre}
                  onChange={(e) => setArqueoForm({ ...arqueoForm, cajero_nombre: e.target.value })}
                  className="rounded-xl border-border/80 text-xs"
                />
              </div>
            </div>

            {/* Comparativa Sistema vs Físico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna Sistema */}
              <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-border/80 space-y-2">
                <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-between">
                  <span>Monto Teórico del Sistema</span>
                  <Badge variant="outline" className="text-[10px]">
                    {arqueoForm.cantidad_facturas} facturas
                  </Badge>
                </div>
                <div className="space-y-1.5 text-neutral-600 dark:text-neutral-400">
                  <div className="flex justify-between">
                    <span>Efectivo cobrado:</span>
                    <span className="font-medium text-foreground">{fmt(arqueoForm.esperado_efectivo)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tarjetas (POS):</span>
                    <span className="font-medium text-foreground">{fmt(arqueoForm.esperado_tarjeta)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transferencias:</span>
                    <span className="font-medium text-foreground">{fmt(arqueoForm.esperado_transferencia)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>(-) Devoluciones:</span>
                    <span>-{fmt(arqueoForm.esperado_devoluciones)}</span>
                  </div>
                  <hr className="border-border/80 my-1" />
                  <div className="flex justify-between font-bold text-foreground text-sm">
                    <span>Total Sistema:</span>
                    <span>{fmt(esperadoTotalNeto)}</span>
                  </div>
                </div>
              </div>

              {/* Columna Físico Declarado */}
              <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/30 space-y-2">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Conteo Físico Declarado en Caja
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Efectivo Físico Contado</Label>
                    <Input
                      type="number"
                      value={arqueoForm.declarado_efectivo}
                      onChange={(e) =>
                        setArqueoForm({ ...arqueoForm, declarado_efectivo: Number(e.target.value) })
                      }
                      className="h-8 rounded-xl border-border/80 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Vouchers Tarjetas (Cierre POS)</Label>
                    <Input
                      type="number"
                      value={arqueoForm.declarado_tarjeta}
                      onChange={(e) =>
                        setArqueoForm({ ...arqueoForm, declarado_tarjeta: Number(e.target.value) })
                      }
                      className="h-8 rounded-xl border-border/80 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Transferencias Bancarias</Label>
                    <Input
                      type="number"
                      value={arqueoForm.declarado_transferencia}
                      onChange={(e) =>
                        setArqueoForm({ ...arqueoForm, declarado_transferencia: Number(e.target.value) })
                      }
                      className="h-8 rounded-xl border-border/80 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Indicador de Descuadre */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
                diferenciaArqueo === 0
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : diferenciaArqueo > 0
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {diferenciaArqueo === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                <span>
                  {diferenciaArqueo === 0
                    ? "Arqueo Cuadrado: Los valores físicos coinciden exactamente con el sistema."
                    : diferenciaArqueo > 0
                    ? `Sobrante Detectado: Hay un exceso de ${fmt(diferenciaArqueo)} en caja.`
                    : `Faltante Detectado: Faltan ${fmt(Math.abs(diferenciaArqueo))} en caja.`}
                </span>
              </div>
              <span className="font-bold text-sm font-mono">{fmt(diferenciaArqueo)}</span>
            </div>

            {/* Campo de Lote y Justificación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">No. de Lote / Terminal POS</Label>
                <Input
                  value={arqueoForm.lote_datáfono}
                  onChange={(e) => setArqueoForm({ ...arqueoForm, lote_datáfono: e.target.value })}
                  placeholder="Ej. LOTE-CardNet-8842"
                  className="rounded-xl border-border/80 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Observaciones / Justificación de Cierre</Label>
                <Textarea
                  value={arqueoForm.justificacion_diferencia}
                  onChange={(e) =>
                    setArqueoForm({ ...arqueoForm, justificacion_diferencia: e.target.value })
                  }
                  placeholder="Notas de entrega de turno o justificación en caso de descuadre..."
                  className="rounded-xl border-border/80 text-xs"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setArqueoModalOpen(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarArqueo}
              disabled={saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <Lock className="w-4 h-4" /> {saving ? "Guardando..." : "Confirmar Cierre de Turno"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Acta Oficial de Cierre y Arqueo Imprimible */}
      <Dialog open={actaModalOpen} onOpenChange={setActaModalOpen}>
        <DialogContent className="max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Printer className="w-5 h-5 text-emerald-600" /> Acta de Arqueo y Cierre de Turno
            </DialogTitle>
            <DialogDescription>
              Documento oficial de control de tesorería y custodia de valores.
            </DialogDescription>
          </DialogHeader>

          {selectedCierre && (
            <div className="p-4 bg-white text-neutral-900 rounded-xl space-y-4 border border-neutral-200">
              {/* Membrete */}
              <div className="border-b pb-3 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-neutral-950 text-sm">
                    CENTRO MÉDICO HOSPITALARIO VITALIST TRACK
                  </h3>
                  <p className="text-[11px] text-neutral-600">
                    Acta Oficial de Arqueo y Liquidación de Turno de Caja
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs border-neutral-700 text-neutral-900">
                    {selectedCierre.fecha}
                  </Badge>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{selectedCierre.turno}</p>
                </div>
              </div>

              {/* Cajero & Responsable */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                <div>
                  <span className="font-semibold text-neutral-600">Cajero Responsable:</span>
                  <p className="font-medium text-neutral-900">{selectedCierre.cajero_nombre}</p>
                </div>
                <div>
                  <span className="font-semibold text-neutral-600">Lote POS / Datáfono:</span>
                  <p className="font-mono text-neutral-900">{selectedCierre.lote_datáfono || "N/A"}</p>
                </div>
              </div>

              {/* Desglose de Valores */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">Efectivo Físico Arqueado:</span>
                  <span className="font-semibold">{fmt(selectedCierre.total_efectivo)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">Vouchers Tarjetas de Crédito/Débito:</span>
                  <span className="font-semibold">{fmt(selectedCierre.total_tarjeta)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100">
                  <span className="text-neutral-600">Transferencias Bancarias:</span>
                  <span className="font-semibold">{fmt(selectedCierre.total_transferencia)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-100 text-rose-600">
                  <span>(-) Devoluciones / Reversiones:</span>
                  <span>-{fmt(selectedCierre.total_devoluciones)}</span>
                </div>
                <div className="flex justify-between py-1.5 font-bold text-sm bg-neutral-100 px-2 rounded">
                  <span>TOTAL NETO RECAUDADO:</span>
                  <span>{fmt(selectedCierre.total_neto)}</span>
                </div>
                <div className="flex justify-between py-1 text-[11px] text-neutral-500">
                  <span>Diferencia de Arqueo:</span>
                  <span className={selectedCierre.diferencia === 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
                    {selectedCierre.diferencia === 0 ? "Caja Cuadrada ($0.00)" : fmt(selectedCierre.diferencia)}
                  </span>
                </div>
              </div>

              {selectedCierre.notas && (
                <div className="text-[11px] bg-neutral-50 p-2 rounded border border-neutral-200">
                  <span className="font-semibold text-neutral-700">Notas de Auditoría:</span>
                  <p className="text-neutral-600 mt-0.5">{selectedCierre.notas}</p>
                </div>
              )}

              {/* Firmas */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="border-t border-neutral-300 pt-1.5">
                  <p className="font-semibold text-neutral-800">{selectedCierre.cajero_nombre}</p>
                  <p className="text-[10px] text-neutral-500">Cajero / Entregado Conforme</p>
                </div>
                <div className="border-t border-neutral-300 pt-1.5">
                  <p className="font-semibold text-neutral-800">Lic. Supervisor de Tesorería</p>
                  <p className="text-[10px] text-neutral-500">Revisado & Recibido en Bóveda</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 print:hidden">
            <Button variant="outline" onClick={() => setActaModalOpen(false)} className="rounded-xl">
              Cerrar
            </Button>
            <Button
              onClick={() => window.print()}
              className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir Acta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
