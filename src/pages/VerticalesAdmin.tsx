import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useVertical, VerticalTipo } from "@/contexts/VerticalContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Users, ArrowLeft } from "lucide-react";
import { VERTICALES_CATALOGO } from "@/config/verticales";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";

export default function VerticalesAdmin() {
  const navigate = useNavigate();
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
      (supabase.from("workspace_verticales") as any)
        .select("vertical, activa")
        .eq("workspace_id", wsId),
      (supabase.from("workspace_members") as any)
        .select("user_id, role, profiles!inner(nombre, apellido, vertical_asignada)")
        .eq("workspace_id", wsId),
    ]);
    const map: Record<string, boolean> = {};
    (vw.data || []).forEach((r: any) => {
      map[r.vertical] = r.activa;
    });
    setActivas(map as any);
    setMiembros(mm.data || []);
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, [wsId]);

  const toggle = async (v: VerticalTipo, value: boolean) => {
    const { error } = await (supabase.from("workspace_verticales") as any).upsert(
      { workspace_id: wsId, vertical: v, activa: value },
      { onConflict: "workspace_id,vertical" }
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(value ? "Vertical habilitada" : "Vertical desactivada");
    setActivas({ ...activas, [v]: value });
    await refresh();
  };

  const asignarMiembro = async (userId: string, vertical: VerticalTipo | "ninguna") => {
    const { error } = await (supabase.from("profiles") as any)
      .update({ vertical_asignada: vertical === "ninguna" ? null : vertical })
      .eq("id", userId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Vertical asignada actualizada");
    cargar();
  };

  const listaVerticales = Object.values(VERTICALES_CATALOGO);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">
      {/* Header unificado */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/app/admin")} aria-label="Volver">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ClinicalPageHeader title="Verticales del Centro" subtitle="Habilita los tipos de servicio clínico que ofreces. El menú lateral y la paleta de colores se adaptan a cada especialidad." icon={Building2} />
      </div>

      {/* Grid de Verticales con muestra de color temático */}
      <Card className="shadow-none border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Verticales Médicas Habilitadas</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaVerticales.map((v) => {
            const Icon = v.icon;
            const isHabilitada = !!activas[v.codigo];
            return (
              <div
                key={v.codigo}
                data-vertical={v.codigo}
                className="flex flex-col justify-between border rounded-xl p-4 bg-card transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Indicador de muestra de color temático de la vertical */}
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full bg-primary shrink-0 shadow-sm" />
                        <p className="font-semibold text-sm">{v.label}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] mt-0.5 border-primary/30 text-primary">
                        {v.colorName}
                      </Badge>
                    </div>
                  </div>
                  <Switch
                    checked={isHabilitada}
                    onCheckedChange={(c) => toggle(v.codigo, c)}
                    aria-label={`Habilitar ${v.label}`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{v.descripcion}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Asignación por Miembro */}
      <Card className="shadow-none border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Asignación de Vertical por Profesional
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Cargando profesionales...</p>
          ) : miembros.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay profesionales registrados en este centro.</p>
          ) : (
            <div className="space-y-3">
              {miembros.map((m) => {
                const p = m.profiles;
                const vertAsignada = (p?.vertical_asignada as VerticalTipo) || "ninguna";
                return (
                  <div
                    key={m.user_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-card gap-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {p?.nombre} {p?.apellido}
                      </p>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        Rol: {m.role}
                      </Badge>
                    </div>
                    <div className="w-full sm:w-64">
                      <Select
                        value={vertAsignada}
                        onValueChange={(val) => asignarMiembro(m.user_id, val as any)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Asignar vertical" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ninguna">Sin vertical (Común)</SelectItem>
                          {listaVerticales.map((v) => (
                            <SelectItem key={v.codigo} value={v.codigo}>
                              {v.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
