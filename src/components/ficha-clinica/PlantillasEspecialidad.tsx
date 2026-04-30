import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, FileText, Eye } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const ESPECIALIDADES: { value: string; label: string }[] = [
  { value: "medicina_general", label: "Medicina General" },
  { value: "pediatria", label: "Pediatría" },
  { value: "ginecologia", label: "Ginecología" },
  { value: "cardiologia", label: "Cardiología" },
  { value: "dermatologia", label: "Dermatología" },
  { value: "odontologia", label: "Odontología" },
  { value: "psicologia", label: "Psicología" },
  { value: "laboratorio", label: "Laboratorio" },
  { value: "imagenes", label: "Imágenes" },
  { value: "emergencias", label: "Emergencias" },
  { value: "otro", label: "Otro" },
];

interface CampoPlantilla {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox";
  options?: string[];
  required?: boolean;
}

interface Plantilla {
  id: string;
  especialidad: string;
  nombre: string;
  descripcion: string | null;
  campos_json: CampoPlantilla[];
  activo: boolean;
}

interface ConsultaEsp {
  id: string;
  paciente_id: string;
  profesional_id: string;
  plantilla_id: string | null;
  especialidad: string;
  datos_json: Record<string, any>;
  created_at: string;
  personal_salud?: { nombre: string; apellido: string } | null;
  plantillas_especialidad?: { nombre: string } | null;
}

// ==========================================
// ADMIN: Gestión de plantillas
// ==========================================
export function PlantillasEspecialidadAdmin() {
  const { currentWorkspace } = useWorkspace();
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Plantilla> | null>(null);
  const [camposText, setCamposText] = useState("");

  const fetchPlantillas = useCallback(async () => {
    setLoading(true);
    const q = supabase.from("plantillas_especialidad").select("*").order("especialidad").order("nombre");
    if (currentWorkspace) q.eq("workspace_id", currentWorkspace.id);
    const { data } = await q;
    setPlantillas((data || []) as unknown as Plantilla[]);
    setLoading(false);
  }, [currentWorkspace]);

  useEffect(() => { fetchPlantillas(); }, [fetchPlantillas]);

  const openNew = () => {
    setEditing({ especialidad: "medicina_general", activo: true, campos_json: [] });
    setCamposText(JSON.stringify(DEFAULT_CAMPOS["medicina_general"], null, 2));
    setDialogOpen(true);
  };

  const openEdit = (p: Plantilla) => {
    setEditing(p);
    setCamposText(JSON.stringify(p.campos_json, null, 2));
    setDialogOpen(true);
  };

  const save = async () => {
    if (!editing?.nombre?.trim()) { toast.error("Nombre requerido"); return; }
    let campos: CampoPlantilla[];
    try {
      campos = JSON.parse(camposText);
    } catch {
      toast.error("JSON de campos inválido");
      return;
    }

    const payload = {
      workspace_id: currentWorkspace?.id || null,
      especialidad: editing.especialidad as any,
      nombre: editing.nombre,
      descripcion: editing.descripcion || null,
      campos_json: campos as any,
      activo: editing.activo ?? true,
    };

    const { error } = editing.id
      ? await supabase.from("plantillas_especialidad").update(payload).eq("id", editing.id)
      : await supabase.from("plantillas_especialidad").insert(payload);
    if (error) { toast.error("Error: " + error.message); return; }
    toast.success("Plantilla guardada");
    setDialogOpen(false);
    fetchPlantillas();
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar esta plantilla?")) return;
    await supabase.from("plantillas_especialidad").delete().eq("id", id);
    toast.success("Eliminada");
    fetchPlantillas();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Plantillas por Especialidad</h3>
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nueva plantilla</Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
      ) : plantillas.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No hay plantillas. Cree la primera para una especialidad.</p>
      ) : (
        <div className="grid gap-3">
          {plantillas.map(p => (
            <Card key={p.id}>
              <CardContent className="p-4 flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{p.nombre}</span>
                    <Badge variant="outline" className="capitalize">
                      {ESPECIALIDADES.find(e => e.value === p.especialidad)?.label || p.especialidad}
                    </Badge>
                    {!p.activo && <Badge variant="secondary">Inactiva</Badge>}
                  </div>
                  {p.descripcion && <p className="text-sm text-muted-foreground mt-1">{p.descripcion}</p>}
                  <p className="text-xs text-muted-foreground mt-1">{p.campos_json.length} campos</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar" : "Nueva"} Plantilla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre *</Label>
                <Input value={editing?.nombre || ""} onChange={e => setEditing(prev => ({ ...prev, nombre: e.target.value }))} />
              </div>
              <div>
                <Label>Especialidad</Label>
                <Select
                  value={editing?.especialidad || "medicina_general"}
                  onValueChange={v => {
                    setEditing(prev => ({ ...prev, especialidad: v }));
                    if (!editing?.id) setCamposText(JSON.stringify(DEFAULT_CAMPOS[v] || [], null, 2));
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESPECIALIDADES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Input value={editing?.descripcion || ""} onChange={e => setEditing(prev => ({ ...prev, descripcion: e.target.value }))} />
            </div>
            <div>
              <Label>Campos (JSON)</Label>
              <Textarea rows={12} className="font-mono text-xs" value={camposText} onChange={e => setCamposText(e.target.value)} />
              <p className="text-xs text-muted-foreground mt-1">
                Cada campo: {"{ key, label, type: text|textarea|number|select|checkbox, options?: [...], required?: true }"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// PATIENT: Consultas usando plantillas
// ==========================================
interface ConsultasProps {
  pacienteId: string;
}

export function ConsultasEspecialidad({ pacienteId }: ConsultasProps) {
  const { currentWorkspace } = useWorkspace();
  const [consultas, setConsultas] = useState<ConsultaEsp[]>([]);
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [profesionales, setProfesionales] = useState<{ id: string; nombre: string; apellido: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ConsultaEsp> | null>(null);
  const [selectedPlantilla, setSelectedPlantilla] = useState<Plantilla | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [viewDialog, setViewDialog] = useState<ConsultaEsp | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [c, p, prof] = await Promise.all([
      supabase.from("consultas_especialidad")
        .select("*, personal_salud:profesional_id(nombre, apellido), plantillas_especialidad:plantilla_id(nombre)")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false }),
      supabase.from("plantillas_especialidad").select("*").eq("activo", true).order("especialidad"),
      supabase.from("personal_salud").select("id, nombre, apellido").order("nombre"),
    ]);
    if (c.data) setConsultas(c.data as unknown as ConsultaEsp[]);
    if (p.data) setPlantillas(p.data as unknown as Plantilla[]);
    if (prof.data) setProfesionales(prof.data);
    setLoading(false);
  }, [pacienteId]);

  useEffect(() => { fetch(); }, [fetch]);

  const openNew = () => {
    setEditing({ especialidad: "medicina_general" });
    setSelectedPlantilla(null);
    setFormData({});
    setDialogOpen(true);
  };

  const selectPlantilla = (pId: string) => {
    const p = plantillas.find(t => t.id === pId);
    setSelectedPlantilla(p || null);
    setEditing(prev => ({ ...prev, plantilla_id: pId, especialidad: p?.especialidad }));
    setFormData({});
  };

  const save = async () => {
    if (!editing?.profesional_id) { toast.error("Seleccione profesional"); return; }
    const payload = {
      paciente_id: pacienteId,
      profesional_id: editing.profesional_id,
      plantilla_id: editing.plantilla_id || null,
      especialidad: (editing.especialidad || "medicina_general") as any,
      datos_json: formData as any,
      workspace_id: currentWorkspace?.id || null,
    };
    const { error } = editing.id
      ? await supabase.from("consultas_especialidad").update(payload).eq("id", editing.id)
      : await supabase.from("consultas_especialidad").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Consulta guardada");
    setDialogOpen(false);
    fetch();
  };

  if (loading) return <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Nueva consulta</Button>
      </div>

      {consultas.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">No hay consultas especializadas</p>
      ) : consultas.map(c => (
        <Card key={c.id}>
          <CardContent className="p-4 flex justify-between items-start gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{new Date(c.created_at).toLocaleDateString()}</span>
                <Badge variant="outline" className="capitalize">
                  {ESPECIALIDADES.find(e => e.value === c.especialidad)?.label || c.especialidad}
                </Badge>
                {c.plantillas_especialidad && (
                  <Badge variant="secondary">{(c.plantillas_especialidad as any).nombre}</Badge>
                )}
              </div>
              {c.personal_salud && (
                <p className="text-sm text-muted-foreground">
                  Dr(a). {(c.personal_salud as any).nombre} {(c.personal_salud as any).apellido}
                </p>
              )}
            </div>
            <Button size="icon" variant="ghost" onClick={() => setViewDialog(c)}>
              <Eye className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* View dialog */}
      <Dialog open={!!viewDialog} onOpenChange={() => setViewDialog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Consulta</DialogTitle>
          </DialogHeader>
          {viewDialog && (
            <div className="space-y-2">
              {Object.entries(viewDialog.datos_json || {}).map(([k, v]) => (
                <div key={k}>
                  <Label className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, " ")}</Label>
                  <p className="text-sm">{typeof v === "boolean" ? (v ? "Sí" : "No") : String(v || "—")}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Consulta Especializada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Profesional *</Label>
                <Select value={editing?.profesional_id || ""} onValueChange={v => setEditing(prev => ({ ...prev, profesional_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {profesionales.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Plantilla</Label>
                <Select value={editing?.plantilla_id || ""} onValueChange={selectPlantilla}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plantilla..." /></SelectTrigger>
                  <SelectContent>
                    {plantillas.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} ({ESPECIALIDADES.find(e => e.value === p.especialidad)?.label})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedPlantilla && selectedPlantilla.campos_json.length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">{selectedPlantilla.nombre}</p>
                {selectedPlantilla.campos_json.map(campo => (
                  <div key={campo.key}>
                    <Label className="text-xs">{campo.label}{campo.required ? " *" : ""}</Label>
                    {campo.type === "textarea" ? (
                      <Textarea
                        value={formData[campo.key] || ""}
                        onChange={e => setFormData(prev => ({ ...prev, [campo.key]: e.target.value }))}
                        rows={3}
                      />
                    ) : campo.type === "select" && campo.options ? (
                      <Select value={formData[campo.key] || ""} onValueChange={v => setFormData(prev => ({ ...prev, [campo.key]: v }))}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          {campo.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : campo.type === "checkbox" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!formData[campo.key]}
                          onChange={e => setFormData(prev => ({ ...prev, [campo.key]: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm">{campo.label}</span>
                      </div>
                    ) : (
                      <Input
                        type={campo.type === "number" ? "number" : "text"}
                        value={formData[campo.key] || ""}
                        onChange={e => setFormData(prev => ({ ...prev, [campo.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!selectedPlantilla && (
              <div>
                <Label>Notas de consulta (sin plantilla)</Label>
                <Textarea
                  value={formData["notas_generales"] || ""}
                  onChange={e => setFormData(prev => ({ ...prev, notas_generales: e.target.value }))}
                  rows={6} placeholder="Escriba las notas de la consulta..."
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// Default templates per specialty
// ==========================================
const DEFAULT_CAMPOS: Record<string, CampoPlantilla[]> = {
  medicina_general: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "enfermedad_actual", label: "Enfermedad actual", type: "textarea" },
    { key: "revision_sistemas", label: "Revisión por sistemas", type: "textarea" },
    { key: "examen_fisico", label: "Examen físico", type: "textarea" },
    { key: "plan", label: "Plan", type: "textarea" },
  ],
  pediatria: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "peso_kg", label: "Peso (kg)", type: "number" },
    { key: "talla_cm", label: "Talla (cm)", type: "number" },
    { key: "perimetro_cefalico", label: "Perímetro cefálico (cm)", type: "number" },
    { key: "alimentacion", label: "Alimentación", type: "select", options: ["Lactancia materna exclusiva", "Fórmula", "Mixta", "Alimentación complementaria", "Normal para edad"] },
    { key: "vacunas_al_dia", label: "Vacunas al día", type: "checkbox" },
    { key: "desarrollo_psicomotor", label: "Desarrollo psicomotor", type: "textarea" },
    { key: "examen_fisico", label: "Examen físico", type: "textarea" },
    { key: "plan", label: "Plan", type: "textarea" },
  ],
  ginecologia: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "fum", label: "FUM (Fecha última menstruación)", type: "text" },
    { key: "ciclo_menstrual", label: "Ciclo menstrual", type: "text" },
    { key: "gestaciones", label: "G P A C", type: "text" },
    { key: "anticonceptivo", label: "Método anticonceptivo", type: "select", options: ["Ninguno", "ACO", "DIU", "Implante", "Preservativo", "Otro"] },
    { key: "pap_previo", label: "PAP previo", type: "text" },
    { key: "mamografia", label: "Mamografía previa", type: "text" },
    { key: "examen_fisico", label: "Examen físico", type: "textarea" },
    { key: "plan", label: "Plan", type: "textarea" },
  ],
  cardiologia: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "dolor_toracico", label: "Dolor torácico", type: "select", options: ["No", "Típico", "Atípico", "No cardíaco"] },
    { key: "disnea", label: "Disnea", type: "select", options: ["No", "NYHA I", "NYHA II", "NYHA III", "NYHA IV"] },
    { key: "palpitaciones", label: "Palpitaciones", type: "checkbox" },
    { key: "sincope", label: "Síncope", type: "checkbox" },
    { key: "pa", label: "PA (mmHg)", type: "text" },
    { key: "fc", label: "FC (lpm)", type: "number" },
    { key: "ecg", label: "ECG", type: "textarea" },
    { key: "ecocardiograma", label: "Ecocardiograma", type: "textarea" },
    { key: "plan", label: "Plan", type: "textarea" },
  ],
  dermatologia: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "localizacion", label: "Localización de la lesión", type: "text" },
    { key: "tiempo_evolucion", label: "Tiempo de evolución", type: "text" },
    { key: "descripcion_lesion", label: "Descripción de la lesión", type: "textarea" },
    { key: "tipo_lesion", label: "Tipo de lesión", type: "select", options: ["Mácula", "Pápula", "Placa", "Nódulo", "Vesícula", "Ampolla", "Pústula", "Úlcera", "Otro"] },
    { key: "prurito", label: "Prurito", type: "checkbox" },
    { key: "diagnostico_diferencial", label: "Diagnóstico diferencial", type: "textarea" },
    { key: "plan", label: "Plan", type: "textarea" },
  ],
  odontologia: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "pieza_dental", label: "Pieza(s) dental(es)", type: "text" },
    { key: "tipo_procedimiento", label: "Tipo de procedimiento", type: "select", options: ["Evaluación", "Limpieza", "Restauración", "Endodoncia", "Extracción", "Ortodoncia", "Prótesis", "Cirugía", "Otro"] },
    { key: "hallazgos", label: "Hallazgos clínicos", type: "textarea" },
    { key: "radiografias", label: "Radiografías", type: "textarea" },
    { key: "plan_tratamiento", label: "Plan de tratamiento", type: "textarea" },
  ],
  psicologia: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "tipo_sesion", label: "Tipo de sesión", type: "select", options: ["Evaluación inicial", "Seguimiento", "Crisis", "Alta"] },
    { key: "estado_emocional", label: "Estado emocional", type: "textarea" },
    { key: "tecnicas_aplicadas", label: "Técnicas aplicadas", type: "textarea" },
    { key: "tareas_asignadas", label: "Tareas asignadas", type: "textarea" },
    { key: "observaciones", label: "Observaciones", type: "textarea" },
    { key: "proxima_sesion", label: "Próxima sesión sugerida", type: "text" },
  ],
  laboratorio: [
    { key: "estudios_solicitados", label: "Estudios solicitados", type: "textarea", required: true },
    { key: "tipo_muestra", label: "Tipo de muestra", type: "select", options: ["Sangre", "Orina", "Heces", "Esputo", "Secreción", "Tejido", "Otro"] },
    { key: "ayuno_requerido", label: "Ayuno requerido", type: "checkbox" },
    { key: "indicaciones_especiales", label: "Indicaciones especiales", type: "textarea" },
    { key: "resultados", label: "Resultados", type: "textarea" },
    { key: "valores_anormales", label: "Valores anormales", type: "textarea" },
  ],
  imagenes: [
    { key: "estudio_solicitado", label: "Estudio solicitado", type: "text", required: true },
    { key: "tipo_estudio", label: "Tipo de estudio", type: "select", options: ["Radiografía", "Ecografía", "TAC", "RMN", "Mamografía", "Densitometría", "Otro"] },
    { key: "region_anatomica", label: "Región anatómica", type: "text" },
    { key: "indicacion_clinica", label: "Indicación clínica", type: "textarea" },
    { key: "hallazgos", label: "Hallazgos", type: "textarea" },
    { key: "impresion_diagnostica", label: "Impresión diagnóstica", type: "textarea" },
  ],
  emergencias: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "mecanismo_lesion", label: "Mecanismo de lesión", type: "text" },
    { key: "triaje", label: "Clasificación triaje", type: "select", options: ["Rojo - Emergencia", "Naranja - Urgencia", "Amarillo - Urgencia menor", "Verde - No urgente", "Azul - Sin urgencia"] },
    { key: "signos_vitales", label: "Signos vitales", type: "textarea" },
    { key: "examen_fisico", label: "Examen físico", type: "textarea" },
    { key: "procedimientos", label: "Procedimientos realizados", type: "textarea" },
    { key: "plan_disposicion", label: "Plan / Disposición", type: "select", options: ["Alta", "Observación", "Hospitalización", "Cirugía", "Traslado", "Referencia"] },
  ],
  otro: [
    { key: "motivo_consulta", label: "Motivo de consulta", type: "textarea", required: true },
    { key: "hallazgos", label: "Hallazgos", type: "textarea" },
    { key: "plan", label: "Plan", type: "textarea" },
  ],
};
