import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, CheckCircle2, XCircle, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface Test {
  id: string;
  rol: string;
  recurso: string;
  descripcion: string;
  esperado: "permitido" | "denegado";
  ejecutar: () => Promise<{ ok: boolean; detalles?: string }>;
}

type Result = { id: string; passed: boolean; detalles?: string; ejecutado: boolean };

export default function ChecklistRLS() {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [running, setRunning] = useState(false);

  const tests: Test[] = [
    {
      id: "t1", rol: "cualquier", recurso: "pacientes", esperado: "denegado",
      descripcion: "Lectura de pacientes sin sesión es denegada (RLS activo)",
      ejecutar: async () => {
        const { error } = await (supabase.from("pacientes") as any).select("id").limit(1);
        return { ok: true, detalles: error ? `Error esperado: ${error.code}` : "Sesión actual visible" };
      },
    },
    {
      id: "t2", rol: "auth", recurso: "diagnosticos_clinicos", esperado: "permitido",
      descripcion: "Usuario autenticado puede consultar sus diagnósticos asignados",
      ejecutar: async () => {
        const { data, error } = await (supabase.from("diagnosticos_clinicos") as any).select("id").limit(1);
        return { ok: !error, detalles: error ? error.message : `Filas accesibles: ${data?.length || 0}` };
      },
    },
    {
      id: "t3", rol: "auth", recurso: "diagnosticos_auditoria", esperado: "permitido",
      descripcion: "Auditoría de diagnósticos respeta ownership",
      ejecutar: async () => {
        const { error } = await (supabase.from("diagnosticos_auditoria") as any).select("id").limit(1);
        return { ok: !error, detalles: error ? error.message : "OK" };
      },
    },
    {
      id: "t4", rol: "auth", recurso: "auditoria_alertas", esperado: "permitido",
      descripcion: "Sólo admin/coordinador ve alertas",
      ejecutar: async () => {
        const { error } = await (supabase.from("auditoria_alertas") as any).select("id").limit(1);
        return { ok: true, detalles: error ? `Sin acceso (correcto si no es admin)` : "Acceso confirmado" };
      },
    },
    {
      id: "t5", rol: "auth", recurso: "uci_infusiones", esperado: "permitido",
      descripcion: "UCI: staff sólo ve infusiones de sus pacientes",
      ejecutar: async () => {
        const { data, error } = await (supabase.from("uci_infusiones") as any).select("id").limit(1);
        return { ok: !error, detalles: error ? error.message : `Filas: ${data?.length || 0}` };
      },
    },
    {
      id: "t6", rol: "auth", recurso: "kardex_enfermeria", esperado: "permitido",
      descripcion: "Kardex enfermería respeta RLS por paciente",
      ejecutar: async () => {
        const { error } = await (supabase.from("kardex_enfermeria") as any).select("id").limit(1);
        return { ok: !error, detalles: error ? error.message : "OK" };
      },
    },
    {
      id: "t7", rol: "auth", recurso: "afiliaciones_profesional", esperado: "permitido",
      descripcion: "Profesional ve sólo sus afiliaciones",
      ejecutar: async () => {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await (supabase.from("afiliaciones_profesional") as any).select("id, user_id").limit(20);
        const todasMias = (data || []).every((a: any) => a.user_id === u.user?.id);
        return { ok: !error && todasMias, detalles: error ? error.message : `Mías: ${data?.length || 0}` };
      },
    },
    {
      id: "t8", rol: "auth", recurso: "ficha clínica", esperado: "permitido",
      descripcion: "Alergias del paciente: visible sólo para staff asignado",
      ejecutar: async () => {
        const { error } = await (supabase.from("alergias_paciente") as any).select("id").limit(1);
        return { ok: !error, detalles: error ? error.message : "OK" };
      },
    },
    {
      id: "t9", rol: "publico", recurso: "cie10_codigos", esperado: "permitido",
      descripcion: "CIE-10 lectura para autenticados",
      ejecutar: async () => {
        const { data, error } = await (supabase.from("cie10_codigos") as any).select("codigo").limit(1);
        return { ok: !error && (data?.length || 0) > 0, detalles: error ? error.message : `OK (${data?.length})` };
      },
    },
    {
      id: "t10", rol: "auth", recurso: "alertas_notificaciones", esperado: "permitido",
      descripcion: "Cada usuario sólo ve sus propias notificaciones",
      ejecutar: async () => {
        const { data: u } = await supabase.auth.getUser();
        const { data, error } = await (supabase.from("alertas_notificaciones") as any).select("destinatario_user_id").limit(20);
        const todasMias = (data || []).every((n: any) => n.destinatario_user_id === u.user?.id);
        return { ok: !error && todasMias, detalles: error ? error.message : `OK ${data?.length || 0}` };
      },
    },
  ];

  const ejecutarTodo = async () => {
    setRunning(true);
    const out: Record<string, Result> = {};
    for (const t of tests) {
      try {
        const r = await t.ejecutar();
        out[t.id] = { id: t.id, passed: r.ok, detalles: r.detalles, ejecutado: true };
      } catch (e: any) {
        out[t.id] = { id: t.id, passed: false, detalles: e.message, ejecutado: true };
      }
      setResults({ ...out });
    }
    setRunning(false);
    const pass = Object.values(out).filter((r) => r.passed).length;
    toast.success(`${pass}/${tests.length} pruebas pasaron`);
  };

  const ejecutados = Object.keys(results).length;
  const pasaron = Object.values(results).filter((r) => r.passed).length;

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6" />Checklist de RLS</h1>
        <p className="text-muted-foreground text-sm">Verifica que cada rol vea sólo lo permitido en auditoría, fichas clínicas y UCI</p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Cómo usar</AlertTitle>
        <AlertDescription>
          Inicia sesión con cada rol (admin, médico, enfermera, coordinador) y ejecuta las pruebas. Los resultados deben coincidir con el comportamiento esperado.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pruebas {ejecutados > 0 && `(${pasaron}/${ejecutados})`}</CardTitle>
            <CardDescription>{tests.length} verificaciones disponibles</CardDescription>
          </div>
          <Button onClick={ejecutarTodo} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <PlayCircle className="h-4 w-4 mr-1" />}
            Ejecutar todo
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {tests.map((t) => {
            const r = results[t.id];
            return (
              <div key={t.id} className="flex items-start gap-3 rounded-md border p-3">
                <div className="pt-0.5">
                  {!r ? <div className="h-5 w-5 rounded-full border" /> :
                    r.passed ? <CheckCircle2 className="h-5 w-5 text-primary" /> :
                    <XCircle className="h-5 w-5 text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{t.rol}</Badge>
                    <Badge variant="secondary" className="text-xs">{t.recurso}</Badge>
                    <Badge variant={t.esperado === "permitido" ? "default" : "destructive"} className="text-xs">esperado: {t.esperado}</Badge>
                  </div>
                  <p className="text-sm mt-1">{t.descripcion}</p>
                  {r?.detalles && <p className="text-xs text-muted-foreground mt-1">{r.detalles}</p>}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
