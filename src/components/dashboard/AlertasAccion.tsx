import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ShieldAlert, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface AlertaAccion {
  id: string;
  nivel: "critica" | "aviso";
  titulo: string;
  detalle: string;
  etiqueta: string;
  accion: { label: string; to: string };
}

const NIVEL: Record<AlertaAccion["nivel"], { icon: LucideIcon; caja: string; chip: string }> = {
  critica: { icon: ShieldAlert, caja: "bg-destructive/10 text-destructive", chip: "border-destructive/30 bg-destructive/10 text-destructive" },
  aviso: { icon: AlertTriangle, caja: "bg-warning/10 text-warning", chip: "border-warning/30 bg-warning/10 text-warning" },
};

const DESCARTADAS_KEY = "alertas_descartadas_hoy";
const hoy = () => new Date().toDateString();
const leerDescartadas = (): string[] => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(DESCARTADAS_KEY) ?? "{}");
    return raw.dia === hoy() ? raw.ids : [];
  } catch {
    return [];
  }
};

/** Alertas accionables (estilo "Rising Readmission Risk" / "Potential fall detected" de las referencias). */
export function AlertasAccion({ alertas }: { alertas: AlertaAccion[] }) {
  const navigate = useNavigate();
  const [descartadas, setDescartadas] = useState<string[]>(leerDescartadas);
  const visibles = alertas.filter((a) => !descartadas.includes(a.id));
  if (visibles.length === 0) return null;

  const descartar = (id: string) => {
    const ids = [...descartadas, id];
    setDescartadas(ids);
    try { sessionStorage.setItem(DESCARTADAS_KEY, JSON.stringify({ dia: hoy(), ids })); } catch { /* sin storage */ }
  };

  return (
    <section aria-label="Alertas que requieren atención" className="grid gap-3 lg:grid-cols-2">
      {visibles.map((a) => {
        const { icon: Icon, caja, chip } = NIVEL[a.nivel];
        return (
          <article key={a.id} role="alert" className="flex items-start gap-3 rounded-2xl border bg-card p-4">
            <div className={`rounded-xl p-2 ${caja}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{a.titulo}</h3>
                <button
                  type="button"
                  onClick={() => descartar(a.id)}
                  className="-mr-1 -mt-1 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={`Descartar alerta: ${a.titulo}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{a.detalle}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" dot className={`text-[11px] ${chip}`}>{a.etiqueta}</Badge>
                <Button size="sm" className="ml-auto h-8 rounded-full" onClick={() => navigate(a.accion.to)}>
                  {a.accion.label}
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
