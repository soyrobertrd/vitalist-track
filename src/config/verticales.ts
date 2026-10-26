import {
  Activity,
  CircleDot,
  Sparkles,
  BedDouble,
  Eye,
  SmilePlus,
} from "lucide-react";
import type { VerticalTipo } from "@/contexts/VerticalContext";

export interface VerticalConfig {
  codigo: VerticalTipo;
  label: string;
  descripcion: string;
  icon: any;
  colorName: string;
  defaultRoute: string;
}

export const VERTICALES_CATALOGO: Record<VerticalTipo, VerticalConfig> = {
  clinica: {
    codigo: "clinica",
    label: "Hospital / Clínica General",
    descripcion: "Centros policlínicos, hospitalización, urgencias y medicina interna",
    icon: Activity,
    colorName: "Azul Hospitalario",
    defaultRoute: "/app",
  },
  dental: {
    codigo: "dental",
    label: "Odontología Pro",
    descripcion: "Clínicas dentales, ortodoncia, odontogramas y presupuestos",
    icon: CircleDot,
    colorName: "Turquesa Dental",
    defaultRoute: "/dental-care",
  },
  aesthetic: {
    codigo: "aesthetic",
    label: "Aesthetic Pro",
    descripcion: "Medicina estética, spa médico, cirugía plástica y cabinas",
    icon: Sparkles,
    colorName: "Rosa Frambuesa",
    defaultRoute: "/aesthetic-pro",
  },
  recovery: {
    codigo: "recovery",
    label: "Recovery Care",
    descripcion: "Casas de recuperación postoperatoria y atención domiciliaria",
    icon: BedDouble,
    colorName: "Verde Salvia",
    defaultRoute: "/recovery-care",
  },
  vision: {
    codigo: "vision",
    label: "VisionCare Pro",
    descripcion: "Ópticas, oftalmología, recetas ópticas y laboratorio de lentes",
    icon: Eye,
    colorName: "Índigo Óptico",
    defaultRoute: "/vision-care",
  },
  psicologia: {
    codigo: "psicologia",
    label: "Psicología & Psiquiatría",
    descripcion: "Salud mental, psicoterapia, tests psicométricos y bonos de sesiones",
    icon: SmilePlus,
    colorName: "Lavanda Serenidad",
    defaultRoute: "/psicologia-pro",
  },
};

export const verticalLabel: Record<VerticalTipo, string> = {
  clinica: "Hospital / Clínica",
  dental: "Odontología",
  aesthetic: "Aesthetic Pro",
  recovery: "Recovery Care",
  vision: "VisionCare Pro",
  psicologia: "Psicología & Psiquiatría",
};

export const verticalIcon: Record<VerticalTipo, any> = {
  clinica: Activity,
  dental: CircleDot,
  aesthetic: Sparkles,
  recovery: BedDouble,
  vision: Eye,
  psicologia: SmilePlus,
};
