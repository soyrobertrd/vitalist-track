import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Circle, Rocket, Settings, Users, Calendar, DollarSign } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const subnichos: Record<string, string[]> = {
  dental: ["Dentista general", "Ortodoncista", "Implantología", "Odontopediatría", "Endodoncia", "Clínica multi-doctor"],
  estetica: ["Spa médico / MedSpa", "Cirugía plástica", "Dermatología estética", "Clínica láser", "Salón clínico premium"],
  recovery: ["Centro de fisioterapia", "Quiropráctica", "Rehabilitación deportiva", "Terapia ocupacional", "Centro de dolor"],
  vision: ["Óptica retail + consultorio", "Oftalmología clínica", "Optometría independiente", "Centro de cirugía LASIK", "Audiología / Hearing"],
};

const pasos = [
  { id: 1, label: "Perfil del negocio", icon: Settings, desc: "Nombre, subnicho, horarios" },
  { id: 2, label: "Equipo", icon: Users, desc: "Agregar profesionales y roles" },
  { id: 3, label: "Agenda", icon: Calendar, desc: "Configurar disponibilidad y servicios" },
  { id: 4, label: "Facturación", icon: DollarSign, desc: "Precios, impuestos, métodos de pago" },
  { id: 5, label: "¡Listo!", icon: Rocket, desc: "Tu clínica está configurada" },
];

export default function VerticalOnboardingTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: onboarding, refetch } = useQuery({
    queryKey: ["onboarding_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("onboarding_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).maybeSingle();
      return data;
    },
  });

  const { data: plantillas = [] } = useQuery({
    queryKey: ["plantillas_servicio_vertical", verticalTipo],
    queryFn: async () => {
      const { data } = await (supabase.from("plantillas_servicio_vertical") as any)
        .select("*").eq("vertical_tipo", verticalTipo).eq("activo", true).order("subnicho, nombre_servicio");
      return data || [];
    },
  });

  const [subnicho, setSubnicho] = useState("");
  const [nombreNegocio, setNombreNegocio] = useState("");

  const iniciar = async () => {
    if (!wsId) return;
    const { error } = await (supabase.from("onboarding_vertical") as any).upsert({
      workspace_id: wsId, vertical_tipo: verticalTipo, paso_actual: 1,
      datos: { subnicho, nombre_negocio: nombreNegocio },
      plantilla_seleccionada: subnicho,
    }, { onConflict: "workspace_id,vertical_tipo" });
    if (error) { toast.error(error.message); return; }
    toast.success("Onboarding iniciado");
    refetch();
  };

  const avanzarPaso = async () => {
    if (!onboarding) return;
    const siguiente = Math.min((onboarding.paso_actual || 1) + 1, 5);
    const completado = siguiente >= 5;
    const { error } = await (supabase.from("onboarding_vertical") as any)
      .update({ paso_actual: siguiente, completado }).eq("id", onboarding.id);
    if (error) { toast.error(error.message); return; }
    toast.success(completado ? "¡Onboarding completado!" : `Paso ${siguiente} de 5`);
    refetch();
  };

  if (!onboarding) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <Rocket className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Configurar tu {verticalTipo === "dental" ? "clínica dental" : verticalTipo === "estetica" ? "centro estético" : verticalTipo === "recovery" ? "centro de recuperación" : "óptica"}</h3>
          <p className="text-muted-foreground mb-6">Wizard de configuración rápida en 5 pasos</p>
          <div className="max-w-sm mx-auto space-y-4">
            <div><Label>Nombre del negocio</Label><Input value={nombreNegocio} onChange={e => setNombreNegocio(e.target.value)} placeholder="Mi Clínica" /></div>
            <div><Label>Subnicho</Label>
              <Select value={subnicho} onValueChange={setSubnicho}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo..." /></SelectTrigger>
                <SelectContent>
                  {(subnichos[verticalTipo] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={iniciar} className="w-full"><Rocket className="h-4 w-4 mr-1" /> Iniciar configuración</Button>
          </div>
        </Card>
      </div>
    );
  }

  const pasoActual = onboarding.paso_actual || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Configuración inicial</h3>
        {onboarding.completado && <Badge className="bg-green-100 text-green-800">✓ Completado</Badge>}
      </div>

      <div className="flex gap-2 items-center">
        {pasos.map((p) => {
          const Icon = pasoActual > p.id ? CheckCircle2 : pasoActual === p.id ? p.icon : Circle;
          const done = pasoActual > p.id;
          const active = pasoActual === p.id;
          return (
            <div key={p.id} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm ${done ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : active ? "bg-primary/10 text-primary font-medium" : "bg-muted text-muted-foreground"}`}>
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{p.label}</span>
              </div>
              {p.id < 5 && <span className="text-muted-foreground">→</span>}
            </div>
          );
        })}
      </div>

      <Card>
        <CardContent className="py-6">
          <h4 className="font-medium mb-2">{pasos[pasoActual - 1]?.label}</h4>
          <p className="text-sm text-muted-foreground mb-4">{pasos[pasoActual - 1]?.desc}</p>

          {pasoActual === 1 && (
            <div className="space-y-2 text-sm">
              <p>Subnicho: <Badge variant="outline">{onboarding.datos?.subnicho || "—"}</Badge></p>
              <p>Negocio: <strong>{onboarding.datos?.nombre_negocio || "—"}</strong></p>
            </div>
          )}

          {pasoActual === 3 && plantillas.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Servicios sugeridos para tu subnicho:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plantillas.filter((p: any) => !subnicho || p.subnicho === (onboarding.datos?.subnicho || "")).slice(0, 8).map((p: any) => (
                  <Card key={p.id} className="p-2">
                    <p className="text-sm font-medium">{p.nombre_servicio}</p>
                    <p className="text-xs text-muted-foreground">${p.precio_sugerido} · {p.duracion_minutos} min</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!onboarding.completado && (
            <Button onClick={avanzarPaso} className="mt-4">
              {pasoActual >= 4 ? "Finalizar" : "Siguiente paso"} →
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
