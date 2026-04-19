import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus, Edit, Trash2, MessageCircle } from "lucide-react";
import { renderPlantilla, type PlantillaWhatsApp } from "@/lib/whatsappService";
import { useUserRole } from "@/hooks/useUserRole";

const CATEGORIAS = [
  { value: "recordatorio_cita", label: "Recordatorio de cita" },
  { value: "confirmacion_cita", label: "Confirmación de cita" },
  { value: "cobro_pendiente", label: "Cobro pendiente" },
  { value: "visita_en_camino", label: "Visita en camino" },
  { value: "custom", label: "Personalizada" },
] as const;

const VARIABLES_DISPONIBLES = [
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

const PlantillasWhatsApp = () => {
  const { isAdmin } = useUserRole();
  const [plantillas, setPlantillas] = useState<PlantillaWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<PlantillaWhatsApp | null>(null);

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    categoria: "custom" as PlantillaWhatsApp["categoria"],
    contenido: "",
    destinatario_default: "paciente" as PlantillaWhatsApp["destinatario_default"],
    activo: true,
  });

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plantillas_whatsapp")
      .select("*")
      .order("categoria")
      .order("nombre");
    if (error) {
      toast.error("Error cargando plantillas");
    } else {
      setPlantillas((data ?? []) as unknown as PlantillaWhatsApp[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar();
  }, []);

  const resetForm = () => {
    setForm({
      nombre: "",
      descripcion: "",
      categoria: "custom",
      contenido: "",
      destinatario_default: "paciente",
      activo: true,
    });
    setEditing(null);
  };

  const abrirEditar = (p: PlantillaWhatsApp) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      categoria: p.categoria,
      contenido: p.contenido,
      destinatario_default: p.destinatario_default,
      activo: p.activo,
    });
    setOpenDialog(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.contenido.trim()) {
      toast.error("Nombre y contenido son obligatorios");
      return;
    }

    // Detectar variables usadas en el contenido
    const variables = Array.from(
      new Set([...form.contenido.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))
    );

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      categoria: form.categoria,
      contenido: form.contenido,
      destinatario_default: form.destinatario_default,
      activo: form.activo,
      variables,
    };

    if (editing) {
      const { error } = await supabase
        .from("plantillas_whatsapp")
        .update({ ...payload, version: editing.version + 1 })
        .eq("id", editing.id);
      if (error) {
        toast.error("Error al actualizar");
        return;
      }
      toast.success("Plantilla actualizada");
    } else {
      const { error } = await supabase.from("plantillas_whatsapp").insert(payload);
      if (error) {
        toast.error("Error al crear");
        return;
      }
      toast.success("Plantilla creada");
    }

    setOpenDialog(false);
    resetForm();
    cargar();
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    const { error } = await supabase.from("plantillas_whatsapp").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Plantilla eliminada");
    cargar();
  };

  const previewVariables: Record<string, string> = {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-[#25D366]" />
            Plantillas de WhatsApp
          </h1>
          <p className="text-muted-foreground mt-1">
            Mensajes que el sistema envía a pacientes vía WhatsApp.
          </p>
        </div>
        {isAdmin && (
          <Dialog
            open={openDialog}
            onOpenChange={(o) => {
              setOpenDialog(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nueva plantilla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar plantilla" : "Nueva plantilla"}</DialogTitle>
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
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Categoría</Label>
                    <Select
                      value={form.categoria}
                      onValueChange={(v) =>
                        setForm({ ...form, categoria: v as PlantillaWhatsApp["categoria"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => (
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
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Contenido del mensaje</Label>
                  <Textarea
                    rows={6}
                    value={form.contenido}
                    onChange={(e) => setForm({ ...form, contenido: e.target.value })}
                    placeholder="Hola {{paciente_nombre}}, le recordamos su cita..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variables disponibles:{" "}
                    {VARIABLES_DISPONIBLES.map((v) => (
                      <code key={v} className="text-xs bg-muted px-1 rounded mr-1">
                        {`{{${v}}}`}
                      </code>
                    ))}
                  </p>
                </div>

                {form.contenido && (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <Label className="text-xs">Vista previa</Label>
                    <p className="text-sm whitespace-pre-wrap mt-1">
                      {renderPlantilla(form.contenido, previewVariables)}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Destinatario por defecto</Label>
                    <Select
                      value={form.destinatario_default}
                      onValueChange={(v) =>
                        setForm({
                          ...form,
                          destinatario_default: v as PlantillaWhatsApp["destinatario_default"],
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
                      checked={form.activo}
                      onCheckedChange={(v) => setForm({ ...form, activo: v })}
                    />
                    <Label>Activa</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardar}>{editing ? "Guardar" : "Crear"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plantillas.map((p) => (
            <Card key={p.id} className={!p.activo ? "opacity-60" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{p.nombre}</CardTitle>
                    <CardDescription>{p.descripcion}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline">
                      {CATEGORIAS.find((c) => c.value === p.categoria)?.label ?? p.categoria}
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
                    v{p.version} · destinatario: {p.destinatario_default}
                  </span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => abrirEditar(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => eliminar(p.id)}
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
          {plantillas.length === 0 && (
            <p className="text-muted-foreground col-span-2">No hay plantillas. Crea la primera.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlantillasWhatsApp;
