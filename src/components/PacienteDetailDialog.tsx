import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Phone, MapPin, Heart, Pill, Mail, History, Printer, ExternalLink } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { printFichaClinica360 } from "@/lib/clinical-print-service";
import { NotificacionPlanAccion } from "@/components/NotificacionPlanAccion";
import { PatientTimeline } from "@/components/PatientTimeline";
import { FichaClinicaPaciente } from "@/components/ficha-clinica/FichaClinicaPaciente";
import { GenerarTokenPortal } from "@/components/GenerarTokenPortal";
import { SectionTitle } from "@/components/common/SectionTitle";

const capital = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

interface PacienteDetailDialogProps {
  pacienteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PacienteDetailDialog({ pacienteId, open, onOpenChange }: PacienteDetailDialogProps) {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [paciente, setPaciente] = useState<any>(null);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [llamadas, setLlamadas] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [parametros, setParametros] = useState<any>(null);

  useEffect(() => {
    if (pacienteId && open) {
      setPaciente(null);
      fetchPacienteDetails();
    }
  }, [pacienteId, open]);

  const fetchPacienteDetails = async () => {
    if (!pacienteId) return;

    const [pacienteRes, medicamentosRes, llamadasRes, visitasRes, parametrosRes] = await Promise.all([
      supabase.from("pacientes").select("*").eq("id", pacienteId).single(),
      supabase.from("medicamentos_paciente").select("*").eq("paciente_id", pacienteId),
      supabase.from("registro_llamadas")
        .select("*, personal_salud!registro_llamadas_profesional_id_fkey(nombre, apellido)")
        .eq("paciente_id", pacienteId)
        .in("estado", ["agendada", "pendiente"])
        .order("fecha_agendada", { ascending: true })
        .limit(5),
      supabase.from("control_visitas")
        .select("*, personal_salud!control_visitas_profesional_id_fkey(nombre, apellido)")
        .eq("paciente_id", pacienteId)
        .eq("estado", "pendiente")
        .order("fecha_hora_visita", { ascending: true })
        .limit(5),
      supabase.from("parametros_seguimiento").select("*").eq("paciente_id", pacienteId).maybeSingle(),
    ]);

    if (pacienteRes.data) setPaciente(pacienteRes.data);
    if (medicamentosRes.data) setMedicamentos(medicamentosRes.data);
    if (llamadasRes.data) setLlamadas(llamadasRes.data);
    if (visitasRes.data) setVisitas(visitasRes.data);
    if (parametrosRes.data) setParametros(parametrosRes.data);
  };

  if (!paciente) return null;

  const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`;
  const iniciales = `${paciente.nombre?.[0] ?? ""}${paciente.apellido?.[0] ?? ""}`.toUpperCase();
  const edad = paciente.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(paciente.fecha_nacimiento).getTime()) / 31_557_600_000)
    : null;
  // numero_principal indica cuál contacto es el principal ("paciente" | "cuidador"), no es un teléfono
  const telefono = (paciente.numero_principal === "cuidador" ? paciente.contacto_cuidador : paciente.contacto_px) || paciente.contacto_px || paciente.contacto_cuidador;
  const waNumero = (n: string) => n.replace(/\D/g, "").replace(/^([89]\d{9})$/, "1$1");
  const fechaHora = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" }) : "Sin fecha";
  const fecha = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-DO", { dateStyle: "medium" }) : "—");

  const proximaCita = visitas[0]?.fecha_hora_visita ?? null;
  const proximaLlamada = llamadas[0]?.fecha_agendada ?? null;
  const activo = paciente.status_px === "activo";

  const Dato = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children || "—"}</dd>
    </div>
  );

  const Vacio = ({ texto }: { texto: string }) => (
    <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">{texto}</p>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-6xl flex-col gap-0 overflow-hidden p-0">
        {/* Encabezado fijo: identidad + acciones rápidas */}
        <DialogHeader className="space-y-0 border-b p-6 pb-4 text-left">
          <div className="flex flex-wrap items-start gap-4 pr-8">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary"
            >
              {iniciales}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold">{nombreCompleto}</DialogTitle>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${activo ? "bg-success" : "bg-muted-foreground"}`} aria-hidden="true" />
                  {capital(paciente.status_px)}
                </span>
                {edad !== null && <span>{edad} años</span>}
                {paciente.cedula && <span className="tabular-nums">Cédula {paciente.cedula}</span>}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              className="rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90"
              onClick={() => {
                onOpenChange(false);
                navigate(`/hub-paciente/${paciente.id}`);
              }}
            >
              <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Expediente Hub 360°
            </Button>
            {telefono && (
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <a href={`tel:${telefono.replace(/\D/g, "")}`}>
                  <Phone className="mr-1.5 h-4 w-4" aria-hidden="true" /> Llamar
                </a>
              </Button>
            )}
            {telefono && (paciente.whatsapp_px || paciente.whatsapp_cuidador) && (
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <a href={`https://wa.me/${waNumero(telefono)}`} target="_blank" rel="noopener noreferrer">
                  <FontAwesomeIcon icon={faWhatsapp} className="mr-1.5 h-4 w-4 text-success" /> WhatsApp
                </a>
              </Button>
            )}
            {paciente.email_px && (
              <Button asChild size="sm" variant="outline" className="rounded-xl">
                <a href={`mailto:${paciente.email_px}`}>
                  <Mail className="mr-1.5 h-4 w-4" aria-hidden="true" /> Email
                </a>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-primary font-medium"
              onClick={() => {
                printFichaClinica360(
                  {
                    nombre: paciente.nombre,
                    apellido: paciente.apellido,
                    cedula: paciente.cedula,
                    fecha_nacimiento: paciente.fecha_nacimiento,
                    sexo: paciente.sexo,
                    contacto_px: paciente.contacto_px,
                    contacto_cuidador: paciente.contacto_cuidador,
                    direccion_domicilio: paciente.direccion_domicilio,
                    zona: paciente.zona,
                    historia_medica_basica: paciente.historia_medica_basica,
                    medicamentos: medicamentos.map((m: any) => ({
                      nombre: m.medicamento || m.nombre,
                      dosis: m.dosis,
                      frecuencia: m.frecuencia,
                    })),
                  },
                  {
                    centroNombre: currentWorkspace?.nombre,
                  }
                );
              }}
            >
              <Printer className="mr-1.5 h-4 w-4" /> Imprimir Ficha 360
            </Button>
            <GenerarTokenPortal pacienteId={pacienteId!} pacienteNombre={nombreCompleto} />
          </div>
        </DialogHeader>

        <div className="grid flex-1 gap-6 overflow-y-auto bg-background/60 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <NotificacionPlanAccion pacienteId={pacienteId || ""} />

          <SectionTitle>Resumen general</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Calendar,
                label: "Próxima cita",
                valor: proximaCita ? fechaHora(proximaCita) : "No programada",
                iconStyle: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
              },
              {
                icon: Phone,
                label: "Próxima llamada",
                valor: proximaLlamada ? fechaHora(proximaLlamada) : "No programada",
                iconStyle: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
              },
              {
                icon: Pill,
                label: "Medicamentos",
                valor: String(medicamentos.length),
                iconStyle: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
              },
              {
                icon: History,
                label: "Citas pendientes",
                valor: String(visitas.length + llamadas.length),
                iconStyle: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
              },
            ].map(({ icon: Icon, label, valor, iconStyle }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3.5 shadow-none transition-all hover:shadow-sm">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-muted-foreground">{label}</span>
                  <span className="block truncate text-sm font-bold tabular-nums text-foreground">{valor}</span>
                </span>
              </div>
            ))}
          </div>

          <Tabs defaultValue="resumen">
            <TabsList className="h-auto w-full justify-start overflow-x-auto">
              <TabsTrigger value="resumen">Resumen</TabsTrigger>
              <TabsTrigger value="ficha">Ficha clínica</TabsTrigger>
              <TabsTrigger value="medicamentos">Medicamentos ({medicamentos.length})</TabsTrigger>
              <TabsTrigger value="agenda">Agenda ({llamadas.length + visitas.length})</TabsTrigger>
              <TabsTrigger value="historial">
                <History className="mr-1 h-4 w-4" aria-hidden="true" /> Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resumen" className="space-y-4 pt-4">
              {!paciente.nombre_cuidador && !parametros && <Vacio texto="Sin cuidador ni parámetros de seguimiento registrados" />}
              {paciente.nombre_cuidador && (
                <section className="rounded-2xl border bg-card p-5">
                  <h3 className="mb-3 text-sm font-semibold">Cuidador</h3>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Dato label="Nombre">{paciente.nombre_cuidador}</Dato>
                    <Dato label="Teléfono">
                      {paciente.contacto_cuidador && (
                        <span className="flex items-center gap-2">
                          <a href={`tel:${paciente.contacto_cuidador.replace(/\D/g, "")}`} className="hover:text-primary">
                            {paciente.contacto_cuidador}
                          </a>
                          {paciente.whatsapp_cuidador && (
                            <a
                              href={`https://wa.me/${waNumero(paciente.contacto_cuidador)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="WhatsApp del cuidador"
                            >
                              <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-success" />
                            </a>
                          )}
                        </span>
                      )}
                    </Dato>
                    <Dato label="Correo" full>{paciente.email_cuidador}</Dato>
                  </dl>
                </section>
              )}


              {parametros && (
                <section className="rounded-2xl border bg-card p-5">
                  <h3 className="mb-3 text-sm font-semibold">Parámetros de seguimiento</h3>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <Dato label="Próxima llamada programada">{fecha(parametros.fecha_proxima_llamada_prog)}</Dato>
                    <Dato label="Próxima visita programada">{fecha(parametros.fecha_proxima_visita_prog)}</Dato>
                    <Dato label="Ciclo de llamadas">{parametros.periodo_llamada_ciclico ? `Cada ${parametros.periodo_llamada_ciclico} días` : null}</Dato>
                    <Dato label="Ciclo de visitas">{parametros.periodo_visita_ciclico ? `Cada ${parametros.periodo_visita_ciclico} días` : null}</Dato>
                    <Dato label="Llamadas sin contestar">{String(parametros.contador_llamadas_no_contestadas ?? 0)}</Dato>
                  </dl>
                </section>
              )}
            </TabsContent>

            <TabsContent value="ficha" className="pt-2">
              {pacienteId && <FichaClinicaPaciente pacienteId={pacienteId} />}
            </TabsContent>

            <TabsContent value="medicamentos" className="space-y-2 pt-2">
              {medicamentos.length === 0 ? (
                <Vacio texto="No hay medicamentos registrados" />
              ) : (
                medicamentos.map((med) => (
                  <div key={med.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{med.nombre_medicamento}</p>
                      <p className="text-xs text-muted-foreground">{[med.dosis, med.frecuencia].filter(Boolean).join(" · ")}</p>
                      {med.notas && <p className="mt-1 text-xs text-muted-foreground">{med.notas}</p>}
                    </div>
                    <div className="shrink-0 text-right text-xs text-muted-foreground">
                      {med.muestra_medica && <Badge variant="secondary" className="mb-1 text-[10px]">Muestra</Badge>}
                      <p className="tabular-nums">Stock: {med.cantidad_disponible ?? 0}</p>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="agenda" className="space-y-2 pt-2">
              {visitas.length + llamadas.length === 0 ? (
                <Vacio texto="No hay citas ni llamadas pendientes" />
              ) : (
                [
                  ...visitas.map((v) => ({
                    id: v.id, icon: Calendar, tipo: capital((v.tipo_visita ?? "visita").replace(/_/g, " ")),
                    cuando: v.fecha_hora_visita, estado: v.estado, prof: v.personal_salud, motivo: v.motivo_visita,
                  })),
                  ...llamadas.map((l) => ({
                    id: l.id, icon: Phone, tipo: "Llamada",
                    cuando: l.fecha_agendada, estado: l.estado, prof: l.personal_salud, motivo: l.motivo,
                  })),
                ]
                  .sort((a, b) => (a.cuando ?? "").localeCompare(b.cuando ?? ""))
                  .map((e) => (
                    <div key={e.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <e.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium tabular-nums">{fechaHora(e.cuando)}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.tipo}
                          {e.prof && ` · ${e.prof.nombre} ${e.prof.apellido}`}
                        </p>
                        {e.motivo && <p className="mt-1 text-xs">{e.motivo}</p>}
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">{capital(e.estado ?? "")}</Badge>
                    </div>
                  ))
              )}
            </TabsContent>

            <TabsContent value="historial" className="pt-2">
              <PatientTimeline pacienteId={pacienteId || ""} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Panel derecho: información general + notas importantes */}
        <aside className="space-y-4 lg:sticky lg:top-0 lg:self-start">
          <section className="rounded-2xl border bg-card p-5">
            <h3 className="mb-4 text-base font-semibold">Información general</h3>
            <ul className="space-y-4">
              {[
                { icon: Calendar, label: "Fecha de nacimiento", valor: paciente.fecha_nacimiento ? `${fecha(paciente.fecha_nacimiento)}${edad !== null ? ` (${edad} años)` : ""}` : null },
                { icon: Phone, label: "Teléfono", valor: paciente.contacto_px },
                { icon: Mail, label: "Correo", valor: paciente.email_px },
                { icon: MapPin, label: "Zona / Barrio", valor: [paciente.zona && capital(paciente.zona.replace(/_/g, " ")), paciente.barrio].filter(Boolean).join(" · ") || null },
              ].map(({ icon: Icon, label, valor }) => (
                <li key={label} className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">{label}</span>
                    <span className="block break-words text-sm font-medium">{valor || "—"}</span>
                  </span>
                </li>
              ))}
            </ul>
            {paciente.direccion_domicilio && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(paciente.direccion_domicilio)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                {paciente.direccion_domicilio}
              </a>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 text-base font-semibold">
              <Heart className="h-4 w-4 text-primary" aria-hidden="true" /> Notas importantes
            </h3>
            <p className="whitespace-pre-line rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
              {paciente.historia_medica_basica || "Sin notas registradas."}
            </p>
          </section>
        </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
