import { useNavigate } from "react-router-dom";
import { Users, Calendar, DoorOpen, Pill, SmilePlus, ReceiptText, Brain, Heart, PawPrint, BedDouble, Sparkles, Glasses, Dumbbell, Apple, Baby, HeartHandshake, Syringe, Clock, Hotel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useVertical } from "@/contexts/VerticalContext";

interface QuickLinkItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  to: string;
  bgColor: string;
  textColor: string;
}

const QUICK_LINKS_HUMANOS: QuickLinkItem[] = [
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
    id: "facturacion",
    label: "Facturación & e-CF",
    description: "Cobros y fiscal DGII",
    icon: ReceiptText,
    to: "/facturacion",
    bgColor: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40",
    textColor: "text-rose-600 dark:text-rose-400",
  },
];

const LINKS_VETERINARIA: QuickLinkItem[] = [
  {
    id: "mascotas",
    label: "Fichas de Mascotas",
    description: "Raza, peso y tutores",
    icon: PawPrint,
    to: "/vet-care?tab=mascotas",
    bgColor: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/40",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "vacunas_vet",
    label: "Vacunas & Desparasitación",
    description: "Calendario antirrábico y sérico",
    icon: Syringe,
    to: "/vet-care?tab=vacunas",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "boxes_vet",
    label: "Boxes & Aislamiento",
    description: "Caniles y jaulas clínicas",
    icon: BedDouble,
    to: "/vet-care?tab=boxes",
    bgColor: "bg-orange-50 dark:bg-orange-950/40 border-orange-200/70 dark:border-orange-900/40",
    textColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "agenda_vet",
    label: "Agenda Veterinaria",
    description: "Consultas y cirugías animales",
    icon: Calendar,
    to: "/calendario",
    bgColor: "bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-900/40",
    textColor: "text-blue-600 dark:text-blue-400",
  },
];

const LINKS_RECOVERY: QuickLinkItem[] = [
  {
    id: "recovery_planes",
    label: "Planes Postquirúrgicos",
    description: "Protocolos post-operatorios",
    icon: Heart,
    to: "/recovery-care?tab=planes",
    bgColor: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/70 dark:border-purple-900/40",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "drenajes",
    label: "Drenajes & Signos",
    description: "Curaciones y gasto diario",
    icon: Clock,
    to: "/recovery-care?tab=seguimiento",
    bgColor: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40",
    textColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "suites",
    label: "Suites & Habitaciones",
    description: "Ocupación y reservas recovery",
    icon: Hotel,
    to: "/recovery-care?tab=habitaciones",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-900/40",
    textColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "concierge",
    label: "Concierge Médico",
    description: "Atención personalizada huésped",
    icon: Users,
    to: "/recovery-care?tab=concierge",
    bgColor: "bg-teal-50 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-900/40",
    textColor: "text-teal-600 dark:text-teal-400",
  },
];

// Especialidades estrictamente humanas (Hospital y Policlínica)
// NO incluye veterinaria ni recovery home
const ESPECIALIDADES_HOSPITAL: QuickLinkItem[] = [
  {
    id: "dental",
    label: "DentalCare Pro",
    description: "Sillones & Odontograma",
    icon: SmilePlus,
    to: "/dental-care",
    bgColor: "bg-teal-50 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-900/40",
    textColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "estetica",
    label: "AestheticPro & Spa",
    description: "Cabinas, botox & láser",
    icon: Sparkles,
    to: "/aesthetic-pro",
    bgColor: "bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200/70 dark:border-fuchsia-900/40",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400",
  },
  {
    id: "psicologia",
    label: "Psicología & Salud Mental",
    description: "Salas, escalas & notas SOAP",
    icon: Brain,
    to: "/psicologia-pro",
    bgColor: "bg-purple-50 dark:bg-purple-950/40 border-purple-200/70 dark:border-purple-900/40",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "vision",
    label: "VisionCare Pro",
    description: "Refracción, taller & monturas",
    icon: Glasses,
    to: "/vision-care",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-900/40",
    textColor: "text-indigo-600 dark:text-indigo-400",
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
  {
    id: "fisioterapia",
    label: "Fisioterapia & Kine",
    description: "Goniometría, Daniels & Boxes",
    icon: Dumbbell,
    to: "/fisioterapia-pro",
    bgColor: "bg-teal-50 dark:bg-teal-950/40 border-teal-200/70 dark:border-teal-900/40",
    textColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "nutricion",
    label: "Nutrición Clínica",
    description: "Bioimpedancia & Minutas",
    icon: Apple,
    to: "/nutricion-pro",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-900/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "ginecologia",
    label: "Salud Femenina / Gineco",
    description: "Control prenatal & Naegele",
    icon: HeartHandshake,
    to: "/ginecologia-obstetricia",
    bgColor: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40",
    textColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "pediatria",
    label: "Pediatría & Puericultura",
    description: "Curvas OMS & Vacunas",
    icon: Baby,
    to: "/pediatria",
    bgColor: "bg-sky-50 dark:bg-sky-950/40 border-sky-200/70 dark:border-sky-900/40",
    textColor: "text-sky-600 dark:text-sky-400",
  },
];

export function QuickLinksBar() {
  const navigate = useNavigate();
  const { verticalActiva } = useVertical();

  // Caso 1: Veterinaria (Aislada e independiente)
  if (verticalActiva === "veterinaria") {
    return (
      <div className="space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
              Gestión Clínica Veterinaria (Salud Animal)
            </h2>
            <Badge variant="outline" className="border-amber-500/30 text-amber-700 bg-amber-500/10 text-[10px]">
              Entidad Veterinaria Independiente
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LINKS_VETERINARIA.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigate(link.to)}
                  className="group flex flex-col items-center rounded-2xl border border-border/70 bg-card p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-sm"
                >
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${link.bgColor} ${link.textColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground group-hover:text-amber-600">
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

  // Caso 2: Recovery Care (Aislada e independiente)
  if (verticalActiva === "recovery") {
    return (
      <div className="space-y-4">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-500" />
              Recovery Care & Cuidado Domiciliario
            </h2>
            <Badge variant="outline" className="border-purple-500/30 text-purple-700 bg-purple-500/10 text-[10px]">
              Entidad Recovery Independiente
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LINKS_RECOVERY.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigate(link.to)}
                  className="group flex flex-col items-center rounded-2xl border border-border/70 bg-card p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-sm"
                >
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${link.bgColor} ${link.textColor}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground group-hover:text-purple-600">
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

  // Caso 3: Hospital General / Policlínica (Salud Humana)
  // No incluye veterinaria ni recovery home
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_LINKS_HUMANOS.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => navigate(link.to)}
                className="group flex flex-col items-center rounded-2xl border border-border/70 bg-card p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
              >
                <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${link.bgColor} ${link.textColor}`}>
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

      {/* 2. Especialidades Clínicas Humanas del Hospital */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
            Especialidades Médicas del Hospital & Policlínica
          </h2>
          <span className="text-[11px] text-muted-foreground">Salud humana integral</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ESPECIALIDADES_HOSPITAL.map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => navigate(link.to)}
                className="group flex flex-col items-center rounded-2xl border border-border/70 bg-card p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-sm"
              >
                <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl border ${link.bgColor} ${link.textColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">
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
