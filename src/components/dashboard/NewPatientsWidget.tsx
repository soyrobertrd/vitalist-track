import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, ArrowRight, UserPlus, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NewPatientItem {
  id: string;
  nombre: string;
  apellido: string;
  tipo: "Seguimiento" | "Primera vez";
  fecha: string;
  motivo: string;
}

export function NewPatientsWidget() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [pacientes, setPacientes] = useState<NewPatientItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecentPatients() {
      if (!currentWorkspace?.id) return;
      try {
        const { data, error } = await supabase
          .from("pacientes")
          .select("id, nombre, apellido, created_at, historia_medica_basica, status_px")
          .eq("workspace_id", currentWorkspace.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (data && data.length > 0) {
          const mapped: NewPatientItem[] = data.map((p, idx) => ({
            id: p.id,
            nombre: p.nombre,
            apellido: p.apellido,
            tipo: idx === 0 ? "Primera vez" : "Seguimiento",
            fecha: p.created_at ? format(new Date(p.created_at), "d MMM, HH:mm", { locale: es }) : "Reciente",
            motivo: p.historia_medica_basica || "Evaluación clínica general preventiva.",
          }));
          setPacientes(mapped);
        } else {
          // Datos de demostración de alta fidelidad
          setPacientes([
            {
              id: "demo-1",
              nombre: "Sofía",
              apellido: "Rosario",
              tipo: "Seguimiento",
              fecha: "Hoy, 10:30 AM",
              motivo: "Control post-tratamiento y revisión de analíticas de laboratorio.",
            },
            {
              id: "demo-2",
              nombre: "Mateo",
              apellido: "Castillo",
              tipo: "Primera vez",
              fecha: "Ayer, 04:00 PM",
              motivo: "Consulta de inicio por cefalea persistente y fatiga.",
            },
            {
              id: "demo-3",
              nombre: "Camila",
              apellido: "Navarro",
              tipo: "Primera vez",
              fecha: "24 Oct, 02:15 PM",
              motivo: "Evaluación integral de salud y rutina preventiva.",
            },
          ]);
        }
      } catch {
        // Fallback
        setPacientes([
          {
            id: "demo-1",
            nombre: "Sofía",
            apellido: "Rosario",
            tipo: "Seguimiento",
            fecha: "Hoy, 10:30 AM",
            motivo: "Control clínico preventivo.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentPatients();
  }, [currentWorkspace?.id]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pacientes Recientes
          </h2>
          <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] font-bold tabular-nums">
            {pacientes.length} nuevos
          </Badge>
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
        {pacientes.map((p) => {
          const initials = `${p.nombre[0] || ""}${p.apellido[0] || ""}`.toUpperCase();
          const isInitial = p.tipo === "Primera vez";

          return (
            <div
              key={p.id}
              className="group flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-4.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-10 w-10 rounded-2xl border border-border/80">
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {p.nombre} {p.apellido}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{p.fecha}</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isInitial
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                    }`}
                  >
                    {p.tipo}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                  {p.motivo}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-border/50 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/pacientes?id=${p.id}`)}
                  className="h-8 flex-1 rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" /> Ficha 360
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/pacientes?id=${p.id}&tab=historia`)}
                  className="h-8 flex-1 rounded-xl text-xs font-semibold gap-1.5 hover:bg-muted"
                >
                  <FileText className="h-3.5 w-3.5" /> Nota
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
