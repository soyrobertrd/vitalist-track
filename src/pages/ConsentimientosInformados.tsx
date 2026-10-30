import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  FileSignature,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  Eraser,
  Printer,
  Download,
  Lock,
  User,
  Heart,
  Baby,
  Stethoscope,
  XCircle,
  FileText
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export interface ConsentimientoRegistro {
  id: string;
  paciente_nombre: string;
  paciente_cedula: string;
  es_menor_edad: boolean;
  tutor_nombre?: string;
  tutor_cedula?: string;
  procedimiento: string;
  especialidad: "Cirugía General" | "Cardiología" | "Pediatría" | "Endoscopía" | "Hemoterapia" | "Anestesiología";
  medico_responsable: string;
  exequatur: string;
  fecha_hora_firma: string;
  estado: "firmado_vigente" | "pendiente_firma" | "revocado";
  firma_paciente_url?: string;
  firma_medico_url?: string;
  hash_integridad: string;
  riesgos_explicados: string;
}

const PLANTILLAS_CONSENTIMIENTO = [
  {
    id: "cirugia_laparoscopica",
    nombre: "Intervención Quirúrgica Laparoscópica / General",
    especialidad: "Cirugía General",
    riesgosDefault:
      "Riesgo de sangrado, infección del sitio quirúrgico, necesidad de conversión a cirugía abierta, lesión de órganos vecinos y reacciones a fármacos anestésicos.",
  },
  {
    id: "cateterismo_cardiaco",
    nombre: "Cateterismo Cardíaco / Coronariografía Diagnóstica",
    especialidad: "Cardiología",
    riesgosDefault:
      "Hematoma en el sitio de punción arterial, arritmias ventriculares transitorias, reacción alérgica al contraste yodado, espasmo coronario o disección vascular.",
  },
  {
    id: "procedimiento_pediatrico",
    nombre: "Procedimiento Invasivo Pediátrico (Con Tutor Legal)",
    especialidad: "Pediatría",
    riesgosDefault:
      "Molestias locales, agitación psicomotriz transitoria, hematomas menores y riesgo inherente a sedación supervisada por anestesiólogo pediatra.",
  },
  {
    id: "transfusion_sangre",
    nombre: "Transfusión de Hemocomponentes (Norma Sangre Segura)",
    especialidad: "Hemoterapia",
    riesgosDefault:
      "Reacción febril no hemolítica, sobrecarga circulatoria (TACO), erupción urticarial leve y riesgo residual residual biológico a pesar del tamizaje estricto.",
  },
  {
    id: "anestesia_regional",
    nombre: "Procedimiento Anestésico (Raquídea / Epidural)",
    especialidad: "Anestesiología",
    riesgosDefault:
      "Cefalea postpunción dural, hipotensión arterial transitoria, lumbalgia leve y parestesias transitorias en extremidades inferiores.",
  },
];

const CONSENTIMIENTOS_INICIALES: ConsentimientoRegistro[] = [
  {
    id: "CONS-2026-081",
    paciente_nombre: "Roberto Carlos Santana",
    paciente_cedula: "001-1827364-5",
    es_menor_edad: false,
    procedimiento: "Apendicectomía Laparoscópica",
    especialidad: "Cirugía General",
    medico_responsable: "Dr. Roberto Santos",
    exequatur: "CMD-18452-RD",
    fecha_hora_firma: new Date(Date.now() - 3600000 * 5).toISOString(),
    estado: "firmado_vigente",
    hash_integridad: "SHA256:7a9f8b1c4e2d3f6a5b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
    riesgos_explicados: "Riesgos de conversión a laparotomía y sangrado explicados y comprendidos satisfactoriamente.",
  },
  {
    id: "CONS-2026-082",
    paciente_nombre: "Mateo Samuel Vargas",
    paciente_cedula: "N/A (Menor)",
    es_menor_edad: true,
    tutor_nombre: "Laura Vargas Peña (Madre)",
    tutor_cedula: "402-2837461-9",
    procedimiento: "Drenaje de Absceso Periamigdalino Pediátrico",
    especialidad: "Pediatría",
    medico_responsable: "Dra. Sofía Valenzuela",
    exequatur: "CMD-21940-RD",
    fecha_hora_firma: new Date(Date.now() - 3600000 * 12).toISOString(),
    estado: "firmado_vigente",
    hash_integridad: "SHA256:9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d",
    riesgos_explicados: "Autorizado por la madre bajo el Código de Niños, Niñas y Adolescentes de RD.",
  },
  {
    id: "CONS-2026-083",
    paciente_nombre: "Mercedes Almonte Cruz",
    paciente_cedula: "031-0029384-1",
    es_menor_edad: false,
    procedimiento: "Cateterismo Cardíaco con Posible Angioplastia",
    especialidad: "Cardiología",
    medico_responsable: "Dr. Ramón Emilio Peralta",
    exequatur: "CMD-14320-RD",
    fecha_hora_firma: new Date(Date.now() - 3600000 * 20).toISOString(),
    estado: "firmado_vigente",
    hash_integridad: "SHA256:3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    riesgos_explicados: "Uso de stent liberador de fármacos y doble antiagregación posterior explicada.",
  },
  {
    id: "CONS-2026-084",
    paciente_nombre: "José Alejandro Tavárez",
    paciente_cedula: "001-9928374-2",
    es_menor_edad: false,
    procedimiento: "Transfusión de 2 Unidades de Concentrado de Glóbulos Rojos",
    especialidad: "Hemoterapia",
    medico_responsable: "Dra. Elena Guzmán",
    exequatur: "CMD-25110-RD",
    fecha_hora_firma: "",
    estado: "pendiente_firma",
    hash_integridad: "PENDIENTE_DE_EMISIÓN",
    riesgos_explicados: "Pendiente de firma en cama por el paciente previo al inicio de la infusión.",
  },
];

export default function ConsentimientosInformados() {
  const [consentimientos, setConsentimientos] = useState<ConsentimientoRegistro[]>(CONSENTIMIENTOS_INICIALES);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEsp, setFiltroEsp] = useState<string>("todas");
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [consentimientoActivo, setConsentimientoActivo] = useState<ConsentimientoRegistro | null>(null);

  // Formulario nuevo consentimiento
  const [plantillaSel, setPlantillaSel] = useState(PLANTILLAS_CONSENTIMIENTO[0].id);
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [cedulaPaciente, setCedulaPaciente] = useState("");
  const [esMenor, setEsMenor] = useState(false);
  const [nombreTutor, setNombreTutor] = useState("");
  const [cedulaTutor, setCedulaTutor] = useState("");
  const [medico, setMedico] = useState("Dr. Ramón Emilio Peralta");
  const [exequatur, setExequatur] = useState("CMD-14320-RD");
  const [riesgosTexto, setRiesgosTexto] = useState(PLANTILLAS_CONSENTIMIENTO[0].riesgosDefault);

  // Pad de firma interactivo con Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [firmaCapturada, setFirmaCapturada] = useState<string | null>(null);

  const plantillaActual = PLANTILLAS_CONSENTIMIENTO.find((p) => p.id === plantillaSel);

  // Control del Canvas
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();
    setFirmaCapturada(canvas.toDataURL("image/png"));
  };

  const handleStopDraw = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmaCapturada(null);
  };

  const handleCrearConsentimiento = () => {
    if (!nombrePaciente.trim() || !cedulaPaciente.trim()) {
      toast.error("Complete los datos de identificación del paciente.");
      return;
    }
    if (esMenor && (!nombreTutor.trim() || !cedulaTutor.trim())) {
      toast.error("Al ser menor de edad, se requiere el nombre y cédula del tutor legal.");
      return;
    }
    if (!firmaCapturada) {
      toast.error("El paciente o tutor legal debe plasmar su firma digital en el pad.");
      return;
    }

    const randomHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

    const nuevo: ConsentimientoRegistro = {
      id: `CONS-2026-0${(consentimientos.length + 80).toString()}`,
      paciente_nombre: nombrePaciente,
      paciente_cedula: cedulaPaciente,
      es_menor_edad: esMenor,
      tutor_nombre: esMenor ? nombreTutor : undefined,
      tutor_cedula: esMenor ? cedulaTutor : undefined,
      procedimiento: plantillaActual?.nombre || "Procedimiento Clínico",
      especialidad: (plantillaActual?.especialidad as any) || "Cirugía General",
      medico_responsable: medico,
      exequatur,
      fecha_hora_firma: new Date().toISOString(),
      estado: "firmado_vigente",
      firma_paciente_url: firmaCapturada,
      hash_integridad: `SHA256:${randomHex}`,
      riesgos_explicados: riesgosTexto,
    };

    setConsentimientos([nuevo, ...consentimientos]);
    toast.success(`Consentimiento Informado registrado: ${nuevo.id}`, {
      description: `Sellado criptográficamente bajo Ley 42-01. Hash: ${nuevo.hash_integridad.slice(0, 16)}...`,
    });

    setModalNuevoOpen(false);
    setNombrePaciente("");
    setCedulaPaciente("");
    setNombreTutor("");
    setCedulaTutor("");
    handleClearCanvas();
  };

  const handleRevocarConsentimiento = (id: string) => {
    setConsentimientos(
      consentimientos.map((c) => (c.id === id ? { ...c, estado: "revocado" } : c))
    );
    toast.error(`Consentimiento ${id} REVOCADO`, {
      description: "El paciente ha ejercido su derecho legal de revocación. Se cancela el procedimiento programado.",
    });
  };

  const consentimientosFiltrados = useMemo(() => {
    return consentimientos.filter((c) => {
      const matchBusqueda =
        c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.paciente_cedula.includes(busqueda) ||
        c.procedimiento.toLowerCase().includes(busqueda.toLowerCase());
      const matchEsp = filtroEsp === "todas" ? true : c.especialidad === filtroEsp;
      return matchBusqueda && matchEsp;
    });
  }, [consentimientos, busqueda, filtroEsp]);

  const vigentes = consentimientos.filter((c) => c.estado === "firmado_vigente").length;
  const pendientes = consentimientos.filter((c) => c.estado === "pendiente_firma").length;
  const menores = consentimientos.filter((c) => c.es_menor_edad).length;
  const revocados = consentimientos.filter((c) => c.estado === "revocado").length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Consentimientos Informados & Firma Biométrica"
        subtitle="Gestión legal y clínica de autorizaciones quirúrgicas, transfusionales y de procedimientos invasivos (Ley 42-01 RD)"
        icon={FileSignature}
        badge="Ley General de Salud RD & Marco Bioético"
        action={
          <Button size="sm" onClick={() => setModalNuevoOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Consentimiento Firmado
          </Button>
        }
      />

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Consentimientos Vigentes"
          value={vigentes}
          subtitle="Firmados con validez legal activa"
          icon={ShieldCheck}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Pendientes de Firma"
          value={pendientes}
          subtitle="Pre-quirúrgicos / Transfusionales"
          icon={Clock}
          variant="amber"
          alert={pendientes > 0}
        />
        <ClinicalKpiCard
          title="Procedimientos Pediátricos"
          value={menores}
          subtitle="Firmados por tutor legal autorizado"
          icon={Baby}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Revocaciones del Paciente"
          value={revocados}
          subtitle="Derecho de desistimiento registrado"
          icon={XCircle}
          variant="rose"
        />
      </div>

      {/* Censo y Filtros */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-purple-600" />
                Expediente de Consentimientos Informados Digitales
              </CardTitle>
              <CardDescription>
                Registro inmutable con firma biométrica del paciente o tutor legal y aval del médico tratante con exequátur.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente, cédula..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Select value={filtroEsp} onValueChange={setFiltroEsp}>
                <SelectTrigger className="w-40 h-9 text-xs">
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las Áreas</SelectItem>
                  <SelectItem value="Cirugía General">Cirugía General</SelectItem>
                  <SelectItem value="Cardiología">Cardiología</SelectItem>
                  <SelectItem value="Pediatría">Pediatría</SelectItem>
                  <SelectItem value="Hemoterapia">Hemoterapia</SelectItem>
                  <SelectItem value="Anestesiología">Anestesiología</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {consentimientosFiltrados.map((c) => (
            <div
              key={c.id}
              className={`p-3.5 rounded-xl border transition-all ${
                c.estado === "revocado"
                  ? "border-red-500/40 bg-red-500/5 opacity-75"
                  : c.estado === "pendiente_firma"
                  ? "border-amber-500/40 bg-amber-500/5"
                  : "border-border/80 hover:bg-muted/20"
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{c.paciente_nombre}</span>
                    <Badge variant="outline" className="text-[11px] font-mono">
                      Céd: {c.paciente_cedula}
                    </Badge>
                    {c.es_menor_edad && (
                      <Badge className="bg-purple-600 text-white text-[10px]">Tutor: {c.tutor_nombre}</Badge>
                    )}
                    <Badge
                      className={
                        c.estado === "firmado_vigente"
                          ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]"
                          : c.estado === "revocado"
                          ? "bg-red-500/15 text-red-700 border-red-500/30 text-[10px]"
                          : "bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]"
                      }
                    >
                      {c.estado.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Procedimiento: <strong className="text-foreground">{c.procedimiento}</strong> ({c.especialidad}) · Médico:{" "}
                    {c.medico_responsable} ({c.exequatur})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => {
                      setConsentimientoActivo(c);
                      setModalVerOpen(true);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Ver Documento
                  </Button>
                  {c.estado === "firmado_vigente" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-red-600 hover:bg-red-500/10"
                      onClick={() => handleRevocarConsentimiento(c.id)}
                    >
                      Revocar
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-border/40 flex justify-between items-center text-[11px] text-muted-foreground font-mono">
                <span>
                  <Lock className="h-3 w-3 inline mr-1 text-emerald-600" />
                  Hash: {c.hash_integridad.slice(0, 24)}...
                </span>
                <span>
                  {c.fecha_hora_firma ? format(new Date(c.fecha_hora_firma), "dd/MM/yyyy hh:mm a") : "Sin firmar"}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modal Nuevo Consentimiento con Pad de Firma */}
      <Dialog open={modalNuevoOpen} onOpenChange={setModalNuevoOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileSignature className="h-5 w-5 text-purple-600" />
              Nuevo Consentimiento Informado con Firma Biométrica
            </DialogTitle>
            <DialogDescription>
              Cumplimiento del consentimiento informado previo a procedimiento médico o quirúrgico.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Plantilla de Procedimiento / Especialidad</Label>
              <Select
                value={plantillaSel}
                onValueChange={(val) => {
                  setPlantillaSel(val);
                  const p = PLANTILLAS_CONSENTIMIENTO.find((item) => item.id === val);
                  if (p) setRiesgosTexto(p.riesgosDefault);
                }}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANTILLAS_CONSENTIMIENTO.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.especialidad}: {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre Completo del Paciente *</Label>
                <Input
                  placeholder="Ej: Danilo Martínez Soto"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cédula de Identidad o Pasaporte *</Label>
                <Input
                  placeholder="001-XXXXXXX-X"
                  value={cedulaPaciente}
                  onChange={(e) => setCedulaPaciente(e.target.value)}
                />
              </div>
            </div>

            {/* Selector si es menor de edad */}
            <div className="p-2.5 rounded-xl border bg-muted/20 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="es_menor_check"
                  checked={esMenor}
                  onChange={(e) => setEsMenor(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="es_menor_check" className="text-xs cursor-pointer font-medium">
                  El paciente es menor de edad o legalmente dependiente (Firma Tutor Legal)
                </label>
              </div>

              {esMenor && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Nombre del Padre / Madre / Tutor *</Label>
                    <Input value={nombreTutor} onChange={(e) => setNombreTutor(e.target.value)} className="h-8" />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Cédula del Tutor *</Label>
                    <Input value={cedulaTutor} onChange={(e) => setCedulaTutor(e.target.value)} className="h-8" />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Médico Especialista Responsable</Label>
                <Input value={medico} onChange={(e) => setMedico(e.target.value)} className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Número de Exequátur Oficial</Label>
                <Input value={exequatur} onChange={(e) => setExequatur(e.target.value)} className="h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Riesgos, Beneficios y Alternativas Notificadas</Label>
              <Textarea
                value={riesgosTexto}
                onChange={(e) => setRiesgosTexto(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>

            {/* Pad de Firma Digital con Canvas */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <FileSignature className="h-4 w-4 text-purple-600" />
                  Pad de Firma Biométrica Digital (Paciente o Tutor Legal) *
                </Label>
                <Button size="sm" variant="ghost" onClick={handleClearCanvas} className="h-7 text-xs text-muted-foreground">
                  <Eraser className="h-3.5 w-3.5 mr-1" /> Limpiar firma
                </Button>
              </div>

              <div className="border-2 border-dashed border-primary/30 rounded-xl bg-background p-1 text-center">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={140}
                  className="w-full touch-none cursor-crosshair rounded-lg bg-slate-50 dark:bg-slate-900/60"
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDraw}
                  onMouseUp={handleStopDraw}
                  onMouseLeave={handleStopDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleDraw}
                  onTouchEnd={handleStopDraw}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Dibuje la firma con el mouse o con el dedo en pantallas táctiles / tablets.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalNuevoOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearConsentimiento}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Registrar & Firmar Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Visualizador de Documento Firmado */}
      <Dialog open={modalVerOpen} onOpenChange={setModalVerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Documento de Consentimiento Informado Oficial
            </DialogTitle>
            <DialogDescription>
              Comprobante médico-legal certificado bajo la Ley 42-01 de República Dominicana.
            </DialogDescription>
          </DialogHeader>

          {consentimientoActivo && (
            <div className="space-y-4 py-2 text-xs border p-4 rounded-xl bg-card">
              <div className="text-center border-b pb-3 space-y-1">
                <p className="font-bold text-sm uppercase">Hospital & Centro de Especialidades Médicas</p>
                <p className="text-[11px] text-muted-foreground">Registro Nacional de Consentimientos Clínicos</p>
                <Badge variant="outline" className="font-mono text-[10px] mt-1">
                  ID: {consentimientoActivo.id}
                </Badge>
              </div>

              <div className="space-y-1.5">
                <p><strong>Paciente:</strong> {consentimientoActivo.paciente_nombre} (Céd: {consentimientoActivo.paciente_cedula})</p>
                {consentimientoActivo.es_menor_edad && (
                  <p><strong>Tutor Legal Autorizado:</strong> {consentimientoActivo.tutor_nombre} (Céd: {consentimientoActivo.tutor_cedula})</p>
                )}
                <p><strong>Procedimiento Autorizado:</strong> {consentimientoActivo.procedimiento}</p>
                <p><strong>Especialidad:</strong> {consentimientoActivo.especialidad}</p>
                <p><strong>Médico Responsable:</strong> {consentimientoActivo.medico_responsable} - Exequátur: {consentimientoActivo.exequatur}</p>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <strong className="text-foreground">Declaración de Riesgos y Alternativas:</strong>
                <p className="text-muted-foreground">{consentimientoActivo.riesgos_explicados}</p>
              </div>

              {consentimientoActivo.firma_paciente_url && (
                <div className="border rounded-lg p-2 text-center bg-white dark:bg-slate-900">
                  <p className="text-[10px] text-muted-foreground mb-1">Firma Biométrica Registrada</p>
                  <img
                    src={consentimientoActivo.firma_paciente_url}
                    alt="Firma del paciente"
                    className="max-h-20 mx-auto filter invert dark:invert-0"
                  />
                </div>
              )}

              <div className="text-[10px] font-mono text-muted-foreground border-t pt-2 space-y-0.5">
                <p>Sello de Seguridad: {consentimientoActivo.hash_integridad}</p>
                <p>Fecha de Certificación: {consentimientoActivo.fecha_hora_firma ? format(new Date(consentimientoActivo.fecha_hora_firma), "Pp") : "Pendiente"}</p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info("Generando copia imprimible del Consentimiento...");
                window.print();
              }}
            >
              <Printer className="h-4 w-4 mr-1" /> Imprimir / PDF
            </Button>
            <Button size="sm" onClick={() => setModalVerOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
