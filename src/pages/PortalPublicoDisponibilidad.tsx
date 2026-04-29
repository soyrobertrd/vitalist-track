import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { CalendarDays, Clock, Stethoscope, MapPin, Loader2, Building2, Filter, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PortalPublicoDisponibilidad() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("portal_api_key") || "");
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [profSel, setProfSel] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingProf, setLoadingProf] = useState(false);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [reservando, setReservando] = useState<string | null>(null);
  const [datosPaciente, setDatosPaciente] = useState({ nombre: "", cedula: "", telefono: "" });

  const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
  const baseUrl = `https://${projectId}.supabase.co/functions/v1/api-citas-publicas`;

  const callApi = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) throw new Error((await res.json()).error || "Error");
    return res.json();
  };

  const cargarProf = async () => {
    if (!apiKey) { toast.error("Ingresa tu API key"); return; }
    setLoadingProf(true);
    try {
      localStorage.setItem("portal_api_key", apiKey);
      const data = await callApi("/profesionales");
      setProfesionales(data.profesionales || []);
      toast.success(`${data.profesionales?.length || 0} profesionales`);
    } catch (e: any) { toast.error(e.message); }
    setLoadingProf(false);
  };

  const buscarDisp = async () => {
    if (!profSel) { toast.error("Selecciona un profesional"); return; }
    setLoadingDisp(true);
    try {
      const data = await callApi(`/disponibilidad?profesional_id=${profSel}&fecha=${fecha}`);
      setSlots(data.slots || []);
    } catch (e: any) { toast.error(e.message); setSlots([]); }
    setLoadingDisp(false);
  };

  const reservar = async (hora: string) => {
    if (!datosPaciente.nombre || !datosPaciente.cedula) {
      toast.error("Ingresa nombre y cédula del paciente"); return;
    }
    setReservando(hora);
    try {
      await callApi("/agendar", {
        method: "POST",
        body: JSON.stringify({
          profesional_id: profSel,
          fecha, hora,
          paciente: datosPaciente,
        }),
      });
      toast.success("✓ Cita reservada — recibirás confirmación");
      buscarDisp();
    } catch (e: any) { toast.error(e.message); }
    setReservando(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 p-4">
      <div className="container mx-auto max-w-4xl space-y-4">
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold">Reserva de citas en línea</h1>
          <p className="text-muted-foreground mt-1">Consulta disponibilidad y agenda en tiempo real</p>
        </div>

        {profesionales.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>API key del centro</CardTitle>
              <CardDescription>Solicítala al centro de salud para acceder a su disponibilidad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="x-api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
              <Button onClick={cargarProf} disabled={loadingProf} className="w-full">
                {loadingProf ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Stethoscope className="h-4 w-4 mr-1" />}
                Cargar profesionales
              </Button>
            </CardContent>
          </Card>
        )}

        {profesionales.length > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Buscar disponibilidad</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Label>Profesional</Label>
                  <Select value={profSel} onValueChange={setProfSel}>
                    <SelectTrigger><SelectValue placeholder="Selecciona profesional" /></SelectTrigger>
                    <SelectContent>
                      {profesionales.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} {p.especialidad ? `· ${p.especialidad}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                </div>
                <Button onClick={buscarDisp} disabled={loadingDisp || !profSel} className="md:col-span-3">
                  {loadingDisp ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
                  Buscar horarios disponibles
                </Button>
              </CardContent>
            </Card>

            {slots.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Datos del paciente</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-2">
                  <div><Label>Nombre completo</Label><Input value={datosPaciente.nombre} onChange={(e) => setDatosPaciente({ ...datosPaciente, nombre: e.target.value })} /></div>
                  <div><Label>Cédula</Label><Input value={datosPaciente.cedula} onChange={(e) => setDatosPaciente({ ...datosPaciente, cedula: e.target.value })} /></div>
                  <div><Label>Teléfono</Label><Input placeholder="829-123-1234" value={datosPaciente.telefono} onChange={(e) => setDatosPaciente({ ...datosPaciente, telefono: e.target.value })} /></div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Horarios disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDisp && <div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
                {!loadingDisp && slots.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Selecciona profesional y fecha para ver disponibilidad</p>}
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {slots.map((s: any) => (
                    <Button
                      key={s.hora}
                      variant={s.disponible ? "outline" : "secondary"}
                      disabled={!s.disponible || reservando === s.hora}
                      onClick={() => reservar(s.hora)}
                      className="flex-col h-auto py-2"
                    >
                      <span className="font-mono">{s.hora}</span>
                      {s.consultorio && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{s.consultorio}</span>}
                      {!s.disponible && <Badge variant="secondary" className="text-[9px] mt-1">Ocupado</Badge>}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
