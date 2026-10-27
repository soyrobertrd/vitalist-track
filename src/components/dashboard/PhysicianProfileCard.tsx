import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Clock, Calendar, ArrowRight, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PhysicianProfileCardProps {
  nombre?: string;
  especialidad?: string;
  telefono?: string;
  email?: string;
  horario?: string;
  proximaCitaHora?: string;
  proximoPaciente?: string;
}

export function PhysicianProfileCard({
  nombre = "Dra. Courtney Henry",
  especialidad = "Cardiología & Medicina Interna",
  telefono = "+1 (809) 555-0199",
  email = "c.henry@vitalisttrack.com",
  horario = "08:00 AM - 04:00 PM",
  proximaCitaHora = "10:30 AM",
  proximoPaciente = "Carlos Méndez (Control)",
}: PhysicianProfileCardProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-none transition-all hover:border-primary/40">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Médico de Guardia / Especialista Activo
        </h3>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          En Turno
        </span>
      </div>

      <div className="mt-4 flex flex-col items-center text-center sm:flex-row sm:text-left gap-4">
        <Avatar className="h-16 w-16 rounded-2xl border-2 border-primary/20 shadow-xs">
          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white">
            CH
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h4 className="text-base font-bold text-foreground">{nombre}</h4>
          <p className="text-xs font-semibold text-primary">{especialidad}</p>
          <div className="mt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {horario}
            </span>
          </div>
        </div>
      </div>

      {/* Próxima Cita Asignada */}
      <div className="mt-4 rounded-2xl border border-border/60 bg-muted/30 p-3">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Próxima Consulta:</span>
          <span className="font-bold text-foreground tabular-nums">{proximaCitaHora}</span>
        </div>
        <p className="mt-0.5 text-xs font-bold text-foreground truncate">
          {proximoPaciente}
        </p>
      </div>

      {/* Contacto y Acciones */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/calendario")}
          className="h-9 rounded-xl text-xs font-semibold gap-1.5"
        >
          <Calendar className="h-3.5 w-3.5" /> Agenda
        </Button>
        <Button
          size="sm"
          onClick={() => navigate("/recepcion")}
          className="h-9 rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
        >
          <MessageSquare className="h-3.5 w-3.5" /> Consulta
        </Button>
      </div>
    </div>
  );
}
