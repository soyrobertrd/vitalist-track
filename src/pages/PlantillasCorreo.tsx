import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Eye, Edit, Trash2, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Plantilla {
  id: string;
  nombre: string;
  asunto: string;
  contenido_html: string;
  variables: any;
  tipo: string;
  activo: boolean;
  categoria: string;
  version: number;
  created_at: string;
}

const PlantillasCorreo = () => {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    asunto: "",
    contenido_html: "",
    tipo: "recordatorio",
    categoria: "externa",
    variables: [] as string[],
  });

  const variablesDisponibles = [
    "{{nombre_paciente}}",
    "{{apellido_paciente}}",
    "{{profesional}}",
    "{{fecha_cita}}",
    "{{hora_cita}}",
    "{{motivo}}",
    "{{enlace}}",
    "{{nombre_sistema}}",
  ];

  useEffect(() => {
    fetchPlantillas();
  }, []);

  const fetchPlantillas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plantillas_correo")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar plantillas", variant: "destructive" });
    } else {
      setPlantillas(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from("plantillas_correo").insert([
      {
        ...formData,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      },
    ]);

    if (error) {
      toast({ title: "Error al crear plantilla", variant: "destructive" });
    } else {
      toast({ title: "Plantilla creada exitosamente" });
      setDialogOpen(false);
      setFormData({
        nombre: "",
        asunto: "",
        contenido_html: "",
        tipo: "recordatorio",
        categoria: "externa",
        variables: [],
      });
      fetchPlantillas();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("plantillas_correo").delete().eq("id", id);

    if (error) {
      toast({ title: "Error al eliminar plantilla", variant: "destructive" });
    } else {
      toast({ title: "Plantilla eliminada" });
      fetchPlantillas();
    }
  };

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      contenido_html: formData.contenido_html + " " + variable,
    });
  };

  const renderPreview = () => {
    if (!selectedPlantilla) return null;

    let preview = selectedPlantilla.contenido_html;
    variablesDisponibles.forEach((variable) => {
      const value = variable.replace(/[{}]/g, "").split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      preview = preview.replace(new RegExp(variable.replace(/[{}]/g, "\\{\\}"), "g"), `<span class="text-primary font-bold">${value}</span>`);
    });

    return <div dangerouslySetInnerHTML={{ __html: preview }} className="prose prose-sm max-w-none" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plantillas de Correo</h1>
          <p className="text-muted-foreground">Gestiona las plantillas para correos automáticos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Plantilla de Correo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la Plantilla</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Recordatorio de Cita"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recordatorio">Recordatorio</SelectItem>
                      <SelectItem value="bienvenida">Bienvenida</SelectItem>
                      <SelectItem value="confirmacion">Confirmación</SelectItem>
                      <SelectItem value="encuesta">Encuesta</SelectItem>
                      <SelectItem value="resumen">Resumen</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Asunto del Correo</Label>
                <Input
                  value={formData.asunto}
                  onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                  placeholder="Ej: Recordatorio: Cita con {{profesional}} el {{fecha_cita}}"
                />
              </div>

              <div className="space-y-2">
                <Label>Variables Disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {variablesDisponibles.map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => insertVariable(variable)}
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Contenido HTML</Label>
                <Textarea
                  value={formData.contenido_html}
                  onChange={(e) => setFormData({ ...formData, contenido_html: e.target.value })}
                  placeholder="Escribe el contenido del correo aquí. Puedes usar HTML y las variables haciendo clic en ellas."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interna">Interna</SelectItem>
                      <SelectItem value="externa">Externa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>Crear Plantilla</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="todas" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="recordatorio">Recordatorios</TabsTrigger>
          <TabsTrigger value="encuesta">Encuestas</TabsTrigger>
          <TabsTrigger value="resumen">Resúmenes</TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-center">Cargando plantillas...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plantillas.map((plantilla) => (
                <GlassCard key={plantilla.id} className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold text-foreground">{plantilla.nombre}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{plantilla.asunto}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline">{plantilla.tipo}</Badge>
                        <Badge variant={plantilla.activo ? "default" : "secondary"}>
                          {plantilla.activo ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedPlantilla(plantilla);
                        setPreviewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Vista Previa
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(plantilla.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </TabsContent>

        {["recordatorio", "encuesta", "resumen"].map((tipo) => (
          <TabsContent key={tipo} value={tipo} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plantillas
                .filter((p) => p.tipo === tipo)
                .map((plantilla) => (
                  <GlassCard key={plantilla.id} className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-foreground">{plantilla.nombre}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{plantilla.asunto}</p>
                        <Badge variant={plantilla.activo ? "default" : "secondary"}>
                          {plantilla.activo ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedPlantilla(plantilla);
                          setPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Vista Previa
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(plantilla.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </GlassCard>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vista Previa: {selectedPlantilla?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Asunto</Label>
              <p className="text-sm text-muted-foreground">{selectedPlantilla?.asunto}</p>
            </div>
            <div>
              <Label>Contenido</Label>
              <div className="p-4 border rounded-lg bg-background">{renderPreview()}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlantillasCorreo;
