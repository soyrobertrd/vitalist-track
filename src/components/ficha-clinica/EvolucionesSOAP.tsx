import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText, Activity } from "lucide-react";
import { toast } from "sonner";

interface Evolucion {
  id: string;
  paciente_id: string;
  visita_id: string | null;
  profesional_id: string | null;
  fecha_evolucion: string;
  motivo_consulta: string | null;
  subjetivo: string | null;
  objetivo: string | null;
  analisis: string | null;
  plan: string | null;
  signos_vitales: { ta?: string; fc?: string; fr?: string; temp?: string; spo2?: string; peso?: string } | null;
  personal_salud?: { nombre: string; apellido: string } | null;
}

export function EvolucionesSOAP({ pacienteId }: { pacienteId: string }) {
  const [evoluciones, setEvoluciones] = useState<Evolucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; data: Partial<Evolucion> | null }>({ open: false, data: null });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("evoluciones_soap")
      .select("*, personal_salud:profesional_id(nombre, apellido)")
      .eq("paciente_id", pacienteId)
      .order("fecha_evolucion", { ascending: false });
    setEvoluciones((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (pacienteId) fetchData();
  }, [pacienteId]);

  const save = async () => {
    const d = dialog.data;
    if (!d?.subjetivo && !d?.objetivo && !d?.analisis && !d?.plan) {
      toast.error("Completa al menos una sección SOAP");
      return;
    }
    const payload = {
      paciente_id: pacienteId,
      motivo_consulta: d.motivo_consulta || null,
      subjetivo: d.subjetivo || null,
      objetivo: d.objetivo || null,
      analisis: d.analisis || null,
      plan: d.plan || null,
      signos_vitales: d.signos_vitales || {},
      fecha_evolucion: d.fecha_evolucion || new Date().toISOString(),
    };
    const { error } = d.id
      ? await supabase.from("evoluciones_soap").update(payload).eq("id", d.id)
      : await supabase.from("evoluciones_soap").insert(payload);
    if (error) {
      toast.error("Error al guardar evolución");
      return;
    }
    toast.success("Evolución guardada");
    setDialog({ open: false, data: null });
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta evolución?")) return;
    const { error } = await supabase.from("evoluciones_soap").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Eliminada");
    fetchData();
  };

  const updateSV = (key: string, value: string) => {
    setDialog({
      ...dialog,
      data: { ...dialog.data, signos_vitales: { ...(dialog.data?.signos_vitales || {}), [key]: value } as any },
    });
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog({ open: true, data: { fecha_evolucion: new Date().toISOString() } })}>
          <Plus className="h-4 w-4 mr-1" /> Nueva evolución SOAP
        </Button>
      </div>

      {evoluciones.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">No hay evoluciones registradas</p>
      ) : (
        evoluciones.map((e) => (
          <div key={e.id} className="border rounded-lg p-4 space-y-3 bg-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {new Date(e.fecha_evolucion).toLocaleString("es-DO", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  {e.personal_salud && (
                    <Badge variant="outline">
                      Dr. {e.personal_salud.nombre} {e.personal_salud.apellido}
                    </Badge>
                  )}
                </div>
                {e.motivo_consulta && (
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Motivo: </span>{e.motivo_consulta}
                  </p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => setDialog({ open: true, data: e })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(e.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            {e.signos_vitales && Object.keys(e.signos_vitales).length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {e.signos_vitales.ta && <Badge variant="secondary"><Activity className="h-3 w-3 mr-1" />TA: {e.signos_vitales.ta}</Badge>}
                {e.signos_vitales.fc && <Badge variant="secondary">FC: {e.signos_vitales.fc}</Badge>}
                {e.signos_vitales.fr && <Badge variant="secondary">FR: {e.signos_vitales.fr}</Badge>}
                {e.signos_vitales.temp && <Badge variant="secondary">T°: {e.signos_vitales.temp}</Badge>}
                {e.signos_vitales.spo2 && <Badge variant="secondary">SpO₂: {e.signos_vitales.spo2}</Badge>}
                {e.signos_vitales.peso && <Badge variant="secondary">Peso: {e.signos_vitales.peso}</Badge>}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3 text-sm">
              {e.subjetivo && (
                <div className="bg-muted/40 p-2 rounded">
                  <p className="font-semibold text-xs text-primary mb-1">S — Subjetivo</p>
                  <p className="whitespace-pre-wrap">{e.subjetivo}</p>
                </div>
              )}
              {e.objetivo && (
                <div className="bg-muted/40 p-2 rounded">
                  <p className="font-semibold text-xs text-primary mb-1">O — Objetivo</p>
                  <p className="whitespace-pre-wrap">{e.objetivo}</p>
                </div>
              )}
              {e.analisis && (
                <div className="bg-muted/40 p-2 rounded">
                  <p className="font-semibold text-xs text-primary mb-1">A — Análisis</p>
                  <p className="whitespace-pre-wrap">{e.analisis}</p>
                </div>
              )}
              {e.plan && (
                <div className="bg-muted/40 p-2 rounded">
                  <p className="font-semibold text-xs text-primary mb-1">P — Plan</p>
                  <p className="whitespace-pre-wrap">{e.plan}</p>
                </div>
              )}
            </div>
          </div>
        ))
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o, data: o ? dialog.data : null })}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog.data?.id ? "Editar" : "Nueva"} evolución SOAP</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Fecha y hora</Label>
                <Input
                  type="datetime-local"
                  value={dialog.data?.fecha_evolucion ? new Date(dialog.data.fecha_evolucion).toISOString().slice(0, 16) : ""}
                  onChange={(ev) => setDialog({ ...dialog, data: { ...dialog.data, fecha_evolucion: new Date(ev.target.value).toISOString() } })}
                />
              </div>
              <div>
                <Label>Motivo de consulta</Label>
                <Input
                  value={dialog.data?.motivo_consulta || ""}
                  onChange={(ev) => setDialog({ ...dialog, data: { ...dialog.data, motivo_consulta: ev.target.value } })}
                />
              </div>
            </div>

            <div className="border rounded p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">SIGNOS VITALES</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Input placeholder="TA (120/80)" value={dialog.data?.signos_vitales?.ta || ""} onChange={(e) => updateSV("ta", e.target.value)} />
                <Input placeholder="FC (lpm)" value={dialog.data?.signos_vitales?.fc || ""} onChange={(e) => updateSV("fc", e.target.value)} />
                <Input placeholder="FR (rpm)" value={dialog.data?.signos_vitales?.fr || ""} onChange={(e) => updateSV("fr", e.target.value)} />
                <Input placeholder="T° (°C)" value={dialog.data?.signos_vitales?.temp || ""} onChange={(e) => updateSV("temp", e.target.value)} />
                <Input placeholder="SpO₂ (%)" value={dialog.data?.signos_vitales?.spo2 || ""} onChange={(e) => updateSV("spo2", e.target.value)} />
                <Input placeholder="Peso (kg)" value={dialog.data?.signos_vitales?.peso || ""} onChange={(e) => updateSV("peso", e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-primary font-semibold">S — Subjetivo (lo que refiere el paciente)</Label>
              <Textarea
                rows={3}
                value={dialog.data?.subjetivo || ""}
                onChange={(ev) => setDialog({ ...dialog, data: { ...dialog.data, subjetivo: ev.target.value } })}
                placeholder="Síntomas, queja principal, historia actual..."
              />
            </div>
            <div>
              <Label className="text-primary font-semibold">O — Objetivo (hallazgos al examen físico)</Label>
              <Textarea
                rows={3}
                value={dialog.data?.objetivo || ""}
                onChange={(ev) => setDialog({ ...dialog, data: { ...dialog.data, objetivo: ev.target.value } })}
                placeholder="Examen físico, signos vitales, resultados de pruebas..."
              />
            </div>
            <div>
              <Label className="text-primary font-semibold">A — Análisis / Impresión diagnóstica</Label>
              <Textarea
                rows={3}
                value={dialog.data?.analisis || ""}
                onChange={(ev) => setDialog({ ...dialog, data: { ...dialog.data, analisis: ev.target.value } })}
                placeholder="Diagnóstico presuntivo, diferenciales..."
              />
            </div>
            <div>
              <Label className="text-primary font-semibold">P — Plan</Label>
              <Textarea
                rows={3}
                value={dialog.data?.plan || ""}
                onChange={(ev) => setDialog({ ...dialog, data: { ...dialog.data, plan: ev.target.value } })}
                placeholder="Tratamiento, indicaciones, próximas pruebas, seguimiento..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ open: false, data: null })}>Cancelar</Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
