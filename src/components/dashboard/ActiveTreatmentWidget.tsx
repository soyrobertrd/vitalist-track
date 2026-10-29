import { Pill, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface MedicationItem {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  indicacion: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

const TREATMENTS: MedicationItem[] = [
  {
    id: "med-1",
    nombre: "Ibuprofeno",
    dosis: "600 mg",
    frecuencia: "2 veces al día",
    indicacion: "Tomar después de los alimentos",
    bgColor: "bg-blue-50/80 dark:bg-blue-950/30",
    borderColor: "border-blue-200/80 dark:border-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "med-2",
    nombre: "Complejo Vitamina B12",
    dosis: "1000 mcg",
    frecuencia: "1 vez al día",
    indicacion: "Por la mañana con agua",
    bgColor: "bg-emerald-50/80 dark:bg-emerald-950/30",
    borderColor: "border-emerald-200/80 dark:border-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "med-3",
    nombre: "Amoxicilina + Clavulánico",
    dosis: "875/125 mg",
    frecuencia: "Cada 12 horas",
    indicacion: "Completar pauta de 7 días",
    bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
    borderColor: "border-amber-200/80 dark:border-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "med-4",
    nombre: "Losartán Potásico",
    dosis: "50 mg",
    frecuencia: "1 comprimido / 24h",
    indicacion: "Control cardiovascular regular",
    bgColor: "bg-violet-50/80 dark:bg-violet-950/30",
    borderColor: "border-violet-200/80 dark:border-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
];

export function ActiveTreatmentWidget() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Prescripciones y Tratamientos Frecuentes
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/citas")}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Gestionar recetas <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TREATMENTS.map((med) => (
          <div
            key={med.id}
            className={`flex flex-col justify-between rounded-3xl border ${med.borderColor} ${med.bgColor} p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-900/80 shadow-xs">
                  <Pill className={`h-5 w-5 ${med.iconColor}`} />
                </div>
                <span className="text-xs font-bold tabular-nums text-foreground">
                  {med.dosis}
                </span>
              </div>

              <div className="mt-3">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {med.nombre}
                </h3>
                <p className="text-xs font-semibold text-primary mt-0.5">
                  {med.frecuencia}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                  {med.indicacion}
                </p>
              </div>
            </div>

            <div className="mt-3.5 border-t border-black/5 dark:border-white/10 pt-2.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground">
                Receta activa
              </span>
              <button
                type="button"
                onClick={() => navigate("/app/citas")}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Ver pauta →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
