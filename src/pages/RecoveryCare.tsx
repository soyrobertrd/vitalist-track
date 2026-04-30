import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, BedDouble, CalendarCheck, Activity, Plane, Users, CalendarDays, DollarSign, Calculator } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import VerticalPersonalTab from "@/components/vertical/VerticalPersonalTab";
import VerticalCitasTab from "@/components/vertical/VerticalCitasTab";
import VerticalFacturacionTab from "@/components/vertical/VerticalFacturacionTab";
import VerticalNominaTab from "@/components/vertical/VerticalNominaTab";
import VerticalPacientesTab from "@/components/vertical/VerticalPacientesTab";

const estadoPacColor: Record<string, string> = {
  reservado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ingresado: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  en_recuperacion: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  alta: "bg-muted text-muted-foreground",
  cancelado: "bg-destructive/10 text-destructive",
};

const estadoHabColor: Record<string, string> = {
  disponible: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ocupada: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  limpieza: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  mantenimiento: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  reservada: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export default function RecoveryCare() {
  const { currentWorkspace } = useWorkspace();
  const [tab, setTab] = useState("pacientes");

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes_recovery", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("pacientes_recovery" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    },
  });

  const { data: habitaciones = [] } = useQuery({
    queryKey: ["habitaciones_recovery", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("habitaciones_recovery" as any).select("*").eq("workspace_id", currentWorkspace!.id).eq("activa", true).order("nombre");
      return (data || []) as any[];
    },
  });

  const { data: planes = [] } = useQuery({
    queryKey: ["planes_recovery", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("planes_recovery" as any).select("*").eq("workspace_id", currentWorkspace!.id).eq("activo", true).order("dias");
      return (data || []) as any[];
    },
  });

  const { data: seguimientos = [] } = useQuery({
    queryKey: ["seguimiento_diario_recovery", currentWorkspace?.id],
    enabled: !!currentWorkspace,
    queryFn: async () => {
      const { data } = await supabase.from("seguimiento_diario_recovery" as any).select("*").eq("workspace_id", currentWorkspace!.id).order("created_at", { ascending: false }).limit(50);
      return (data || []) as any[];
    },
  });

  const activos = pacientes.filter((p: any) => ["ingresado", "en_recuperacion"].includes(p.estado)).length;
  const turismoMedico = pacientes.filter((p: any) => p.turismo_medico).length;
  const habDisponibles = habitaciones.filter((h: any) => h.estado === "disponible").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Heart className="h-6 w-6" /> Recovery Care
        </h1>
        <p className="text-muted-foreground">Gestión de casas de recuperación postquirúrgica</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Activity className="h-5 w-5 mx-auto mb-1 text-green-500" />
          <p className="text-2xl font-bold">{activos}</p>
          <p className="text-xs text-muted-foreground">Pacientes activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <BedDouble className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{habDisponibles}/{habitaciones.length}</p>
          <p className="text-xs text-muted-foreground">Hab. disponibles</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Plane className="h-5 w-5 mx-auto mb-1 text-blue-500" />
          <p className="text-2xl font-bold">{turismoMedico}</p>
          <p className="text-xs text-muted-foreground">Turismo médico</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{planes.length}</p>
          <p className="text-xs text-muted-foreground">Planes activos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{seguimientos.length}</p>
          <p className="text-xs text-muted-foreground">Seguimientos hoy</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pacientes">Pacientes</TabsTrigger>
          <TabsTrigger value="habitaciones">Habitaciones</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="gestion_pacientes" className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Registro</TabsTrigger>
          <TabsTrigger value="citas" className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Citas</TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Personal</TabsTrigger>
          <TabsTrigger value="facturacion" className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> Facturación</TabsTrigger>
          <TabsTrigger value="nomina" className="flex items-center gap-1"><Calculator className="h-3.5 w-3.5" /> Nómina</TabsTrigger>
        </TabsList>

        <TabsContent value="pacientes" className="space-y-3">
          {pacientes.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay pacientes</CardContent></Card>
          ) : pacientes.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.numero} — {p.nombre_paciente || "Paciente"}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.tipo_cirugia || ""} · {p.medico_tratante || ""} · {p.pais_origen || "RD"}
                    {p.turismo_medico && " ✈️"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.fecha_ingreso ? `Ingreso: ${format(new Date(p.fecha_ingreso), "dd/MM/yyyy", { locale: es })}` : ""}
                  </p>
                </div>
                <Badge className={estadoPacColor[p.estado] || ""}>{p.estado.replace(/_/g, " ")}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="habitaciones" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habitaciones.map((h: any) => (
            <Card key={h.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-lg">{h.nombre}</p>
                    <p className="text-sm text-muted-foreground">{h.tipo} · Cap: {h.capacidad} {h.piso ? `· Piso ${h.piso}` : ""}</p>
                    {h.tarifa_diaria && <p className="text-sm font-medium mt-1">${h.tarifa_diaria}/día</p>}
                  </div>
                  <Badge className={estadoHabColor[h.estado] || ""}>{h.estado}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="planes" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planes.map((p: any) => (
            <Card key={p.id}>
              <CardContent className="pt-4">
                <p className="font-bold text-lg">{p.nombre}</p>
                <Badge variant="outline" className="mt-1">{p.categoria} · {p.dias} días</Badge>
                {p.precio && <p className="text-xl font-bold mt-2">${p.precio} {p.moneda}</p>}
                {p.descripcion && <p className="text-sm text-muted-foreground mt-2">{p.descripcion}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="seguimiento" className="space-y-3">
          {seguimientos.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No hay seguimientos</CardContent></Card>
          ) : seguimientos.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="py-4">
                <div className="flex justify-between">
                  <p className="font-medium">{s.fecha} — Turno: {s.turno}</p>
                  {s.alertas && <Badge variant="destructive">{s.alertas}</Badge>}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2 text-sm">
                  {s.temperatura && <span>🌡️ {s.temperatura}°C</span>}
                  {s.presion_sistolica && <span>💓 {s.presion_sistolica}/{s.presion_diastolica}</span>}
                  {s.frecuencia_cardiaca && <span>❤️ {s.frecuencia_cardiaca} bpm</span>}
                  {s.saturacion_o2 && <span>🫁 {s.saturacion_o2}%</span>}
                  {s.nivel_dolor !== null && <span>😣 Dolor: {s.nivel_dolor}/10</span>}
                  {s.inflamacion && <span>🔴 {s.inflamacion}</span>}
                </div>
                {s.notas_enfermeria && <p className="text-sm text-muted-foreground mt-2">{s.notas_enfermeria}</p>}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
