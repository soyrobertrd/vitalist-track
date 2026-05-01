import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useVertical, VerticalTipo } from "@/contexts/VerticalContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stethoscope, SmilePlus, Sparkles, BedDouble, Eye, Building2, Users } from "lucide-react";
import { toast } from "sonner";

const VERTICALES: { id: VerticalTipo; label: string; desc: string; icon: any }[] = [
  { id: "clinica",   label: "Clínica / Hospital", desc: "Hospitalización, urgencias, quirófano, UCI, etc.", icon: Stethoscope },
  { id: "dental",    label: "Odontología",        desc: "DentalCare Pro + odontograma.", icon: SmilePlus },
  { id: "aesthetic", label: "Estética",           desc: "Aesthetic Pro: CRM y evaluaciones.", icon: Sparkles },
  { id: "recovery",  label: "Recovery Care",      desc: "Casa de recuperación postquirúrgica.", icon: BedDouble },
  { id: "vision",    label: "Visión / Óptica",    desc: "VisionCare Pro: recetas y óptica.", icon: Eye },
];

export default function VerticalesAdmin() {
  const { currentWorkspace } = useWorkspace();
  const { refresh } = useVertical();
  const wsId = currentWorkspace?.id;
  const [activas, setActivas] = useState<Record<VerticalTipo, boolean>>({} as any);
  const [miembros, setMiembros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const [vw, mm] = await Promise.all([
      (supabase.from("workspace_verticales") as any).select("vertical, activa").eq("workspace_id", wsId),
      (supabase.from("workspace_members") as any)
        .select("user_id, role, profiles!inner(nombre, apellido, vertical_asignada)")
        .eq("workspace_id", wsId),
    ]);
    const map: Record<string, boolean> = {};
    (vw.data || []).forEach((r: any) => { map[r.vertical] = r.activa; });
    setActivas(map as any);
    setMiembros(mm.data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [wsId]);

  const toggle = async (v: VerticalTipo, value: boolean) => {
    const { error } = await (supabase.from("workspace_verticales") as any)
      .upsert({ workspace_id: wsId, vertical: v, activa: value }, { onConflict: "workspace_id,vertical" });
    if (error) { toast.error(error.message); return; }
    toast.success(value ? "Vertical habilitada" : "Vertical desactivada");
    setActivas({ ...activas, [v]: value });
    await refresh();
  };

  const asignarMiembro = async (userId: string, vertical: VerticalTipo | "ninguna") => {
    const { error } = await (supabase.from("profiles") as any)
      .update({ vertical_asignada: vertical === "ninguna" ? null : vertical })
      .eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success("Vertical asignada actualizada");
    cargar();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" /> Verticales del centro
        </h1>
        <p className="text-muted-foreground">
          Habilita los tipos de servicio que ofreces. El menú lateral se adapta a cada miembro según su vertical asignada.
          Personal, Nómina, Finanzas, Agenda y Telemedicina son comunes a todas.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle>Verticales habilitadas</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-3">
          {VERTICALES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.id} className="flex items-start justify-between border rounded-lg p-3">
                <div className="flex gap-3">
                  <Icon className="h-5 w-5 mt-0.5 text-primary" />
                  <div>
                    <p className="font-medium">{v.label}</p>
                    <p className="text-xs text-muted-foreground">{v.desc}</p>
                  </div>
                </div>
                <Switch checked={!!activas[v.id]} onCheckedChange={(c) => toggle(v.id, c)} />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Asignación por miembro</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Cargando...</p> : (
            <div className="space-y-2">
              {miembros.map((m: any) => (
                <div key={m.user_id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                  <div>
                    <p className="font-medium text-sm">{m.profiles?.nombre} {m.profiles?.apellido}</p>
                    <Badge variant="outline" className="text-xs capitalize mt-1">{m.role}</Badge>
                  </div>
                  <div className="w-56">
                    <Select
                      value={m.profiles?.vertical_asignada || "ninguna"}
                      onValueChange={(v) => asignarMiembro(m.user_id, v as any)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ninguna">Sin restricción (ve todas)</SelectItem>
                        {VERTICALES.filter(v => activas[v.id]).map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
