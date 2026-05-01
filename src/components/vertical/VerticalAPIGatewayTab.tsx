import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key, Webhook, ScrollText, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Props { verticalTipo: string; }

export default function VerticalAPIGatewayTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;

  const { data: apiKeys = [] } = useQuery({
    queryKey: ["api_keys_externas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("api_keys_externas")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: webhooks = [] } = useQuery({
    queryKey: ["webhooks_config", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("webhooks_config")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["webhooks_log", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("webhooks_log")
        .select("*, webhooks_config(nombre)")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  return (
    <Tabs defaultValue="apikeys" className="space-y-4">
      <TabsList>
        <TabsTrigger value="apikeys"><Key className="h-4 w-4 mr-1" /> API Keys</TabsTrigger>
        <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-1" /> Webhooks</TabsTrigger>
        <TabsTrigger value="logs"><ScrollText className="h-4 w-4 mr-1" /> Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="apikeys" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Generar API Key</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Prefijo</TableHead>
              <TableHead>Permisos</TableHead>
              <TableHead>Rate Limit</TableHead>
              <TableHead>Requests</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((k: any) => (
              <TableRow key={k.id}>
                <TableCell className="font-medium">{k.nombre}</TableCell>
                <TableCell className="font-mono text-xs">{k.key_prefix}...</TableCell>
                <TableCell>{Array.isArray(k.permisos) ? k.permisos.join(", ") : "read"}</TableCell>
                <TableCell>{k.rate_limit_por_minuto}/min</TableCell>
                <TableCell className="font-mono">{k.total_requests}</TableCell>
                <TableCell><Badge className={k.activa ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{k.activa ? "Activa" : "Revocada"}</Badge></TableCell>
              </TableRow>
            ))}
            {apiKeys.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin API keys</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="webhooks" className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Webhook</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {webhooks.map((w: any) => (
            <Card key={w.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{w.nombre}</CardTitle>
                  <Badge className={w.activo ? "bg-green-100 text-green-800" : "bg-muted"}>{w.activo ? "Activo" : "Inactivo"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-mono text-xs truncate">{w.url}</p>
                <div className="flex flex-wrap gap-1">
                  {(w.eventos || []).map((e: string) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                </div>
                {w.fallos_consecutivos > 0 && <p className="text-xs text-red-600">{w.fallos_consecutivos} fallos consecutivos</p>}
              </CardContent>
            </Card>
          ))}
          {webhooks.length === 0 && <p className="text-sm text-muted-foreground col-span-2 py-8 text-center">Sin webhooks configurados</p>}
        </div>
      </TabsContent>

      <TabsContent value="logs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Webhook</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duración</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Resultado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell>{(l as any).webhooks_config?.nombre || "—"}</TableCell>
                <TableCell className="font-mono text-xs">{l.evento}</TableCell>
                <TableCell className="font-mono">{l.status_code || "—"}</TableCell>
                <TableCell>{l.duracion_ms ? `${l.duracion_ms}ms` : "—"}</TableCell>
                <TableCell>{format(new Date(l.created_at), "dd/MM HH:mm", { locale: es })}</TableCell>
                <TableCell><Badge className={l.exitoso ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>{l.exitoso ? "OK" : "Error"}</Badge></TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sin logs</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
