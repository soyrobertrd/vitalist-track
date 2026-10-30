import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  FileText,
  Users,
  Plus,
  Stethoscope,
  HeartHandshake,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  Copy,
  Search,
  Filter,
  ShieldCheck,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MiembroEquipo {
  id: string;
  nombre: string;
  rol: string; // ej: "Médico Internista", "Enfermería", "Nutrición", "Fisioterapia"
}

interface NotaMedica {
  id: string;
  paciente_id: string;
  paciente_nombre: string;
  fecha: string;
  tipo_nota: "individual" | "multidisciplinaria";
  titulo: string;
  servicio: string;
  profesional_principal: string;
  equipo_multidisciplinario?: string[];
  subjetivo: string;
  objetivo: string;
  analisis: string;
  plan: string;
  escalas_asociadas?: string;
  diagnosticos_cie10?: string;
  estado: "borrador" | "firmada";
}

const SERVICIOS_CLINICOS = [
  "Medicina Interna",
  "Cirugía General",
  "Cuidados Intensivos (UCI)",
  "Enfermería Hospitalaria",
  "Pediatría & Neonatología",
  "Rehabilitación & Fisioterapia",
  "Nutrición Clínica",
  "Psicología & Psiquiatría",
  "Ginecología & Obstetricia",
  "Cardiología",
];

const ROLES_DISCIPLINAS = [
  "Médico Tratante / Especialista",
  "Enfermero/a Jefe de Piso",
  "Nutricionista Clínico",
  "Fisioterapeuta / Kinesiólogo",
  "Psicólogo/a Clínico",
  "Trabajador/a Social",
  "Farmacéutico/a Clínico",
];

export default function NotasMedicas() {
  const { currentWorkspace } = useWorkspace();
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<string>("todas");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [notaExpandida, setNotaExpandida] = useState<string | null>(null);

  // Formulario de nueva nota
  const [form, setForm] = useState({
    paciente_id: "",
    tipo_nota: "individual" as "individual" | "multidisciplinaria",
    titulo: "Evolución Médica Diaria",
    servicio: "Medicina Interna",
    profesional_principal: "",
    equipo_multidisciplinario: [] as string[],
    subjetivo: "",
    objetivo: "",
    analisis: "",
    plan: "",
    escalas_asociadas: "",
    diagnosticos_cie10: "",
  });

  // Mock semilla de notas
  const [notas, setNotas] = useState<NotaMedica[]>([
    {
      id: "nota-1",
      paciente_id: "p-1",
      paciente_nombre: "María Altagracia Pérez",
      fecha: new Date(Date.now() - 3600000 * 3).toISOString(),
      tipo_nota: "multidisciplinaria",
      titulo: "Junta de Egreso y Plan Terapéutico Multidisciplinario",
      servicio: "Medicina Interna",
      profesional_principal: "Dr. Carlos Mendoza (Medicina Interna)",
      equipo_multidisciplinario: [
        "Dr. Carlos Mendoza (Medicina Interna)",
        "Lic. Ana Reyes (Enfermera Especialista)",
        "Lic. Marcos Duval (Nutrición Clínica)",
        "Dra. Laura Peña (Fisioterapia & Rehabilitación)",
      ],
      subjetivo: "Paciente refiere notable mejoría clínica, tolerancia oral adecuada y deambulación con mínima fatiga.",
      objetivo: "TA 120/75 mmHg, FC 74 lpm, SatO2 98% aire ambiente. Sin soplos ni ruidos agregados. Abdomen blando no doloroso.",
      analisis: "Evolución favorable de neumonía adquirida en la comunidad tratada. Afebril en las últimas 48 horas.",
      plan: "1. Alta hospitalaria con antibióticoterapia oral por 5 días.\n2. Dieta normosódica recomendada por nutrición.\n3. Protocolo de fisioterapia respiratoria ambulatoria.",
      escalas_asociadas: "Glasgow: 15/15 | Barthel: 95/100 | NEWS2: 0 pts",
      diagnosticos_cie10: "J18.9 Neumonía no especificada | I10 Hipertensión esencial",
      estado: "firmada",
    },
    {
      id: "nota-2",
      paciente_id: "p-2",
      paciente_nombre: "Juan Antonio Morales",
      fecha: new Date(Date.now() - 3600000 * 8).toISOString(),
      tipo_nota: "individual",
      titulo: "Evolución Postoperatoria 24h",
      servicio: "Cirugía General",
      profesional_principal: "Dr. Roberto Santos (Cirugía)",
      subjetivo: "Paciente lúcido, refiere dolor quirúrgico leve controlado con analgesia reglada.",
      objetivo: "Herida quirúrgica limpia sin signos de sangrado ni secreción. Drenaje serohemático escaso (30 ml). Ruidos hidroaéreos presentes.",
      analisis: "Postoperatorio mediato de apendicectomía laparoscópica con adecuada respuesta y tránsito intestinal.",
      plan: "Iniciar tolerancia líquida, deambulación temprana asistida y retiro de analgesia parenteral a VO.",
      escalas_asociadas: "EVA Dolor: 3/10 | Braden: 17/23",
      diagnosticos_cie10: "K35.80 Apendicitis aguda",
      estado: "firmada",
    },
  ]);

  useEffect(() => {
    if (!currentWorkspace) return;
    Promise.all([
      supabase.from("pacientes").select("id, nombre, apellido").eq("workspace_id", currentWorkspace.id).eq("status_px", "activo").order("nombre"),
      supabase.from("personal_salud").select("id, nombre, apellido, especialidad").eq("workspace_id", currentWorkspace.id).order("nombre"),
    ]).then(([p, prof]) => {
      if (p.data && p.data.length > 0) {
        setPacientes(p.data);
        setForm(f => ({ ...f, paciente_id: p.data[0].id }));
      } else {
        setPacientes([
          { id: "p-1", nombre: "María Altagracia", apellido: "Pérez" },
          { id: "p-2", nombre: "Juan Antonio", apellido: "Morales" },
          { id: "p-3", nombre: "Elena", apellido: "Gómez" },
        ]);
        setForm(f => ({ ...f, paciente_id: "p-1" }));
      }

      if (prof.data && prof.data.length > 0) {
        setProfesionales(prof.data);
        setForm(f => ({ ...f, profesional_principal: `Dr(a). ${prof.data[0].nombre} ${prof.data[0].apellido}` }));
      } else {
        setProfesionales([
          { id: "prof-1", nombre: "Carlos", apellido: "Mendoza", especialidad: "Medicina Interna" },
          { id: "prof-2", nombre: "Ana", apellido: "Reyes", especialidad: "Enfermería" },
          { id: "prof-3", nombre: "Roberto", apellido: "Santos", especialidad: "Cirugía General" },
          { id: "prof-4", nombre: "Marcos", apellido: "Duval", especialidad: "Nutrición Clínica" },
        ]);
        setForm(f => ({ ...f, profesional_principal: "Dr. Carlos Mendoza" }));
      }
    });
  }, [currentWorkspace]);

  // Manejo de agregar integrante al equipo multidisciplinario
  const toggleMiembroEquipo = (miembro: string) => {
    setForm(f => {
      const existe = f.equipo_multidisciplinario.includes(miembro);
      return {
        ...f,
        equipo_multidisciplinario: existe
          ? f.equipo_multidisciplinario.filter(m => m !== miembro)
          : [...f.equipo_multidisciplinario, miembro],
      };
    });
  };

  // Guardar nota médica
  const handleGuardarNota = (firmarDirecto: boolean = true) => {
    if (!form.paciente_id || !form.subjetivo || !form.plan) {
      toast.error("Por favor completa los campos clínicos requeridos (Paciente, Subjetivo y Plan)");
      return;
    }

    const pacienteObj = pacientes.find(p => p.id === form.paciente_id);
    const nombrePx = pacienteObj ? `${pacienteObj.nombre} ${pacienteObj.apellido}` : "Paciente no especificado";

    const nuevaNota: NotaMedica = {
      id: `nota-${Date.now()}`,
      paciente_id: form.paciente_id,
      paciente_nombre: nombrePx,
      fecha: new Date().toISOString(),
      tipo_nota: form.tipo_nota,
      titulo: form.titulo,
      servicio: form.servicio,
      profesional_principal: form.profesional_principal,
      equipo_multidisciplinario: form.tipo_nota === "multidisciplinaria" ? form.equipo_multidisciplinario : undefined,
      subjetivo: form.subjetivo,
      objetivo: form.objetivo,
      analisis: form.analisis,
      plan: form.plan,
      escalas_asociadas: form.escalas_asociadas || undefined,
      diagnosticos_cie10: form.diagnosticos_cie10 || undefined,
      estado: firmarDirecto ? "firmada" : "borrador",
    };

    setNotas([nuevaNota, ...notas]);
    toast.success(firmarDirecto ? "Nota médica firmada y guardada en expediente" : "Nota médica guardada como borrador");
    setModalOpen(false);
    // Reset
    setForm(f => ({
      ...f,
      subjetivo: "",
      objetivo: "",
      analisis: "",
      plan: "",
      escalas_asociadas: "",
      diagnosticos_cie10: "",
      equipo_multidisciplinario: [],
    }));
  };

  // Filtrado de notas
  const notasFiltradas = notas.filter(n => {
    if (filtroTipo === "multidisciplinaria" && n.tipo_nota !== "multidisciplinaria") return false;
    if (filtroTipo === "individual" && n.tipo_nota !== "individual") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        n.paciente_nombre.toLowerCase().includes(q) ||
        n.titulo.toLowerCase().includes(q) ||
        n.profesional_principal.toLowerCase().includes(q) ||
        n.servicio.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // KPIs
  const totalNotas = notas.length;
  const multiNotas = notas.filter(n => n.tipo_nota === "multidisciplinaria").length;
  const notasFirmadas = notas.filter(n => n.estado === "firmada").length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Notas Médicas & Equipo Multidisciplinario"
        subtitle="Registro de evoluciones SOAP individuales, pases de guardia y juntas médicas interdisciplinarias"
        icon={FileText}
        badge="Expediente Clínico Electrónico"
        action={
          <div className="flex items-center gap-2">
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-none">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Nota Médica
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border-border/80">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-teal-600" />
                    <span>Redactar Nota Clínica / Evolución</span>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Selector de Modalidad */}
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-muted/40 rounded-2xl border border-border/70">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo_nota: "individual" }))}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                        form.tipo_nota === "individual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Stethoscope className="h-4 w-4" />
                      Profesional Individual
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo_nota: "multidisciplinaria" }))}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                        form.tipo_nota === "multidisciplinaria" ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Equipo Multidisciplinario / Junta
                    </button>
                  </div>

                  {/* Metadatos de la Nota */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Paciente *</Label>
                      <Select value={form.paciente_id} onValueChange={v => setForm(f => ({ ...f, paciente_id: v }))}>
                        <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {pacientes.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre} {p.apellido}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Servicio / Especialidad</Label>
                      <Select value={form.servicio} onValueChange={v => setForm(f => ({ ...f, servicio: v }))}>
                        <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {SERVICIOS_CLINICOS.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Título o Tipo de Nota</Label>
                      <Input
                        className="rounded-xl mt-1"
                        value={form.titulo}
                        onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                        placeholder="Ej: Evolución Diaria, Pase de Guardia"
                      />
                    </div>
                  </div>

                  {/* Profesional Principal / Responsable */}
                  <div>
                    <Label className="text-xs font-semibold">Médico / Profesional Responsable</Label>
                    <Input
                      className="rounded-xl mt-1"
                      value={form.profesional_principal}
                      onChange={e => setForm(f => ({ ...f, profesional_principal: e.target.value }))}
                      placeholder="Dr(a). Nombre y Especialidad"
                    />
                  </div>

                  {/* Selección de Equipo Multidisciplinario si aplica */}
                  {form.tipo_nota === "multidisciplinaria" && (
                    <div className="p-3.5 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                      <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Disciplinas Médicas Participantes en la Atención
                      </Label>
                      <p className="text-[11px] text-muted-foreground">
                        Selecciona los roles y profesionales que integraron la junta médica o pase multidisciplinario:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ROLES_DISCIPLINAS.map(rol => {
                          const seleccionado = form.equipo_multidisciplinario.includes(rol);
                          return (
                            <Button
                              key={rol}
                              type="button"
                              size="sm"
                              variant={seleccionado ? "default" : "outline"}
                              className="rounded-xl text-xs h-7 px-2.5 font-normal"
                              onClick={() => toggleMiembroEquipo(rol)}
                            >
                              {seleccionado ? "✓ " : "+ "}
                              {rol}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Estructura SOAP */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <Label className="text-xs font-semibold flex items-center justify-between">
                        <span>S — Subjetivo (Síntomas referidos por el paciente) *</span>
                        <span className="text-[10px] text-muted-foreground">Motivo, dolor, cambios reportados</span>
                      </Label>
                      <Textarea
                        className="rounded-xl mt-1 resize-none"
                        rows={2}
                        placeholder="Paciente refiere..."
                        value={form.subjetivo}
                        onChange={e => setForm(f => ({ ...f, subjetivo: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold flex items-center justify-between">
                        <span>O — Objetivo (Exploración física, Signos vitales & Escalas)</span>
                        <span className="text-[10px] text-muted-foreground">TA, FC, SpO2, hallazgos clínicos</span>
                      </Label>
                      <Textarea
                        className="rounded-xl mt-1 resize-none"
                        rows={2}
                        placeholder="Signos vitales estables, examen por sistemas..."
                        value={form.objetivo}
                        onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">Escalas Médicas Aplicadas (Opcional)</Label>
                        <Input
                          className="rounded-xl mt-1"
                          placeholder="Ej: Glasgow: 15/15 | Braden: 18/23 | EVA: 2/10"
                          value={form.escalas_asociadas}
                          onChange={e => setForm(f => ({ ...f, escalas_asociadas: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Diagnósticos Asociados (CIE-10)</Label>
                        <Input
                          className="rounded-xl mt-1"
                          placeholder="Ej: J18.9 Neumonía, I10 HTA"
                          value={form.diagnosticos_cie10}
                          onChange={e => setForm(f => ({ ...f, diagnosticos_cie10: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold flex items-center justify-between">
                        <span>A — Análisis & Juicio Clínico</span>
                        <span className="text-[10px] text-muted-foreground">Diagnóstico diferencial, evolución patológica</span>
                      </Label>
                      <Textarea
                        className="rounded-xl mt-1 resize-none"
                        rows={2}
                        placeholder="Paciente con adecuada respuesta terapéutica..."
                        value={form.analisis}
                        onChange={e => setForm(f => ({ ...f, analisis: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold flex items-center justify-between">
                        <span>P — Plan Terapéutico & Conducta Médica *</span>
                        <span className="text-[10px] text-muted-foreground">Fármacos, dieta, cuidados, interconsultas</span>
                      </Label>
                      <Textarea
                        className="rounded-xl mt-1 resize-none"
                        rows={2}
                        placeholder="1. Continuar antibiótico...\n2. Control de enfermería cada 4h..."
                        value={form.plan}
                        onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-3 gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => handleGuardarNota(false)}>
                    Guardar como Borrador
                  </Button>
                  <Button className="rounded-xl shadow-none" onClick={() => handleGuardarNota(true)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Firmar y Guardar Nota
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Total Notas Médicas"
          value={totalNotas}
          subtitle="En expediente clínico"
          icon={FileText}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Juntas Multidisciplinarias"
          value={multiNotas}
          subtitle="Atención de equipo interdisciplinario"
          icon={Users}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Notas en Firme"
          value={notasFirmadas}
          subtitle="Con firma médica digital"
          icon={ShieldCheck}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Servicios Activos"
          value="10"
          subtitle="Especialidades hospitalarias"
          icon={Layers}
          variant="purple"
        />
      </div>

      {/* Filtros de Lista */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9 rounded-xl border-border/80"
            placeholder="Buscar por paciente, profesional o servicio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px] rounded-xl border-border/80 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas">Todas las notas</SelectItem>
              <SelectItem value="multidisciplinaria">Solo Multidisciplinarias</SelectItem>
              <SelectItem value="individual">Solo Individuales</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de Notas Clínicas */}
      <div className="space-y-4">
        {notasFiltradas.length === 0 ? (
          <Card className="rounded-2xl border-border/80 shadow-none">
            <CardContent className="py-12 text-center text-muted-foreground space-y-2">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p className="font-semibold text-foreground">No se encontraron notas médicas registradas</p>
              <p className="text-xs">Haz clic en "+ Nueva Nota Médica" para crear la primera evolución clínica.</p>
            </CardContent>
          </Card>
        ) : (
          notasFiltradas.map(n => {
            const isExpanded = notaExpandida === n.id;
            return (
              <Card
                key={n.id}
                className="rounded-2xl border-border/80 shadow-none hover:border-primary/40 transition-all bg-card overflow-hidden"
              >
                <CardHeader className="p-4 sm:p-5 bg-muted/20 border-b border-border/60">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-foreground">{n.titulo}</span>
                        {n.tipo_nota === "multidisciplinaria" ? (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-full text-[10px] font-semibold border-0 gap-1">
                            <Users className="h-3 w-3" />
                            Equipo Multidisciplinario
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-full text-[10px]">
                            Individual
                          </Badge>
                        )}
                        <Badge
                          variant={n.estado === "firmada" ? "default" : "secondary"}
                          className="rounded-full text-[10px]"
                        >
                          {n.estado === "firmada" ? "Firmada en Firme" : "Borrador"}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Paciente: {n.paciente_nombre}</span>
                        <span>•</span>
                        <span>Servicio: {n.servicio}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(n.fecha), "dd/MM/yyyy HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl h-8 text-xs gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${n.titulo} - ${n.paciente_nombre}\nSubjetivo: ${n.subjetivo}\nObjetivo: ${n.objetivo}\nAnálisis: ${n.analisis}\nPlan: ${n.plan}`
                          );
                          toast.success("Nota médica copiada al portapapeles");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 text-xs"
                        onClick={() => setNotaExpandida(isExpanded ? null : n.id)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="h-3.5 w-3.5 mr-1" />
                            Colapsar
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3.5 w-3.5 mr-1" />
                            Ver SOAP
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Integrantes del equipo multidisciplinario si los tiene */}
                  {n.equipo_multidisciplinario && n.equipo_multidisciplinario.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-muted-foreground mr-1">Equipo médico:</span>
                      {n.equipo_multidisciplinario.map((m, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center text-[10px] bg-background px-2 py-0.5 rounded-lg border border-border/80 text-foreground font-medium"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </CardHeader>

                {/* Contenido SOAP */}
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-muted/20 rounded-xl border border-border/60 space-y-1">
                      <span className="font-bold text-primary block">S — SUBJETIVO</span>
                      <p className="text-muted-foreground leading-relaxed">{n.subjetivo}</p>
                    </div>

                    <div className="p-3 bg-muted/20 rounded-xl border border-border/60 space-y-1">
                      <span className="font-bold text-primary block">O — OBJETIVO</span>
                      <p className="text-muted-foreground leading-relaxed">{n.objetivo || "Sin hallazgos específicos."}</p>
                    </div>
                  </div>

                  {/* Escalas asociadas y diagnósticos */}
                  {(n.escalas_asociadas || n.diagnosticos_cie10) && (
                    <div className="flex flex-wrap gap-2 text-xs pt-1">
                      {n.escalas_asociadas && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-300">
                          <Activity className="h-3.5 w-3.5" />
                          <span className="font-semibold">Escalas:</span> {n.escalas_asociadas}
                        </div>
                      )}
                      {n.diagnosticos_cie10 && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted border border-border/80 text-foreground">
                          <span className="font-semibold">CIE-10:</span> {n.diagnosticos_cie10}
                        </div>
                      )}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-border/60">
                      <div className="p-3 bg-muted/20 rounded-xl border border-border/60 space-y-1">
                        <span className="font-bold text-primary block">A — ANÁLISIS CLÍNICO</span>
                        <p className="text-muted-foreground leading-relaxed">{n.analisis || "Evolución acorde al plan."}</p>
                      </div>

                      <div className="p-3 bg-muted/20 rounded-xl border border-border/60 space-y-1">
                        <span className="font-bold text-emerald-600 block">P — PLAN & CONDUCTA</span>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{n.plan}</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
                    <span className="font-semibold text-foreground">
                      Firma: {n.profesional_principal}
                    </span>
                    <span className="font-mono text-[10px]">ID: {n.id}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
