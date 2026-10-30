import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  QrCode,
  Sparkles,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Plus,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export type ZonaEsterilizacion = "zona_roja" | "zona_azul" | "esteril_almacen" | "en_quirofano";

export interface CajaQuirurgica {
  id: string;
  codigoCaja: string;
  nombre: string;
  especialidad: string;
  zona: ZonaEsterilizacion;
  autoclaveNumero: string;
  numeroCiclo: number;
  tipoEsterilizacion: "vapor_134" | "vapor_121" | "plasma_peroxido" | "oxido_etileno";
  indicadorQuimicoClase: "clase_5_integrador" | "clase_6_emulador";
  fechaEsterilizacion: string;
  fechaCaducidad: string;
  tecnicoResponsable: string;
  quirofanoAsignado?: string;
  pacienteDestino?: string;
}

const DEFAULT_CAJAS: CajaQuirurgica[] = [
  {
    id: "box-1",
    codigoCaja: "CQ-LAP-04",
    nombre: "Caja de Laparoscopía Avanzada HD #4",
    especialidad: "Cirugía General / Gineco",
    zona: "esteril_almacen",
    autoclaveNumero: "Autoclave 01 (Vapor)",
    numeroCiclo: 1420,
    tipoEsterilizacion: "vapor_134",
    indicadorQuimicoClase: "clase_5_integrador",
    fechaEsterilizacion: "2026-10-28 07:30",
    fechaCaducidad: "2027-04-28",
    tecnicoResponsable: "Lic. Miguel Ángel Sosa (CEYE)",
    quirofanoAsignado: "Quirófano 2 (Central)",
    pacienteDestino: "Ramón Arturo Gómez",
  },
  {
    id: "box-2",
    codigoCaja: "CQ-TRAUMA-02",
    nombre: "Caja de Osteosíntesis Grandes Fragmentos",
    especialidad: "Traumatología y Ortopedia",
    zona: "en_quirofano",
    autoclaveNumero: "Autoclave 02 (Vapor)",
    numeroCiclo: 1422,
    tipoEsterilizacion: "vapor_134",
    indicadorQuimicoClase: "clase_6_emulador",
    fechaEsterilizacion: "2026-10-28 09:15",
    fechaCaducidad: "2027-04-28",
    tecnicoResponsable: "Lic. Miguel Ángel Sosa",
    quirofanoAsignado: "Quirófano 1 (Trauma)",
    pacienteDestino: "Elena Vásquez",
  },
  {
    id: "box-3",
    codigoCaja: "CQ-OPTIC-01",
    nombre: "Óptica Laparoscópica Storz 30° 10mm (Termosensible)",
    especialidad: "Cirugía Mínimamente Invasiva",
    zona: "esteril_almacen",
    autoclaveNumero: "Esterilizador Plasma H2O2",
    numeroCiclo: 310,
    tipoEsterilizacion: "plasma_peroxido",
    indicadorQuimicoClase: "clase_5_integrador",
    fechaEsterilizacion: "2026-10-27 15:40",
    fechaCaducidad: "2027-01-27",
    tecnicoResponsable: "Tec. Patricia Luna",
  },
  {
    id: "box-4",
    codigoCaja: "CQ-CESAREA-03",
    nombre: "Caja de Cirugía Obstétrica & Cesárea #3",
    especialidad: "Obstetricia & Maternidad",
    zona: "zona_azul",
    autoclaveNumero: "Pendiente Carga",
    numeroCiclo: 0,
    tipoEsterilizacion: "vapor_134",
    indicadorQuimicoClase: "clase_5_integrador",
    fechaEsterilizacion: "—",
    fechaCaducidad: "—",
    tecnicoResponsable: "Tec. Patricia Luna (Inspección & Empaque)",
  },
  {
    id: "box-5",
    codigoCaja: "CQ-HERNIA-01",
    nombre: "Set de Hernioplastia Inguinal / Pared",
    especialidad: "Cirugía General",
    zona: "zona_roja",
    autoclaveNumero: "Pendiente Lavado",
    numeroCiclo: 0,
    tipoEsterilizacion: "vapor_134",
    indicadorQuimicoClase: "clase_5_integrador",
    fechaEsterilizacion: "—",
    fechaCaducidad: "—",
    tecnicoResponsable: "Recepción de Instrumental Usado",
  },
];

export const TrazabilidadCajasTab: React.FC = () => {
  const [cajas, setCajas] = useState<CajaQuirurgica[]>(DEFAULT_CAJAS);
  const [filtroZona, setFiltroZona] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [openNueva, setOpenNueva] = useState(false);
  const [etiquetaModal, setEtiquetaModal] = useState<CajaQuirurgica | null>(null);

  const [form, setForm] = useState({
    codigoCaja: "",
    nombre: "",
    especialidad: "Cirugía General",
    tipoEsterilizacion: "vapor_134" as CajaQuirurgica["tipoEsterilizacion"],
    autoclaveNumero: "Autoclave 01 (Vapor)",
    numeroCiclo: 1425,
    indicadorQuimicoClase: "clase_5_integrador" as CajaQuirurgica["indicadorQuimicoClase"],
    tecnicoResponsable: "Lic. Miguel Ángel Sosa",
  });

  const handleCrear = () => {
    if (!form.codigoCaja || !form.nombre) {
      toast.error("Por favor completa el código y nombre de la caja");
      return;
    }

    const nueva: CajaQuirurgica = {
      id: `box-${Date.now()}`,
      codigoCaja: form.codigoCaja,
      nombre: form.nombre,
      especialidad: form.especialidad,
      zona: "esteril_almacen",
      autoclaveNumero: form.autoclaveNumero,
      numeroCiclo: form.numeroCiclo,
      tipoEsterilizacion: form.tipoEsterilizacion,
      indicadorQuimicoClase: form.indicadorQuimicoClase,
      fechaEsterilizacion: new Date().toISOString().replace("T", " ").substring(0, 16),
      fechaCaducidad: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().substring(0, 10),
      tecnicoResponsable: form.tecnicoResponsable,
    };

    setCajas([nueva, ...cajas]);
    toast.success("Caja quirúrgica registrada y esterilizada en CEYE");
    setOpenNueva(false);
    setForm({
      codigoCaja: "",
      nombre: "",
      especialidad: "Cirugía General",
      tipoEsterilizacion: "vapor_134",
      autoclaveNumero: "Autoclave 01 (Vapor)",
      numeroCiclo: 1426,
      indicadorQuimicoClase: "clase_5_integrador",
      tecnicoResponsable: "Lic. Miguel Ángel Sosa",
    });
  };

  const cambiarZona = (id: string, nuevaZona: ZonaEsterilizacion) => {
    setCajas(cajas.map((c) => (c.id === id ? { ...c, zona: nuevaZona } : c)));
    toast.success("Transición de etapa de reprocesamiento actualizada");
  };

  const zonaBadge = (zona: ZonaEsterilizacion) => {
    switch (zona) {
      case "zona_roja":
        return <Badge variant="destructive" className="text-[10px]">🔴 Zona Roja (Lavado)</Badge>;
      case "zona_azul":
        return <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-[10px]">🔵 Zona Azul (Empaque)</Badge>;
      case "esteril_almacen":
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">🟢 Zona Verde (Estéril)</Badge>;
      case "en_quirofano":
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 text-[10px]">🟣 En Quirófano</Badge>;
    }
  };

  const filtered = cajas.filter((c) => {
    const matchZona = filtroZona === "todas" || c.zona === filtroZona;
    const matchBusqueda =
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.codigoCaja.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.especialidad.toLowerCase().includes(busqueda.toLowerCase());
    return matchZona && matchBusqueda;
  });

  return (
    <div className="space-y-4">
      {/* Controles de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar caja, código o instrumental..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
          <Select value={filtroZona} onValueChange={setFiltroZona}>
            <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl">
              <SelectValue placeholder="Filtrar por zona..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las Etapas</SelectItem>
              <SelectItem value="zona_roja">Zona Roja (Descontaminación)</SelectItem>
              <SelectItem value="zona_azul">Zona Azul (Inspección & Empaque)</SelectItem>
              <SelectItem value="esteril_almacen">Zona Verde (Almacén Estéril)</SelectItem>
              <SelectItem value="en_quirofano">En Uso / Quirófano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={openNueva} onOpenChange={setOpenNueva}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl shrink-0">
              <Plus className="h-4 w-4 mr-1.5" />
              Nueva Caja Esterilizada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <Sparkles className="h-4 w-4 text-primary" />
                Registrar Caja Quirúrgica Estéril
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Código de Caja</Label>
                  <Input
                    placeholder="CQ-CARDIO-01"
                    value={form.codigoCaja}
                    onChange={(e) => setForm({ ...form, codigoCaja: e.target.value })}
                    className="text-xs mt-1 font-mono uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs">Especialidad</Label>
                  <Input
                    placeholder="Cirugía General"
                    value={form.especialidad}
                    onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Nombre Descriptivo de la Caja</Label>
                <Input
                  placeholder="Set de Instrumental de Toracotomía"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Método de Esterilización</Label>
                  <Select
                    value={form.tipoEsterilizacion}
                    onValueChange={(v: any) => setForm({ ...form, tipoEsterilizacion: v })}
                  >
                    <SelectTrigger className="text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vapor_134">Vapor 134°C (Autoclave Rápido)</SelectItem>
                      <SelectItem value="vapor_121">Vapor 121°C (Cargas Pesadas)</SelectItem>
                      <SelectItem value="plasma_peroxido">Plasma H2O2 (Ópticas/Fibras)</SelectItem>
                      <SelectItem value="oxido_etileno">Óxido de Etileno (ETO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Equipo y Ciclo</Label>
                  <Input
                    placeholder="Autoclave 01 / Ciclo 1425"
                    value={`${form.autoclaveNumero} / C-${form.numeroCiclo}`}
                    onChange={(e) => setForm({ ...form, autoclaveNumero: e.target.value })}
                    className="text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Indicador Químico Interno</Label>
                <Select
                  value={form.indicadorQuimicoClase}
                  onValueChange={(v: any) => setForm({ ...form, indicadorQuimicoClase: v })}
                >
                  <SelectTrigger className="text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clase_5_integrador">Clase 5: Integrador (Respuesta Fisiológica)</SelectItem>
                    <SelectItem value="clase_6_emulador">Clase 6: Emulador de Parámetros Críticos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Técnico Instrumentista / CEYE</Label>
                <Input
                  value={form.tecnicoResponsable}
                  onChange={(e) => setForm({ ...form, tecnicoResponsable: e.target.value })}
                  className="text-xs mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button size="sm" onClick={handleCrear} className="w-full">
                Certificar y Empacar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de cajas en proceso */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => (
          <Card key={c.id} className="rounded-2xl border-border/80 shadow-none hover:border-primary/40 transition">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-primary block">
                    {c.codigoCaja}
                  </span>
                  <h4 className="font-semibold text-sm text-foreground line-clamp-1">{c.nombre}</h4>
                </div>
                {zonaBadge(c.zona)}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Especialidad: <strong className="text-foreground">{c.especialidad}</strong></p>
                <p>Ciclo: <span className="font-mono text-foreground">{c.autoclaveNumero} (C-{c.numeroCiclo})</span></p>
                <p className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Testigo: {c.indicadorQuimicoClase.replace(/_/g, " ")}</span>
                </p>
                {c.quirofanoAsignado && (
                  <p className="text-purple-600 dark:text-purple-400 font-medium pt-0.5">
                    Destino: {c.quirofanoAsignado} {c.pacienteDestino && `(${c.pacienteDestino})`}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                <span>Vence: <strong className="text-foreground">{c.fechaCaducidad}</strong></span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => setEtiquetaModal(c)}
                >
                  <QrCode className="h-3.5 w-3.5 text-primary" />
                  Etiqueta QR
                </Button>
              </div>

              {/* Botones de Cambio Rápido de Zona */}
              <div className="pt-1 flex gap-1">
                {c.zona === "zona_roja" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[11px]"
                    onClick={() => cambiarZona(c.id, "zona_azul")}
                  >
                    Pasar a Zona Azul (Empaque)
                  </Button>
                )}
                {c.zona === "zona_azul" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[11px] text-emerald-600"
                    onClick={() => cambiarZona(c.id, "esteril_almacen")}
                  >
                    Carga Esterilizada (Almacén)
                  </Button>
                )}
                {c.zona === "esteril_almacen" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[11px] text-purple-600"
                    onClick={() => cambiarZona(c.id, "en_quirofano")}
                  >
                    Despachar a Quirófano
                  </Button>
                )}
                {c.zona === "en_quirofano" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[11px] text-rose-600"
                    onClick={() => cambiarZona(c.id, "zona_roja")}
                  >
                    Retornar Instrumental Sucio
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <p className="text-sm font-medium">No se encontraron cajas quirúrgicas con este criterio</p>
          </div>
        )}
      </div>

      {/* Modal de Etiqueta de Esterilidad con QR */}
      <Dialog open={!!etiquetaModal} onOpenChange={(o) => !o && setEtiquetaModal(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              Etiqueta de Esterilidad CEYE
            </DialogTitle>
          </DialogHeader>

          <div className="p-3 border-2 border-dashed border-border/80 rounded-2xl bg-card space-y-3">
            <div className="flex items-center justify-center">
              {/* QR Simulado */}
              <div className="p-2 bg-white rounded-xl border">
                <svg className="h-28 w-28 text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  <rect x="5" y="5" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="13" width="10" height="10" />
                  <rect x="69" y="5" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="77" y="13" width="10" height="10" />
                  <rect x="5" y="69" width="26" height="26" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                  <rect x="13" y="77" width="10" height="10" />
                  <rect x="38" y="12" width="6" height="6" />
                  <rect x="48" y="12" width="8" height="6" />
                  <rect x="38" y="24" width="20" height="6" />
                  <rect x="10" y="42" width="12" height="10" />
                  <rect x="28" y="42" width="30" height="6" />
                  <rect x="66" y="42" width="20" height="6" />
                  <rect x="40" y="58" width="14" height="12" />
                  <rect x="64" y="58" width="12" height="12" />
                  <rect x="38" y="76" width="22" height="6" />
                  <rect x="68" y="76" width="18" height="10" />
                </svg>
              </div>
            </div>

            <div className="text-xs space-y-1 text-left bg-muted/40 p-2.5 rounded-xl font-mono">
              <div className="font-bold text-sm text-foreground text-center">
                {etiquetaModal?.codigoCaja}
              </div>
              <p className="text-[11px] truncate text-center">{etiquetaModal?.nombre}</p>
              <div className="border-t border-border/60 pt-1 text-[11px] space-y-0.5">
                <p>ESTERILIZADO: <strong>{etiquetaModal?.fechaEsterilizacion}</strong></p>
                <p>CADUCIDAD: <strong className="text-rose-600">{etiquetaModal?.fechaCaducidad}</strong></p>
                <p>EQUIPO: {etiquetaModal?.autoclaveNumero}</p>
                <p>CICLO: #{etiquetaModal?.numeroCiclo}</p>
                <p>RESPONSABLE: {etiquetaModal?.tecnicoResponsable}</p>
              </div>
            </div>

            <Button size="sm" onClick={() => window.print()} className="w-full text-xs">
              <Printer className="h-4 w-4 mr-1.5" />
              Imprimir Etiqueta Térmica
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
