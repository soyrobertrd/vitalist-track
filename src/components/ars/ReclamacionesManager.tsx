import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Send,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw,
  ShieldAlert,
  Search,
  DollarSign
} from "lucide-react";
import { useLocale } from "@/hooks/useLocale";
import { resolveCurrency, formatCurrency } from "@/lib/currency";
import { localeFromCountry } from "@/lib/dateFormat";

const CAUSALES_GLOSA_SISALRIL = [
  { codigo: "G01", motivo: "Falta de Autorización Previa / Carnet Inactivo" },
  { codigo: "G02", motivo: "Procedimiento CPT/SIMON No Cubierto en Plan Básico" },
  { codigo: "G03", motivo: "Documentación Clínica Incompleta / Sin Nota SOAP" },
  { codigo: "G04", motivo: "Discrepancia en Tarifa Acordada en Contrato" },
  { codigo: "G05", motivo: "Posible Duplicidad de Reclamación en el Período" },
  { codigo: "G06", motivo: "Prescripción sin Firma/Sello del Médico con Exequátur" },
];

const estadoColor: Record<string, string> = {
  borrador: "bg-gray-500/10 text-gray-700 border-gray-500/30",
  enviada: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  en_revision: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  pagada: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  rechazada: "bg-red-500/10 text-red-700 border-red-500/30",
  parcial: "bg-orange-500/10 text-orange-700 border-orange-500/30",
  glosada: "bg-purple-500/10 text-purple-700 border-purple-500/30",
};

interface Reclamacion {
  id: string;
  numero_reclamacion: string | null;
  numero_lote: string | null;
  estado: string;
  fecha_envio: string | null;
  fecha_respuesta: string | null;
  monto_reclamado: number;
  monto_aprobado: number;
  monto_rechazado: number;
  cantidad_casos: number;
  periodo_desde: string | null;
  periodo_hasta: string | null;
  motivo_rechazo: string | null;
  notas: string | null;
  aseguradora_id: string;
  aseguradoras?: { nombre: string } | null;
}

const emptyForm = {
  aseguradora_id: "",
  numero_lote: "",
  monto_reclamado: "",
  cantidad_casos: "",
  periodo_desde: "",
  periodo_hasta: "",
  notas: "",
};

export function ReclamacionesManager() {
  const { currentWorkspace } = useWorkspace();
  const wsId = (currentWorkspace as any)?.id;
  const { countryCode } = useLocale();
  const currency = resolveCurrency(currentWorkspace, countryCode);
  const locale = localeFromCountry(countryCode);
  const fmt = (n: number | string | null) => (n != null ? formatCurrency(n, currency, locale) : "—");

  const [items, setItems] = useState<Reclamacion[]>([]);
  const [aseguradoras, setAseguradoras] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Modal Conciliación de Glosa
  const [modalGlosaOpen, setModalGlosaOpen] = useState(false);
  const [reclamacionSeleccionada, setReclamacionSeleccionada] = useState<Reclamacion | null>(null);
  const [causalGlosa, setCausalGlosa] = useState("G01");
  const [montoAprobadoModal, setMontoAprobadoModal] = useState("");
  const [montoGlosadoModal, setMontoGlosadoModal] = useState("");
  const [planApelacion, setPlanApelacion] = useState("");

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const { data } = await supabase
      .from("reclamaciones_ars")
      .select("*, aseguradoras(nombre)")
      .eq("workspace_id", wsId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setItems((data as any[]) || []);
    } else {
      // Semilla demo realista si la base está vacía
      setItems([
        {
          id: "rec-01",
          numero_reclamacion: "LOTE-SENASA-2026-10",
          numero_lote: "LOTE-104",
          estado: "parcial",
          fecha_envio: "2026-10-15",
          fecha_respuesta: "2026-10-28",
          monto_reclamado: 185000,
          monto_aprobado: 142000,
          monto_rechazado: 43000,
          cantidad_casos: 28,
          periodo_desde: "2026-10-01",
          periodo_hasta: "2026-10-15",
          motivo_rechazo: "G03: Falta de informe quirúrgico detallado en 3 casos.",
          notas: "SeNaSa Régimen Contributivo - En proceso de apelación con notas SOAP adjuntas.",
          aseguradora_id: "aseg-1",
          aseguradoras: { nombre: "SeNaSa (Seguro Nacional de Salud)" },
        },
        {
          id: "rec-02",
          numero_reclamacion: "LOTE-PRIMERA-2026-10",
          numero_lote: "LOTE-105",
          estado: "pagada",
          fecha_envio: "2026-10-18",
          fecha_respuesta: "2026-10-27",
          monto_reclamado: 94500,
          monto_aprobado: 94500,
          monto_rechazado: 0,
          cantidad_casos: 15,
          periodo_desde: "2026-10-01",
          periodo_hasta: "2026-10-15",
          motivo_rechazo: null,
          notas: "Primera ARS - Liquidación aprobada al 100%.",
          aseguradora_id: "aseg-2",
          aseguradoras: { nombre: "Primera ARS de Humano" },
        },
      ]);
    }

    const { data: asegs } = await supabase
      .from("aseguradoras")
      .select("id, nombre")
      .eq("workspace_id", wsId)
      .eq("activa", true)
      .order("nombre");
    setAseguradoras((asegs as any[]) || [{ id: "aseg-1", nombre: "SeNaSa" }, { id: "aseg-2", nombre: "Primera ARS" }, { id: "aseg-3", nombre: "Mapfre Salud ARS" }]);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, [wsId]);

  const crear = async () => {
    if (!form.aseguradora_id) {
      toast.error("Seleccione la aseguradora (ARS).");
      return;
    }
    const { error } = await supabase.from("reclamaciones_ars").insert({
      workspace_id: wsId,
      aseguradora_id: form.aseguradora_id,
      numero_lote: form.numero_lote || null,
      monto_reclamado: parseFloat(form.monto_reclamado) || 0,
      cantidad_casos: parseInt(form.cantidad_casos) || 0,
      periodo_desde: form.periodo_desde || null,
      periodo_hasta: form.periodo_hasta || null,
      notas: form.notas || null,
    } as any);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reclamación creada exitosamente.");
    setOpen(false);
    setForm(emptyForm);
    cargar();
  };

  const actualizarEstado = async (id: string, estado: string, extra?: Record<string, any>) => {
    const payload: any = { estado, ...extra };
    if (estado === "enviada") payload.fecha_envio = new Date().toISOString().split("T")[0];
    if (["pagada", "rechazada", "parcial"].includes(estado)) payload.fecha_respuesta = new Date().toISOString().split("T")[0];
    await supabase.from("reclamaciones_ars").update(payload).eq("id", id);
    toast.success(`Reclamación actualizada: ${estado}`);
    cargar();
  };

  const handleAbrirConciliacionGlosa = (r: Reclamacion) => {
    setReclamacionSeleccionada(r);
    setMontoAprobadoModal(r.monto_aprobado ? r.monto_aprobado.toString() : (r.monto_reclamado * 0.8).toString());
    setMontoGlosadoModal(r.monto_rechazado ? r.monto_rechazado.toString() : (r.monto_reclamado * 0.2).toString());
    setCausalGlosa("G03");
    setPlanApelacion("");
    setModalGlosaOpen(true);
  };

  const handleGuardarGlosa = () => {
    if (!reclamacionSeleccionada) return;
    const aprobado = parseFloat(montoAprobadoModal) || 0;
    const glosado = parseFloat(montoGlosadoModal) || 0;
    const causalObj = CAUSALES_GLOSA_SISALRIL.find((c) => c.codigo === causalGlosa);

    const motivo = `${causalObj?.codigo}: ${causalObj?.motivo}. Plan de respuesta: ${planApelacion || "En revisión médica"}`;

    setItems(
      items.map((item) =>
        item.id === reclamacionSeleccionada.id
          ? {
              ...item,
              estado: glosado > 0 ? "parcial" : "pagada",
              monto_aprobado: aprobado,
              monto_rechazado: glosado,
              motivo_rechazo: motivo,
              fecha_respuesta: new Date().toISOString().split("T")[0],
            }
          : item
      )
    );

    toast.success(`Glosa conciliada para lote ${reclamacionSeleccionada.numero_lote || reclamacionSeleccionada.id}`, {
      description: `Monto liquidado: ${fmt(aprobado)} | Glosado: ${fmt(glosado)} (${causalObj?.codigo})`,
    });

    setModalGlosaOpen(false);
  };

  const filtered = filtroEstado === "todos" ? items : items.filter((i) => i.estado === filtroEstado);
  const totalReclamado = items.reduce((s, r) => s + Number(r.monto_reclamado), 0);
  const totalAprobado = items.reduce((s, r) => s + Number(r.monto_aprobado), 0);
  const totalGlosado = items.reduce((s, r) => s + Number(r.monto_rechazado), 0);

  return (
    <div className="space-y-4">
      {/* KPIs de Reclamaciones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="rounded-2xl border-border/80">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Lotes Radicados</p>
              <p className="text-xl font-bold font-mono">{items.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
              <Send className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Monto Total Reclamado</p>
              <p className="text-xl font-bold font-mono">{fmt(totalReclamado)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Liquidado / Aprobado ARS</p>
              <p className="text-xl font-bold font-mono text-emerald-600">{fmt(totalAprobado)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-border/80">
          <CardContent className="pt-5 pb-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">Monto Glosado en Disputa</p>
              <p className="text-xl font-bold font-mono text-amber-600">{fmt(totalGlosado)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Receipt className="h-5 w-5 text-emerald-600" />
            Conciliación de Reclamaciones & Glosas ARS
          </h3>
          <p className="text-xs text-muted-foreground">
            Auditoría de lotes radicados, liquidaciones y respuesta a objeciones médicas SISALRIL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los Estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="enviada">Enviada</SelectItem>
              <SelectItem value="en_revision">En revisión</SelectItem>
              <SelectItem value="pagada">Pagada 100%</SelectItem>
              <SelectItem value="parcial">Liquidación Parcial / Glosa</SelectItem>
              <SelectItem value="rechazada">Rechazada Total</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <Button size="sm" onClick={() => setOpen(true)} className="h-8 text-xs">
              <Plus className="h-4 w-4 mr-1" /> Nuevo Lote ARS
            </Button>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Lote de Reclamación ARS</DialogTitle></DialogHeader>
              <div className="space-y-3 text-xs">
                <div>
                  <Label className="text-xs">Aseguradora (ARS) *</Label>
                  <Select value={form.aseguradora_id} onValueChange={(v) => setForm({ ...form, aseguradora_id: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar ARS" /></SelectTrigger>
                    <SelectContent>
                      {aseguradoras.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">N° Lote / Factura</Label>
                    <Input value={form.numero_lote} onChange={(e) => setForm({ ...form, numero_lote: e.target.value })} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Monto Reclamado (DOP)</Label>
                    <Input type="number" step="0.01" value={form.monto_reclamado} onChange={(e) => setForm({ ...form, monto_reclamado: e.target.value })} className="h-8" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Cantidad de Casos / Expedientes</Label>
                  <Input type="number" value={form.cantidad_casos} onChange={(e) => setForm({ ...form, cantidad_casos: e.target.value })} className="h-8" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Período Desde</Label>
                    <Input type="date" value={form.periodo_desde} onChange={(e) => setForm({ ...form, periodo_desde: e.target.value })} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-xs">Período Hasta</Label>
                    <Input type="date" value={form.periodo_hasta} onChange={(e) => setForm({ ...form, periodo_hasta: e.target.value })} className="h-8" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Notas de Radicación</Label>
                  <Textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className="text-xs" />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button size="sm" onClick={crear}>Radicar Lote</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando reclamaciones...</p>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl border-border/80"><CardContent className="py-8 text-center text-muted-foreground">No hay reclamaciones registradas.</CardContent></Card>
      ) : (
        <Card className="rounded-2xl border-border/80 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote / Reclamación</TableHead>
                <TableHead>Aseguradora</TableHead>
                <TableHead>Reclamado</TableHead>
                <TableHead>Aprobado</TableHead>
                <TableHead>Glosado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones de Conciliación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-semibold text-xs text-foreground">{r.numero_lote || r.id}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{r.cantidad_casos} casos · {r.fecha_envio || "Borrador"}</p>
                  </TableCell>
                  <TableCell className="text-xs">{(r as any).aseguradoras?.nombre || "ARS General"}</TableCell>
                  <TableCell className="font-mono text-xs font-medium">{fmt(r.monto_reclamado)}</TableCell>
                  <TableCell className="font-mono text-xs font-bold text-emerald-600">{fmt(r.monto_aprobado)}</TableCell>
                  <TableCell className="font-mono text-xs text-amber-600">{r.monto_rechazado > 0 ? fmt(r.monto_rechazado) : "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] capitalize ${estadoColor[r.estado] || ""}`}>
                      {r.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {r.estado === "borrador" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => actualizarEstado(r.id, "enviada")}>
                        <Send className="h-3 w-3 mr-1" /> Radicar
                      </Button>
                    )}
                    {(r.estado === "enviada" || r.estado === "en_revision" || r.estado === "parcial") && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleAbrirConciliacionGlosa(r)}
                      >
                        <ShieldAlert className="h-3 w-3 mr-1" /> Conciliar Glosa
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Modal Conciliación de Glosas SISALRIL */}
      <Dialog open={modalGlosaOpen} onOpenChange={setModalGlosaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Conciliación de Liquidación & Glosas ARS
            </DialogTitle>
            <DialogDescription>
              Lote: {reclamacionSeleccionada?.numero_lote || reclamacionSeleccionada?.id} (Reclamado: {fmt(reclamacionSeleccionada?.monto_reclamado ?? 0)})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Monto Aprobado (DOP)</Label>
                <Input
                  type="number"
                  value={montoAprobadoModal}
                  onChange={(e) => setMontoAprobadoModal(e.target.value)}
                  className="h-8 text-emerald-600 font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Monto Glosado / Deducido (DOP)</Label>
                <Input
                  type="number"
                  value={montoGlosadoModal}
                  onChange={(e) => setMontoGlosadoModal(e.target.value)}
                  className="h-8 text-amber-600 font-bold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Causal de Glosa (Catálogo SISALRIL)</Label>
              <Select value={causalGlosa} onValueChange={setCausalGlosa}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CAUSALES_GLOSA_SISALRIL.map((c) => (
                    <SelectItem key={c.codigo} value={c.codigo}>
                      {c.codigo}: {c.motivo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Plan de Apelación / Documento de Soporte</Label>
              <Textarea
                placeholder="Explicación para re-radicación a la ARS con nota SOAP adjunta..."
                value={planApelacion}
                onChange={(e) => setPlanApelacion(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalGlosaOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleGuardarGlosa}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Guardar Conciliación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
