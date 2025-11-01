import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, MapPin, Upload, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PacienteDetailDialog } from "@/components/PacienteDetailDialog";
import { ImportPacientesDialog } from "@/components/ImportPacientesDialog";
import { addDays, format, isWeekend } from "date-fns";

interface Paciente {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  contacto_px: string | null;
  status_px: string;
  grado_dificultad: string;
  zona: string | null;
}

const Pacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCedula, setLoadingCedula] = useState(false);
  const [medicamentos, setMedicamentos] = useState<string[]>([""]);
  const [filters, setFilters] = useState({
    status: "todos",
    zona: "todos",
    grado: "todos",
    busqueda: ""
  });

  const fetchPacientes = async () => {
    const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      toast.error("Error al cargar pacientes");
    } else {
      setPacientes(data || []);
    }
  };

  const filteredPacientes = pacientes.filter((p) => {
    if (filters.status !== "todos" && p.status_px !== filters.status) return false;
    if (filters.zona !== "todos" && p.zona !== filters.zona) return false;
    if (filters.grado !== "todos" && p.grado_dificultad !== filters.grado) return false;
    if (filters.busqueda) {
      const busqueda = filters.busqueda.toLowerCase();
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      const cedula = p.cedula.toLowerCase();
      if (!nombreCompleto.includes(busqueda) && !cedula.includes(busqueda)) return false;
    }
    return true;
  });

  useEffect(() => {
    fetchPacientes();
  }, []);

  const fetchCedulaData = async (cedula: string) => {
    if (cedula.length < 11) return;
    
    setLoadingCedula(true);
    try {
      const response = await fetch(`http://190.122.98.11:11080/jce/api/citizen/${cedula}`);
      if (response.ok) {
        const data = await response.json();
        
        // Rellenar campos del formulario
        const nombreInput = document.getElementById("nombre") as HTMLInputElement;
        const apellidoInput = document.getElementById("apellido") as HTMLInputElement;
        const fechaNacimientoInput = document.getElementById("fecha_nacimiento") as HTMLInputElement;
        
        if (nombreInput && data.nombres) nombreInput.value = data.nombres;
        if (apellidoInput && data.apellido1) {
          apellidoInput.value = data.apellido2 ? `${data.apellido1} ${data.apellido2}` : data.apellido1;
        }
        if (fechaNacimientoInput && data.fechaNacimiento) {
          // Convertir formato de fecha si es necesario
          fechaNacimientoInput.value = data.fechaNacimiento;
        }
        
        toast.success("Datos cargados desde JCE");
      }
    } catch (error) {
      console.error("Error fetching cedula data:", error);
    } finally {
      setLoadingCedula(false);
    }
  };

  const calcularFechaLlamada = (fechaBase: Date): Date => {
    let fecha = addDays(fechaBase, 2);
    
    // Si cae en fin de semana, mover al lunes
    while (isWeekend(fecha)) {
      fecha = addDays(fecha, 1);
    }
    
    return fecha;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const dataPaciente = {
      cedula: formData.get("cedula") as string,
      nombre: formData.get("nombre") as string,
      apellido: formData.get("apellido") as string,
      fecha_nacimiento: formData.get("fecha_nacimiento") as string,
      contacto_px: formData.get("contacto_px") as string,
      nombre_cuidador: formData.get("nombre_cuidador") as string,
      contacto_cuidador: formData.get("contacto_cuidador") as string,
      direccion_domicilio: formData.get("direccion_domicilio") as string,
      historia_medica_basica: formData.get("historia_medica") as string,
      zona: formData.get("zona") as any,
      grado_dificultad: formData.get("grado_dificultad") as any,
      status_px: "activo" as any,
    };

    const { data: paciente, error: pacienteError } = await supabase
      .from("pacientes")
      .insert([dataPaciente])
      .select()
      .single();

    if (pacienteError) {
      toast.error(pacienteError.message);
      setLoading(false);
      return;
    }

    // Insertar medicamentos
    const medicamentosValidos = medicamentos.filter(m => m.trim() !== "");
    if (medicamentosValidos.length > 0 && paciente) {
      const medicamentosData = medicamentosValidos.map(med => ({
        paciente_id: paciente.id,
        nombre_medicamento: med,
      }));
      
      await supabase.from("medicamentos_paciente").insert(medicamentosData);
    }

    // Insertar parámetros de seguimiento
    if (paciente) {
      const periodoLlamada = parseInt(formData.get("periodo_llamada") as string) || 30;
      const periodoVisita = parseInt(formData.get("periodo_visita") as string) || 90;
      
      await supabase.from("parametros_seguimiento").insert([{
        paciente_id: paciente.id,
        periodo_llamada_ciclico: periodoLlamada,
        periodo_visita_ciclico: periodoVisita,
        fecha_proxima_llamada_prog: format(calcularFechaLlamada(new Date()), "yyyy-MM-dd"),
        fecha_proxima_visita_prog: format(addDays(new Date(), periodoVisita), "yyyy-MM-dd"),
      }]);

      // Agendar llamada automáticamente
      const fechaLlamada = calcularFechaLlamada(new Date());
      await supabase.from("registro_llamadas").insert([{
        paciente_id: paciente.id,
        fecha_agendada: fechaLlamada.toISOString(),
        estado: "agendada" as any,
        motivo: "Llamada inicial de seguimiento",
        duracion_estimada: 15,
      }]);

      toast.success("Paciente agregado exitosamente con llamada agendada");
    }

    setOpen(false);
    fetchPacientes();
    setMedicamentos([""]);
    (e.target as HTMLFormElement).reset();
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-success text-success-foreground";
      case "inactivo":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-destructive text-destructive-foreground";
    }
  };

  const getDificultadColor = (dificultad: string) => {
    switch (dificultad) {
      case "bajo":
        return "bg-secondary text-secondary-foreground";
      case "medio":
        return "bg-warning text-warning-foreground";
      case "alto":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Gestión de pacientes del programa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Paciente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Paciente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cedula">Cédula *</Label>
                    <Input 
                      id="cedula" 
                      name="cedula" 
                      required 
                      onBlur={(e) => fetchCedulaData(e.target.value)}
                      disabled={loadingCedula}
                    />
                    {loadingCedula && <p className="text-xs text-muted-foreground">Consultando JCE...</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha_nacimiento">Fecha Nacimiento</Label>
                    <Input id="fecha_nacimiento" name="fecha_nacimiento" type="date" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input id="nombre" name="nombre" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input id="apellido" name="apellido" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contacto_px">Contacto Paciente</Label>
                    <Input id="contacto_px" name="contacto_px" type="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zona">Zona</Label>
                    <Select name="zona">
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar zona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="santo_domingo_oeste">SD Oeste</SelectItem>
                        <SelectItem value="santo_domingo_este">SD Este</SelectItem>
                        <SelectItem value="santo_domingo_norte">SD Norte</SelectItem>
                        <SelectItem value="distrito_nacional">Distrito Nacional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grado_dificultad">Grado Dificultad</Label>
                    <Select name="grado_dificultad" defaultValue="medio">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bajo">Bajo</SelectItem>
                        <SelectItem value="medio">Medio</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombre_cuidador">Nombre Cuidador</Label>
                    <Input id="nombre_cuidador" name="nombre_cuidador" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contacto_cuidador">Contacto Cuidador</Label>
                  <Input id="contacto_cuidador" name="contacto_cuidador" type="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion_domicilio">Dirección</Label>
                  <Input id="direccion_domicilio" name="direccion_domicilio" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="historia_medica">Historia Médica</Label>
                  <Textarea 
                    id="historia_medica" 
                    name="historia_medica" 
                    placeholder="Resumen de condiciones médicas relevantes..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Medicamentos</Label>
                  {medicamentos.map((med, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={med}
                        onChange={(e) => {
                          const newMeds = [...medicamentos];
                          newMeds[index] = e.target.value;
                          setMedicamentos(newMeds);
                        }}
                        placeholder="Nombre del medicamento"
                      />
                      {index === medicamentos.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setMedicamentos([...medicamentos, ""])}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="periodo_llamada">Período Llamadas (días)</Label>
                    <Input 
                      id="periodo_llamada" 
                      name="periodo_llamada" 
                      type="number" 
                      defaultValue="30"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="periodo_visita">Período Visitas (días)</Label>
                    <Input 
                      id="periodo_visita" 
                      name="periodo_visita" 
                      type="number" 
                      defaultValue="90"
                      min="1"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Paciente"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Búsqueda</label>
              <Input
                placeholder="Nombre o cédula..."
                value={filters.busqueda}
                onChange={(e) => setFilters({ ...filters, busqueda: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                  <SelectItem value="fallecido">Fallecido</SelectItem>
                  <SelectItem value="renuncio">Renunció</SelectItem>
                  <SelectItem value="cambio_ars">Cambió ARS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Zona</label>
              <Select value={filters.zona} onValueChange={(v) => setFilters({ ...filters, zona: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="santo_domingo_oeste">SD Oeste</SelectItem>
                  <SelectItem value="santo_domingo_este">SD Este</SelectItem>
                  <SelectItem value="santo_domingo_norte">SD Norte</SelectItem>
                  <SelectItem value="distrito_nacional">Distrito Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Grado Dificultad</label>
              <Select value={filters.grado} onValueChange={(v) => setFilters({ ...filters, grado: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPacientes.map((paciente) => (
          <Card 
            key={paciente.id} 
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => {
              setSelectedPacienteId(paciente.id);
              setDetailOpen(true);
            }}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {paciente.nombre} {paciente.apellido}
                </CardTitle>
                <Badge className={getStatusColor(paciente.status_px)}>
                  {paciente.status_px}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Cédula:</span> {paciente.cedula}
              </p>
              {paciente.contacto_px && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {paciente.contacto_px}
                </p>
              )}
              {paciente.zona && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {paciente.zona.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </p>
              )}
              <Badge className={getDificultadColor(paciente.grado_dificultad)}>
                Dificultad: {paciente.grado_dificultad}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPacientes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No se encontraron pacientes
          </CardContent>
        </Card>
      )}

      <PacienteDetailDialog
        pacienteId={selectedPacienteId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <ImportPacientesDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={fetchPacientes}
      />
    </div>
  );
};

export default Pacientes;
