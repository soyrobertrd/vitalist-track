import {
  Activity,
  CircleDot,
  Sparkles,
  BedDouble,
  Eye,
  Brain,
  PawPrint,
  Dumbbell,
  Apple,
  HeartHandshake,
  Baby,
  SmilePlus,
  Stethoscope,
  Building2,
  Syringe,
  FileText,
  Calendar,
  Users,
  Wrench,
  Utensils,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Zap,
  Camera,
  Heart,
  Scale,
  type LucideIcon,
} from "lucide-react";
import type { VerticalTipo } from "@/contexts/VerticalContext";
import type { PlanCodigo } from "@/config/sidebar-permissions";

export interface SubItemVertical {
  path: string;
  label: string;
  icon?: LucideIcon;
  badge?: string;
  /** Plan mínimo; sin valor = "solo" */
  minPlan?: PlanCodigo;
  adminOnly?: boolean;
}

export interface MenuVerticalConfig {
  id: VerticalTipo;
  titulo: string;
  subtitulo: string;
  icon: LucideIcon;
  colorClass: string;
  badgeColor: string;
  rootPath: string;
  items: SubItemVertical[];
}

export const MENUS_VERTICALES: Record<VerticalTipo, MenuVerticalConfig> = {
  fisioterapia: {
    id: "fisioterapia",
    titulo: "Fisioterapia & Rehab",
    subtitulo: "Kinesiología & Biomecánica",
    icon: Dumbbell,
    colorClass: "text-teal-600 dark:text-teal-400",
    badgeColor: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    rootPath: "/fisioterapia-pro",
    items: [
      { path: "/fisioterapia-pro", label: "Panel Fisioterapia Pro", icon: Dumbbell, minPlan: "free" },
      { path: "/fisioterapia-pro?tab=goniometria", label: "Goniometría & Daniels", icon: Activity },
      { path: "/fisioterapia-pro?tab=ejercicios_hep", label: "Ejercicios HEP Domicilio", icon: TrendingUp },
      { path: "/fisioterapia-pro?tab=puntos_gatillo", label: "Puntos Gatillo & Punción", icon: Zap },
      { path: "/fisioterapia-pro?tab=boxes_sesiones", label: "Boxes & Bonos de Terapia", icon: Building2, minPlan: "plus" },
      { path: "/fisioterapia-pro?tab=pacientes", label: "Pacientes en Fisioterapia", icon: Users, minPlan: "free" },
      { path: "/fisioterapia-pro?tab=citas", label: "Agenda & Sesiones", icon: Calendar, minPlan: "free" },
      { path: "/fisioterapia-pro?tab=terapeutas", label: "Fisioterapeutas & Staff", icon: Stethoscope, minPlan: "pro", adminOnly: true },
      { path: "/fisioterapia-pro?tab=facturacion", label: "Facturación & Split", icon: FileText, minPlan: "pro", adminOnly: true },
    ],
  },

  nutricion: {
    id: "nutricion",
    titulo: "Nutrición & Bariatría",
    subtitulo: "Metabolismo & Dietética",
    icon: Apple,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    rootPath: "/nutricion-pro",
    items: [
      { path: "/nutricion-pro", label: "Panel Nutricional Pro", icon: Apple, minPlan: "free" },
      { path: "/nutricion-pro?tab=bioimpedancia", label: "Bioimpedancia Segmental", icon: Scale },
      { path: "/nutricion-pro?tab=antropometria_isak", label: "Pliegues ISAK & Medidas", icon: Activity },
      { path: "/nutricion-pro?tab=planificador", label: "Minutas & Plan de Dietas", icon: Utensils },
      { path: "/nutricion-pro?tab=bariatria", label: "Protocolo Bariátrico (% EWL)", icon: Heart, minPlan: "pro" },
      { path: "/nutricion?tab=calculadora", label: "Calculadora Mifflin & Lorentz", icon: Calculator },
      { path: "/nutricion?tab=evaluaciones", label: "Censo de Evaluaciones", icon: Users, minPlan: "pro" },
      { path: "/nutricion?tab=dietas", label: "Dietas Hospitalarias Activas", icon: Utensils, minPlan: "pro" },
    ],
  },

  dental: {
    id: "dental",
    titulo: "Odontología Pro",
    subtitulo: "DentalCare & Ortodoncia",
    icon: CircleDot,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    badgeColor: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    rootPath: "/dental-care",
    items: [
      { path: "/dental-care", label: "Panel DentalCare Pro", icon: SmilePlus, minPlan: "free" },
      { path: "/odontograma", label: "Odontograma 2D / 3D", icon: CircleDot },
      { path: "/dental-care?tab=planes", label: "Planes de Tratamiento", icon: FileText },
      { path: "/dental-care?tab=ortodoncia", label: "Ortodoncia & Controles", icon: Sparkles },
      { path: "/dental-care?tab=presupuestos", label: "Presupuestos Sonrisa", icon: FileText },
      { path: "/dental-care?tab=sillones", label: "Sillones / Boxes Dentales", icon: Building2, minPlan: "plus" },
      { path: "/dental-care?tab=laboratorio", label: "Laboratorio & Prótesis", icon: Wrench, minPlan: "pro" },
      { path: "/dental-care?tab=pacientes", label: "Pacientes Dentales", icon: Users, minPlan: "free" },
      { path: "/dental-care?tab=citas", label: "Agenda Odontológica", icon: Calendar, minPlan: "free" },
    ],
  },

  aesthetic: {
    id: "aesthetic",
    titulo: "Aesthetic Pro & Spa",
    subtitulo: "Medicina Estética & Láser",
    icon: Sparkles,
    colorClass: "text-pink-600 dark:text-pink-400",
    badgeColor: "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
    rootPath: "/aesthetic-pro",
    items: [
      { path: "/aesthetic-pro", label: "Panel Estética & Spa", icon: Sparkles, minPlan: "free" },
      { path: "/aesthetic-pro?tab=evaluaciones", label: "Evaluaciones Estéticas", icon: FileText },
      { path: "/aesthetic-pro?tab=ficha_biotipo", label: "Ficha Cutánea & Bonos", icon: Sparkles },
      { path: "/aesthetic-pro?tab=mapa_facial", label: "Face Mapping / Toxina", icon: Syringe },
      { path: "/aesthetic-pro?tab=viales", label: "Trazabilidad de Viales", icon: Syringe, minPlan: "pro" },
      { path: "/aesthetic-pro?tab=fotos", label: "Fotos Evolución & Split", icon: Camera },
      { path: "/aesthetic-pro?tab=cabinas", label: "Cabinas & Aparatología", icon: Building2, minPlan: "plus" },
      { path: "/aesthetic-pro?tab=gift_cards", label: "Gift Cards & Membresías", icon: Heart, minPlan: "plus" },
    ],
  },

  veterinaria: {
    id: "veterinaria",
    titulo: "Hospital Veterinario",
    subtitulo: "Salud Animal & Mascotas",
    icon: PawPrint,
    colorClass: "text-amber-600 dark:text-amber-400",
    badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    rootPath: "/vet-care",
    items: [
      { path: "/vet-care", label: "Panel Hospital Veterinario", icon: PawPrint, minPlan: "free" },
      { path: "/vet-care?tab=mascotas", label: "Fichas de Mascotas & Tutores", icon: PawPrint, minPlan: "free" },
      { path: "/vet-care?tab=vacunas", label: "Calendario de Vacunación", icon: ShieldCheck, minPlan: "free" },
      { path: "/vet-care?tab=boxes", label: "Boxes, Jaulas & Aislamiento", icon: BedDouble, minPlan: "plus" },
      { path: "/vet-care?tab=hospitalizacion", label: "Hospitalización Animal", icon: Activity, minPlan: "plus" },
      { path: "/vet-care?tab=cirugia", label: "Quirófano Veterinario", icon: Stethoscope, minPlan: "plus" },
      { path: "/vet-care?tab=citas", label: "Citas & Guardias Vet", icon: Calendar, minPlan: "free" },
      { path: "/vet-care?tab=facturacion", label: "Facturación Veterinaria", icon: FileText, minPlan: "pro", adminOnly: true },
    ],
  },

  recovery: {
    id: "recovery",
    titulo: "Recovery Home",
    subtitulo: "Cuidado Postquirúrgico",
    icon: BedDouble,
    colorClass: "text-purple-600 dark:text-purple-400",
    badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    rootPath: "/recovery-care",
    items: [
      { path: "/recovery-care", label: "Panel Recovery Suites", icon: BedDouble, minPlan: "free" },
      { path: "/recovery-care?tab=habitaciones", label: "Habitaciones & Suites", icon: BedDouble, minPlan: "plus" },
      { path: "/recovery-care?tab=planes", label: "Planes Postquirúrgicos", icon: FileText },
      { path: "/recovery-care?tab=seguimiento", label: "Drenajes, Curaciones & Signos", icon: Heart },
      { path: "/recovery-care?tab=concierge", label: "Concierge Médico", icon: Users, minPlan: "pro" },
      { path: "/recovery-care?tab=alertas", label: "Alertas Clínicas Recovery", icon: Activity },
      { path: "/rutas", label: "Rutas & Visitas Domiciliarias", icon: Building2, minPlan: "plus" },
      { path: "/recovery-care?tab=reservas", label: "Reservas & Estancias", icon: Calendar, minPlan: "plus" },
    ],
  },

  vision: {
    id: "vision",
    titulo: "VisionCare / Óptica",
    subtitulo: "Optometría & Oftalmología",
    icon: Eye,
    colorClass: "text-indigo-600 dark:text-indigo-400",
    badgeColor: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    rootPath: "/vision-care",
    items: [
      { path: "/vision-care", label: "Panel Óptica & Oftalmo", icon: Eye, minPlan: "free" },
      { path: "/vision-care?tab=gabinete_refraccion", label: "Gabinete & Refracción", icon: Eye },
      { path: "/vision-care?tab=recetas", label: "Recetas Ópticas", icon: FileText, minPlan: "free" },
      { path: "/vision-care?tab=inventario", label: "Inventario & Monturas", icon: Boxes, minPlan: "plus" },
      { path: "/vision-care?tab=taller_biselado", label: "Taller & Biselado", icon: Wrench, minPlan: "pro" },
      { path: "/vision-care?tab=ordenes", label: "Órdenes de Laboratorio", icon: FileText, minPlan: "pro" },
      { path: "/vision-care?tab=combos", label: "Combos & Garantías", icon: ShieldCheck, minPlan: "pro" },
    ],
  },

  psicologia: {
    id: "psicologia",
    titulo: "Psicología & Salud Mental",
    subtitulo: "Psicoterapia & Psiquiatría",
    icon: Brain,
    colorClass: "text-purple-600 dark:text-purple-400",
    badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    rootPath: "/psicologia-pro",
    items: [
      { path: "/psicologia-pro", label: "Panel Psicológico Pro", icon: Brain, minPlan: "free" },
      { path: "/psicologia-pro?tab=fichas", label: "Fichas & Anamnesis", icon: FileText, minPlan: "free" },
      { path: "/psicologia-pro?tab=salas", label: "Salas de Consulta", icon: Building2, minPlan: "plus" },
      { path: "/psicologia-pro?tab=sesiones", label: "Sesiones & Notas", icon: Calendar, minPlan: "free" },
      { path: "/psicologia-pro?tab=evaluaciones", label: "Tests PHQ-9 / GAD-7", icon: Activity },
      { path: "/psicologia-pro?tab=psiquiatria", label: "Psiquiatría & Fármacos", icon: Stethoscope },
      { path: "/psicologia-pro?tab=tareas", label: "Tareas Terapéuticas", icon: Sparkles },
    ],
  },

  ginecologia: {
    id: "ginecologia",
    titulo: "Ginecología & Obstetricia",
    subtitulo: "Salud Femenina & Prenatal",
    icon: HeartHandshake,
    colorClass: "text-rose-600 dark:text-rose-400",
    badgeColor: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    rootPath: "/ginecologia-obstetricia",
    items: [
      { path: "/ginecologia-obstetricia", label: "Panel Obstetricia & Gine", icon: HeartHandshake, minPlan: "free" },
      { path: "/maternidad-neonatologia", label: "Maternidad & Neonatología", icon: Baby, minPlan: "pro" },
      { path: "/ordenes-medicas", label: "Órdenes & Ecografías", icon: FileText },
    ],
  },

  pediatria: {
    id: "pediatria",
    titulo: "Pediatría & Puericultura",
    subtitulo: "Crecimiento & Vacunas",
    icon: Baby,
    colorClass: "text-sky-600 dark:text-sky-400",
    badgeColor: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
    rootPath: "/pediatria",
    items: [
      { path: "/pediatria", label: "Panel Pediatría Integral", icon: Baby, minPlan: "free" },
      { path: "/alertas-clinicas", label: "Alertas Pediátricas", icon: Activity },
      { path: "/ordenes-medicas", label: "Órdenes & Recetas", icon: FileText },
    ],
  },

  clinica: {
    id: "clinica",
    titulo: "Hospital / Policlínica",
    subtitulo: "Servicios Centrales",
    icon: Activity,
    colorClass: "text-blue-600 dark:text-blue-400",
    badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    rootPath: "/app",
    items: [
      { path: "/centro-comando", label: "Centro de Comando 24/7", icon: Activity, minPlan: "business" },
      { path: "/urgencias-triage", label: "Urgencias & Triage MTS", icon: Activity, minPlan: "business" },
      { path: "/hospitalizacion", label: "Hospitalización", icon: BedDouble, minPlan: "business" },
      { path: "/censo-camas", label: "Censo & Mapa de Camas", icon: Building2, minPlan: "business" },
      { path: "/quirofano", label: "Quirófano / Cirugías", icon: Stethoscope, minPlan: "business" },
      { path: "/laboratorio", label: "Laboratorio Clínico", icon: FileText, minPlan: "business" },
      { path: "/farmacia", label: "Farmacia & Medicamentos", icon: Boxes, minPlan: "plus" },
      { path: "/comisiones-empleados", label: "Honorarios Médicos & Split", icon: FileText, minPlan: "pro", adminOnly: true },
    ],
  },
};
