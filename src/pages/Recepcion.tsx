import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, differenceInMinutes } from "date-fns";
import {
  Building2,
  UserCheck,
  Clock,
  Search,
  ScanLine,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Volume2,
  Stethoscope,
  GraduationCap,
  Users,
  CreditCard,
  BedDouble,
  ArrowRight,
  Filter,
  Activity,
  Layers,
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export type TipoCentroMedico = "consultorio_individual" | "policlinica_ambulatoria" | "hospital_universitario";

interface PacienteEspera {
  id: string;
  ticket: string;
  nombre: string;
  cedula_nss: string;
  tipo_cobertura: "privado" | "senasa" | "primera_ars" | "mapfre" | "universal" | "humano";
  servicio_destino: string;
  medico_asignado?: string;
  equipo_docente?: {
    tutor: string;
    residente: string;
    rotacion: string;
  };
  sala_espera: string;
  hora_llegada: string;
  estado: "en_espera" | "llamado" | "en_consulta" | "finalizado";
  monto_copago_dop: number;
  pagado: boolean;
  prioridad: "normal" | "preferencial" | "urgente";
}

const CONFIG_CENTROS: Record<TipoCentroMedico, { nombre: string; desc: string; badge: string; salas: string[] }> = {
  consultorio_individual: {
    nombre: "Consultorio Privado / Especialista",
    desc: "Flujo directo y ágil: Recepción directa de citas, confirmación de copago y pase inmediato a consulta.",
    badge: "Modo Consultorio Único",
    salas: ["Antesala Privada"],
  },
  policlinica_ambulatoria: {
    nombre: "Policlínica / Centro Ambulatorio",
    desc: "Múltiples consultorios ambulatorios, emisión de turnos por especialidad y validación de coberturas ARS.",
    badge: "Modo Centro Médico",
    salas: ["Sala de Espera General", "Espera Especialidades A", "Espera Laboratorio"],
  },
  hospital_universitario: {
    nombre: "Hospital Universitario Multidisciplinario",
    desc: "Admisión general con derivación a urgencias/triage, asignación a cátedras y equipos docentes (Tutor + Residente).",
    badge: "Modo Universitario Complejo",
    salas: ["Sala Central de Admisiones", "Espera Docencia / Consultorios Externos", "Espera Urgencias / Triage", "Espera Procedimientos"],
  },
};

const PACIENTES_MOCK_INICIALES: PacienteEspera[] = [
  {
    id: "REC-101",
    ticket: "A-01",
    nombre: "Rosa Elena Méndez Gómez",
    cedula_nss: "402-2345678-1",
    tipo_cobertura: "senasa",
    servicio_destino: "Cardiología Clínica",
    medico_asignado: "Dr. Ramón Emilio Peralta",
    equipo_docente: {
      tutor: "Dr. Ramón Peralta (Prof. Titular)",
      residente: "Dra. Laura De León (R2 Cardiología)",
      rotacion: "Clínica de Falla Cardíaca",
    },
    sala_espera: "Espera Docencia / Consultorios Externos",
    hora_llegada: new Date(Date.now() - 18 * 60000).toISOString(),
    estado: "en_espera",
    monto_copago_dop: 300,
    pagado: true,
    prioridad: "normal",
  },
  {
    id: "REC-102",
    ticket: "B-03",
    nombre: "Gabriel Antonio Castillo",
    cedula_nss: "001-9876543-2",
    tipo_cobertura: "primera_ars",
    servicio_destino: "Pediatría & Puericultura",
    medico_asignado: "Dra. Sofía Valenzuela",
    equipo_docente: {
      tutor: "Dra. Sofía Valenzuela (Jefa Cátedra)",
      residente: "Dr. Marcos Peña (R1 Pediatría)",
      rotacion: "Control Niño Sano",
    },
    sala_espera: "Sala Central de Admisiones",
    hora_llegada: new Date(Date.now() - 32 * 60000).toISOString(),
    estado: "llamado",
    monto_copago_dop: 450,
    pagado: true,
    prioridad: "preferencial",
  },
  {
    id: "REC-103",
    ticket: "C-05",
    nombre: "José Alejandro Tavárez",
    cedula_nss: "031-1122334-9",
    tipo_cobertura: "universal",
    servicio_destino: "Endocrinología & Diabetes",
    medico_asignado: "Dr. Miguel Ángel Rosario",
    equipo_docente: {
      tutor: "Dr. Miguel Rosario",
      residente: "Dra. Carla Ortiz (R3 Medicina Interna)",
      rotacion: "Pie Diabético y Metabolismo",
    },
    sala_espera: "Espera Docencia / Consultorios Externos",
    hora_llegada: new Date(Date.now() - 8 * 60000).toISOString(),
    estado: "en_espera",
    monto_copago_dop: 500,
    pagado: false,
    prioridad: "normal",
  },
  {
    id: "REC-104",
    ticket: "U-02",
    nombre: "Manuel Antonio Reyes",
    cedula_nss: "002-3344556-7",
    tipo_cobertura: "privado",
    servicio_destino: "Urgencias / Triage Manchester",
    medico_asignado: "Guardia de Urgencias",
    sala_espera: "Espera Urgencias / Triage",
    hora_llegada: new Date(Date.now() - 5 * 60000).toISOString(),
    estado: "en_espera",
    monto_copago_dop: 1200,
    pagado: true,
    prioridad: "urgente",
  },
];

export default function Recepcion() {
  const [tipoCentro, setTipoCentro] = useState<TipoCentroMedico>("hospital_universitario");
  const [pacientes, setPacientes] = useState<PacienteEspera[]>(PACIENTES_MOCK_INICIALES);
  const [tabActual, setTabActual] = useState("cola");
  const [busqueda, setBusqueda] = useState("");
  const [filtroSala, setFiltroSala] = useState("todas");
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);

  // Formulario nuevo paciente
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaCedula, setNuevaCedula] = useState("");
  const [nuevoServicio, setNuevoServicio] = useState("Medicina General");
  const [nuevaCobertura, setNuevaCobertura] = useState<PacienteEspera["tipo_cobertura"]>("senasa");
  const [nuevoCopago, setNuevoCopago] = useState("300");
  const [nuevoPagado, setNuevoPagado] = useState(true);
  const [nuevaSala, setNuevaSala] = useState(CONFIG_CENTROS[tipoCentro].salas[0]);
  const [nuevoTutor, setNuevoTutor] = useState("Dr. Ramón Peralta");
  const [nuevoResidente, setNuevoResidente] = useState("Dra. Laura De León (R2)");

  const cfg = CONFIG_CENTROS[tipoCentro];

  // Acciones de cola
  const handleLlamarPaciente = (p: PacienteEspera) => {
    setPacientes(
      pacientes.map((item) => (item.id === p.id ? { ...item, estado: "llamado" } : item))
    );
    toast.success(`Llamando al paciente ${p.ticket} - ${p.nombre}`, {
      description: `Dirigirse a: ${p.servicio_destino} (${p.medico_asignado || "Consultorio"})`,
      duration: 5000,
    });
  };

  const handleIngresarConsulta = (p: PacienteEspera) => {
    setPacientes(
      pacientes.map((item) => (item.id === p.id ? { ...item, estado: "en_consulta" } : item))
    );
    toast.info(`Paciente ${p.nombre} ingresó a consulta.`);
  };

  const handleFinalizar = (p: PacienteEspera) => {
    setPacientes(
      pacientes.map((item) => (item.id === p.id ? { ...item, estado: "finalizado" } : item))
    );
    toast.success(`Atención concluida para ${p.nombre}.`);
  };

  const handleCrearAdmision = () => {
    if (!nuevoNombre.trim() || !nuevaCedula.trim()) {
      toast.error("Por favor complete el nombre y la cédula/NSS.");
      return;
    }

    const letraTicket = nuevoServicio.includes("Urgencias") ? "U" : nuevoServicio.includes("Cardio") ? "A" : nuevoServicio.includes("Pedia") ? "B" : "C";
    const numTicket = `${letraTicket}-${Math.floor(10 + Math.random() * 89)}`;

    const nuevo: PacienteEspera = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      ticket: numTicket,
      nombre: nuevoNombre,
      cedula_nss: nuevaCedula,
      tipo_cobertura: nuevaCobertura,
      servicio_destino: nuevoServicio,
      medico_asignado: nuevoTutor,
      equipo_docente:
        tipoCentro === "hospital_universitario"
          ? {
              tutor: nuevoTutor,
              residente: nuevoResidente,
              rotacion: nuevoServicio,
            }
          : undefined,
      sala_espera: nuevaSala,
      hora_llegada: new Date().toISOString(),
      estado: "en_espera",
      monto_copago_dop: parseFloat(nuevoCopago) || 0,
      pagado: nuevoPagado,
      prioridad: nuevoServicio.includes("Urgencias") ? "urgente" : "normal",
    };

    setPacientes([nuevo, ...pacientes]);
    toast.success(`Ticket generado: ${nuevo.ticket}`, {
      description: `Paciente admitido en ${nuevo.sala_espera}. Copago DOP $${nuevo.monto_copago_dop.toLocaleString()}`,
    });

    setNuevoNombre("");
    setNuevaCedula("");
    setModalNuevoOpen(false);
  };

  // Filtrado de pacientes
  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      const matchBusqueda =
        p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.cedula_nss.includes(busqueda) ||
        p.ticket.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.servicio_destino.toLowerCase().includes(busqueda.toLowerCase());

      const matchSala = filtroSala === "todas" ? true : p.sala_espera === filtroSala;
      return matchBusqueda && matchSala;
    });
  }, [pacientes, busqueda, filtroSala]);

  const enEsperaCount = pacientes.filter((p) => p.estado === "en_espera" || p.estado === "llamado").length;
  const enConsultaCount = pacientes.filter((p) => p.estado === "en_consulta").length;
  const recaudacionCopagos = pacientes
    .filter((p) => p.pagado)
    .reduce((acc, curr) => acc + curr.monto_copago_dop, 0);

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Recepción, Admisión & Flujo de Pacientes"
        subtitle="Gestión de llegadas, validación de seguros ARS, turnos y derivación configurable por tipo de institución médica"
        icon={Building2}
        badge={cfg.badge}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de Tipo de Centro Médico */}
            <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/80">
              <span className="text-xs font-semibold px-2 text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Tipo de Centro:
              </span>
              <Select value={tipoCentro} onValueChange={(val: TipoCentroMedico) => setTipoCentro(val)}>
                <SelectTrigger className="h-8 text-xs font-medium w-48 sm:w-60 bg-background border-none shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultorio_individual">🩺 Consultorio Privado</SelectItem>
                  <SelectItem value="policlinica_ambulatoria">🏥 Policlínica Ambulatoria</SelectItem>
                  <SelectItem value="hospital_universitario">🏛️ Hospital Universitario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button size="sm" onClick={() => setModalNuevoOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nueva Admisión / Ticket
            </Button>
          </div>
        }
      />

      {/* Banner de Contexto Operativo según el tipo de Centro */}
      <div className="p-3.5 rounded-2xl border border-teal-500/20 bg-teal-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
        <div>
          <span className="font-semibold text-teal-800 dark:text-teal-300 mr-2">Configuración activa:</span>
          <span className="font-medium text-foreground">{cfg.nombre}.</span>
          <span className="text-muted-foreground ml-1.5">{cfg.desc}</span>
        </div>
        <Badge variant="outline" className="border-teal-500/40 text-teal-700 dark:text-teal-300">
          {tipoCentro === "hospital_universitario" ? "Cátedras & Residentes Habilitados" : tipoCentro === "policlinica_ambulatoria" ? "Múltiples Especialidades" : "Atención Personalizada Directa"}
        </Badge>
      </div>

      {/* KPIs de Recepción */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Pacientes en Antesala / Espera"
          value={enEsperaCount}
          subtitle="Tickets activos en salas de espera"
          icon={Clock}
          variant="amber"
          alert={enEsperaCount > 5}
        />
        <ClinicalKpiCard
          title="En Consulta Activa"
          value={enConsultaCount}
          subtitle="Atención médica en progreso"
          icon={Stethoscope}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Copagos Recaudados Hoy"
          value={`RD$ ${recaudacionCopagos.toLocaleString()}`}
          subtitle="Cobros directos en caja de recepción"
          icon={CreditCard}
          variant="teal"
        />
        <ClinicalKpiCard
          title={tipoCentro === "hospital_universitario" ? "Docencia Activa" : "Validaciones ARS"}
          value={tipoCentro === "hospital_universitario" ? "3 Equipos" : "96% Ok"}
          subtitle={tipoCentro === "hospital_universitario" ? "Tutores + Residentes de guardia" : "Senasa, Primera, Mapfre, Humano"}
          icon={tipoCentro === "hospital_universitario" ? GraduationCap : ShieldCheck}
          variant="purple"
        />
      </div>

      {/* Navegación y Filtros */}
      <Tabs value={tabActual} onValueChange={setTabActual} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="cola" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              Cola de Pacientes ({pacientesFiltrados.length})
            </TabsTrigger>
            <TabsTrigger value="pantalla" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <Volume2 className="h-4 w-4" />
              Pantalla de Llamado
            </TabsTrigger>
            <TabsTrigger value="docencia" className="flex items-center gap-1.5 text-xs sm:text-sm">
              <GraduationCap className="h-4 w-4" />
              {tipoCentro === "hospital_universitario" ? "Cátedras / Residentes" : "Consultorios"}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, ticket, cédula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            {cfg.salas.length > 1 && (
              <Select value={filtroSala} onValueChange={setFiltroSala}>
                <SelectTrigger className="w-40 h-9 text-xs">
                  <SelectValue placeholder="Todas las salas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las Salas</SelectItem>
                  {cfg.salas.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Tab 1: Cola de Admisión y Recepción */}
        <TabsContent value="cola" className="space-y-3">
          {pacientesFiltrados.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="font-medium">No hay pacientes esperando en este momento.</p>
                <p className="text-xs">Todos los turnos han sido atendidos o no coinciden con la búsqueda.</p>
              </CardContent>
            </Card>
          ) : (
            pacientesFiltrados.map((p) => {
              const mins = differenceInMinutes(new Date(), new Date(p.hora_llegada));
              return (
                <Card
                  key={p.id}
                  className={`transition-all hover:shadow-sm ${
                    p.estado === "llamado"
                      ? "border-amber-500/60 bg-amber-500/5 animate-pulse"
                      : p.estado === "en_consulta"
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : p.prioridad === "urgente"
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-border/80"
                  }`}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold font-mono px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                          {p.ticket}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-base">{p.nombre}</span>
                            <Badge variant="outline" className="text-[11px] font-mono">
                              {p.cedula_nss}
                            </Badge>
                            {p.prioridad === "urgente" && (
                              <Badge className="bg-red-600 text-white text-[10px]">STAT / Urgente</Badge>
                            )}
                            {p.prioridad === "preferencial" && (
                              <Badge className="bg-purple-600 text-white text-[10px]">Preferencial</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Destino: <strong className="text-foreground">{p.servicio_destino}</strong> · Llegada:{" "}
                            {format(new Date(p.hora_llegada), "hh:mm a")} ({mins} min de espera)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            p.tipo_cobertura === "senasa"
                              ? "border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/10 uppercase"
                              : p.tipo_cobertura === "privado"
                              ? "border-slate-500/40 text-slate-700 dark:text-slate-300 uppercase"
                              : "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 uppercase"
                          }
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {p.tipo_cobertura.replace("_", " ")}
                        </Badge>
                        <Badge
                          className={
                            p.pagado
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-700 border-amber-500/30"
                          }
                        >
                          {p.pagado ? `Copago Pagado: RD$ ${p.monto_copago_dop}` : `Pendiente Caja: RD$ ${p.monto_copago_dop}`}
                        </Badge>
                      </div>
                    </div>

                    {/* Detalle de Asignación Docente o Consultorio según el perfil */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-xl text-xs">
                      <div>
                        <span className="text-muted-foreground">Ubicación Actual:</span>{" "}
                        <strong className="text-foreground">{p.sala_espera}</strong>
                      </div>

                      {tipoCentro === "hospital_universitario" && p.equipo_docente ? (
                        <div className="md:col-span-2 flex flex-wrap gap-x-4 gap-y-1">
                          <span>
                            <GraduationCap className="h-3.5 w-3.5 inline mr-1 text-purple-600" />
                            <strong>Tutor:</strong> {p.equipo_docente.tutor}
                          </span>
                          <span>
                            <strong>Residente asignado:</strong> {p.equipo_docente.residente}
                          </span>
                        </div>
                      ) : (
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Médico tratante:</span>{" "}
                          <strong className="text-foreground">{p.medico_asignado || "Consultorio Asignado"}</strong>
                        </div>
                      )}
                    </div>

                    {/* Acciones de Operación de Recepción */}
                    <div className="flex justify-between items-center pt-1 border-t border-border/40">
                      <div className="text-xs text-muted-foreground font-mono">
                        Estado: <strong className="uppercase">{p.estado.replace("_", " ")}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.prioridad === "urgente" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs border-rose-500/40 text-rose-600 hover:bg-rose-500/10" asChild>
                            <Link to="/urgencias-triage">
                              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                              Derivar a Triage
                            </Link>
                          </Button>
                        )}
                        {p.estado === "en_espera" && (
                          <Button size="sm" variant="default" className="h-8 text-xs" onClick={() => handleLlamarPaciente(p)}>
                            <Volume2 className="h-3.5 w-3.5 mr-1" />
                            Llamar Pantalla
                          </Button>
                        )}
                        {p.estado === "llamado" && (
                          <Button size="sm" variant="default" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleIngresarConsulta(p)}>
                            <Stethoscope className="h-3.5 w-3.5 mr-1" />
                            Ingresar a Consulta
                          </Button>
                        )}
                        {p.estado === "en_consulta" && (
                          <Button size="sm" variant="outline" className="h-8 text-xs border-emerald-500/40 text-emerald-600" onClick={() => handleFinalizar(p)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Completar Atención
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Tab 2: Pantalla de Llamado en Sala (Totem / Display) */}
        <TabsContent value="pantalla" className="space-y-4">
          <Card className="border-border/80 bg-slate-950 text-white dark:bg-slate-900 rounded-2xl p-6">
            <div className="text-center space-y-2 mb-6">
              <p className="text-xs tracking-widest uppercase text-muted-foreground font-mono">Pantalla de Turnos en Vivo</p>
              <h2 className="text-2xl font-bold tracking-tight">Llamado a Consultorios & Servicios</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pacientes
                .filter((p) => p.estado === "llamado" || p.estado === "en_consulta")
                .slice(0, 4)
                .map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border text-center space-y-2 ${
                      p.estado === "llamado" ? "border-amber-500 bg-amber-500/10 animate-pulse" : "border-emerald-500/40 bg-emerald-500/5"
                    }`}
                  >
                    <span className="text-4xl font-extrabold font-mono text-primary tracking-wider">{p.ticket}</span>
                    <p className="text-lg font-semibold text-white">{p.nombre}</p>
                    <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                      {p.servicio_destino}
                    </Badge>
                    <p className="text-xs text-slate-400">
                      {p.medico_asignado} · {p.sala_espera}
                    </p>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Cátedras / Consultorios */}
        <TabsContent value="docencia" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                {tipoCentro === "hospital_universitario" ? "Distribución de Cátedras & Docencia Médica" : "Consultorios & Médicos en Servicio"}
              </CardTitle>
              <CardDescription>
                {tipoCentro === "hospital_universitario"
                  ? "Asignación de pacientes ambulatorios a médicos tratantes titulares y residentes supervisados para cumplimiento de residencia médica."
                  : "Estado de disponibilidad de consultorios y especialistas activos en la jornada."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border/80 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs">Cátedra de Cardiología</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Activo</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Tutor: Dr. Ramón Peralta</p>
                  <p className="text-xs text-muted-foreground">Residente: Dra. Laura De León (R2)</p>
                  <p className="text-xs font-mono font-medium">Pacientes asignados: 4</p>
                </div>

                <div className="p-3 rounded-xl border border-border/80 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs">Cátedra de Pediatría</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Activo</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Tutor: Dra. Sofía Valenzuela</p>
                  <p className="text-xs text-muted-foreground">Residente: Dr. Marcos Peña (R1)</p>
                  <p className="text-xs font-mono font-medium">Pacientes asignados: 3</p>
                </div>

                <div className="p-3 rounded-xl border border-border/80 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs">Cátedra de Endocrinología</span>
                    <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px]">Activo</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Tutor: Dr. Miguel Rosario</p>
                  <p className="text-xs text-muted-foreground">Residente: Dra. Carla Ortiz (R3)</p>
                  <p className="text-xs font-mono font-medium">Pacientes asignados: 2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Nueva Admisión */}
      <Dialog open={modalNuevoOpen} onOpenChange={setModalNuevoOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <UserCheck className="h-5 w-5 text-teal-600" />
              Nueva Admisión / Ticket de Recepción
            </DialogTitle>
            <DialogDescription>
              Emisión de turno para atención médica según el modelo del centro: {cfg.nombre}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Nombre Completo del Paciente *</Label>
                <Input
                  placeholder="Ej: Carmen Altagracia Núñez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cédula o NSS *</Label>
                <Input
                  placeholder="001-XXXXXXX-X"
                  value={nuevaCedula}
                  onChange={(e) => setNuevaCedula(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Servicio / Especialidad Destino</Label>
                <Select value={nuevoServicio} onValueChange={setNuevoServicio}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cardiología Clínica">Cardiología Clínica</SelectItem>
                    <SelectItem value="Endocrinología & Diabetes">Endocrinología & Diabetes</SelectItem>
                    <SelectItem value="Pediatría & Puericultura">Pediatría & Puericultura</SelectItem>
                    <SelectItem value="Medicina General">Medicina General</SelectItem>
                    <SelectItem value="Urgencias / Triage Manchester">Urgencias / Triage Manchester</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Aseguradora (ARS) / Cobertura</Label>
                <Select value={nuevaCobertura} onValueChange={(val: any) => setNuevaCobertura(val)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="senasa">SeNaSa (Contributivo / Subsidiado)</SelectItem>
                    <SelectItem value="primera_ars">Primera ARS</SelectItem>
                    <SelectItem value="mapfre">Mapfre Salud ARS</SelectItem>
                    <SelectItem value="universal">ARS Universal</SelectItem>
                    <SelectItem value="humano">Humano Seguros</SelectItem>
                    <SelectItem value="privado">Privado / Sin Seguro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Monto Copago (RD$)</Label>
                <Input
                  type="number"
                  value={nuevoCopago}
                  onChange={(e) => setNuevoCopago(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sala de Espera</Label>
                <Select value={nuevaSala} onValueChange={setNuevaSala}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cfg.salas.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tipoCentro === "hospital_universitario" && (
              <div className="p-2.5 rounded-xl border bg-muted/30 space-y-2">
                <Label className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" /> Asignación Académica / Cátedra
                </Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Médico Tutor</Label>
                    <Input value={nuevoTutor} onChange={(e) => setNuevoTutor(e.target.value)} className="h-7 text-xs" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Médico Residente</Label>
                    <Input value={nuevoResidente} onChange={(e) => setNuevoResidente(e.target.value)} className="h-7 text-xs" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalNuevoOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearAdmision}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Emitir Ticket & Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
