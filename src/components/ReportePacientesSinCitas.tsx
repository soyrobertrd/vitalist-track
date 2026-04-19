import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Calendar, MapPin, Search, Plus, AlertTriangle, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  contacto_px?: string;
  zona?: string;
  barrio?: string;
  grado_dificultad?: string;
}

export function ReportePacientesSinCitas() {
  const [loading, setLoading] = useState(true);
  const [pacientesSinLlamadas, setPacientesSinLlamadas] = useState<Paciente[]>([]);
  const [pacientesSinVisitas, setPacientesSinVisitas] = useState<Paciente[]>([]);
  const [busquedaLlamadas, setBusquedaLlamadas] = useState("");
  const [busquedaVisitas, setBusquedaVisitas] = useState("");
  const [personal, setPersonal] = useState<any[]>([]);
  const [openAgendarLlamada, setOpenAgendarLlamada] = useState(false);
  const [openAgendarVisita, setOpenAgendarVisita] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [loadingVisita, setLoadingVisita] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pacientesRes, llamadasRes, visitasRes, personalRes] = await Promise.all([
        supabase.from("pacientes").select("*").eq("status_px", "activo"),
        supabase.from("registro_llamadas").select("paciente_id").in("estado", ["agendada", "pendiente"]),
        supabase.from("control_visitas").select("paciente_id").eq("estado", "pendiente"),
        supabase.from("personal_salud").select("*").eq("activo", true),
      ]);

      if (pacientesRes.data && llamadasRes.data && visitasRes.data) {
        const pacientesConLlamada = new Set(llamadasRes.data.map((l: any) => l.paciente_id));
        const pacientesConVisita = new Set(visitasRes.data.map((v: any) => v.paciente_id));

        const sinLlamadas = pacientesRes.data.filter((p: any) => !pacientesConLlamada.has(p.id));
        const sinVisitas = pacientesRes.data.filter((p: any) => !pacientesConVisita.has(p.id));

        setPacientesSinLlamadas(sinLlamadas);
        setPacientesSinVisitas(sinVisitas);
      }

      if (personalRes.data) {
        const filteredPersonal = personalRes.data.filter(
          (p: any) => p.especialidad && !p.especialidad.toLowerCase().includes('admin')
        );
        setPersonal(filteredPersonal);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAgendarLlamada = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setOpenAgendarLlamada(true);
  };

  const handleAgendarVisita = (pacienteId: string) => {
    setSelectedPacienteId(pacienteId);
    setOpenAgendarVisita(true);
  };

  const handleSubmitVisita = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPacienteId) return;
    
    setLoadingVisita(true);
    const formData = new FormData(e.currentTarget);
    const fechaHoraInput = formData.get("fecha_hora_visita") as string;
    // Convertir datetime-local (string sin TZ) a ISO con TZ local
    // para que Postgres no lo interprete como UTC y desplace la hora
    const fechaHoraISO = fechaHoraInput ? new Date(fechaHoraInput).toISOString() : fechaHoraInput;

    const data = {
      paciente_id: selectedPacienteId,
      profesional_id: formData.get("profesional_id") as string,
      fecha_hora_visita: fechaHoraISO,
      tipo_visita: formData.get("tipo_visita") as any,
      motivo_visita: formData.get("motivo_visita") as string,
      estado: "pendiente" as any,
    };

    const { error } = await supabase.from("control_visitas").insert([data]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Visita programada exitosamente");
      setOpenAgendarVisita(false);
      setSelectedPacienteId(null);
      fetchData();
    }
    setLoadingVisita(false);
  };

  const getDificultadColor = (dificultad: string | null | undefined) => {
    switch (dificultad) {
      case "alto": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medio": return "bg-warning/10 text-warning border-warning/20";
      case "bajo": return "bg-success/10 text-success border-success/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const filtrarPacientesLlamadas = pacientesSinLlamadas.filter(p =>
    `${p.nombre} ${p.apellido} ${p.cedula}`.toLowerCase().includes(busquedaLlamadas.toLowerCase())
  );

  const filtrarPacientesVisitas = pacientesSinVisitas.filter(p =>
    `${p.nombre} ${p.apellido} ${p.cedula}`.toLowerCase().includes(busquedaVisitas.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const renderPacienteCard = (paciente: Paciente, tipo: "llamada" | "visita") => (
    <div
      key={paciente.id}
      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {paciente.nombre} {paciente.apellido}
          </p>
          {paciente.grado_dificultad && (
            <Badge variant="outline" className={`text-xs ${getDificultadColor(paciente.grado_dificultad)}`}>
              {paciente.grado_dificultad}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
          <span>{paciente.cedula}</span>
          {paciente.contacto_px && (
            <a href={`tel:${paciente.contacto_px.replace(/\D/g, '')}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3 w-3" />
              {paciente.contacto_px}
            </a>
          )}
          {paciente.zona && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {paciente.zona.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => tipo === "llamada" ? handleAgendarLlamada(paciente.id) : handleAgendarVisita(paciente.id)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Agendar
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5 text-destructive" />
              Sin Llamadas Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{pacientesSinLlamadas.length}</div>
            <p className="text-sm text-muted-foreground">pacientes activos</p>
          </CardContent>
        </Card>

        <Card className="border-warning/50 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-warning" />
              Sin Visitas Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">{pacientesSinVisitas.length}</div>
            <p className="text-sm text-muted-foreground">pacientes activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con listas */}
      <Tabs defaultValue="llamadas" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="llamadas" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Sin Llamadas ({pacientesSinLlamadas.length})
          </TabsTrigger>
          <TabsTrigger value="visitas" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sin Visitas ({pacientesSinVisitas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="llamadas" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pacientes sin llamadas agendadas</CardTitle>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={busquedaLlamadas}
                  onChange={(e) => setBusquedaLlamadas(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filtrarPacientesLlamadas.map((paciente) => renderPacienteCard(paciente, "llamada"))}
                  {filtrarPacientesLlamadas.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {busquedaLlamadas ? "No se encontraron pacientes" : "Todos los pacientes tienen llamadas agendadas"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitas" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pacientes sin visitas agendadas</CardTitle>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente..."
                  value={busquedaVisitas}
                  onChange={(e) => setBusquedaVisitas(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {filtrarPacientesVisitas.map((paciente) => renderPacienteCard(paciente, "visita"))}
                  {filtrarPacientesVisitas.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {busquedaVisitas ? "No se encontraron pacientes" : "Todos los pacientes tienen visitas agendadas"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para agendar llamada */}
      <Dialog open={openAgendarLlamada} onOpenChange={setOpenAgendarLlamada}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Llamada</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!selectedPacienteId) return;
            
            const formData = new FormData(e.currentTarget);
            const fechaAgendadaInput = formData.get("fecha_agendada") as string;
            // Convertir datetime-local (string sin TZ) a ISO con TZ local
            // para que Postgres no lo interprete como UTC y desplace la hora
            const fechaAgendadaISO = fechaAgendadaInput ? new Date(fechaAgendadaInput).toISOString() : fechaAgendadaInput;
            const data = {
              paciente_id: selectedPacienteId,
              profesional_id: formData.get("profesional_id") as string,
              fecha_agendada: fechaAgendadaISO,
              motivo: formData.get("motivo") as string,
              estado: "agendada" as any,
            };

            const { error } = await supabase.from("registro_llamadas").insert([data]);

            if (error) {
              toast.error(error.message);
            } else {
              toast.success("Llamada agendada exitosamente");
              setOpenAgendarLlamada(false);
              setSelectedPacienteId(null);
              fetchData();
            }
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Input 
                value={pacientesSinLlamadas.find(p => p.id === selectedPacienteId)?.nombre + " " + pacientesSinLlamadas.find(p => p.id === selectedPacienteId)?.apellido || ""} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profesional_id">Profesional *</Label>
              <Select name="profesional_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_agendada">Fecha y Hora *</Label>
              <Input type="datetime-local" name="fecha_agendada" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea name="motivo" placeholder="Motivo de la llamada" />
            </div>
            <Button type="submit" className="w-full">
              Agendar Llamada
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para agendar visita */}
      <Dialog open={openAgendarVisita} onOpenChange={setOpenAgendarVisita}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programar Visita</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitVisita} className="space-y-4">
            <div className="space-y-2">
              <Label>Paciente</Label>
              <Input 
                value={pacientesSinVisitas.find(p => p.id === selectedPacienteId)?.nombre + " " + pacientesSinVisitas.find(p => p.id === selectedPacienteId)?.apellido || ""} 
                disabled 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profesional_id">Profesional *</Label>
              <Select name="profesional_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar profesional" />
                </SelectTrigger>
                <SelectContent>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_hora_visita">Fecha y Hora *</Label>
              <Input type="datetime-local" name="fecha_hora_visita" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipo_visita">Tipo de Visita *</Label>
              <Select name="tipo_visita" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulatorio">Ambulatorio</SelectItem>
                  <SelectItem value="domicilio">Domicilio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo_visita">Motivo</Label>
              <Textarea name="motivo_visita" placeholder="Motivo de la visita" />
            </div>
            <Button type="submit" className="w-full" disabled={loadingVisita}>
              {loadingVisita ? "Programando..." : "Programar Visita"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
