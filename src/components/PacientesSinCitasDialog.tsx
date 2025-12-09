import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Phone, MapPin, Search, Plus } from "lucide-react";

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  contacto_px?: string;
  zona?: string;
  barrio?: string;
}

interface PacientesSinCitasDialogProps {
  pacientes: Paciente[];
  tipo: "llamadas" | "visitas";
  onAgendar: (pacienteId: string) => void;
}

export function PacientesSinCitasDialog({ pacientes, tipo, onAgendar }: PacientesSinCitasDialogProps) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const pacientesFiltrados = pacientes.filter(p =>
    `${p.nombre} ${p.apellido} ${p.cedula}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto text-destructive underline">
          Ver pacientes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            Pacientes sin {tipo === "llamadas" ? "llamadas" : "visitas"} agendadas ({pacientes.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {pacientesFiltrados.map((paciente) => (
              <div
                key={paciente.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {paciente.nombre} {paciente.apellido}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span>{paciente.cedula}</span>
                    {paciente.contacto_px && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {paciente.contacto_px}
                      </span>
                    )}
                    {paciente.zona && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {paciente.zona}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    onAgendar(paciente.id);
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agendar
                </Button>
              </div>
            ))}
            {pacientesFiltrados.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No se encontraron pacientes
              </p>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
