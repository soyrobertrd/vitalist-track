import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/integrations/db/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CalendarPlus, Search, Stethoscope } from "lucide-react";

interface Medico {
  id: string;
  nombre: string;
  apellido: string;
  especialidad: string | null;
  centro: { nombre: string; slug: string };
}

const iniciales = (m: Medico) => `${m.nombre[0] ?? ""}${m.apellido[0] ?? ""}`.toUpperCase();

/** Directorio público: médicos de las clínicas que aceptan reservas en línea, con acceso a agendar. */
export default function DirectorioMedico() {
  const [medicos, setMedicos] = useState<Medico[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [especialidad, setEspecialidad] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Directorio médico — Vitalist Track";
    db.functions.invoke("directorio-medico", { body: {} }).then(({ data, error: e }) => {
      if (e || data?.error) setError(data?.error ?? "No se pudo cargar el directorio.");
      else setMedicos(data.medicos ?? []);
    });
  }, []);

  const especialidades = useMemo(
    () => [...new Set((medicos ?? []).map((m) => m.especialidad).filter((e): e is string => !!e))].sort(),
    [medicos],
  );
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (medicos ?? []).filter(
      (m) =>
        (!especialidad || m.especialidad === especialidad) &&
        (!q || `${m.nombre} ${m.apellido} ${m.especialidad ?? ""} ${m.centro.nombre}`.toLowerCase().includes(q)),
    );
  }, [medicos, busqueda, especialidad]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Vitalist Track
        </Link>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 md:px-8 pb-24">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Directorio médico</h1>
          <p className="text-muted-foreground mt-2">
            Encuentra a tu médico y agenda tu cita en línea. El centro te confirma por teléfono o email.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, especialidad o centro"
              aria-label="Buscar médico"
              className="pl-9"
            />
          </div>
          {especialidades.length > 0 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por especialidad">
              {[null, ...especialidades].map((e) => (
                <Button
                  key={e ?? "todas"}
                  size="sm"
                  variant={especialidad === e ? "default" : "outline"}
                  aria-pressed={especialidad === e}
                  onClick={() => setEspecialidad(e)}
                >
                  {e ?? "Todas"}
                </Button>
              ))}
            </div>
          )}
        </div>

        <section className="mt-8" aria-live="polite">
          {error ? (
            <p className="text-destructive">{error}</p>
          ) : medicos === null ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center">
              <Stethoscope className="h-8 w-8 mx-auto text-muted-foreground mb-3" aria-hidden />
              <p className="font-medium">
                {medicos.length ? "Ningún médico coincide con tu búsqueda." : "Aún no hay médicos con reservas en línea."}
              </p>
              {medicos.length > 0 && (
                <Button variant="link" onClick={() => { setBusqueda(""); setEspecialidad(null); }}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map((m) => (
                <li key={m.id} className="rounded-2xl border bg-card p-5 flex flex-col hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold" aria-hidden>
                      {iniciales(m)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold truncate">{m.nombre} {m.apellido}</h2>
                      <p className="text-sm text-primary truncate">{m.especialidad ?? "Medicina general"}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 flex-1">{m.centro.nombre}</p>
                  <Button asChild className="mt-4 w-full">
                    <Link to={`/reservar/${m.centro.slug}?profesional=${m.id}`}>
                      <CalendarPlus className="h-4 w-4 mr-2" /> Agendar cita
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
