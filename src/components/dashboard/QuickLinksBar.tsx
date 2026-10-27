import { useNavigate } from "react-router-dom";
import { Users, Calendar, DoorOpen, Pill, Smile, ReceiptText, Sparkles } from "lucide-react";

interface QuickLinkItem {
  id: string;
  label: string;
  description: string;
  icon: typeof Users;
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
    to: "/app/citas",
    bgColor: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/70 dark:border-amber-900/40",
    textColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "especialidades",
    label: "Especialidades",
    description: "Odontograma y estética",
    icon: Smile,
    to: "/app/odontograma",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200/70 dark:border-cyan-900/40",
    textColor: "text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "facturacion",
    label: "Facturación",
    description: "Cobros y planes",
    icon: ReceiptText,
    to: "/app/planes",
    bgColor: "bg-rose-50 dark:bg-rose-950/40 border-rose-200/70 dark:border-rose-900/40",
    textColor: "text-rose-600 dark:text-rose-400",
  },
];

export function QuickLinksBar() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase text-xs text-muted-foreground">
          Accesos Rápidos Clínicos
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
              className="group flex flex-col items-center rounded-2xl border border-border/60 bg-card p-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div
                className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl border ${link.bgColor} ${link.textColor} transition-transform group-hover:scale-110`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground group-hover:text-primary">
                {link.label}
              </span>
              <span className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                {link.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
