import { useNavigate } from "react-router-dom";
import { Users, Calendar, DoorOpen, Pill, SmilePlus, ReceiptText, Brain, Heart, PawPrint, Microscope, BedDouble, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface QuickLinkItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  to: string;
  bgColor: string;
  textColor: string;
}

const QUICK_LINKS: QuickLinkItem[] = [
  {
    id: "pacientes",
    label: "Pacientes 360",
    description: "Fichas e historial clínico",
    icon: Users,
    to: "/pacientes",
    bgColor: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/40",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "agenda",
    label: "Agenda Médica",
    description: "Calendario y consultas",
    icon: Calendar,
    to: "/calendario",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "recepcion",
    label: "Modo Recepción",
    description: "Llegadas y cobro ágil",
    icon: DoorOpen,
    to: "/recepcion",
    bgColor: "bg-violet-50 dark:bg-violet-950/40 border-violet-200/70 dark:border-violet-900/40",
    textColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "recetas",
    label: "Recetas Médicas",
    description: "Emisión de prescripciones",
    icon: Pill,
    to: "/citas",
    bgColor: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/40",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "odontograma",
    label: "Odontograma",
    description: "Piezas y superficies",
    icon: SmilePlus,
    to: "/odontograma",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/70 dark:border-cyan-900/40",
    textColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "facturacion",
    label: "Facturación & e-CF",
    description: "Cobros y fiscal DGII",
    icon: ReceiptText,
    to: "/facturacion",
    bgColor: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40",
    textColor: "text-rose-600 dark:text-rose-400",
  },
];

const ESPECIALIDADES_LINKS: QuickLinkItem[] = [
  {
    id: "dental",
    label: "DentalCare Pro",
    description: "Sillones & CAD/CAM",
    icon: SmilePlus,
    to: "/dental-care",
    bgColor: "bg-teal-50 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-900/40",
    textColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "estetica",
    label: "AestheticPro & Spa",
    description: "Cabinas, botox & gift cards",
    icon: Sparkles,
    to: "/aesthetic-pro",
    bgColor: "bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200/70 dark:border-fuchsia-900/40",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    id: "psicologia",
    label: "Psicología & Psiquiatría",
    description: "Salas, escalas & notas",
    icon: Brain,
    to: "/psicologia-pro",
    bgColor: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/70 dark:border-purple-900/40",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "recovery",
    label: "Recovery Care",
    description: "Suites, drenajes & concierge",
    icon: Heart,
    to: "/recovery-care",
    bgColor: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40",
    textColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "veterinaria",
    label: "VetCare Pro",
    description: "Boxes bioseguros & dosis",
    icon: PawPrint,
    to: "/vet-care",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "dermatologia",
    label: "Dermatología",
    description: "Mapeo 3D, PASI & SCORAD",
    icon: Microscope,
    to: "/dermatologia",
    bgColor: "bg-sky-50 dark:bg-sky-950/40 border-sky-200/70 dark:border-sky-900/40",
    textColor: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "censo",
    label: "Censo de Camas",
    description: "Ocupación hospitalaria",
    icon: BedDouble,
    to: "/censo-camas",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-900/40",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
];

export function QuickLinksBar() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* 1. Flujo Diario Clínico */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
            Flujo Clínico Diario
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => navigate(link.to)}
                className="group flex flex-col items-center rounded-2xl border border-border/70 bg-card p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${link.bgColor} ${link.textColor} transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-primary">
                  {link.label}
                </span>
                <span className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                  {link.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Centros Especializados & Módulos Clínicos */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
            Centros Especializados & Hospitalarios
          </h2>
          <span className="text-[11px] text-muted-foreground">Flujos unipersonales y policlínica</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ESPECIALIDADES_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => navigate(link.to)}
                className="group flex flex-col items-center rounded-2xl border border-border/70 bg-card p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div
                  className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${link.bgColor} ${link.textColor} transition-transform group-hover:scale-105`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  {link.label}
                </span>
                <span className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                  {link.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
