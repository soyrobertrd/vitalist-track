import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Send, MessageSquare, Mail, BarChart3 } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const CANALES = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "email", label: "Email", icon: Mail },
  { value: "sms", label: "SMS", icon: Send },
  { value: "instagram", label: "Instagram", icon: Send },
];

export default function VerticalMarketingTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: "", canal: "whatsapp", mensaje_plantilla: "" });

  const { data: campanas = [], refetch } = useQuery({
    queryKey: ["campanas_marketing_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("campanas_marketing_vertical") as any).select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: mensajes = [] } = useQuery({
    queryKey: ["mensajes_whatsapp_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("mensajes_whatsapp_vertical") as any).select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo).order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.nombre) return;
    const { error } = await (supabase.from("campanas_marketing_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo, nombre: form.nombre,
      canal: form.canal, mensaje_plantilla: form.mensaje_plantilla || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Campaña creada");
    setOpen(false);
    setForm({ nombre: "", canal: "whatsapp", mensaje_plantilla: "" });
    refetch();
  };

  const estadoBadge = (estado: string) => {
    const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      borrador: "secondary", programada: "outline", enviando: "default", completada: "default", cancelada: "destructive",
    };
    return <Badge variant={map[estado] || "secondary"}>{estado}</Badge>;
  };

  return (
    <Tabs defaultValue="campanas" className="space-y-4">
      <TabsList>
        <TabsTrigger value="campanas"><BarChart3 className="h-4 w-4 mr-1" />Campañas</TabsTrigger>
        <TabsTrigger value="whatsapp"><MessageSquare className="h-4 w-4 mr-1" />WhatsApp</TabsTrigger>
      </TabsList>

      <TabsContent value="campanas" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Campañas de Marketing</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva campaña</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva campaña</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
                <div>
                  <Label>Canal</Label>
                  <Select value={form.canal} onValueChange={v => setForm({ ...form, canal: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CANALES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Plantilla del mensaje</Label><Textarea value={form.mensaje_plantilla} onChange={e => setForm({ ...form, mensaje_plantilla: e.target.value })} rows={4} placeholder="Hola {nombre}, te recordamos tu cita..." /></div>
                <Button onClick={crear}>Crear campaña</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaña</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Enviados</TableHead>
                <TableHead>Abiertos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campanas.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell><Badge variant="outline">{c.canal}</Badge></TableCell>
                  <TableCell>{estadoBadge(c.estado)}</TableCell>
                  <TableCell>{c.enviados}/{c.destinatarios_total}</TableCell>
                  <TableCell>{c.abiertos}</TableCell>
                </TableRow>
              ))}
              {!campanas.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin campañas</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>

      <TabsContent value="whatsapp" className="space-y-4">
        <h3 className="text-lg font-semibold">Mensajes WhatsApp</h3>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teléfono</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mensajes.map((m: any) => (
                <TableRow key={m.id}>
                  <TableCell>{m.telefono}</TableCell>
                  <TableCell><Badge variant="outline">{m.tipo}</Badge></TableCell>
                  <TableCell className="max-w-[200px] truncate">{m.mensaje}</TableCell>
                  <TableCell><Badge variant={m.estado === "enviado" || m.estado === "entregado" ? "default" : m.estado === "fallido" ? "destructive" : "secondary"}>{m.estado}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {!mensajes.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin mensajes</TableCell></TableRow>}
            </TableBody>
          </Table>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
