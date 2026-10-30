import { useEffect, useMemo, useState } from "react";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Receipt,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Building2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

const TIPOS_NCF = [
  { v: "B01", l: "B01 - Crédito Fiscal" },
  { v: "B02", l: "B02 - Consumidor Final" },
  { v: "B03", l: "B03 - Nota de Débito" },
  { v: "B04", l: "B04 - Nota de Crédito" },
  { v: "B11", l: "B11 - Proveedor Informal" },
  { v: "B13", l: "B13 - Gastos Menores" },
  { v: "B14", l: "B14 - Régimen Especial" },
  { v: "B15", l: "B15 - Gubernamental" },
  { v: "B16", l: "B16 - Exportación" },
  { v: "E31", l: "E31 - Factura de Crédito Fiscal Electrónica (e-CF)" },
  { v: "E32", l: "E32 - Factura de Consumo Electrónica (e-CF)" },
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
  const [form, setForm] = useState({
    tipo_ncf: "B02",
    serie: "B",
    inicio: 1,
    fin: 10000,
    actual: 1,
    fecha_vencimiento: "",
  });
  const [emitForm, setEmitForm] = useState({ tipo_ncf: "B02", rnc_cliente: "", subtotal: 0 });

  const load = async () => {
    if (!wsId) return;
    const [s, c] = await Promise.all([
      (db as any).from("ncf_secuencias").select("*").eq("workspace_id", wsId).order("tipo_ncf"),
      (db as any)
        .from("comprobantes_fiscales")
        .select("*")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setSecuencias(s.data || []);
    setComprobantes(c.data || []);
  };

  useEffect(() => {
    load();
  }, [wsId]);

  const save = async () => {
    if (!wsId) return;
    const payload: any = { ...form, workspace_id: wsId, actual: form.inicio };
    if (!payload.fecha_vencimiento) delete payload.fecha_vencimiento;
    const { error } = await (db as any).from("ncf_secuencias").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Secuencia de NCF registrada");
    setOpen(false);
    load();
  };

  const emitir = async () => {
    if (!wsId) return;
    setEmitting(true);
    try {
      const { data: ncf, error: rpcErr } = await (db.rpc as any)("generar_ncf", {
        _workspace_id: wsId,
        _tipo: emitForm.tipo_ncf,
      });
      if (rpcErr) throw rpcErr;
      const itbis = +(emitForm.subtotal * 0.18).toFixed(2);
      const total = +(emitForm.subtotal + itbis).toFixed(2);
      const { error } = await (db as any).from("comprobantes_fiscales").insert({
        workspace_id: wsId,
        ncf: ncf as string,
        tipo_ncf: emitForm.tipo_ncf,
        rnc_cliente: emitForm.rnc_cliente || null,
        total,
        itbis,
        estado_dgii: "pendiente",
      });
      if (error) throw error;
      toast.success(`Comprobante fiscal ${ncf} emitido con éxito`);
      setEmitOpen(false);
      setEmitForm({ tipo_ncf: "B02", rnc_cliente: "", subtotal: 0 });
      load();
    } catch (e: any) {
      toast.error(e.message || "Error al emitir comprobante");
    } finally {
      setEmitting(false);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalItbis = comprobantes.reduce((s, c) => s + Number(c.itbis || 0), 0);
    const totalMonto = comprobantes.reduce((s, c) => s + Number(c.total || 0), 0);
    const totalDisponibles = secuencias.reduce(
      (s, sec) => s + Math.max(0, Number(sec.fin || 0) - Number(sec.actual || 0)),
      0
    );

    return {
      comprobantesCount: comprobantes.length,
      totalItbis,
      totalMonto,
      totalDisponibles,
      secuenciasCount: secuencias.length,
    };
  }, [comprobantes, secuencias]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Facturación Fiscal Electrónica RD (NCF & e-CF)"
        subtitle="Administración de secuencias autorizadas por la DGII, emisión de comprobantes fiscales e integración e-CF"
        icon={Receipt}
        badge="DGII / Fiscal RD"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-border/80 text-xs gap-1.5">
                  <Plus className="h-4 w-4" /> Registrar Secuencia
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-emerald-600" /> Registrar Secuencia NCF
                  </DialogTitle>
                  <CardDescription>Rango de números autorizados formalmente por la DGII</CardDescription>
                </DialogHeader>
                <div className="space-y-3.5 py-2">
                  <div className="space-y-1.5">
                    <Label>Tipo de Comprobante</Label>
                    <Select
                      value={form.tipo_ncf}
                      onValueChange={(v) => setForm({ ...form, tipo_ncf: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_NCF.map((t) => (
                          <SelectItem key={t.v} value={t.v}>
                            {t.l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Número Inicial</Label>
                      <Input
                        type="number"
                        className="rounded-xl font-mono"
                        value={form.inicio}
                        onChange={(e) => setForm({ ...form, inicio: +e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Número Final</Label>
                      <Input
                        type="number"
                        className="rounded-xl font-mono"
                        value={form.fin}
                        onChange={(e) => setForm({ ...form, fin: +e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha de Vencimiento de la Autorización</Label>
                    <Input
                      type="date"
                      className="rounded-xl font-mono"
                      value={form.fecha_vencimiento}
                      onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button onClick={save} className="rounded-xl">
                    Guardar Secuencia
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={emitOpen} onOpenChange={setEmitOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-sm gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Receipt className="h-4 w-4" /> Emitir Comprobante
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-emerald-600" /> Emitir NCF / e-CF
                  </DialogTitle>
                  <CardDescription>Generación de comprobante fiscal con cálculo automático de ITBIS</CardDescription>
                </DialogHeader>
                <div className="space-y-3.5 py-2">
                  <div className="space-y-1.5">
                    <Label>Tipo de NCF</Label>
                    <Select
                      value={emitForm.tipo_ncf}
                      onValueChange={(v) => setEmitForm({ ...emitForm, tipo_ncf: v })}
                    >
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_NCF.map((t) => (
                          <SelectItem key={t.v} value={t.v}>
                            {t.l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>RNC o Cédula del Cliente (Opcional para B02)</Label>
                    <Input
                      placeholder="Ej: 131234567"
                      className="rounded-xl font-mono"
                      value={emitForm.rnc_cliente}
                      onChange={(e) => setEmitForm({ ...emitForm, rnc_cliente: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Monto Subtotal Gravado (RD$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="rounded-xl font-mono font-semibold"
                      value={emitForm.subtotal || ""}
                      onChange={(e) => setEmitForm({ ...emitForm, subtotal: +e.target.value })}
                    />
                  </div>
                  <div className="bg-muted/40 p-3 rounded-xl border border-border/60 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ITBIS (18%):</span>
                      <span className="font-semibold text-foreground">
                        RD$ {(emitForm.subtotal * 0.18).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-border/50 pt-1 font-bold">
                      <span className="text-foreground">Total Facturado:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        RD$ {(emitForm.subtotal * 1.18).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setEmitOpen(false)} className="rounded-xl">
                    Cancelar
                  </Button>
                  <Button
                    onClick={emitir}
                    disabled={emitting || !emitForm.subtotal}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    {emitting ? "Emitiendo..." : "Confirmar Emisión"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Facturación Fiscal"
          value={`RD$ ${kpis.totalMonto.toLocaleString("es-DO")}`}
          subtitle={`${kpis.comprobantesCount} comprobantes emitidos`}
          icon={Receipt}
          variant="primary"
        />
        <ClinicalKpiCard
          title="ITBIS Generado (18%)"
          value={`RD$ ${kpis.totalItbis.toLocaleString("es-DO")}`}
          subtitle="Impuesto liquidable a DGII"
          icon={DollarSign}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Secuencias Activas"
          value={kpis.secuenciasCount}
          subtitle="Series autorizadas por la DGII"
          icon={ShieldCheck}
          variant="blue"
        />
        <ClinicalKpiCard
          title="NCFs Disponibles"
          value={kpis.totalDisponibles.toLocaleString("es-DO")}
          subtitle="Saldo remanente en rango"
          icon={CheckCircle2}
          variant={kpis.totalDisponibles < 500 ? "amber" : "teal"}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sec" className="space-y-4">
        <TabsList className="bg-card border border-border/80 rounded-xl p-1">
          <TabsTrigger value="sec" className="rounded-lg gap-2 text-xs">
            <Receipt className="w-4 h-4" /> Secuencias Autorizadas ({secuencias.length})
          </TabsTrigger>
          <TabsTrigger value="cf" className="rounded-lg gap-2 text-xs">
            <FileText className="w-4 h-4" /> Comprobantes Emitidos ({comprobantes.length})
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-lg gap-2 text-xs">
            <Building2 className="w-4 h-4" /> Configuración e-CF & DGII
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Secuencias */}
        <TabsContent value="sec" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-semibold">Secuencias Fiscales Registradas</CardTitle>
              <CardDescription>Monitoreo del rango de consumo y porcentaje remanente de NCFs</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Tipo NCF</TableHead>
                    <TableHead>Rango Autorizado</TableHead>
                    <TableHead className="text-right">Último Emitido</TableHead>
                    <TableHead className="text-right">Disponibles</TableHead>
                    <TableHead className="w-44">Nivel de Consumo</TableHead>
                    <TableHead>Fecha Vencimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {secuencias.map((s: any) => {
                    const rangoTotal = Math.max(1, s.fin - s.inicio);
                    const consumido = Math.max(0, s.actual - s.inicio);
                    const pctConsumido = Math.min(100, (consumido / rangoTotal) * 100);
                    const restantes = Math.max(0, s.fin - s.actual);
                    const esAgotandose = pctConsumido >= 85;

                    return (
                      <TableRow key={s.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge variant="outline" className="font-mono font-bold text-xs">
                            {s.tipo_ncf}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {s.inicio} → {s.fin}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">{s.actual}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-foreground">
                          {restantes}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={pctConsumido} className="h-2 rounded-full" />
                            <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
                              <span>{pctConsumido.toFixed(0)}% usado</span>
                              {esAgotandose && <span className="text-rose-600 font-bold">¡Por agotar!</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">
                          {s.fecha_vencimiento || "Indefinida"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!secuencias.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        No hay secuencias registradas. Presiona "Registrar Secuencia" para cargar los datos de la DGII.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Comprobantes */}
        <TabsContent value="cf" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60">
              <CardTitle className="text-base font-semibold">Historial de Comprobantes Emitidos</CardTitle>
              <CardDescription>Registro cronológico de NCFs y estado de radicación ante DGII</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead>Número de NCF</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>RNC / Cédula</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">ITBIS (18%)</TableHead>
                    <TableHead className="text-right">Total Facturado</TableHead>
                    <TableHead className="text-center w-32">Estado DGII</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comprobantes.map((c: any) => {
                    const sub = Number(c.total || 0) - Number(c.itbis || 0);

                    return (
                      <TableRow key={c.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-bold text-xs text-foreground">
                          {c.ncf}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {c.tipo_ncf}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{c.rnc_cliente || "—"}</TableCell>
                        <TableCell className="text-right font-mono text-xs">${sub.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                          ${Number(c.itbis).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          ${Number(c.total).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              c.estado_dgii === "aceptado"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                : c.estado_dgii === "rechazado"
                                ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                                : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {c.estado_dgii}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!comprobantes.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        No hay comprobantes fiscales emitidos aún.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Configuración DGII */}
        <TabsContent value="info" className="mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-6 space-y-4">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Building2 className="h-5 w-5 text-emerald-600" />
                Guía de Cumplimiento Fiscal & Facturación Electrónica e-CF
              </CardTitle>
              <CardDescription>
                Requisitos según la Ley 32-23 de Facturación Electrónica de la República Dominicana
              </CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                    1
                  </div>
                  Autorización de NCFs
                </div>
                <p className="text-xs text-muted-foreground">
                  Solicite formalmente a través de la oficina virtual de la DGII las secuencias para cada comprobante (B01, B02, B04, etc.) antes de su vencimiento.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs">
                    2
                  </div>
                  Certificado Digital e-CF
                </div>
                <p className="text-xs text-muted-foreground">
                  Adquiera un certificado digital tributario (PKCS#12) emitido por una entidad de certificación acreditada en RD (Avansi, Cámara de Comercio, etc.).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border/70 bg-card space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs">
                    3
                  </div>
                  Homologación Web Service
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete las pruebas del set de datos en el ambiente de certificación de la DGII para habilitar el timbrado XML en tiempo real.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

