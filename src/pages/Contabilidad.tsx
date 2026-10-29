import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, BookOpen, XCircle, CheckCircle, FileText, CheckCircle2, AlertCircle, Layers } from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { StatusBadge } from "@/components/common/StatusBadge";

const TIPOS_CUENTA = [
  { value: "activo", label: "Activo" },
  { value: "pasivo", label: "Pasivo" },
  { value: "capital", label: "Capital" },
  { value: "ingreso", label: "Ingreso" },
  { value: "gasto", label: "Gasto" },
  { value: "costo", label: "Costo" },
];

const ESTADO_COLOR: Record<string, string> = {
  borrador: "bg-gray-100 text-gray-800",
  aprobado: "bg-green-100 text-green-800",
  anulado: "bg-red-100 text-red-800",
};

const Contabilidad = () => {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("asientos");

  // Cuentas
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [cuentaDialog, setCuentaDialog] = useState(false);
  const [cuentaForm, setCuentaForm] = useState({ codigo: "", nombre: "", tipo: "activo", naturaleza: "deudora", cuenta_padre_id: "", nivel: 1 });

  // Asientos
  const [asientos, setAsientos] = useState<any[]>([]);
  const [asientoDialog, setAsientoDialog] = useState(false);
  const [asientoForm, setAsientoForm] = useState({ fecha: new Date().toISOString().split("T")[0], descripcion: "", referencia: "", notas: "" });
  const [lineas, setLineas] = useState<{ cuenta_id: string; descripcion: string; debe: number; haber: number }[]>([]);
  const [searchAsiento, setSearchAsiento] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  // Detalle
  const [detalleAsiento, setDetalleAsiento] = useState<any>(null);
  const [detalleLineas, setDetalleLineas] = useState<any[]>([]);

  const fetchCuentas = async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("cuentas_contables").select("*").eq("workspace_id", currentWorkspace.id).order("codigo");
    setCuentas(data || []);
  };

  const fetchAsientos = async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase.from("asientos_contables").select("*").eq("workspace_id", currentWorkspace.id).order("created_at", { ascending: false }).limit(200);
    setAsientos(data || []);
  };

  useEffect(() => { fetchCuentas(); fetchAsientos(); }, [currentWorkspace]);

  const handleCreateCuenta = async () => {
    if (!currentWorkspace || !cuentaForm.codigo || !cuentaForm.nombre) { toast.error("Código y nombre requeridos"); return; }
    const { error } = await supabase.from("cuentas_contables").insert({
      workspace_id: currentWorkspace.id,
      codigo: cuentaForm.codigo,
      nombre: cuentaForm.nombre,
      tipo: cuentaForm.tipo as any,
      naturaleza: cuentaForm.naturaleza as any,
      cuenta_padre_id: cuentaForm.cuenta_padre_id || null,
      nivel: cuentaForm.nivel,
    });
    if (error) toast.error(error.message);
    else { toast.success("Cuenta creada"); setCuentaDialog(false); setCuentaForm({ codigo: "", nombre: "", tipo: "activo", naturaleza: "deudora", cuenta_padre_id: "", nivel: 1 }); fetchCuentas(); }
  };

  const handleCreateAsiento = async () => {
    if (!currentWorkspace || !asientoForm.descripcion || lineas.length === 0) { toast.error("Descripción y líneas requeridas"); return; }
    const totalDebe = lineas.reduce((s, l) => s + l.debe, 0);
    const totalHaber = lineas.reduce((s, l) => s + l.haber, 0);
    if (Math.abs(totalDebe - totalHaber) > 0.01) { toast.error(`Asiento descuadrado: Debe ${totalDebe.toFixed(2)} ≠ Haber ${totalHaber.toFixed(2)}`); return; }

    const { data, error } = await supabase.from("asientos_contables").insert({
      workspace_id: currentWorkspace.id,
      fecha: asientoForm.fecha,
      descripcion: asientoForm.descripcion,
      referencia: asientoForm.referencia || null,
      notas: asientoForm.notas || null,
      total_debe: totalDebe,
      total_haber: totalHaber,
    }).select().single();
    if (error) { toast.error(error.message); return; }

    const lineasInsert = lineas.map(l => ({ asiento_id: data.id, cuenta_id: l.cuenta_id, descripcion: l.descripcion || null, debe: l.debe, haber: l.haber }));
    const { error: e2 } = await supabase.from("lineas_asiento").insert(lineasInsert);
    if (e2) toast.error(e2.message);
    else { toast.success("Asiento creado"); setAsientoDialog(false); setLineas([]); setAsientoForm({ fecha: new Date().toISOString().split("T")[0], descripcion: "", referencia: "", notas: "" }); fetchAsientos(); }
  };

  const updateEstadoAsiento = async (id: string, estado: "borrador" | "aprobado" | "anulado") => {
    const { error } = await supabase.from("asientos_contables").update({ estado }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Estado actualizado"); fetchAsientos(); if (detalleAsiento?.id === id) setDetalleAsiento({ ...detalleAsiento, estado }); }
  };

  const openDetalle = async (asiento: any) => {
    setDetalleAsiento(asiento);
    const { data } = await supabase.from("lineas_asiento").select("*, cuentas_contables(codigo, nombre)").eq("asiento_id", asiento.id);
    setDetalleLineas(data || []);
  };

  const addLinea = () => setLineas([...lineas, { cuenta_id: "", descripcion: "", debe: 0, haber: 0 }]);
  const removeLinea = (i: number) => setLineas(lineas.filter((_, idx) => idx !== i));
  const updateLinea = (i: number, field: string, val: any) => setLineas(lineas.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  const totalDebe = lineas.reduce((s, l) => s + l.debe, 0);
  const totalHaber = lineas.reduce((s, l) => s + l.haber, 0);
  const cuadrado = Math.abs(totalDebe - totalHaber) < 0.01;

  const filteredAsientos = asientos.filter(a => {
    if (filterEstado !== "todos" && a.estado !== filterEstado) return false;
    if (searchAsiento) {
      const s = searchAsiento.toLowerCase();
      return (a.numero || "").toLowerCase().includes(s) || (a.descripcion || "").toLowerCase().includes(s);
    }
    return true;
  });

  const cuentasActivas = cuentas.filter(c => c.activa && c.acepta_movimientos);

  const totalAsientos = asientos.length;
  const asientosAprobados = asientos.filter(a => a.estado === "aprobado").length;
  const asientosBorrador = asientos.filter(a => a.estado === "borrador").length;
  const cuentasActivasCount = cuentas.filter(c => c.activa).length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Contabilidad & Finanzas Clínicas"
        subtitle="Gestión del libro diario, catálogo de cuentas maestras y control de asientos contables"
        icon={BookOpen}
        variant="emerald"
        badge="Libro Diario & Mayor"
        action={
          <div className="flex items-center gap-2">
            <Dialog open={asientoDialog} onOpenChange={setAsientoDialog}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Asiento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/80">
                <DialogHeader>
                  <DialogTitle>Nuevo Asiento Contable</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        className="rounded-xl"
                        value={asientoForm.fecha}
                        onChange={e => setAsientoForm(f => ({ ...f, fecha: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Descripción *</Label>
                      <Input
                        className="rounded-xl"
                        value={asientoForm.descripcion}
                        onChange={e => setAsientoForm(f => ({ ...f, descripcion: e.target.value }))}
                        placeholder="Motivo del asiento contable"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Referencia</Label>
                      <Input
                        className="rounded-xl"
                        value={asientoForm.referencia}
                        onChange={e => setAsientoForm(f => ({ ...f, referencia: e.target.value }))}
                        placeholder="Ej: FAC-2026-00001"
                      />
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Input
                        className="rounded-xl"
                        value={asientoForm.notas}
                        onChange={e => setAsientoForm(f => ({ ...f, notas: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Líneas de Asiento</Label>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={addLinea}>
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Agregar Línea
                      </Button>
                    </div>
                    {lineas.map((l, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end bg-muted/20 p-2 rounded-xl border border-border/60">
                        <div className="col-span-12 sm:col-span-4">
                          {i === 0 && <Label className="text-xs mb-1 block">Cuenta</Label>}
                          <Select value={l.cuenta_id} onValueChange={v => updateLinea(i, "cuenta_id", v)}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seleccionar cuenta..." /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {cuentasActivas.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nombre}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                          {i === 0 && <Label className="text-xs mb-1 block">Descripción</Label>}
                          <Input className="rounded-xl" value={l.descripcion} onChange={e => updateLinea(i, "descripcion", e.target.value)} />
                        </div>
                        <div className="col-span-5 sm:col-span-2">
                          {i === 0 && <Label className="text-xs mb-1 block">Debe</Label>}
                          <Input className="rounded-xl font-mono text-right" type="number" min={0} step={0.01} value={l.debe} onChange={e => updateLinea(i, "debe", Number(e.target.value))} />
                        </div>
                        <div className="col-span-5 sm:col-span-2">
                          {i === 0 && <Label className="text-xs mb-1 block">Haber</Label>}
                          <Input className="rounded-xl font-mono text-right" type="number" min={0} step={0.01} value={l.haber} onChange={e => updateLinea(i, "haber", Number(e.target.value))} />
                        </div>
                        <div className="col-span-2 sm:col-span-1 flex justify-center">
                          <Button size="icon" variant="ghost" className="rounded-xl text-destructive hover:bg-destructive/10" onClick={() => removeLinea(i)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {lineas.length > 0 && (
                      <div className="flex flex-wrap items-center justify-end gap-4 text-sm font-semibold p-3 bg-muted/30 rounded-xl border border-border/60">
                        <span className="font-mono">Debe: ${totalDebe.toFixed(2)}</span>
                        <span className="font-mono">Haber: ${totalHaber.toFixed(2)}</span>
                        <Badge variant={cuadrado ? "default" : "destructive"} className="rounded-full">
                          {cuadrado ? "✓ Cuadrado" : "✗ Descuadrado"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Button onClick={handleCreateAsiento} className="w-full rounded-xl shadow-none" disabled={!cuadrado || lineas.length === 0}>
                    Registrar Asiento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Total Asientos"
          value={totalAsientos}
          subtitle="Registrados en el libro diario"
          icon={BookOpen}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Asientos Aprobados"
          value={asientosAprobados}
          subtitle="Contabilidad en firme"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="En Borrador"
          value={asientosBorrador}
          subtitle={asientosBorrador > 0 ? "Pendientes de aprobación" : "Sin pendientes"}
          icon={AlertCircle}
          variant="amber"
          alert={asientosBorrador > 0}
        />
        <ClinicalKpiCard
          title="Cuentas Activas"
          value={cuentasActivasCount}
          subtitle="Catálogo maestro disponible"
          icon={Layers}
          variant="purple"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto flex justify-start gap-1 p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
          <TabsTrigger value="asientos" className="rounded-xl text-xs font-semibold px-4 py-2">
            Libro Diario
          </TabsTrigger>
          <TabsTrigger value="cuentas" className="rounded-xl text-xs font-semibold px-4 py-2">
            Catálogo de Cuentas
          </TabsTrigger>
        </TabsList>

        {/* ASIENTOS */}
        <TabsContent value="asientos" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 rounded-xl border-border/80"
                placeholder="Buscar asiento por número o descripción..."
                value={searchAsiento}
                onChange={e => setSearchAsiento(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[160px] rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="borrador">Solo Borradores</SelectItem>
                  <SelectItem value="aprobado">Aprobados</SelectItem>
                  <SelectItem value="anulado">Anulados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold">Número</TableHead>
                    <TableHead className="font-semibold">Fecha</TableHead>
                    <TableHead className="font-semibold">Descripción</TableHead>
                    <TableHead className="font-semibold text-right">Debe</TableHead>
                    <TableHead className="font-semibold text-right">Haber</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAsientos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                        No se encontraron asientos contables registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAsientos.map(a => (
                      <TableRow
                        key={a.id}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => openDetalle(a)}
                      >
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          {a.numero}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(a.fecha + "T12:00:00").toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-medium text-foreground max-w-xs truncate">
                          {a.descripcion}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          ${Number(a.total_debe).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          ${Number(a.total_haber).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={a.estado} />
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1 justify-end">
                            {a.estado === "borrador" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rounded-xl h-8 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                  onClick={() => updateEstadoAsiento(a.id, "aprobado")}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Aprobar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-xl h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={() => updateEstadoAsiento(a.id, "anulado")}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CUENTAS */}
        <TabsContent value="cuentas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={cuentaDialog} onOpenChange={setCuentaDialog}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cuenta
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl border-border/80">
                <DialogHeader>
                  <DialogTitle>Nueva Cuenta Contable</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Código *</Label>
                      <Input
                        className="rounded-xl font-mono"
                        value={cuentaForm.codigo}
                        onChange={e => setCuentaForm(f => ({ ...f, codigo: e.target.value }))}
                        placeholder="Ej: 1.1.01"
                      />
                    </div>
                    <div>
                      <Label>Nombre *</Label>
                      <Input
                        className="rounded-xl"
                        value={cuentaForm.nombre}
                        onChange={e => setCuentaForm(f => ({ ...f, nombre: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={cuentaForm.tipo}
                        onValueChange={v =>
                          setCuentaForm(f => ({
                            ...f,
                            tipo: v,
                            naturaleza: ["activo", "gasto", "costo"].includes(v) ? "deudora" : "acreedora",
                          }))
                        }
                      >
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {TIPOS_CUENTA.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Naturaleza</Label>
                      <Select value={cuentaForm.naturaleza} onValueChange={v => setCuentaForm(f => ({ ...f, naturaleza: v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="deudora">Deudora</SelectItem>
                          <SelectItem value="acreedora">Acreedora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Cuenta Padre</Label>
                      <Select value={cuentaForm.cuenta_padre_id} onValueChange={v => setCuentaForm(f => ({ ...f, cuenta_padre_id: v }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Ninguna" /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="">Ninguna</SelectItem>
                          {cuentas.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nivel</Label>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        className="rounded-xl"
                        value={cuentaForm.nivel}
                        onChange={e => setCuentaForm(f => ({ ...f, nivel: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateCuenta} className="w-full rounded-xl shadow-none">
                    Guardar Cuenta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold">Código</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Naturaleza</TableHead>
                    <TableHead className="font-semibold">Nivel</TableHead>
                    <TableHead className="font-semibold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cuentas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        No hay cuentas contables configuradas
                      </TableCell>
                    </TableRow>
                  ) : (
                    cuentas.map(c => (
                      <TableRow key={c.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold">{c.codigo}</TableCell>
                        <TableCell style={{ paddingLeft: `${(c.nivel - 1) * 20 + 16}px` }} className="font-medium text-foreground">
                          {c.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="rounded-full text-[11px] font-normal uppercase tracking-wide">
                            {c.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground capitalize">{c.naturaleza}</TableCell>
                        <TableCell className="font-mono text-xs">{c.nivel}</TableCell>
                        <TableCell>
                          <StatusBadge status={c.activa ? "activo" : "inactivo"} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detalle Asiento */}
      <Dialog open={!!detalleAsiento} onOpenChange={v => !v && setDetalleAsiento(null)}>
        <DialogContent className="max-w-2xl rounded-2xl border-border/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Asiento {detalleAsiento?.numero}</span>
              {detalleAsiento?.estado && <StatusBadge status={detalleAsiento.estado} />}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/60">
              <span className="font-mono">
                Fecha: {detalleAsiento?.fecha && new Date(detalleAsiento.fecha + "T12:00:00").toLocaleDateString()}
              </span>
              {detalleAsiento?.referencia && (
                <span className="font-mono bg-muted px-2 py-0.5 rounded-lg">
                  Ref: {detalleAsiento.referencia}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Descripción</p>
              <p className="font-medium text-foreground">{detalleAsiento?.descripcion}</p>
            </div>
            
            <div className="rounded-xl border border-border/70 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-semibold text-xs">Cuenta</TableHead>
                    <TableHead className="font-semibold text-xs">Descripción</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Debe</TableHead>
                    <TableHead className="font-semibold text-xs text-right">Haber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalleLineas.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-mono text-xs text-foreground font-medium">
                        {l.cuentas_contables?.codigo} — {l.cuentas_contables?.nombre}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.descripcion || "—"}</TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        {Number(l.debe) > 0 ? `$${Number(l.debe).toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-semibold">
                        {Number(l.haber) > 0 ? `$${Number(l.haber).toFixed(2)}` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/20">
                    <TableCell colSpan={2} className="text-right text-xs">Totales</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-primary">
                      ${Number(detalleAsiento?.total_debe || 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-primary">
                      ${Number(detalleAsiento?.total_haber || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {detalleAsiento?.estado === "borrador" && (
              <div className="flex gap-2 justify-end pt-2">
                <Button
                  size="sm"
                  className="rounded-xl shadow-none bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => updateEstadoAsiento(detalleAsiento.id, "aprobado")}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Aprobar Asiento
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => updateEstadoAsiento(detalleAsiento.id, "anulado")}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Anular
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contabilidad;
