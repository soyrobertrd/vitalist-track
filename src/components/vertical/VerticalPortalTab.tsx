import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Link2, Copy } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

export default function VerticalPortalTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [pacienteId, setPacienteId] = useState("");

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes_portal_v", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("pacientes") as any).select("id, nombre, apellido").eq("workspace_id", wsId!).eq("activo", true).order("nombre").limit(500);
      return data || [];
    },
  });

  const { data: tokens = [], refetch } = useQuery({
    queryKey: ["portal_paciente_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("portal_paciente_vertical") as any).select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const generar = async () => {
    if (!wsId || !pacienteId) { toast.error("Seleccione un paciente"); return; }
    const { error } = await (supabase.from("portal_paciente_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo, paciente_id: pacienteId,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Token generado");
    setPacienteId("");
    refetch();
  };

  const copiar = (token: string) => {
    const url = `${window.location.origin}/portal-vertical?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Portal del Paciente</h3>
      </div>

      <Card className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label>Paciente</Label>
            <Select value={pacienteId} onValueChange={setPacienteId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
              <SelectContent>
                {pacientes.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido || ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generar} size="sm"><Link2 className="h-4 w-4 mr-1" /> Generar enlace</Button>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead>Usado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((t: any) => {
              const expirado = new Date(t.expira_en) < new Date();
              return (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.token.slice(0, 12)}...</TableCell>
                  <TableCell>
                    <span className={expirado ? "text-destructive" : ""}>{new Date(t.expira_en).toLocaleDateString()}</span>
                    {expirado && <Badge variant="destructive" className="ml-2 text-xs">Expirado</Badge>}
                  </TableCell>
                  <TableCell>{t.usado ? <Badge>Sí</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => copiar(t.token)}><Copy className="h-3 w-3 mr-1" />Copiar</Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!tokens.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin tokens generados</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
