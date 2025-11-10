import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, User, Filter, TrendingUp, Activity, CheckSquare, Phone } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { VisitaDetailDialog } from "@/components/VisitaDetailDialog";
import { ImportVisitasDialog } from "@/components/ImportVisitasDialog";
import { useUserRole } from "@/hooks/useUserRole";

interface Visita {
  id: string;
  fecha_hora_visita: string;
  tipo_visita: string;
  motivo_visita: string | null;
  estado: string;
  notas_visita: string | null;
  pacientes: { nombre: string; apellido: string } | null;
  personal_salud: { nombre: string; apellido: string } | null;
}

const Visitas = () => {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [personal, setPersonal] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [unscheduledOpen, setUnscheduledOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { isAdmin } = useUserRole();
  const [filters, setFilters] = useState({
    estado: "",
    profesional: "",
    tipo: "",
  });
  const [showAllVisitas, setShowAllVisitas] = useState(false);
  const [stats, setStats] = useState({
    totalVisitas: 0,
    pendientes: 0,
    realizadas: 0,
    canceladas: 0,
  });
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);

  const fetchData = async () => {
    const [visitasRes, pacientesRes, personalRes] = await Promise.all([
      supabase
        .from("control_visitas")
        .select(`
          *,
          pacientes!control_visitas_paciente_id_fkey(
            nombre, 
            apellido, 
            contacto_px, 
            contacto_cuidador, 
            whatsapp_px, 
            whatsapp_cuidador, 
            numero_principal
          ),
          personal_salud!control_visitas_profesional_id_fkey(nombre, apellido)
        `)
        .order("fecha_hora_visita", { ascending: false }),
      supabase.from("pacientes").select("*").eq("status_px", "activo"),
      supabase.from("personal_salud").select("*").eq("activo", true),
    ]);

    if (visitasRes.data) {
      // Fetch additional professionals for each visit
      const visitasConProfesionales = await Promise.all(
        visitasRes.data.map(async (visita: any) => {
          const { data: profesionales } = await supabase
            .from("visitas_profesionales")
            .select("profesional_id, personal_salud!visitas_profesionales_profesional_id_fkey(nombre, apellido)")
            .eq("visita_id", visita.id);
          
          return {
            ...visita,
            profesionales_adicionales: profesionales || []
          };
        })
      );
      
      setVisitas(visitasConProfesionales as any);
      
      // Calculate stats
      const total = visitasConProfesionales.length;
      const pendientes = visitasConProfesionales.filter((v: any) => v.estado === "pendiente").length;
      const realizadas = visitasConProfesionales.filter((v: any) => v.estado === "realizada").length;
      const canceladas = visitasConProfesionales.filter((v: any) => v.estado === "cancelada").length;
      
      setStats({
        totalVisitas: total,
        pendientes,
        realizadas,
        canceladas,
      });
    }
    if (pacientesRes.data) setPacientes(pacientesRes.data);
    if (personalRes.data) setPersonal(personalRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      paciente_id: formData.get("paciente_id") as string,
      profesional_id: formData.get("profesional_id") as string,
      fecha_hora_visita: formData.get("fecha_hora_visita") as string,
      tipo_visita: formData.get("tipo_visita") as any,
      motivo_visita: formData.get("motivo_visita") as string,
      estado: "pendiente" as any,
    };

    const { data: visitaData, error } = await supabase
      .from("control_visitas")
      .insert([data])
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      // Insert additional professionals if any
      if (selectedProfessionals.length > 0 && visitaData) {
        const profesionalesData = selectedProfessionals.map(profId => ({
          visita_id: visitaData.id,
          profesional_id: profId
        }));
        
        await supabase.from("visitas_profesionales").insert(profesionalesData);
      }
      
      toast.success("Visita programada exitosamente");
      setOpen(false);
      setSelectedProfessionals([]);
      fetchData();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const handleUnscheduledSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      paciente_id: formData.get("paciente_id") as string,
      profesional_id: formData.get("profesional_id") as string,
      fecha_hora_visita: new Date().toISOString(),
      tipo_visita: formData.get("tipo_visita") as any,
      motivo_visita: formData.get("motivo_visita") as string,
      estado: "realizada" as any,
      notas_visita: "Visita no agendada - " + (formData.get("razon") as string || ""),
    };

    const { error } = await supabase.from("control_visitas").insert([data]);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Visita no agendada registrada exitosamente");
      setUnscheduledOpen(false);
      fetchData();
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "realizada":
        return "bg-success text-success-foreground";
      case "pendiente":
        return "bg-primary text-primary-foreground";
      case "cancelada":
      case "no_realizada":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-warning text-warning-foreground";
    }
  };

  const getTipoIcon = (tipo: string) => {
    return tipo === "domicilio" ? "🏠" : "🏥";
  };

  const filteredVisitas = visitas.filter((v: any) => {
    if (filters.estado && v.estado !== filters.estado) return false;
    if (filters.profesional && v.profesional_id !== filters.profesional) return false;
    if (filters.tipo && v.tipo_visita !== filters.tipo) return false;
    return true;
  });

  // Filter for pending + today's visits
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const visitasPendientesYHoy = filteredVisitas.filter((v: any) => {
    if (v.estado === 'pendiente') return true;
    
    if ((v.estado === 'realizada' || v.estado === 'cancelada') && v.fecha_hora_visita) {
      const fechaVisita = new Date(v.fecha_hora_visita);
      fechaVisita.setHours(0, 0, 0, 0);
      return fechaVisita.getTime() === hoy.getTime();
    }
    
    return false;
  });

  const visitasOtras = filteredVisitas.filter((v: any) => {
    if (v.estado === 'pendiente') return false;
    
    if ((v.estado === 'realizada' || v.estado === 'cancelada') && v.fecha_hora_visita) {
      const fechaVisita = new Date(v.fecha_hora_visita);
      fechaVisita.setHours(0, 0, 0, 0);
      return fechaVisita.getTime() !== hoy.getTime();
    }
    
    return false;
  });

  const visitasToShow = showAllVisitas ? [...visitasPendientesYHoy, ...visitasOtras] : visitasPendientesYHoy;

  const getCardColor = (fecha: string, estado: string) => {
    if (estado !== "pendiente") return "";
    
    const diff = differenceInDays(new Date(fecha), new Date());
    if (diff < 0) {
      const daysPast = Math.abs(diff);
      if (daysPast >= 4) return "border-red-500 bg-red-50 dark:bg-red-950/20";
      if (daysPast >= 1) return "border-orange-500 bg-orange-50 dark:bg-orange-950/20";
    }
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Control de Visitas</h1>
          <p className="text-muted-foreground">Citas ambulatorias y domiciliarias</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <ImportVisitasDialog onSuccess={fetchData} />}
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            {showFilters ? "Ocultar Filtros" : "Filtros"}
          </Button>
          <Dialog open={unscheduledOpen} onOpenChange={setUnscheduledOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CheckSquare className="mr-2 h-4 w-4" />
                Visita No Agendada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Visita No Agendada</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUnscheduledSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente_unscheduled">Paciente *</Label>
                  <Select name="paciente_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} {p.apellido} - {p.cedula}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profesional_unscheduled">Profesional *</Label>
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
                  <Label htmlFor="tipo_visita_unscheduled">Tipo de Visita *</Label>
                  <Select name="tipo_visita" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambulatorio">Ambulatorio (Consultorio)</SelectItem>
                      <SelectItem value="domicilio">Domicilio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="razon">Razón de visita no agendada</Label>
                  <Textarea 
                    id="razon" 
                    name="razon" 
                    placeholder="Ej: Paciente se confundió de fecha, estaba cerca y se llamó"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motivo_visita_unscheduled">Motivo</Label>
                  <Textarea 
                    id="motivo_visita_unscheduled" 
                    name="motivo_visita" 
                    placeholder="Motivo de la visita" 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registrando..." : "Registrar Visita"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Programar Visita
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Programar Nueva Visita</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paciente_id">Paciente *</Label>
                <Select name="paciente_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {pacientes.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} - {p.cedula}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Input
                  id="fecha_hora_visita"
                  name="fecha_hora_visita"
                  type="datetime-local"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_visita">Tipo de Visita *</Label>
                <Select name="tipo_visita" required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambulatorio">Ambulatorio (Consultorio)</SelectItem>
                    <SelectItem value="domicilio">Domicilio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profesionales Adicionales (Opcional)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded p-2">
                  {personal.map((p) => (
                    <div key={p.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`prof-${p.id}`}
                        checked={selectedProfessionals.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProfessionals([...selectedProfessionals, p.id]);
                          } else {
                            setSelectedProfessionals(selectedProfessionals.filter(id => id !== p.id));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`prof-${p.id}`} className="cursor-pointer text-sm">
                        {p.nombre} {p.apellido} - {p.especialidad}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="motivo_visita">Motivo</Label>
                <Textarea id="motivo_visita" name="motivo_visita" placeholder="Motivo de la visita" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Programando..." : "Programar Visita"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Visitas</p>
              <p className="text-2xl font-bold">{stats.totalVisitas}</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendientes}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Realizadas</p>
              <p className="text-2xl font-bold text-green-600">{stats.realizadas}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Canceladas</p>
              <p className="text-2xl font-bold text-red-600">{stats.canceladas}</p>
            </div>
            <Badge variant="destructive">{stats.canceladas}</Badge>
          </div>
        </GlassCard>
      </div>

      {/* Filters */}
      {showFilters && (
        <GlassCard className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={filters.estado} onValueChange={(value) => setFilters({...filters, estado: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="realizada">Realizada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Profesional</Label>
              <Select value={filters.profesional} onValueChange={(value) => setFilters({...filters, profesional: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {personal.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={filters.tipo} onValueChange={(value) => setFilters({...filters, tipo: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ambulatorio">Ambulatorio</SelectItem>
                  <SelectItem value="domicilio">Domicilio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Lista de Visitas */}
      {!showAllVisitas && visitasOtras.length > 0 && (
        <div className="flex justify-center mb-4">
          <Button onClick={() => setShowAllVisitas(true)} variant="outline">
            Ver Más Visitas ({visitasOtras.length})
          </Button>
        </div>
      )}
      {showAllVisitas && (
        <div className="flex justify-center mb-4">
          <Button onClick={() => setShowAllVisitas(false)} variant="outline">
            Ocultar Historial
          </Button>
        </div>
      )}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visitasToShow.map((visita: any) => {
          const formatearTexto = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase().replace("_", " ");
          const cardColorClass = getCardColor(visita.fecha_hora_visita, visita.estado);
          
          return (
            <GlassCard 
              key={visita.id} 
              className={`aspect-square p-6 flex flex-col justify-between cursor-pointer hover:scale-105 transition-transform ${cardColorClass}`}
              onClick={() => {
                setSelectedVisita(visita);
                setDetailOpen(true);
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">
                    {visita.pacientes?.nombre} {visita.pacientes?.apellido}
                  </h3>
                  {/* Mobile Call Button */}
                  {visita.pacientes && (
                    <a
                      href={`tel:${
                        visita.pacientes.numero_principal === 'cuidador' && visita.pacientes.contacto_cuidador
                          ? visita.pacientes.contacto_cuidador.replace(/\D/g, '')
                          : (visita.pacientes.contacto_px || '').replace(/\D/g, '')
                      }`}
                      onClick={(e) => e.stopPropagation()}
                      className="md:hidden inline-flex items-center justify-center p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      aria-label="Llamar al paciente"
                      title="Llamar"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(visita.fecha_hora_visita).toLocaleDateString('es-DO', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    {new Date(visita.fecha_hora_visita).toLocaleTimeString('es-DO', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  {visita.personal_salud && (
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      {visita.personal_salud.nombre} {visita.personal_salud.apellido}
                    </div>
                  )}
                  {visita.profesionales_adicionales && visita.profesionales_adicionales.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      +{visita.profesionales_adicionales.length} profesional(es) más
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <Badge variant={
                  visita.estado === "realizada" ? "default" :
                  visita.estado === "cancelada" ? "destructive" : "secondary"
                }>
                  {formatearTexto(visita.estado)}
                </Badge>
                <Badge variant="outline">{getTipoIcon(visita.tipo_visita)} {formatearTexto(visita.tipo_visita)}</Badge>
              </div>
            </GlassCard>
          );
        })}
      </div>

      <VisitaDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        visita={selectedVisita}
        onSuccess={fetchData}
        pacientes={pacientes}
        personal={personal}
      />

      {visitas.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No hay visitas programadas
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Visitas;
