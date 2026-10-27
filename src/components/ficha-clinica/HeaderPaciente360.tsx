import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  User, Phone, ShieldCheck, Clock, AlertTriangle, 
  Calendar, CheckCircle2, HeartPulse, Edit3, Printer
} from "lucide-react";
import { differenceInYears, format } from "date-fns";
import { es } from "date-fns/locale";
import { AgendarCitaButton } from "@/components/AgendarCitaButton";
import { DEMO_MODE, DEMO_PACIENTES, DEMO_CITAS } from "@/lib/mock-live-seed";
import { ImprimirDocumentoDialog } from "@/components/documentos/ImprimirDocumentoDialog";

interface HeaderPaciente360Props {
  pacienteId: string;
  onEditPatient?: () => void;
  className?: string;
}

export function HeaderPaciente360({ pacienteId, onEditPatient, className = "" }: HeaderPaciente360Props) {
  const [paciente, setPaciente] = useState<any>(null);
  const [alergias, setAlergias] = useState<string[]>([]);
  const [seguroActivo, setSeguroActivo] = useState<{ aseguradora: string; numero_afiliado: string | null } | null>(null);
  const [proximaCita, setProximaCita] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imprimirOpen, setImprimirOpen] = useState(false);

  useEffect(() => {
    if (!pacienteId) return;

    async function loadData() {
      setLoading(true);
      try {
        const [pacienteRes, alergiasRes, segurosRes, citasRes] = await Promise.all([
          supabase.from("pacientes").select("*").eq("id", pacienteId).maybeSingle(),
          supabase.from("alergias_paciente").select("sustancia, severidad").eq("paciente_id", pacienteId),
          supabase.from("seguros_paciente").select("aseguradora, numero_afiliado, activo").eq("paciente_id", pacienteId).eq("activo", true).maybeSingle(),
          supabase.from("control_visitas")
            .select("id, fecha_hora_visita, tipo_visita, estado")
            .eq("paciente_id", pacienteId)
            .gte("fecha_hora_visita", new Date().toISOString())
            .order("fecha_hora_visita", { ascending: true })
            .limit(1)
            .maybeSingle(),
        ]);

        // shortcut: columnas alergias/ars_* no están en los tipos generados; regenerar tipos de Supabase
        let pData = pacienteRes.data as any;
        if (!pData && DEMO_MODE) {
          pData = DEMO_PACIENTES.find((p) => p.id === pacienteId) || null;
        }
        setPaciente(pData);

        // Alergias
        const sustancias = (alergiasRes.data || []).map((a: any) => a.sustancia);
        if (pData?.alergias && !sustancias.includes(pData.alergias)) {
          sustancias.push(pData.alergias);
        }
        setAlergias(sustancias);

        // Seguro
        if (segurosRes.data) {
          setSeguroActivo(segurosRes.data as any);
        } else if (pData?.ars_nombre) {
          setSeguroActivo({ aseguradora: pData.ars_nombre, numero_afiliado: pData.ars_numero_afiliado || null });
        }

        // Próxima cita
        if (citasRes.data) {
          setProximaCita(citasRes.data);
        } else if (DEMO_MODE) {
          const demoCita = DEMO_CITAS.find((c) => c.paciente_id === pacienteId);
          if (demoCita) setProximaCita(demoCita);
        }
      } catch (err) {
        console.error("Error cargando Header 360", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [pacienteId]);

  if (loading) {
    return (
      <div className={`p-4 rounded-xl border border-border bg-card animate-pulse flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-3 w-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!paciente) return null;

  const edad = paciente.fecha_nacimiento
    ? differenceInYears(new Date(), new Date(paciente.fecha_nacimiento))
    : null;

  const iniciales = `${paciente.nombre?.[0] || ""}${paciente.apellido?.[0] || ""}`.toUpperCase();

  return (
    <div className={`rounded-xl border border-border bg-card p-4 sm:p-5 shadow-none transition-colors ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Lado izquierdo: Avatar + Datos principales */}
        <div className="flex items-start sm:items-center gap-3.5">
          {paciente.foto_url ? (
            <img 
              src={paciente.foto_url} 
              alt={`${paciente.nombre} ${paciente.apellido}`} 
              className="h-14 w-14 rounded-full object-cover border-2 border-border shadow-none shrink-0" 
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg shrink-0">
              {iniciales || <User className="h-6 w-6" />}
            </div>
          )}

          <div className="space-y-1.5 min-w-0">
            {/* Nombre + Badges de estado clínico */}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                {paciente.nombre} {paciente.apellido}
              </h2>

              {paciente.cedula && (
                <Badge variant="outline" className="text-xs font-mono border-border text-muted-foreground">
                  {paciente.cedula}
                </Badge>
              )}

              {edad !== null && (
                <Badge variant="secondary" className="text-xs tabular-nums font-medium">
                  {edad} años
                </Badge>
              )}

              {/* Alerta de Alergias: BADGE ROJO DESTACADO si tiene */}
              {alergias.length > 0 ? (
                <Badge 
                  variant="destructive" 
                  className="text-xs font-semibold px-2 py-0.5 flex items-center gap-1 shadow-none bg-red-600 text-white dark:bg-red-700 hover:bg-red-600 animate-in fade-in"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  ALERGIAS: {alergias.join(", ")}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground border-border bg-muted/20">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                  Sin alergias reportadas
                </Badge>
              )}
            </div>

            {/* Metadatos secundarios (Teléfono, ARS/Seguro, Próxima Cita) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {(paciente.contacto_px || paciente.contacto_cuidador) && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {paciente.contacto_px || paciente.contacto_cuidador}
                </span>
              )}

              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                <span>ARS: </span>
                <strong className="text-foreground font-semibold">
                  {seguroActivo?.aseguradora || "Particular / Sin Seguro"}
                </strong>
                {seguroActivo?.numero_afiliado && (
                  <span className="text-muted-foreground font-mono">({seguroActivo.numero_afiliado})</span>
                )}
              </span>

              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                <span>Próxima Cita: </span>
                {proximaCita ? (
                  <strong className="text-foreground">
                    {format(new Date(proximaCita.fecha_hora_visita), "dd MMM, HH:mm", { locale: es })}
                    <span className="capitalize ml-1 text-xs text-muted-foreground font-normal">
                      ({proximaCita.tipo_visita || "Ambulatoria"})
                    </span>
                  </strong>
                ) : (
                  <span className="text-muted-foreground italic">No programada</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Lado derecho: Acciones rápidas de cabecera */}
        <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImprimirOpen(true)}
            className="gap-1.5"
            title="Imprimir receta, presupuesto o ficha"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir PDF
          </Button>
          {onEditPatient && (
            <Button variant="outline" size="sm" onClick={onEditPatient} className="gap-1.5">
              <Edit3 className="h-3.5 w-3.5" />
              Editar
            </Button>
          )}
          <AgendarCitaButton size="sm" pacienteId={pacienteId} />
        </div>
      </div>

      <ImprimirDocumentoDialog
        open={imprimirOpen}
        onOpenChange={setImprimirOpen}
        paciente={{
          id: paciente.id,
          nombre: paciente.nombre,
          apellido: paciente.apellido,
          cedula: paciente.cedula,
          edad,
          sexo: paciente.sexo,
          ars: paciente.aseguradora,
          alergias: paciente.alergias,
          telefono: paciente.numero_principal || paciente.contacto_px,
        }}
      />
    </div>
  );
}
