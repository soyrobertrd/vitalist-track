import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ExaminationItem {
  id: string;
  paciente: string;
  diagnostico: string;
  subtexto: string;
  fecha: string;
  estado: "critico" | "pendiente" | "estable";
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
}

const EXAMS_DATA: ExaminationItem[] = [
  {
    id: "ex-1",
    paciente: "Carmen Rodríguez",
    diagnostico: "Hipertensión Grado II",
    subtexto: "Tratamiento en ajuste farmacológico",
    fecha: "Hoy, 10:30 AM",
    estado: "critico",
    bgColor: "bg-rose-50/80 dark:bg-rose-950/30",
    borderColor: "border-rose-200/80 dark:border-rose-900/50",
    textColor: "text-rose-950 dark:text-rose-100",
    badgeBg: "bg-rose-200/70 dark:bg-rose-900/60",
    badgeText: "text-rose-800 dark:text-rose-200",
  },
  {
    id: "ex-2",
    paciente: "Luis Morales",
    diagnostico: "Control Post-Quirúrgico",
    subtexto: "Requiere análisis de laboratorio",
    fecha: "Ayer, 04:15 PM",
    estado: "pendiente",
    bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
    borderColor: "border-amber-200/80 dark:border-amber-900/50",
    textColor: "text-amber-950 dark:text-amber-100",
    badgeBg: "bg-amber-200/70 dark:bg-amber-900/60",
    badgeText: "text-amber-800 dark:text-amber-200",
  },
  {
    id: "ex-3",
    paciente: "Elena Vargas",
    diagnostico: "Evaluación Oftalmológica",
    subtexto: "Fondo de ojo completado satisfactoriamente",
    fecha: "24 Oct, 11:00 AM",
    estado: "estable",
    bgColor: "bg-emerald-50/80 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200/80 dark:border-emerald-900/50",
    textColor: "text-emerald-950 dark:text-emerald-100",
    badgeBg: "bg-emerald-200/70 dark:bg-emerald-900/60",
    badgeText: "text-emerald-800 dark:text-emerald-200",
  },
];

export function ExaminationsWidget() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-foreground uppercase text-xs text-muted-foreground">
            Monitoreo Clínico de Pacientes (Examinations)
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/pacientes")}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMS_DATA.map((exam) => (
          <div
            key={exam.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate("/pacientes")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/pacientes")}
            className={`group relative flex flex-col justify-between rounded-3xl border ${exam.borderColor} ${exam.bgColor} p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 cursor-pointer`}
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {exam.fecha}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${exam.badgeBg} ${exam.badgeText}`}
                >
                  {exam.estado === "critico" ? "Prioridad" : exam.estado === "pendiente" ? "Pendiente" : "Control"}
                </span>
              </div>

              <div className="mt-2.5">
                <h3 className={`text-base font-bold ${exam.textColor}`}>
                  {exam.diagnostico}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {exam.subtexto}
                </p>
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-between border-t border-black/5 pt-2.5 dark:border-white/10">
              <span className="text-xs font-semibold text-foreground">
                {exam.paciente}
              </span>
              <span className="text-[11px] font-medium text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Ver ficha <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
