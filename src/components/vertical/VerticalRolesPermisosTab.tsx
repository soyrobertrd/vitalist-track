import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, Plus, Users, Clock, Trash2 } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const modulosPermisos = [
  "pacientes", "citas", "facturacion", "inventario", "reportes",
  "marketing", "comunicaciones", "configuracion", "personal",
];

export default function VerticalRolesPermisosTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [permisos, setPermisos] = useState<Record<string, { ver: boolean; crear: boolean; editar: boolean; eliminar: boolean }>>({});

  const { data: roles = [] } = useQuery({
    queryKey: ["roles_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("roles_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("nombre");
      return data || [];
    },
  });

  const { data: delegaciones = [] } = useQuery({
    queryKey: ["delegaciones_acceso_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("delegaciones_acceso_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).eq("activo", true).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const crearRol = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("roles_vertical") as any).insert({
        workspace_id: wsId, vertical_tipo: verticalTipo, nombre, descripcion: descripcion || null, permisos,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rol creado");
      qc.invalidateQueries({ queryKey: ["roles_vertical"] });
      setShowCreate(false);
      setNombre("");
      setDescripcion("");
      setPermisos({});
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePermiso = (modulo: string, accion: "ver" | "crear" | "editar" | "eliminar") => {
    setPermisos(prev => ({
      ...prev,
      [modulo]: { ...prev[modulo], [accion]: !(prev[modulo]?.[accion] ?? false) },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Shield className="h-5 w-5" /> Roles y Permisos</h3>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo rol</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Crear rol personalizado</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre</Label><Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Recepcionista" /></div>
              <div><Label>Descripción</Label><Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción del rol..." /></div>
              <div>
                <Label className="mb-2 block">Permisos por módulo</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead><TableHead>Ver</TableHead><TableHead>Crear</TableHead><TableHead>Editar</TableHead><TableHead>Eliminar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modulosPermisos.map(m => (
                      <TableRow key={m}>
                        <TableCell className="capitalize font-medium">{m}</TableCell>
                        {(["ver", "crear", "editar", "eliminar"] as const).map(a => (
                          <TableCell key={a}><Switch checked={permisos[m]?.[a] ?? false} onCheckedChange={() => togglePermiso(m, a)} /></TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={() => crearRol.mutate()} disabled={!nombre}>Guardar rol</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {roles.map((r: any) => (
          <Card key={r.id}>
            <CardContent className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium flex items-center gap-2">{r.nombre} {!r.activo && <Badge variant="secondary">Inactivo</Badge>}</p>
                {r.descripcion && <p className="text-sm text-muted-foreground">{r.descripcion}</p>}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {Object.entries(r.permisos || {}).map(([mod, perm]: [string, any]) => {
                    const acts = Object.entries(perm || {}).filter(([, v]) => v).map(([k]) => k[0].toUpperCase());
                    return acts.length > 0 ? <Badge key={mod} variant="outline" className="text-xs">{mod}: {acts.join("")}</Badge> : null;
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
        {roles.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay roles personalizados. Crea uno para definir permisos granulares.</p>}
      </div>

      {delegaciones.length > 0 && (
        <>
          <h4 className="text-sm font-semibold flex items-center gap-2 mt-6"><Clock className="h-4 w-4" /> Delegaciones activas</h4>
          <div className="grid gap-2">
            {delegaciones.map((d: any) => (
              <Card key={d.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm">
                    <p>Delegación temporal</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.inicio).toLocaleDateString()} → {new Date(d.fin).toLocaleDateString()}</p>
                    {d.motivo && <p className="text-xs text-muted-foreground">{d.motivo}</p>}
                  </div>
                  <Badge variant={new Date(d.fin) > new Date() ? "default" : "secondary"}>{new Date(d.fin) > new Date() ? "Vigente" : "Expirada"}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
