import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MessageSquare, Mail, Phone, Bell, Send, Plus, Megaphone } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const canalIcons: Record<string, typeof Mail> = { email: Mail, whatsapp: MessageSquare, sms: Phone, push: Bell };

export default function VerticalComunicacionesTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();

  const [showPlantilla, setShowPlantilla] = useState(false);
  const [pNombre, setPNombre] = useState("");
  const [pCanal, setPCanal] = useState("email");
  const [pAsunto, setPAsunto] = useState("");
  const [pContenido, setPContenido] = useState("");
  const [pEvento, setPEvento] = useState("");

  const { data: mensajes = [] } = useQuery({
    queryKey: ["comunicaciones_multicanal", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("comunicaciones_multicanal") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: plantillas = [] } = useQuery({
    queryKey: ["plantillas_comunicacion", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("plantillas_comunicacion") as any)
        .select("*").eq("workspace_id", wsId!).order("nombre");
      return (data || []).filter((p: any) => !p.vertical_tipo || p.vertical_tipo === verticalTipo);
    },
  });

  const { data: campanas = [] } = useQuery({
    queryKey: ["campanas_comunicacion", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("campanas_comunicacion") as any)
        .select("*").eq("workspace_id", wsId!).order("created_at", { ascending: false });
      return (data || []).filter((c: any) => !c.vertical_tipo || c.vertical_tipo === verticalTipo);
    },
  });

  const crearPlantilla = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("plantillas_comunicacion") as any).insert({
        workspace_id: wsId, vertical_tipo: verticalTipo, nombre: pNombre, canal: pCanal,
        evento: pEvento || null, asunto_template: pAsunto || null, contenido_template: pContenido,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Plantilla creada");
      qc.invalidateQueries({ queryKey: ["plantillas_comunicacion"] });
      setShowPlantilla(false);
      setPNombre(""); setPCanal("email"); setPAsunto(""); setPContenido(""); setPEvento("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const estadoColor: Record<string, string> = {
    enviado: "bg-green-100 text-green-800", pendiente: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800", entregado: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comunicaciones Multicanal</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {["email", "whatsapp", "sms", "push"].map(canal => {
          const Icon = canalIcons[canal] || Mail;
          const count = mensajes.filter((m: any) => m.canal === canal).length;
          return (
            <Card key={canal} className="p-4">
              <div className="flex items-center gap-2 mb-1"><Icon className="h-4 w-4" /><span className="text-xs text-muted-foreground capitalize">{canal}</span></div>
              <p className="text-2xl font-bold">{count}</p>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="mensajes">
        <TabsList>
          <TabsTrigger value="mensajes">Mensajes</TabsTrigger>
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="campanas">Campañas</TabsTrigger>
        </TabsList>

        <TabsContent value="mensajes">
          {mensajes.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Canal</TableHead><TableHead>Asunto</TableHead><TableHead>Destinatario</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mensajes.slice(0, 20).map((m: any) => {
                    const Icon = canalIcons[m.canal] || Mail;
                    return (
                      <TableRow key={m.id}>
                        <TableCell><Icon className="h-4 w-4" /></TableCell>
                        <TableCell className="font-medium">{m.asunto || m.contenido?.substring(0, 40)}</TableCell>
                        <TableCell className="text-sm">{m.destinatario_contacto || "—"}</TableCell>
                        <TableCell><Badge className={estadoColor[m.estado] || ""}>{m.estado}</Badge></TableCell>
                        <TableCell className="text-sm">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="p-8 text-center"><Send className="h-8 w-8 mx-auto mb-2 text-muted-foreground" /><p className="text-muted-foreground">No hay mensajes enviados aún.</p></Card>
          )}
        </TabsContent>

        <TabsContent value="plantillas">
          <div className="flex justify-end mb-3">
            <Dialog open={showPlantilla} onOpenChange={setShowPlantilla}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva plantilla</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear plantilla</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nombre</Label><Input value={pNombre} onChange={e => setPNombre(e.target.value)} placeholder="Recordatorio de cita" /></div>
                  <div><Label>Canal</Label>
                    <Select value={pCanal} onValueChange={setPCanal}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Evento (opcional)</Label><Input value={pEvento} onChange={e => setPEvento(e.target.value)} placeholder="cita_confirmada" /></div>
                  <div><Label>Asunto</Label><Input value={pAsunto} onChange={e => setPAsunto(e.target.value)} placeholder="Recordatorio: su cita es mañana" /></div>
                  <div><Label>Contenido</Label><Textarea value={pContenido} onChange={e => setPContenido(e.target.value)} placeholder="Hola {{nombre}}, le recordamos..." rows={4} /></div>
                  <Button onClick={() => crearPlantilla.mutate()} disabled={!pNombre || !pContenido}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-2">
            {plantillas.map((p: any) => (
              <Card key={p.id} className="p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{p.nombre}</p>
                    <p className="text-xs text-muted-foreground">{p.canal} · {p.evento || "sin evento"}</p>
                  </div>
                  <Badge variant={p.activo ? "default" : "secondary"}>{p.activo ? "Activa" : "Inactiva"}</Badge>
                </div>
              </Card>
            ))}
            {plantillas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin plantillas configuradas.</p>}
          </div>
        </TabsContent>

        <TabsContent value="campanas">
          <div className="grid gap-2">
            {campanas.map((c: any) => (
              <Card key={c.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium flex items-center gap-2"><Megaphone className="h-4 w-4" /> {c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.canal} · {c.tipo}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={c.estado === "enviada" ? "default" : "secondary"}>{c.estado}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.enviados} enviados · {c.entregados} entregados · {c.abiertos} abiertos
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {campanas.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin campañas creadas.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
