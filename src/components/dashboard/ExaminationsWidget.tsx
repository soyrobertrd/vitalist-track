import { useNavigate } from "react-router-dom";
import { ArrowRight, HeartPulse, Activity, Stethoscope, Clock, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ExaminationItem {
  id: string;
  paciente: string;
  iniciales: string;
  diagnostico: string;
  subtexto: string;
  especialidad: string;
  medico: string;
  fecha: string;
  estado: "critico" | "pendiente" | "estable";
  estadoLabel: string;
  cardBg: string;
  cardBorder: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  icon: typeof HeartPulse;
}

const EXAMS_DATA: ExaminationItem[] = [
  {
    id: "ex-1",
    paciente: "Carmen Rodríguez",
    iniciales: "CR",
    diagnostico: "Hipertensión Grado II",
    subtexto: "Tratamiento en ajuste farmacológico y control de tensión",
    especialidad: "Cardiología",
    medico: "Dra. P. Santos",
    fecha: "Hoy, 10:30 AM",
    estado: "critico",
    estadoLabel: "Prioridad",
    cardBg: "bg-gradient-to-br from-rose-50/90 via-rose-50/50 to-white dark:from-rose-950/30 dark:via-rose-950/10 dark:to-card",
    cardBorder: "border-rose-200/90 hover:border-rose-300 dark:border-rose-900/50 dark:hover:border-rose-800",
    iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
    iconColor: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-100/90 dark:bg-rose-900/60",
    badgeText: "text-rose-800 dark:text-rose-200",
    icon: HeartPulse,
  },
  {
    id: "ex-2",
    paciente: "Luis Morales",
    iniciales: "LM",
    diagnostico: "Control Post-Quirúrgico",
    subtexto: "Evolución de herida operatoria y análisis de laboratorio",
    especialidad: "Cirugía General",
    medico: "Dr. R. Peña",
    fecha: "Ayer, 04:15 PM",
    estado: "pendiente",
    estadoLabel: "Pendiente",
    cardBg: "bg-gradient-to-br from-amber-50/90 via-amber-50/50 to-white dark:from-amber-950/30 dark:via-amber-950/10 dark:to-card",
    cardBorder: "border-amber-200/90 hover:border-amber-300 dark:border-amber-900/50 dark:hover:border-amber-800",
    iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    iconColor: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100/90 dark:bg-amber-900/60",
    badgeText: "text-amber-800 dark:text-amber-200",
    icon: Activity,
  },
  {
    id: "ex-3",
    paciente: "Elena Vargas",
    iniciales: "EV",
    diagnostico: "Evaluación Oftalmológica",
    subtexto: "Fondo de ojo completado satisfactoriamente sin retinopatía",
    especialidad: "Oftalmología",
    medico: "Dr. A. Cruz",
    fecha: "24 Oct, 11:00 AM",
    estado: "estable",
    estadoLabel: "Control",
    cardBg: "bg-gradient-to-br from-emerald-50/90 via-emerald-50/50 to-white dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-card",
    cardBorder: "border-emerald-200/90 hover:border-emerald-300 dark:border-emerald-900/50 dark:hover:border-emerald-800",
    iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100/90 dark:bg-emerald-900/60",
    badgeText: "text-emerald-800 dark:text-emerald-200",
    icon: Stethoscope,
  },
];

export function ExaminationsWidget() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Monitoreo Clínico de Pacientes (Examinations)
          </h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            3 activos
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/pacientes")}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline transition-colors"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMS_DATA.map((exam) => {
          const IconComp = exam.icon;

          return (
            <div
              key={exam.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate("/pacientes")}
              onKeyDown={(e) => e.key === "Enter" && navigate("/pacientes")}
              className={`group relative flex flex-col justify-between rounded-2xl border ${exam.cardBorder} ${exam.cardBg} p-5 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer`}
            >
              {/* Encabezado: Ícono temático + Fecha + Badge de Estado */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${exam.iconBg}`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{exam.fecha}</span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${exam.badgeBg} ${exam.badgeText}`}
                  >
                    {exam.estadoLabel}
                  </span>
                </div>

                {/* Título de Diagnóstico y Subtexto */}
                <div className="mt-3.5">
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                    {exam.diagnostico}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {exam.subtexto}
                  </p>
                </div>

                {/* Especialidad & Médico */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-background/80 border border-border/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
                    {exam.especialidad}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {exam.medico}
                  </span>
                </div>
              </div>

              {/* Pie de Tarjeta: Avatar de Paciente + Nombre + Acción Ver ficha */}
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-7 w-7 rounded-full border border-border/80">
                    <AvatarFallback className="bg-background text-[10px] font-bold text-foreground">
                      {exam.iniciales}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {exam.paciente}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform shrink-0">
                  Ver ficha <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
