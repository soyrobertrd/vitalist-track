/**
 * Configuración Canónica de las 6 Verticales de Salud (Fase 4 Plan Maestro)
 * Centraliza nombres, iconos, rutas raíz y metadatos de vertical.
 */
import { Activity, CircleDot, Sparkles, BedDouble, Eye, Brain, PawPrint, Dumbbell, Apple, HeartHandshake, Baby, type LucideIcon } from "lucide-react";
import type { VerticalTipo } from "@/contexts/VerticalContext";

export interface VerticalMetadata {
  id: VerticalTipo;
  label: string;
  nombreComercial: string;
  icon: LucideIcon;
  rootPath: string;
  descripcion: string;
  badgeColorClass: string;
}

export const VERTICALES_CONFIG: Record<VerticalTipo, VerticalMetadata> = {
  clinica: {
    id: "clinica",
    label: "Hospital",
    nombreComercial: "Vitalist Hospital & Policlínica",
    icon: Activity,
    rootPath: "/app",
    descripcion: "Gestión hospitalaria, internamiento, urgencias y medicina general.",
    badgeColorClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  dental: {
    id: "dental",
    label: "Odontología",
    nombreComercial: "DentalCare Pro",
    icon: CircleDot,
    rootPath: "/dental-care",
    descripcion: "Odontograma interactivo, ortodoncia, presupuestos y sillones dentales.",
    badgeColorClass: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  },
  aesthetic: {
    id: "aesthetic",
    label: "Aesthetic Pro",
    nombreComercial: "Aesthetic & Wellness Studio",
    icon: Sparkles,
    rootPath: "/aesthetic-pro",
    descripcion: "Medicina estética, cabinas láser, evolución fotográfica y membresías.",
    badgeColorClass: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  },
  recovery: {
    id: "recovery",
    label: "Recovery Care",
    nombreComercial: "RecoveryCare & Cuidado Domiciliario",
    icon: BedDouble,
    rootPath: "/recovery-care",
    descripcion: "Rehabilitación física, fisioterapia, cuidado postquirúrgico y visitas domiciliarias.",
    badgeColorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  vision: {
    id: "vision",
    label: "VisionCare Pro",
    nombreComercial: "Óptica & Oftalmología VistaPlus",
    icon: Eye,
    rootPath: "/vision-care",
    descripcion: "Optometría, refracción, recetas ópticas, armazones y gabinete.",
    badgeColorClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  },
  psicologia: {
    id: "psicologia",
    label: "Psicología / Salud Mental",
    nombreComercial: "MenteSana Pro",
    icon: Brain,
    rootPath: "/psicologia-pro",
    descripcion: "Expediente psicológico, escalas GAD/PHQ, teleconsulta y sesiones.",
    badgeColorClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  veterinaria: {
    id: "veterinaria",
    label: "VetCare Pro",
    nombreComercial: "Clínica Veterinaria",
    icon: PawPrint,
    rootPath: "/vet-care",
    descripcion: "Fichas de mascotas con tutor, especie, raza y peso; calendario de vacunas.",
    badgeColorClass: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  fisioterapia: {
    id: "fisioterapia",
    label: "Fisioterapia & Kinesiología",
    nombreComercial: "KinePhysio Pro",
    icon: Dumbbell,
    rootPath: "/fisioterapia-pro",
    descripcion: "Goniometría, balance Daniels, escala EVA, boxes de electroterapia y bonos.",
    badgeColorClass: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  },
  nutricion: {
    id: "nutricion",
    label: "Nutrición & Dietética",
    nombreComercial: "NutriVital Pro",
    icon: Apple,
    rootPath: "/nutricion-pro",
    descripcion: "Bioimpedancia, tasa metabólica basal, minutas semanales y control calórico.",
    badgeColorClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  ginecologia: {
    id: "ginecologia",
    label: "Ginecología & Obstetricia",
    nombreComercial: "Salud Femenina Pro",
    icon: HeartHandshake,
    rootPath: "/ginecologia-obstetricia",
    descripcion: "Control prenatal, regla Naegele FPP, altura uterina y ecografías obstétricas.",
    badgeColorClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
  pediatria: {
    id: "pediatria",
    label: "Pediatría & Puericultura",
    nombreComercial: "Pediatría Integral",
    icon: Baby,
    rootPath: "/pediatria",
    descripcion: "Percentiles OMS de crecimiento, cartilla nacional de vacunas y puericultura.",
    badgeColorClass: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  },
};

export const VERTICAL_LABELS: Record<VerticalTipo, string> = {
  clinica: VERTICALES_CONFIG.clinica.label,
  dental: VERTICALES_CONFIG.dental.label,
  aesthetic: VERTICALES_CONFIG.aesthetic.label,
  recovery: VERTICALES_CONFIG.recovery.label,
  vision: VERTICALES_CONFIG.vision.label,
  psicologia: VERTICALES_CONFIG.psicologia.label,
  veterinaria: VERTICALES_CONFIG.veterinaria.label,
  fisioterapia: VERTICALES_CONFIG.fisioterapia.label,
  nutricion: VERTICALES_CONFIG.nutricion.label,
  ginecologia: VERTICALES_CONFIG.ginecologia.label,
  pediatria: VERTICALES_CONFIG.pediatria.label,
};

export const VERTICAL_ICONS: Record<VerticalTipo, LucideIcon> = {
  clinica: VERTICALES_CONFIG.clinica.icon,
  dental: VERTICALES_CONFIG.dental.icon,
  aesthetic: VERTICALES_CONFIG.aesthetic.icon,
  recovery: VERTICALES_CONFIG.recovery.icon,
  vision: VERTICALES_CONFIG.vision.icon,
  psicologia: VERTICALES_CONFIG.psicologia.icon,
  veterinaria: VERTICALES_CONFIG.veterinaria.icon,
  fisioterapia: VERTICALES_CONFIG.fisioterapia.icon,
  nutricion: VERTICALES_CONFIG.nutricion.icon,
  ginecologia: VERTICALES_CONFIG.ginecologia.icon,
  pediatria: VERTICALES_CONFIG.pediatria.icon,
};

export const VERTICAL_ROOTS: Record<VerticalTipo, string> = {
  clinica: VERTICALES_CONFIG.clinica.rootPath,
  dental: VERTICALES_CONFIG.dental.rootPath,
  aesthetic: VERTICALES_CONFIG.aesthetic.rootPath,
  recovery: VERTICALES_CONFIG.recovery.rootPath,
  vision: VERTICALES_CONFIG.vision.rootPath,
  psicologia: VERTICALES_CONFIG.psicologia.rootPath,
  veterinaria: VERTICALES_CONFIG.veterinaria.rootPath,
  fisioterapia: VERTICALES_CONFIG.fisioterapia.rootPath,
  nutricion: VERTICALES_CONFIG.nutricion.rootPath,
  ginecologia: VERTICALES_CONFIG.ginecologia.rootPath,
  pediatria: VERTICALES_CONFIG.pediatria.rootPath,
};

export interface VerticalCatalogoItem {
  codigo: VerticalTipo;
  label: string;
  icon: LucideIcon;
  colorName: string;
  descripcion: string;
}

export const VERTICALES_CATALOGO: Record<VerticalTipo, VerticalCatalogoItem> = {
  clinica: {
    codigo: "clinica",
    label: "Hospital / Clínica",
    icon: Activity,
    colorName: "Azul Real",
    descripcion: VERTICALES_CONFIG.clinica.descripcion,
  },
  dental: {
    codigo: "dental",
    label: "Odontología",
    icon: CircleDot,
    colorName: "Cian Dental",
    descripcion: VERTICALES_CONFIG.dental.descripcion,
  },
  aesthetic: {
    codigo: "aesthetic",
    label: "Aesthetic Pro",
    icon: Sparkles,
    colorName: "Frambuesa Estético",
    descripcion: VERTICALES_CONFIG.aesthetic.descripcion,
  },
  recovery: {
    codigo: "recovery",
    label: "Recovery Care",
    icon: BedDouble,
    colorName: "Salvia Terapia",
    descripcion: VERTICALES_CONFIG.recovery.descripcion,
  },
  vision: {
    codigo: "vision",
    label: "VisionCare Pro",
    icon: Eye,
    colorName: "Índigo Óptica",
    descripcion: VERTICALES_CONFIG.vision.descripcion,
  },
  psicologia: {
    codigo: "psicologia",
    label: "Psicología & Salud Mental",
    icon: Brain,
    colorName: "Lavanda Bienestar",
    descripcion: VERTICALES_CONFIG.psicologia.descripcion,
  },
  veterinaria: {
    codigo: "veterinaria",
    label: "Veterinaria",
    icon: PawPrint,
    colorName: "Ámbar Veterinario",
    descripcion: VERTICALES_CONFIG.veterinaria.descripcion,
  },
  fisioterapia: {
    codigo: "fisioterapia",
    label: "Fisioterapia & Kinesiología",
    icon: Dumbbell,
    colorName: "Turquesa Rehab",
    descripcion: VERTICALES_CONFIG.fisioterapia.descripcion,
  },
  nutricion: {
    codigo: "nutricion",
    label: "Nutrición & Dietética",
    icon: Apple,
    colorName: "Esmeralda Nutricional",
    descripcion: VERTICALES_CONFIG.nutricion.descripcion,
  },
  ginecologia: {
    codigo: "ginecologia",
    label: "Ginecología & Obstetricia",
    icon: HeartHandshake,
    colorName: "Rosa Obstétrico",
    descripcion: VERTICALES_CONFIG.ginecologia.descripcion,
  },
  pediatria: {
    codigo: "pediatria",
    label: "Pediatría & Puericultura",
    icon: Baby,
    colorName: "Cielo Pediátrico",
    descripcion: VERTICALES_CONFIG.pediatria.descripcion,
  },
};
