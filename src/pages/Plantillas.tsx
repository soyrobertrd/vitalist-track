import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MessageCircle, Mail, Eye } from "lucide-react";
import { renderPlantilla, type PlantillaWhatsApp } from "@/lib/whatsappService";
import { useUserRole } from "@/hooks/useUserRole";

const CATEGORIAS_WA = [
  { value: "recordatorio_cita", label: "Recordatorio de cita" },
  { value: "confirmacion_cita", label: "Confirmación de cita" },
  { value: "cobro_pendiente", label: "Cobro pendiente" },
  { value: "visita_en_camino", label: "Visita en camino" },
  { value: "custom", label: "Personalizada" },
] as const;

const TIPOS_EMAIL = [
  { value: "recordatorio", label: "Recordatorio" },
  { value: "bienvenida", label: "Bienvenida" },
  { value: "confirmacion", label: "Confirmación" },
  { value: "encuesta", label: "Encuesta" },
  { value: "resumen", label: "Resumen" },
  { value: "otro", label: "Otro" },
];

const VARIABLES_WA = [
  "paciente_nombre",
  "paciente_apellido",
  "profesional_nombre",
  "profesional_especialidad",
  "tipo_visita",
  "fecha",
  "hora",
  "fecha_vencimiento",
  "numero_factura",
  "monto",
  "tiempo_estimado",
];

const VARIABLES_EMAIL = [
  "{{Paciente_Nombre}}",
  "{{Cita_Fecha}}",
  "{{Cita_Hora}}",
  "{{Profesional_Nombre}}",
  "{{Profesional_Especialidad}}",
  "{{Sede_Direccion}}",
  "{{Telefono_Centro}}",
  "{{URL_Confirmar}}",
  "{{URL_Reagendar}}",
  "{{Logo_URL}}",
  "{{Nombre_Centro}}",
];

interface PlantillaCorreo {
  id: string;
  nombre: string;
  asunto: string;
  contenido_html: string;
  tipo: string;
  categoria: string | null;
  activo: boolean;
  version: number;
}

const Plantillas = () => {
  const { isAdmin } = useUserRole();

  // ============ WHATSAPP ============
  const [whatsapp, setWhatsapp] = useState<PlantillaWhatsApp[]>([]);
  const [loadingWA, setLoadingWA] = useState(true);
  const [openWA, setOpenWA] = useState(false);
  const [editingWA, setEditingWA] = useState<PlantillaWhatsApp | null>(null);
  const [formWA, setFormWA] = useState({
    nombre: "",
    descripcion: "",
    categoria: "custom" as PlantillaWhatsApp["categoria"],
    contenido: "",
    destinatario_default: "paciente" as PlantillaWhatsApp["destinatario_default"],
    activo: true,
  });

  // ============ EMAIL ============
  const [emails, setEmails] = useState<PlantillaCorreo[]>([]);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [openEmail, setOpenEmail] = useState(false);
  const [previewEmail, setPreviewEmail] = useState<PlantillaCorreo | null>(null);
  const [editingEmail, setEditingEmail] = useState<PlantillaCorreo | null>(null);
  const [formEmail, setFormEmail] = useState({
    nombre: "",
    asunto: "",
    contenido_html: "",
    tipo: "recordatorio",
    categoria: "externa",
    activo: true,
  });

  // ============ LOAD ============
  const cargarWA = async () => {
    setLoadingWA(true);
    const { data, error } = await supabase
      .from("plantillas_whatsapp")
      .select("*")
      .order("categoria")
      .order("nombre");
    if (error) toast.error("Error cargando plantillas WhatsApp");
    else setWhatsapp((data ?? []) as unknown as PlantillaWhatsApp[]);
    setLoadingWA(false);
  };

  const cargarEmails = async () => {
    setLoadingEmail(true);
    const { data, error } = await supabase
      .from("plantillas_correo")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Error cargando plantillas de correo");
    else setEmails((data ?? []) as PlantillaCorreo[]);
    setLoadingEmail(false);
  };

  useEffect(() => {
    cargarWA();
    cargarEmails();
  }, []);

  // ============ WA HANDLERS ============
  const resetFormWA = () => {
    setFormWA({
      nombre: "",
      descripcion: "",
      categoria: "custom",
      contenido: "",
      destinatario_default: "paciente",
      activo: true,
    });
    setEditingWA(null);
  };

  const editarWA = (p: PlantillaWhatsApp) => {
    setEditingWA(p);
    setFormWA({
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      categoria: p.categoria,
      contenido: p.contenido,
      destinatario_default: p.destinatario_default,
      activo: p.activo,
    });
    setOpenWA(true);
  };

  const guardarWA = async () => {
    if (!formWA.nombre.trim() || !formWA.contenido.trim()) {
      toast.error("Nombre y contenido son obligatorios");
      return;
    }
    const variables = Array.from(
      new Set([...formWA.contenido.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))
    );
    const payload = {
      nombre: formWA.nombre.trim(),
      descripcion: formWA.descripcion.trim() || null,
      categoria: formWA.categoria,
      contenido: formWA.contenido,
      destinatario_default: formWA.destinatario_default,
      activo: formWA.activo,
      variables,
    };
    if (editingWA) {
      const { error } = await supabase
        .from("plantillas_whatsapp")
        .update({ ...payload, version: editingWA.version + 1 })
        .eq("id", editingWA.id);
      if (error) return toast.error("Error al actualizar");
      toast.success("Plantilla actualizada");
    } else {
      const { error } = await supabase.from("plantillas_whatsapp").insert(payload);
      if (error) return toast.error("Error al crear");
      toast.success("Plantilla creada");
    }
    setOpenWA(false);
    resetFormWA();
    cargarWA();
  };

  const eliminarWA = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    const { error } = await supabase.from("plantillas_whatsapp").delete().eq("id", id);
    if (error) return toast.error("Error al eliminar");
    toast.success("Plantilla eliminada");
    cargarWA();
  };

  // ============ EMAIL HANDLERS ============
  const resetFormEmail = () => {
    setFormEmail({
      nombre: "",
      asunto: "",
      contenido_html: "",
      tipo: "recordatorio",
      categoria: "externa",
      activo: true,
    });
    setEditingEmail(null);
  };

  const editarEmail = (p: PlantillaCorreo) => {
    setEditingEmail(p);
    setFormEmail({
      nombre: p.nombre,
      asunto: p.asunto,
      contenido_html: p.contenido_html,
      tipo: p.tipo,
      categoria: p.categoria || "externa",
      activo: p.activo,
    });
    setOpenEmail(true);
  };

  const guardarEmail = async () => {
    if (!formEmail.nombre.trim() || !formEmail.asunto.trim() || !formEmail.contenido_html.trim()) {
      toast.error("Nombre, asunto y contenido son obligatorios");
      return;
    }
    if (editingEmail) {
      const { error } = await supabase
        .from("plantillas_correo")
        .update({ ...formEmail, version: (editingEmail.version || 1) + 1 })
        .eq("id", editingEmail.id);
      if (error) return toast.error("Error al actualizar");
      toast.success("Plantilla actualizada");
    } else {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("plantillas_correo").insert({
        ...formEmail,
        created_by: user?.id,
      });
      if (error) return toast.error("Error al crear");
      toast.success("Plantilla creada");
    }
    setOpenEmail(false);
    resetFormEmail();
    cargarEmails();
  };

  const eliminarEmail = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    const { error } = await supabase.from("plantillas_correo").delete().eq("id", id);
    if (error) return toast.error("Error al eliminar");
    toast.success("Plantilla eliminada");
    cargarEmails();
  };

  const insertVarEmail = (v: string) =>
    setFormEmail({ ...formEmail, contenido_html: formEmail.contenido_html + " " + v });

  const previewVarsWA: Record<string, string> = {
    paciente_nombre: "Juan",
    paciente_apellido: "Pérez",
    profesional_nombre: "Dra. María",
    profesional_especialidad: "Medicina general",
    tipo_visita: "domiciliaria",
    fecha: "20/04/2026",
    hora: "10:00 AM",
    fecha_vencimiento: "30/04/2026",
    numero_factura: "FAC-2026-00042",
    monto: "1,500.00",
    tiempo_estimado: "15",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Plantillas de mensajes</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los mensajes que el sistema envía por WhatsApp y correo electrónico.
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whatsapp">
            <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
            WhatsApp ({whatsapp.length})
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2 text-primary" />
            Correo ({emails.length})
          </TabsTrigger>
        </TabsList>

        {/* ============= WHATSAPP TAB ============= */}
        <TabsContent value="whatsapp" className="space-y-4">
          <div className="flex justify-end">
            {isAdmin && (
              <Dialog
                open={openWA}
                onOpenChange={(o) => {
                  setOpenWA(o);
                  if (!o) resetFormWA();
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nueva plantilla WhatsApp
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingWA ? "Editar plantilla" : "Nueva plantilla WhatsApp"}
                    </DialogTitle>
                    <DialogDescription>
                      Use variables como{" "}
                      <code className="text-xs bg-muted px-1 rounded">{`{{paciente_nombre}}`}</code>{" "}
                      que serán reemplazadas al enviar.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          value={formWA.nombre}
                          onChange={(e) => setFormWA({ ...formWA, nombre: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Categoría</Label>
                        <Select
                          value={formWA.categoria}
                          onValueChange={(v) =>
                            setFormWA({
                              ...formWA,
                              categoria: v as PlantillaWhatsApp["categoria"],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIAS_WA.map((c) => (
                              <SelectItem key={c.value} value={c.value}>
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Descripción</Label>
                      <Input
                        value={formWA.descripcion}
                        onChange={(e) => setFormWA({ ...formWA, descripcion: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Contenido del mensaje</Label>
                      <Textarea
                        rows={6}
                        value={formWA.contenido}
                        onChange={(e) => setFormWA({ ...formWA, contenido: e.target.value })}
                        placeholder="Hola {{paciente_nombre}}, le recordamos su cita..."
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Variables disponibles:{" "}
                        {VARIABLES_WA.map((v) => (
                          <code
                            key={v}
                            className="text-xs bg-muted px-1 rounded mr-1 cursor-pointer hover:bg-primary/20"
                            onClick={() =>
                              setFormWA({
                                ...formWA,
                                contenido: formWA.contenido + ` {{${v}}}`,
                              })
                            }
                          >
                            {`{{${v}}}`}
                          </code>
                        ))}
                      </p>
                    </div>

                    {formWA.contenido && (
                      <div className="rounded-md border bg-muted/30 p-3">
                        <Label className="text-xs">Vista previa</Label>
                        <p className="text-sm whitespace-pre-wrap mt-1">
                          {renderPlantilla(formWA.contenido, previewVarsWA)}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Destinatario por defecto</Label>
                        <Select
                          value={formWA.destinatario_default}
                          onValueChange={(v) =>
                            setFormWA({
                              ...formWA,
                              destinatario_default:
                                v as PlantillaWhatsApp["destinatario_default"],
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paciente">Paciente</SelectItem>
                            <SelectItem value="cuidador">Cuidador</SelectItem>
                            <SelectItem value="ambos">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Switch
                          checked={formWA.activo}
                          onCheckedChange={(v) => setFormWA({ ...formWA, activo: v })}
                        />
                        <Label>Activa</Label>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenWA(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={guardarWA}>{editingWA ? "Guardar" : "Crear"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loadingWA ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {whatsapp.map((p) => (
                <Card key={p.id} className={!p.activo ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{p.nombre}</CardTitle>
                        <CardDescription>{p.descripcion}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline">
                          {CATEGORIAS_WA.find((c) => c.value === p.categoria)?.label ?? p.categoria}
                        </Badge>
                        {!p.activo && <Badge variant="secondary">Inactiva</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md bg-muted/40 p-3 text-sm whitespace-pre-wrap mb-3 max-h-40 overflow-auto">
                      {p.contenido}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        v{p.version} · {p.destinatario_default}
                      </span>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => editarWA(p)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => eliminarWA(p.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {whatsapp.length === 0 && (
                <p className="text-muted-foreground col-span-2">
                  No hay plantillas. Crea la primera.
                </p>
              )}
            </div>
          )}
        </TabsContent>

        {/* ============= EMAIL TAB ============= */}
        <TabsContent value="email" className="space-y-4">
          <div className="flex justify-end">
            {isAdmin && (
              <Dialog
                open={openEmail}
                onOpenChange={(o) => {
                  setOpenEmail(o);
                  if (!o) resetFormEmail();
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" /> Nueva plantilla de correo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmail ? "Editar plantilla de correo" : "Nueva plantilla de correo"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          value={formEmail.nombre}
                          onChange={(e) =>
                            setFormEmail({ ...formEmail, nombre: e.target.value })
                          }
                          placeholder="Recordatorio de cita"
                        />
                      </div>
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={formEmail.tipo}
                          onValueChange={(v) => setFormEmail({ ...formEmail, tipo: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_EMAIL.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Asunto</Label>
                      <Input
                        value={formEmail.asunto}
                        onChange={(e) =>
                          setFormEmail({ ...formEmail, asunto: e.target.value })
                        }
                        placeholder="Recordatorio: Cita {{Cita_Fecha}}"
                      />
                    </div>

                    <div>
                      <Label>Variables disponibles (clic para insertar)</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {VARIABLES_EMAIL.map((v) => (
                          <Badge
                            key={v}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                            onClick={() => insertVarEmail(v)}
                          >
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Contenido HTML</Label>
                      <Textarea
                        rows={10}
                        className="font-mono text-sm"
                        value={formEmail.contenido_html}
                        onChange={(e) =>
                          setFormEmail({ ...formEmail, contenido_html: e.target.value })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Categoría</Label>
                        <Select
                          value={formEmail.categoria}
                          onValueChange={(v) =>
                            setFormEmail({ ...formEmail, categoria: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interna">Interna</SelectItem>
                            <SelectItem value="externa">Externa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Switch
                          checked={formEmail.activo}
                          onCheckedChange={(v) => setFormEmail({ ...formEmail, activo: v })}
                        />
                        <Label>Activa</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenEmail(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={guardarEmail}>
                      {editingEmail ? "Guardar" : "Crear"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loadingEmail ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {emails.map((p) => (
                <Card key={p.id} className={!p.activo ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base">{p.nombre}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-2">{p.asunto}</CardDescription>
                    <div className="flex gap-2">
                      <Badge variant="outline">{p.tipo}</Badge>
                      {!p.activo && <Badge variant="secondary">Inactiva</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setPreviewEmail(p)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Vista previa
                      </Button>
                      {isAdmin && (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => editarEmail(p)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => eliminarEmail(p.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {emails.length === 0 && (
                <p className="text-muted-foreground col-span-3">
                  No hay plantillas de correo. Crea la primera.
                </p>
              )}
            </div>
          )}

          {/* Preview email dialog */}
          <Dialog open={!!previewEmail} onOpenChange={(o) => !o && setPreviewEmail(null)}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Vista previa: {previewEmail?.nombre}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Asunto</Label>
                  <p className="text-sm text-muted-foreground">{previewEmail?.asunto}</p>
                </div>
                <div>
                  <Label>Contenido</Label>
                  <div
                    className="p-4 border rounded-lg bg-background prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewEmail?.contenido_html || "" }}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Plantillas;
