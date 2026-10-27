import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Profesional { id: string; nombre: string; apellido: string; especialidad: string | null }

const hoy = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD en hora local

export default function ReservarCita() {
  const { slug } = useParams();
  const [centro, setCentro] = useState<string | null>(null);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requiereCedula, setRequiereCedula] = useState(false);
  const [profId, setProfId] = useState("");
  const [fecha, setFecha] = useState(hoy());
  const [slots, setSlots] = useState<string[] | null>(null);
  const [hora, setHora] = useState("");
  const [form, setForm] = useState({ nombre: "", apellido: "", cedula: "", telefono: "", email: "", motivo: "" });
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  const api = async (accion: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke("reservar-cita", { body: { slug, accion, ...extra } });
    if (error || data?.error) {
      let msg = data?.error;
      try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* sin cuerpo */ }
      throw new Error(msg || "No se pudo conectar con el centro");
    }
    return data;
  };

  useEffect(() => {
    api("info")
      .then((d) => { setCentro(d.centro.nombre); setProfesionales(d.profesionales); setRequiereCedula(!!d.requiere_cedula); })
      .catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (!profId || !fecha) return;
    setSlots(null);
    setHora("");
    api("disponibilidad", { profesional_id: profId, fecha })
      .then((d) => setSlots(d.slots))
      .catch((e) => { toast.error(e.message); setSlots([]); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profId, fecha]);

  const reservar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hora) { toast.error("Elige un horario"); return; }
    setEnviando(true);
    try {
      const [h, m] = hora.split(":").map(Number);
      const fechaHora = new Date(`${fecha}T00:00:00`);
      fechaHora.setHours(h, m, 0, 0);
      await api("reservar", { profesional_id: profId, fecha_hora: fechaHora.toISOString(), ...form });
      setListo(true);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  if (error) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md shadow-none">
          <CardHeader>
            <CardTitle>Reservas no disponibles</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (listo) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center shadow-none">
          <CardContent className="space-y-3 pt-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden="true" />
            <h1 className="text-xl font-semibold">¡Cita reservada!</h1>
            <p className="text-sm text-muted-foreground">
              {centro} te contactará al {form.telefono} para confirmar tu cita del {fecha} a las {hora}.
            </p>
            <Button variant="outline" onClick={() => { setListo(false); setHora(""); setSlots(null); setProfId(""); }}>
              Reservar otra cita
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-muted/30 px-4 py-8">
      <div className="mx-auto max-w-xl space-y-6">
        <header className="text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          {centro ? (
            <h1 className="mt-2 text-2xl font-bold">{centro}</h1>
          ) : (
            <Skeleton className="mx-auto mt-2 h-8 w-48" />
          )}
          <p className="text-sm text-muted-foreground">Reserva tu cita en línea</p>
        </header>

        <form onSubmit={reservar} className="space-y-6">
          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">1. Profesional y horario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prof">Profesional</Label>
                  <Select value={profId} onValueChange={setProfId}>
                    <SelectTrigger id="prof"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                    <SelectContent>
                      {profesionales.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} {p.apellido}{p.especialidad ? ` · ${p.especialidad}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input id="fecha" type="date" min={hoy()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>
              </div>

              {profId && (
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">Horarios disponibles</legend>
                  {slots === null ? (
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-9" />)}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No hay horarios libres este día. Prueba otra fecha.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {slots.map((s) => (
                        <Button
                          key={s}
                          type="button"
                          size="sm"
                          variant={hora === s ? "default" : "outline"}
                          aria-pressed={hora === s}
                          onClick={() => setHora(s)}
                          className="tabular-nums"
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  )}
                </fieldset>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">2. Tus datos</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" required maxLength={100} autoComplete="given-name" value={form.nombre} onChange={set("nombre")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input id="apellido" required maxLength={100} autoComplete="family-name" value={form.apellido} onChange={set("apellido")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input id="telefono" required type="tel" inputMode="tel" autoComplete="tel" placeholder="809-000-0000" value={form.telefono} onChange={set("telefono")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cedula">Cédula{requiereCedula ? " *" : ""}</Label>
                <Input id="cedula" required={requiereCedula} inputMode="numeric" maxLength={13} placeholder="000-0000000-0" value={form.cedula} onChange={set("cedula")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="motivo">Motivo de la consulta</Label>
                <Textarea id="motivo" maxLength={500} rows={3} value={form.motivo} onChange={set("motivo")} />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={enviando || !hora}>
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            {hora ? `Reservar cita · ${fecha} ${hora}` : "Elige un horario"}
          </Button>
        </form>
      </div>
    </main>
  );
}
