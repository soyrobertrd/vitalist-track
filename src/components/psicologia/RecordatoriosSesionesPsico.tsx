import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Plus } from "lucide-react";
import { toast } from "sonner";

interface Props { workspaceId: string }

export default function RecordatoriosSesionesPsico({ workspaceId }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    const { data } = await supabase
      .from("recordatorios_sesiones_psico")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("programado_para", { ascending: false })
      .limit(50);
    setRows(data || []);
  };

  useEffect(() => { if (workspaceId) fetch(); }, [workspaceId]);

  const programarAutomaticos = async () => {
    setLoading(true);
    const { data: sesiones } = await supabase
      .from("sesiones_psicologia")
      .select("id, paciente_id, fecha, hora")
      .eq("workspace_id", workspaceId)
      .gte("fecha", new Date().toISOString().slice(0, 10))
      .limit(100);
    if (!sesiones?.length) { toast.info("Sin sesiones futuras"); setLoading(false); return; }
    const inserts = sesiones.map(s => ({
      workspace_id: workspaceId,
      sesion_id: s.id,
      paciente_id: s.paciente_id,
      canal: "email",
      programado_para: new Date(`${s.fecha}T${s.hora || "09:00"}:00`).toISOString(),
    }));
    const { error } = await supabase.from("recordatorios_sesiones_psico").insert(inserts);
    if (error) toast.error(error.message); else { toast.success(`${inserts.length} recordatorios programados`); fetch(); }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5"/>Recordatorios automáticos</CardTitle>
        <Button size="sm" onClick={programarAutomaticos} disabled={loading}>
          <Plus className="h-4 w-4 mr-1"/>Programar próximas sesiones
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Canal</TableHead><TableHead>Programado</TableHead><TableHead>Estado</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.canal}</TableCell>
                <TableCell>{new Date(r.programado_para).toLocaleString()}</TableCell>
                <TableCell><Badge variant={r.estado === "enviado" ? "default" : r.estado === "fallido" ? "destructive" : "outline"}>{r.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin recordatorios</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
