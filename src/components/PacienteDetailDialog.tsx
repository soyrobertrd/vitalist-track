import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Phone, User, MapPin, Heart, Pill, Mail, History } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NotificacionPlanAccion } from "@/components/NotificacionPlanAccion";
import { PatientTimeline } from "@/components/PatientTimeline";
import { FichaClinicaPaciente } from "@/components/ficha-clinica/FichaClinicaPaciente";

interface PacienteDetailDialogProps {
  pacienteId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PacienteDetailDialog({ pacienteId, open, onOpenChange }: PacienteDetailDialogProps) {
  const [paciente, setPaciente] = useState<any>(null);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [llamadas, setLlamadas] = useState<any[]>([]);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [parametros, setParametros] = useState<any>(null);

  useEffect(() => {
    if (pacienteId && open) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6" />
            {paciente.nombre} {paciente.apellido}
          </DialogTitle>
        </DialogHeader>

        <NotificacionPlanAccion pacienteId={pacienteId || ''} />

        <div className="space-y-4">
          {/* Información General */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información General</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cédula</p>
                <p className="font-medium">{paciente.cedula}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                <p className="font-medium">{paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacto</p>
                {paciente.contacto_px ? (
                  <div className="font-medium flex items-center gap-2">
                    <a
                      href={`tel:${(paciente.contacto_px || '').replace(/\D/g, '')}`}
                      className="no-underline hover:text-primary"
                      aria-label={`Llamar a ${paciente.nombre} ${paciente.apellido}`}
                    >
                      {paciente.contacto_px}
                    </a>
                    {paciente.whatsapp_px && (
                      <a
                        href={`https://wa.me/${(paciente.contacto_px || '').replace(/\D/g, '').replace(/^([89]\d{9})$/, '1$1')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center p-1 rounded hover:bg-accent"
                        aria-label={`Enviar WhatsApp a ${paciente.nombre} ${paciente.apellido}`}
                        title="Enviar mensaje por WhatsApp"
                      >
                        <FontAwesomeIcon icon={faWhatsapp} className="h-6 w-6 text-green-600" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="font-medium">N/A</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correo del Paciente</p>
                {paciente.email_px ? (
                  <a 
                    href={`mailto:${paciente.email_px}`}
                    className="font-medium flex items-center gap-1 hover:text-primary"
                  >
                    <Mail className="h-4 w-4" />
                    {paciente.email_px}
                  </a>
                ) : (
                  <p className="font-medium">N/A</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge className={paciente.status_px === 'activo' ? 'bg-success' : 'bg-muted'}>
                  {paciente.status_px}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Municipio (zona)</p>
                <p className="font-medium">{paciente.zona || 'N/A'}</p>
              </div>
              {paciente.barrio && (
                <div>
                  <p className="text-sm text-muted-foreground">Barrio</p>
                  <p className="font-medium">{paciente.barrio}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Dirección</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {paciente.direccion_domicilio || 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cuidador */}
          {paciente.nombre_cuidador && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cuidador</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{paciente.nombre_cuidador}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contacto</p>
                  {paciente.contacto_cuidador ? (
                    <div className="font-medium flex items-center gap-2">
                      <a
                        href={`tel:${(paciente.contacto_cuidador || '').replace(/\D/g, '')}`}
                        className="no-underline hover:text-primary"
                        aria-label={`Llamar a cuidador de ${paciente.nombre} ${paciente.apellido}`}
                      >
                        {paciente.contacto_cuidador}
                      </a>
                       {paciente.whatsapp_cuidador && (
                        <a
                          href={`https://wa.me/${(paciente.contacto_cuidador || '').replace(/\D/g, '').replace(/^([89]\d{9})$/, '1$1')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center p-1 rounded hover:bg-accent"
                          aria-label={`Enviar WhatsApp al cuidador de ${paciente.nombre} ${paciente.apellido}`}
                          title="Enviar mensaje por WhatsApp"
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="h-4 w-4 text-green-600" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="font-medium">N/A</p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Correo del Cuidador</p>
                  {paciente.email_cuidador ? (
                    <a 
                      href={`mailto:${paciente.email_cuidador}`}
                      className="font-medium flex items-center gap-1 hover:text-primary"
                    >
                      <Mail className="h-4 w-4" />
                      {paciente.email_cuidador}
                    </a>
                  ) : (
                    <p className="font-medium">N/A</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historia Médica */}
          {paciente.historia_medica_basica && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Historia Médica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{paciente.historia_medica_basica}</p>
              </CardContent>
            </Card>
          )}

          {/* Ficha clínica: alergias, antecedentes, seguros */}
          {pacienteId && <FichaClinicaPaciente pacienteId={pacienteId} />}

          {/* Tabs para Medicamentos, Llamadas, Visitas e Historial */}
          <Tabs defaultValue="medicamentos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="medicamentos">Medicamentos ({medicamentos.length})</TabsTrigger>
              <TabsTrigger value="llamadas">Llamadas ({llamadas.length})</TabsTrigger>
              <TabsTrigger value="visitas">Visitas ({visitas.length})</TabsTrigger>
              <TabsTrigger value="historial">
                <History className="h-4 w-4 mr-1" />
                Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="medicamentos" className="space-y-2">
              {medicamentos.map((med) => (
                <Card key={med.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Pill className="h-5 w-5 text-primary mt-1" />
                        <div>
                          <p className="font-medium">{med.nombre_medicamento}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosis} - {med.frecuencia}
                          </p>
                          {med.notas && (
                            <p className="text-sm text-muted-foreground mt-1">{med.notas}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {med.muestra_medica && (
                          <Badge variant="secondary" className="mb-1">Muestra</Badge>
                        )}
                        <p className="text-sm text-muted-foreground">Stock: {med.cantidad_disponible}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {medicamentos.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay medicamentos registrados</p>
              )}
            </TabsContent>

            <TabsContent value="llamadas" className="space-y-2">
              {llamadas.map((llamada) => (
                <Card key={llamada.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {llamada.fecha_agendada 
                                ? new Date(llamada.fecha_agendada).toLocaleString('es-DO', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })
                                : 'Fecha no especificada'}
                            </p>
                            <Badge className="mt-1" variant="outline">{llamada.estado}</Badge>
                          </div>
                        </div>
                        {llamada.personal_salud && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Profesional: {llamada.personal_salud.nombre} {llamada.personal_salud.apellido}
                          </p>
                        )}
                        {llamada.motivo && (
                          <p className="text-sm mt-1">
                            <span className="text-muted-foreground">Motivo:</span> {llamada.motivo}
                          </p>
                        )}
                        {llamada.notas_adicionales && (
                          <p className="text-sm text-muted-foreground mt-1">{llamada.notas_adicionales}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {llamadas.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay llamadas agendadas</p>
              )}
            </TabsContent>

            <TabsContent value="visitas" className="space-y-2">
              {visitas.map((visita) => (
                <Card key={visita.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {new Date(visita.fecha_hora_visita).toLocaleString('es-DO', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </p>
                            <Badge className="mt-1">{visita.estado}</Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize mt-2">
                          Tipo: {visita.tipo_visita?.replace('_', ' ')}
                        </p>
                        {visita.personal_salud && (
                          <p className="text-sm text-muted-foreground">
                            Profesional: {visita.personal_salud.nombre} {visita.personal_salud.apellido}
                          </p>
                        )}
                        {visita.motivo_visita && (
                          <p className="text-sm mt-1">
                            <span className="text-muted-foreground">Motivo:</span> {visita.motivo_visita}
                          </p>
                        )}
                        {visita.notas_visita && (
                          <p className="text-sm text-muted-foreground mt-1">{visita.notas_visita}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {visitas.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No hay visitas agendadas</p>
              )}
            </TabsContent>

            <TabsContent value="historial" className="space-y-2">
              <PatientTimeline pacienteId={pacienteId || ''} />
            </TabsContent>
          </Tabs>

          {/* Parámetros de Seguimiento */}
          {parametros && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parámetros de Seguimiento</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Próxima Llamada</p>
                  <p className="font-medium">{parametros.fecha_proxima_llamada_prog ? new Date(parametros.fecha_proxima_llamada_prog).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próxima Visita</p>
                  <p className="font-medium">{parametros.fecha_proxima_visita_prog ? new Date(parametros.fecha_proxima_visita_prog).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Periodo Llamadas</p>
                  <p className="font-medium">{parametros.periodo_llamada_ciclico} días</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Periodo Visitas</p>
                  <p className="font-medium">{parametros.periodo_visita_ciclico} días</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Llamadas No Contestadas</p>
                  <p className="font-medium">{parametros.contador_llamadas_no_contestadas}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
