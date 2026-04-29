import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield, Bell, Save, AlertTriangle } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { MobilePageHeader } from "@/components/MobilePageHeader";

const SEVERIDADES = [
  { key: "baja", label: "Baja", color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  { key: "media", label: "Media", color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  { key: "alta", label: "Alta", color: "bg-orange-500/10 text-orange-700 border-orange-500/30" },
  { key: "critica", label: "Crítica", color: "bg-red-500/10 text-red-700 border-red-500/30" },
];

const ROLES = ["owner", "admin", "coordinador"];

interface Cfg {
  hora_nocturna_inicio: number;
  hora_nocturna_fin: number;
  umbral_fuera_horario: number;
  umbral_acceso_masivo: number;
  umbral_descargas: number;
  umbral_cambios_criticos: number;
  ventana_horas_acceso_masivo: number;
  detectar_cambios_criticos: boolean;
}

interface Ruteo {
  id?: string;
  severidad: string;
  roles: string[];
  canal_inapp: boolean;
  canal_email: boolean;
  activo: boolean;
}

const DEFAULT_CFG: Cfg = {
  hora_nocturna_inicio: 22,
  hora_nocturna_fin: 6,
  umbral_fuera_horario: 3,
  umbral_acceso_masivo: 50,
  umbral_descargas: 20,
  umbral_cambios_criticos: 10,
  ventana_horas_acceso_masivo: 1,
  detectar_cambios_criticos: true,
};

export default function ConfiguracionAuditoria() {
  const { activeWorkspace } = useWorkspace();
  const [cfg, setCfg] = useState<Cfg>(DEFAULT_CFG);
  const [cfgId, setCfgId] = useState<string | null>(null);
  const [ruteos, setRuteos] = useState<Record<string, Ruteo>>({});
  const [saving, setSaving] = useState(false);

  const wsId = activeWorkspace?.id || null;

  useEffect(() => {
    if (!wsId) return;
    (async () => {
      const { data: c } = await (supabase.from("auditoria_config") as any)
        .select("*").eq("workspace_id", wsId).maybeSingle();
      if (c) {
        setCfgId(c.id);
        setCfg({
          hora_nocturna_inicio: c.hora_nocturna_inicio,
          hora_nocturna_fin: c.hora_nocturna_fin,
          umbral_fuera_horario: c.umbral_fuera_horario,
          umbral_acceso_masivo: c.umbral_acceso_masivo,
          umbral_descargas: c.umbral_descargas,
          umbral_cambios_criticos: c.umbral_cambios_criticos,
          ventana_horas_acceso_masivo: c.ventana_horas_acceso_masivo,
          detectar_cambios_criticos: c.detectar_cambios_criticos,
        });
      }

      const { data: rs } = await (supabase.from("alertas_ruteo") as any)
        .select("*").eq("workspace_id", wsId);
      const map: Record<string, Ruteo> = {};
      SEVERIDADES.forEach((s) => {
        const found = (rs as any[] | null)?.find((r) => r.severidad === s.key);
        map[s.key] = found ? {
          id: found.id, severidad: s.key, roles: found.roles, canal_inapp: found.canal_inapp,
          canal_email: found.canal_email, activo: found.activo,
        } : {
          severidad: s.key,
          roles: s.key === "critica" ? ["owner", "admin"] : ["owner", "admin"],
          canal_inapp: true,
          canal_email: false,
          activo: true,
        };
      });
      setRuteos(map);
    })();
  }, [wsId]);

  const guardarCfg = async () => {
    if (!wsId) return;
    setSaving(true);
    const payload: any = { workspace_id: wsId, ...cfg };
    const { error } = cfgId
      ? await (supabase.from("auditoria_config") as any).update(payload).eq("id", cfgId)
      : await (supabase.from("auditoria_config") as any).insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Umbrales guardados");
  };

  const toggleRol = (sev: string, rol: string) => {
    setRuteos((prev) => {
      const r = prev[sev];
      const has = r.roles.includes(rol);
      return { ...prev, [sev]: { ...r, roles: has ? r.roles.filter((x) => x !== rol) : [...r.roles, rol] } };
    });
  };

  const guardarRuteos = async () => {
    if (!wsId) return;
    setSaving(true);
    for (const sev of Object.keys(ruteos)) {
      const r = ruteos[sev];
      const payload: any = {
        workspace_id: wsId,
        severidad: sev,
        roles: r.roles,
        canal_inapp: r.canal_inapp,
        canal_email: r.canal_email,
        activo: r.activo,
      };
      if (r.id) {
        await (supabase.from("alertas_ruteo") as any).update(payload).eq("id", r.id);
      } else {
        await (supabase.from("alertas_ruteo") as any).insert(payload);
      }
    }
    setSaving(false);
    toast.success("Ruteo de alertas guardado");
  };

  if (!wsId) return <p className="p-6 text-muted-foreground">Selecciona un workspace para configurar.</p>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <MobilePageHeader title="Configuración de Auditoría" description="Umbrales y ruteo de alertas" />
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-7 w-7" /> Configuración de Auditoría
        </h1>
        <p className="text-muted-foreground">Define umbrales de detección y a quién enrutar las alertas según su severidad.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Umbrales de detección</CardTitle>
          <CardDescription>Cómo se clasifican y disparan las alertas sospechosas.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Inicio horario nocturno (hora 0-23)</Label>
            <Input type="number" min={0} max={23} value={cfg.hora_nocturna_inicio}
              onChange={(e) => setCfg({ ...cfg, hora_nocturna_inicio: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Fin horario nocturno (hora 0-23)</Label>
            <Input type="number" min={0} max={23} value={cfg.hora_nocturna_fin}
              onChange={(e) => setCfg({ ...cfg, hora_nocturna_fin: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Umbral accesos fuera de horario (24h)</Label>
            <Input type="number" min={1} value={cfg.umbral_fuera_horario}
              onChange={(e) => setCfg({ ...cfg, umbral_fuera_horario: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Ventana acceso masivo (horas)</Label>
            <Input type="number" min={1} value={cfg.ventana_horas_acceso_masivo}
              onChange={(e) => setCfg({ ...cfg, ventana_horas_acceso_masivo: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Umbral pacientes distintos / ventana</Label>
            <Input type="number" min={1} value={cfg.umbral_acceso_masivo}
              onChange={(e) => setCfg({ ...cfg, umbral_acceso_masivo: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Umbral exportaciones / 24h</Label>
            <Input type="number" min={1} value={cfg.umbral_descargas}
              onChange={(e) => setCfg({ ...cfg, umbral_descargas: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Umbral cambios críticos / hora</Label>
            <Input type="number" min={1} value={cfg.umbral_cambios_criticos}
              onChange={(e) => setCfg({ ...cfg, umbral_cambios_criticos: Number(e.target.value) })} />
          </div>
          <div className="flex items-center justify-between rounded border px-3">
            <Label className="m-0">Detectar cambios críticos</Label>
            <Switch checked={cfg.detectar_cambios_criticos}
              onCheckedChange={(v) => setCfg({ ...cfg, detectar_cambios_criticos: v })} />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button onClick={guardarCfg} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> Guardar umbrales
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Ruteo de alertas por severidad</CardTitle>
          <CardDescription>Define qué roles reciben cada tipo de alerta y por qué canales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SEVERIDADES.map((s) => {
            const r = ruteos[s.key];
            if (!r) return null;
            return (
              <div key={s.key} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Badge variant="outline" className={s.color}>{s.label}</Badge>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Activo</Label>
                    <Switch checked={r.activo} onCheckedChange={(v) =>
                      setRuteos({ ...ruteos, [s.key]: { ...r, activo: v } })} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Roles destinatarios</Label>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {ROLES.map((rol) => (
                      <label key={rol} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={r.roles.includes(rol)} onCheckedChange={() => toggleRol(s.key, rol)} />
                        <span className="capitalize">{rol}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={r.canal_inapp} onCheckedChange={(v) =>
                      setRuteos({ ...ruteos, [s.key]: { ...r, canal_inapp: v } })} />
                    Canal in-app
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch checked={r.canal_email} onCheckedChange={(v) =>
                      setRuteos({ ...ruteos, [s.key]: { ...r, canal_email: v } })} />
                    Canal email
                  </label>
                </div>
              </div>
            );
          })}
          <div className="flex justify-end">
            <Button onClick={guardarRuteos} disabled={saving}>
              <Save className="h-4 w-4 mr-2" /> Guardar ruteo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
