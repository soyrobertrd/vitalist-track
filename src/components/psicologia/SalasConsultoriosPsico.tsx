import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DoorOpen, Users, Clock, ShieldCheck, Plus, Sparkles, AlertCircle, Baby, HeartHandshake, UserCheck } from "lucide-react";
import { toast } from "sonner";

export interface SalaConsultorio {
  id: string;
  nombre: string;
  tipo: "individual" | "infantil_ludoteca" | "pareja_familiar" | "grupal_talleres";
  capacidadMax: number;
  estado: "disponible" | "ocupado" | "reservado" | "mantenimiento";
  terapeutaActual?: string;
  pacienteActual?: string;
  horarioOcupacion?: string;
  caracteristicas: string[];
}

const SALAS_INICIALES: SalaConsultorio[] = [
  {
    id: "box-1",
    nombre: "Consultorio A (Zen)",
    tipo: "individual",
    capacidadMax: 3,
    estado: "ocupado",
    terapeutaActual: "Dra. Altagracia Peña (TCC)",
    pacienteActual: "Marcos De la Rosa",
    horarioOcupacion: "09:00 AM - 10:00 AM",
    caracteristicas: ["Aislamiento acústico 45dB", "Luz cálida regulable", "Sillón ergonómico"],
  },
  {
    id: "box-2",
    nombre: "Sala Lúdica Infantil",
    tipo: "infantil_ludoteca",
    capacidadMax: 5,
    estado: "disponible",
    caracteristicas: ["Caja de arena terapéutica", "Material didáctico Montessori", "Cámaras Gesell unidireccionales"],
  },
  {
    id: "box-3",
    nombre: "Consultorio B (Vínculos)",
    tipo: "pareja_familiar",
    capacidadMax: 6,
    estado: "reservado",
    terapeutaActual: "Lic. Roberto Gómez (Sistémica)",
    horarioOcupacion: "11:00 AM - 12:30 PM",
    caracteristicas: ["Sofá doble + sillón", "Mesa circular de mediación", "Grabación de audio consentida"],
  },
  {
    id: "box-4",
    nombre: "Aula Mindfulness & Grupal",
    tipo: "grupal_talleres",
    capacidadMax: 16,
    estado: "disponible",
    caracteristicas: ["Zafús / Cojines de meditación", "Proyector interactivo", "Sistema de sonido envolvente"],
  },
];

const estadoColorMap: Record<string, string> = {
  disponible: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  ocupado: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  reservado: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  mantenimiento: "bg-muted text-muted-foreground border-border",
};

const tipoIconMap = {
  individual: UserCheck,
  infantil_ludoteca: Baby,
  pareja_familiar: HeartHandshake,
  grupal_talleres: Users,
};

export default function SalasConsultoriosPsico() {
  const [salas, setSalas] = useState<SalaConsultorio[]>(SALAS_INICIALES);
  const [openModal, setOpenModal] = useState(false);
  const [nuevaSala, setNuevaSala] = useState({
    nombre: "",
    tipo: "individual" as SalaConsultorio["tipo"],
    capacidadMax: 3,
    caracteristicas: "",
  });

  const handleCrearSala = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaSala.nombre.trim()) {
      toast.error("El nombre del consultorio es obligatorio");
      return;
    }
    const sala: SalaConsultorio = {
      id: `box-${Date.now()}`,
      nombre: nuevaSala.nombre,
      tipo: nuevaSala.tipo,
      capacidadMax: Number(nuevaSala.capacidadMax),
      estado: "disponible",
      caracteristicas: nuevaSala.caracteristicas
        ? nuevaSala.caracteristicas.split(",").map((s) => s.trim())
        : ["Aislamiento acústico estándar"],
    };
    setSalas((prev) => [...prev, sala]);
    toast.success("Nuevo espacio terapéutico configurado");
    setOpenModal(false);
    setNuevaSala({ nombre: "", tipo: "individual", capacidadMax: 3, caracteristicas: "" });
  };

  const alternarEstado = (id: string, nuevoEstado: SalaConsultorio["estado"]) => {
    setSalas((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
    );
    toast.info(`Estado actualizado a: ${nuevoEstado}`);
  };

  const disponiblesCount = salas.filter((s) => s.estado === "disponible").length;
  const ocupadasCount = salas.filter((s) => s.estado === "ocupado").length;

  return (
    <div className="space-y-6">
      {/* Encabezado y Métricas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <DoorOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Gestión de Consultorios & Salas Terapéuticas
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Asignación en tiempo real para centros psicológicos con múltiples especialistas y salas acústicamente blindadas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{disponiblesCount} Libres</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-2" />
            <span className="text-muted-foreground">{ocupadasCount} En Sesión</span>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl gap-1.5 shadow-none">
                <Plus className="h-4 w-4" /> Agregar Espacio
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Nuevo Consultorio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCrearSala} className="space-y-3.5 pt-2">
                <div>
                  <Label className="text-xs">Nombre o Identificador</Label>
                  <Input
                    placeholder="Ej. Consultorio C - Gestalt"
                    value={nuevaSala.nombre}
                    onChange={(e) => setNuevaSala({ ...nuevaSala, nombre: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Tipología Terapéutica</Label>
                  <Select
                    value={nuevaSala.tipo}
                    onValueChange={(val: any) => setNuevaSala({ ...nuevaSala, tipo: val })}
                  >
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Consultorio Individual (Adultos / Adolescentes)</SelectItem>
                      <SelectItem value="infantil_ludoteca">Ludoteca / Terapia Infantil</SelectItem>
                      <SelectItem value="pareja_familiar">Terapia Familiar & Pareja</SelectItem>
                      <SelectItem value="grupal_talleres">Sala Grupal / Talleres / Mindfulness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Capacidad Máxima de Personas</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={nuevaSala.capacidadMax}
                    onChange={(e) => setNuevaSala({ ...nuevaSala, capacidadMax: Number(e.target.value) })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Equipamiento & Amenidades (separados por coma)</Label>
                  <Input
                    placeholder="Aislamiento acústico, Sofá doble, Luz tenue..."
                    value={nuevaSala.caracteristicas}
                    onChange={(e) => setNuevaSala({ ...nuevaSala, caracteristicas: e.target.value })}
                    className="rounded-xl mt-1"
                  />
                </div>
                <Button type="submit" className="w-full rounded-xl mt-2">
                  Guardar Consultorio
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Grid de Salas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {salas.map((sala) => {
          const Icon = tipoIconMap[sala.tipo] || DoorOpen;
          return (
            <Card
              key={sala.id}
              className="rounded-2xl border-border/80 shadow-none hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className={`rounded-lg text-[10px] uppercase font-semibold tracking-wider ${estadoColorMap[sala.estado]}`}>
                    {sala.estado}
                  </Badge>
                </div>
                <CardTitle className="text-sm font-semibold text-foreground mt-2">
                  {sala.nombre}
                </CardTitle>
                <CardDescription className="text-xs capitalize">
                  {sala.tipo.replace("_", " ")} · Cap. {sala.capacidadMax} px
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-1 space-y-3 text-xs">
                {sala.estado === "ocupado" || sala.estado === "reservado" ? (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Clock className="h-3.5 w-3.5 text-purple-500" />
                      <span>{sala.horarioOcupacion || "En sesión actual"}</span>
                    </div>
                    {sala.terapeutaActual && (
                      <p className="text-muted-foreground truncate">
                        <span className="font-semibold text-foreground">Terapeuta:</span> {sala.terapeutaActual}
                      </p>
                    )}
                    {sala.pacienteActual && (
                      <p className="text-muted-foreground truncate">
                        <span className="font-semibold text-foreground">Paciente:</span> {sala.pacienteActual}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Espacio listo y sanitizado</span>
                  </div>
                )}

                <div className="space-y-1 pt-1 border-t border-border/40">
                  <p className="text-[11px] font-medium text-muted-foreground">Equipamiento:</p>
                  <div className="flex flex-wrap gap-1">
                    {sala.caracteristicas.map((c, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Acciones de gestión de sala */}
                <div className="pt-2 flex items-center gap-1.5">
                  {sala.estado === "disponible" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl text-xs h-7 border-border/80"
                      onClick={() => alternarEstado(sala.id, "ocupado")}
                    >
                      Ocupar Sala
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl text-xs h-7 border-border/80 text-emerald-600 dark:text-emerald-400"
                      onClick={() => alternarEstado(sala.id, "disponible")}
                    >
                      Liberar Sala
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
