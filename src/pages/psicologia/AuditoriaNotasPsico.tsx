import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { format } from "date-fns";

export default function AuditoriaNotasPsico() {
  const { data: rows = [] } = useQuery({
    queryKey: ["notas_psico_audit"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notas_psicologia_accesos")
        .select("*, notas_psicologia(paciente_id, tipo_nota)")
        .order("created_at", { ascending: false })
        .limit(500);
      return (data as any) || [];
    },
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" /> Bitácora de acceso a notas psicológicas
      </h1>
      <p className="text-sm text-muted-foreground">
        Registro inmutable de quién ha leído cada nota privada. Solo admins y supervisores pueden ver esta página.
      </p>
      <Card>
        <CardHeader><CardTitle>Últimos 500 accesos</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Usuario</th>
                  <th className="text-left p-2">Acción</th>
                  <th className="text-left p-2">Tipo nota</th>
                  <th className="text-left p-2">Paciente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any) => (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 text-xs">{format(new Date(r.created_at), "dd/MM/yyyy HH:mm")}</td>
                    <td className="p-2 text-xs"><code>{r.user_id?.slice(0,8)}</code></td>
                    <td className="p-2">{r.accion}</td>
                    <td className="p-2 text-xs">{r.notas_psicologia?.tipo_nota ?? "-"}</td>
                    <td className="p-2 text-xs"><code>{r.notas_psicologia?.paciente_id?.slice(0,8)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
