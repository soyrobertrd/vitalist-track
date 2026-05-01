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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Plug, MessageSquare, Calendar, CreditCard, TestTube, Mail, BarChart3 } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const INTEGRACIONES = [
  { tipo: "whatsapp_api", label: "WhatsApp Business API", icon: MessageSquare, desc: "Mensajes automáticos, recordatorios, confirmaciones" },
  { tipo: "google_calendar", label: "Google Calendar", icon: Calendar, desc: "Sincronización bidireccional de citas" },
  { tipo: "lab_hl7", label: "Laboratorio HL7", icon: TestTube, desc: "Resultados de laboratorio automatizados" },
  { tipo: "stripe", label: "Stripe", icon: CreditCard, desc: "Pagos con tarjeta internacionales" },
  { tipo: "cardnet", label: "CardNET", icon: CreditCard, desc: "Pagos con tarjeta locales RD" },
  { tipo: "paypal", label: "PayPal", icon: CreditCard, desc: "Pagos internacionales alternativos" },
  { tipo: "mailchimp", label: "Mailchimp", icon: Mail, desc: "Email marketing y newsletters" },
  { tipo: "meta_ads", label: "Meta Ads", icon: BarChart3, desc: "Tracking de leads desde Facebook/Instagram" },
];

export default function VerticalIntegracionesTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tipo_integracion: "whatsapp_api", nombre: "" });

  const { data: integraciones = [], refetch } = useQuery({
    queryKey: ["integraciones_externas_vertical", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("integraciones_externas_vertical") as any)
        .select("*").eq("workspace_id", wsId!).eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const crear = async () => {
    if (!wsId || !form.nombre) return;
    const { error } = await (supabase.from("integraciones_externas_vertical") as any).insert({
      workspace_id: wsId, vertical_tipo: verticalTipo,
      tipo_integracion: form.tipo_integracion, nombre: form.nombre,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Integración configurada");
    setOpen(false);
    setForm({ tipo_integracion: "whatsapp_api", nombre: "" });
    refetch();
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    const { error } = await (supabase.from("integraciones_externas_vertical") as any).update({ activo: !activo }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    refetch();
  };

  const activas = integraciones.filter((i: any) => i.activo).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3 text-center"><div className="text-2xl font-bold">{integraciones.length}</div><div className="text-xs text-muted-foreground">Integraciones</div></Card>
        <Card className="p-3 text-center"><div className="text-2xl font-bold text-green-600">{activas}</div><div className="text-xs text-muted-foreground">Activas</div></Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Integraciones Externas</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nueva integración</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Configurar integración</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo_integracion} onValueChange={v => setForm({ ...form, tipo_integracion: v, nombre: INTEGRACIONES.find(i => i.tipo === v)?.label || "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTEGRACIONES.map(i => <SelectItem key={i.tipo} value={i.tipo}>{i.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Nombre</Label><Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} /></div>
              <p className="text-sm text-muted-foreground">{INTEGRACIONES.find(i => i.tipo === form.tipo_integracion)?.desc}</p>
              <Button onClick={crear}><Plug className="h-4 w-4 mr-1" />Configurar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {INTEGRACIONES.map(integ => {
          const configured = integraciones.filter((i: any) => i.tipo_integracion === integ.tipo);
          const Icon = integ.icon;
          return (
            <Card key={integ.tipo} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><Icon className="h-5 w-5" /></div>
                  <div>
                    <h4 className="font-medium">{integ.label}</h4>
                    <p className="text-xs text-muted-foreground">{integ.desc}</p>
                  </div>
                </div>
                {configured.length > 0 ? (
                  <Switch checked={configured[0].activo} onCheckedChange={() => toggleActivo(configured[0].id, configured[0].activo)} />
                ) : (
                  <Badge variant="secondary">No configurada</Badge>
                )}
              </div>
              {configured.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Último sync: {configured[0].ultimo_sync ? new Date(configured[0].ultimo_sync).toLocaleString() : "Nunca"}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
