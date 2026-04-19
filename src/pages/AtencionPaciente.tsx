import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Syringe, Pill, FileText, Beaker, Gift, Check, X, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface AtencionItem {
  id: string;
  paciente_id: string;
  tipo: string;
  descripcion: string;
  estado: string;
  fecha_programada: string;
  fecha_realizada: string | null;
  profesional_id: string;
  periodicidad: string | null;
  proxima_fecha: string | null;
  notas: string | null;
  pacientes: {
    nombre: string;
    apellido: string;
  };
  personal_salud: {
    nombre: string;
    apellido: string;
  } | null;
}

const AtencionPaciente = () => {
  const [atenciones, setAtenciones] = useState<AtencionItem[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    paciente_id: "",
    tipo: "cura",
    descripcion: "",
    fecha_programada: "",
    profesional_id: "",
    periodicidad: "unica",
    notas: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [atencionesData, pacientesData, profesionalesData] = await Promise.all([
      supabase
        .from("atencion_paciente")
        .select(`
          *,
          pacientes (nombre, apellido),
          personal_salud (nombre, apellido)
        `)
        .order("fecha_programada", { ascending: true }),
      supabase.from("pacientes").select("id, nombre, apellido").eq("status_px", "activo"),
      supabase.from("personal_salud").select("id, nombre, apellido").eq("activo", true),
    ]);

    if (atencionesData.error) {
      toast({ title: "Error al cargar atenciones", variant: "destructive" });
    } else {
      setAtenciones(atencionesData.data || []);
    }

    setPacientes(pacientesData.data || []);
    setProfesionales(profesionalesData.data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    // Convertir datetime-local (string sin TZ) a ISO con TZ local
    // para que Postgres no lo interprete como UTC y desplace la hora
    const fechaProgramadaISO = formData.fecha_programada
      ? new Date(formData.fecha_programada).toISOString()
      : formData.fecha_programada;

    const { error } = await supabase
      .from("atencion_paciente")
      .insert([{ ...formData, fecha_programada: fechaProgramadaISO }]);

    if (error) {
      toast({ title: "Error al crear atención", variant: "destructive" });
    } else {
      // Si el tipo requiere visita (cura, medicación, toma_muestra), crear visita automáticamente
      if (["cura", "medicacion", "toma_muestra"].includes(formData.tipo)) {
        const visitaData = {
          paciente_id: formData.paciente_id,
          profesional_id: formData.profesional_id,
          fecha_hora_visita: fechaProgramadaISO,
          tipo_visita: "domicilio" as any,
          motivo_visita: `${getTipoLabel(formData.tipo)} - ${formData.descripcion}`,
          estado: "pendiente" as any,
        };

        const { error: visitaError } = await supabase
          .from("control_visitas")
          .insert([visitaData]);

        if (visitaError) {
          console.error("Error creating visit:", visitaError);
        }

        // Si es recurrente, crear visitas adicionales
        if (formData.periodicidad !== "unica") {
          const visitasRecurrentes = [];
          const fechaBase = new Date(formData.fecha_programada);
          
          let intervalo = 0;
          switch (formData.periodicidad) {
            case "diaria":
              intervalo = 1;
              break;
            case "semanal":
              intervalo = 7;
              break;
            case "mensual":
              intervalo = 30;
              break;
          }

          // Crear 12 visitas recurrentes
          for (let i = 1; i <= 12; i++) {
            const nuevaFecha = new Date(fechaBase);
            nuevaFecha.setDate(nuevaFecha.getDate() + (intervalo * i));
            
            visitasRecurrentes.push({
              paciente_id: formData.paciente_id,
              profesional_id: formData.profesional_id,
              fecha_hora_visita: nuevaFecha.toISOString(),
              tipo_visita: "domicilio" as any,
              motivo_visita: `${getTipoLabel(formData.tipo)} - ${formData.descripcion} (Recurrente)`,
              estado: "pendiente" as any,
            });
          }

          if (visitasRecurrentes.length > 0) {
            await supabase.from("control_visitas").insert(visitasRecurrentes);
          }
        }
      }

      toast({ title: "Atención programada exitosamente" });
      setDialogOpen(false);
      setFormData({
        paciente_id: "",
        tipo: "cura",
        descripcion: "",
        fecha_programada: "",
        profesional_id: "",
        periodicidad: "unica",
        notas: "",
      });
      fetchData();
    }
  };

  const marcarRealizada = async (id: string) => {
    const { error } = await supabase
      .from("atencion_paciente")
      .update({
        estado: "realizada",
        fecha_realizada: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating:", error);
      toast({ title: "Error al actualizar estado", variant: "destructive" });
    } else {
      toast({ title: "Atención marcada como realizada" });
      // Actualizar localmente para respuesta inmediata
      setAtenciones(prev => prev.map(a => 
        a.id === id 
          ? { ...a, estado: "realizada", fecha_realizada: new Date().toISOString() }
          : a
      ));
    }
  };

  const isAtrasada = (fechaProgramada: string): boolean => {
    const fechaAtencion = startOfDay(new Date(fechaProgramada));
    const hoy = startOfDay(new Date());
    return isBefore(fechaAtencion, hoy);
  };

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case "cura":
        return <Syringe className="h-4 w-4" />;
      case "medicacion":
        return <Pill className="h-4 w-4" />;
      case "receta":
        return <FileText className="h-4 w-4" />;
      case "laboratorio":
        return <Beaker className="h-4 w-4" />;
      case "muestra_medica":
        return <Gift className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      cura: "Cura",
      medicacion: "Medicación",
      cambio_sonda: "Cambio de Sonda",
      canalizacion: "Canalización",
      receta: "Receta",
      laboratorio: "Laboratorio",
      muestra_medica: "Muestra Médica",
      toma_muestra: "Toma de Muestra",
    };
    return labels[tipo] || tipo;
  };

  const renderAtencionCard = (atencion: AtencionItem) => {
    const atrasada = atencion.estado === "pendiente" && isAtrasada(atencion.fecha_programada);
    
    return (
      <GlassCard 
        key={atencion.id} 
        className={`p-6 space-y-4 relative ${atrasada ? 'border-destructive border-2' : ''}`}
      >
        {/* Badge de estado en esquina superior derecha */}
        {atencion.estado === "pendiente" && atrasada && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Atrasada
            </Badge>
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-16">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-primary">{getIconForTipo(atencion.tipo)}</div>
              <h3 className="font-semibold text-foreground">{getTipoLabel(atencion.tipo)}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{atencion.descripcion}</p>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Paciente:</span> {atencion.pacientes.nombre} {atencion.pacientes.apellido}
              </p>
              <p>
                <span className="font-medium">Programada:</span>{" "}
                {format(new Date(atencion.fecha_programada), "dd/MM/yyyy HH:mm", { locale: es })}
              </p>
              {atencion.personal_salud && (
                <p>
                  <span className="font-medium">Profesional:</span> {atencion.personal_salud.nombre}{" "}
                  {atencion.personal_salud.apellido}
                </p>
              )}
              {atencion.periodicidad && atencion.periodicidad !== "unica" && (
                <Badge variant="outline" className="mt-2">
                  {atencion.periodicidad}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {atencion.estado === "pendiente" && (
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="default" size="sm" className="flex-1" onClick={() => marcarRealizada(atencion.id)}>
              <Check className="h-4 w-4 mr-2" />
              Marcar Realizada
            </Button>
          </div>
        )}

        {atencion.estado === "realizada" && atencion.fecha_realizada && (
          <div className="pt-4 border-t">
            <Badge variant="default">
              Realizada el {format(new Date(atencion.fecha_realizada), "dd/MM/yyyy HH:mm", { locale: es })}
            </Badge>
          </div>
        )}
      </GlassCard>
    );
  };

  const pendientes = atenciones.filter((a) => a.estado === "pendiente");
  const realizadas = atenciones.filter((a) => a.estado === "realizada");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atención al Paciente</h1>
          <p className="text-muted-foreground">Gestiona curas, medicaciones, recetas, laboratorios y muestras médicas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Atención
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Programar Atención</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select value={formData.paciente_id} onValueChange={(value) => setFormData({ ...formData, paciente_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} {p.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Atención</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cura">Cura</SelectItem>
                      <SelectItem value="medicacion">Medicación</SelectItem>
                      <SelectItem value="cambio_sonda">Cambio de Sonda</SelectItem>
                      <SelectItem value="canalizacion">Canalización</SelectItem>
                      <SelectItem value="receta">Receta</SelectItem>
                      <SelectItem value="laboratorio">Laboratorio</SelectItem>
                      <SelectItem value="muestra_medica">Muestra Médica</SelectItem>
                      <SelectItem value="toma_muestra">Toma de Muestra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe la atención a realizar"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Programada</Label>
                  <Input
                    type="datetime-local"
                    value={formData.fecha_programada}
                    onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Profesional</Label>
                  <Select value={formData.profesional_id} onValueChange={(value) => setFormData({ ...formData, profesional_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar profesional" />
                    </SelectTrigger>
                    <SelectContent>
                      {profesionales.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} {p.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Periodicidad</Label>
                <Select value={formData.periodicidad} onValueChange={(value) => setFormData({ ...formData, periodicidad: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unica">Única</SelectItem>
                    <SelectItem value="diaria">Diaria</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas Adicionales</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas opcionales"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>Programar Atención</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pendientes" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="pendientes">
            Pendientes {pendientes.length > 0 && `(${pendientes.length})`}
          </TabsTrigger>
          <TabsTrigger value="realizadas">
            Realizadas {realizadas.length > 0 && `(${realizadas.length})`}
          </TabsTrigger>
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground text-center">Cargando atenciones...</p>
          ) : pendientes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay atenciones pendientes</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendientes.map(renderAtencionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="realizadas" className="space-y-4">
          {realizadas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay atenciones realizadas</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {realizadas.map(renderAtencionCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {atenciones.map(renderAtencionCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AtencionPaciente;