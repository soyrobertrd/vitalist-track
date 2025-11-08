import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Plus, Zap, Trash2, Clock, Users } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface Automatizacion {
  id: string;
  nombre: string;
  descripcion: string;
  trigger_evento: string;
  accion: string;
  activo: boolean;
  tiempo_ejecucion: string;
  destinatarios: string[];
  plantilla_correo_id?: string;
  encuesta_id?: string;
  created_at: string;
}

const Automatizaciones = () => {
  const [automatizaciones, setAutomatizaciones] = useState<Automatizacion[]>([]);
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [encuestas, setEncuestas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    trigger_evento: "cita_cerrada",
    accion: "enviar_correo",
    activo: true,
    tiempo_ejecucion: "0_minutos",
    destinatarios: ["paciente"],
    plantilla_correo_id: "",
    encuesta_id: "",
  });

  useEffect(() => {
    fetchAutomatizaciones();
    fetchPlantillas();
    fetchEncuestas();
  }, []);

  const fetchAutomatizaciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("automatizaciones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar automatizaciones", variant: "destructive" });
    } else {
      setAutomatizaciones(data || []);
    }
    setLoading(false);
  };

  const fetchPlantillas = async () => {
    const { data } = await supabase
      .from("plantillas_correo")
      .select("id, nombre")
      .eq("activo", true);
    setPlantillas(data || []);
  };

  const fetchEncuestas = async () => {
    const { data } = await supabase
      .from("encuestas")
      .select("id, nombre")
      .eq("activo", true);
    setEncuestas(data || []);
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from("automatizaciones").insert([formData]);

    if (error) {
      toast({ title: "Error al crear automatización", variant: "destructive" });
    } else {
      toast({ title: "Automatización creada exitosamente" });
      setDialogOpen(false);
      setFormData({
        nombre: "",
        descripcion: "",
        trigger_evento: "cita_cerrada",
        accion: "enviar_correo",
        activo: true,
        tiempo_ejecucion: "0_minutos",
        destinatarios: ["paciente"],
        plantilla_correo_id: "",
        encuesta_id: "",
      });
      fetchAutomatizaciones();
    }
  };

  const toggleAutomatizacion = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from("automatizaciones")
      .update({ activo })
      .eq("id", id);

    if (error) {
      toast({ title: "Error al actualizar automatización", variant: "destructive" });
    } else {
      toast({ title: activo ? "Automatización activada" : "Automatización desactivada" });
      fetchAutomatizaciones();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("automatizaciones").delete().eq("id", id);

    if (error) {
      toast({ title: "Error al eliminar automatización", variant: "destructive" });
    } else {
      toast({ title: "Automatización eliminada" });
      fetchAutomatizaciones();
    }
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      cita_cerrada: "Al cerrar cita",
      cita_agendada: "Al agendar cita",
      encuesta_baja: "Encuesta con baja puntuación",
      llamada_no_contestada: "Llamada no contestada",
      visita_completada: "Al completar visita",
      receta_proxima_vencer: "Receta próxima a vencer",
    };
    return labels[trigger] || trigger;
  };

  const getAccionLabel = (accion: string) => {
    const labels: Record<string, string> = {
      enviar_correo: "Enviar correo",
      enviar_encuesta: "Enviar encuesta",
      crear_tarea: "Crear tarea",
      enviar_notificacion: "Enviar notificación",
      asignar_profesional: "Asignar profesional",
    };
    return labels[accion] || accion;
  };

  const getTiempoLabel = (tiempo: string) => {
    const labels: Record<string, string> = {
      "0_minutos": "Inmediatamente",
      "15_minutos": "15 minutos después",
      "30_minutos": "30 minutos después",
      "1_hora": "1 hora después",
      "2_horas": "2 horas después",
      "1_dia": "1 día después",
      "2_dias": "2 días después",
      "1_dia_antes": "1 día antes",
      "2_dias_antes": "2 días antes",
      "1_semana_antes": "1 semana antes",
    };
    return labels[tiempo] || tiempo;
  };

  const getDestinatariosLabel = (destinatarios: string[]) => {
    const labels: Record<string, string> = {
      paciente: "Paciente",
      profesional: "Profesional",
      cuidador: "Cuidador",
    };
    return destinatarios.map(d => labels[d] || d).join(", ");
  };

  const handleDestinatarioChange = (destinatario: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      destinatarios: checked
        ? [...prev.destinatarios, destinatario]
        : prev.destinatarios.filter(d => d !== destinatario)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Automatizaciones</h1>
          <p className="text-muted-foreground">Configura reglas y acciones automáticas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Automatización
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Automatización</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Enviar encuesta post-cita"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe qué hace esta automatización"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Evento Disparador</Label>
                  <Select
                    value={formData.trigger_evento}
                    onValueChange={(value) => setFormData({ ...formData, trigger_evento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="cita_cerrada">Al cerrar cita</SelectItem>
                      <SelectItem value="cita_agendada">Al agendar cita</SelectItem>
                      <SelectItem value="encuesta_baja">Encuesta con baja puntuación</SelectItem>
                      <SelectItem value="llamada_no_contestada">Llamada no contestada</SelectItem>
                      <SelectItem value="visita_completada">Al completar visita</SelectItem>
                      <SelectItem value="receta_proxima_vencer">Receta próxima a vencer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Acción</Label>
                  <Select
                    value={formData.accion}
                    onValueChange={(value) => setFormData({ ...formData, accion: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="enviar_correo">Enviar correo</SelectItem>
                      <SelectItem value="enviar_encuesta">Enviar encuesta</SelectItem>
                      <SelectItem value="crear_tarea">Crear tarea</SelectItem>
                      <SelectItem value="enviar_notificacion">Enviar notificación</SelectItem>
                      <SelectItem value="asignar_profesional">Asignar profesional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tiempo de Ejecución
                </Label>
                <Select
                  value={formData.tiempo_ejecucion}
                  onValueChange={(value) => setFormData({ ...formData, tiempo_ejecucion: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="0_minutos">Inmediatamente</SelectItem>
                    <SelectItem value="15_minutos">15 minutos después</SelectItem>
                    <SelectItem value="30_minutos">30 minutos después</SelectItem>
                    <SelectItem value="1_hora">1 hora después</SelectItem>
                    <SelectItem value="2_horas">2 horas después</SelectItem>
                    <SelectItem value="1_dia">1 día después</SelectItem>
                    <SelectItem value="2_dias">2 días después</SelectItem>
                    <SelectItem value="1_dia_antes">1 día antes</SelectItem>
                    <SelectItem value="2_dias_antes">2 días antes</SelectItem>
                    <SelectItem value="1_semana_antes">1 semana antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Destinatarios
                </Label>
                <div className="space-y-2 border rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="paciente"
                      checked={formData.destinatarios.includes("paciente")}
                      onCheckedChange={(checked) => handleDestinatarioChange("paciente", checked as boolean)}
                    />
                    <label htmlFor="paciente" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Paciente
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="profesional"
                      checked={formData.destinatarios.includes("profesional")}
                      onCheckedChange={(checked) => handleDestinatarioChange("profesional", checked as boolean)}
                    />
                    <label htmlFor="profesional" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Profesional
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cuidador"
                      checked={formData.destinatarios.includes("cuidador")}
                      onCheckedChange={(checked) => handleDestinatarioChange("cuidador", checked as boolean)}
                    />
                    <label htmlFor="cuidador" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Cuidador
                    </label>
                  </div>
                </div>
              </div>

              {formData.accion === "enviar_correo" && (
                <div className="space-y-2">
                  <Label>Plantilla de Correo</Label>
                  <Select
                    value={formData.plantilla_correo_id}
                    onValueChange={(value) => setFormData({ ...formData, plantilla_correo_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {plantillas.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.accion === "enviar_encuesta" && (
                <div className="space-y-2">
                  <Label>Encuesta</Label>
                  <Select
                    value={formData.encuesta_id}
                    onValueChange={(value) => setFormData({ ...formData, encuesta_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar encuesta" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {encuestas.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Activar automatización</Label>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>Crear Automatización</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Cargando automatizaciones...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {automatizaciones.map((auto) => (
            <GlassCard key={auto.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className={`h-4 w-4 ${auto.activo ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-semibold text-foreground">{auto.nombre}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{auto.descripcion}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getTriggerLabel(auto.trigger_evento)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge variant="default" className="text-xs">
                        {getAccionLabel(auto.accion)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{getTiempoLabel(auto.tiempo_ejecucion)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{getDestinatariosLabel(auto.destinatarios)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Switch
                  checked={auto.activo}
                  onCheckedChange={(checked) => toggleAutomatizacion(auto.id, checked)}
                />
                <Button variant="ghost" size="sm" onClick={() => handleDelete(auto.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {!loading && automatizaciones.length === 0 && (
        <GlassCard className="p-12 text-center">
          <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No hay automatizaciones configuradas</h3>
          <p className="text-muted-foreground mb-4">
            Crea tu primera automatización para optimizar los procesos del CRM
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Automatización
          </Button>
        </GlassCard>
      )}
    </div>
  );
};

export default Automatizaciones;
