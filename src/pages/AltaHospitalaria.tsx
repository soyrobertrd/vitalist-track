import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileCheck, Plus, FileSignature, Pill, Calendar, AlertTriangle, Stethoscope } from "lucide-react";
import { format } from "date-fns";

const ESTADO_COLOR: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  firmada:   "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  entregada: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  anulada:   "bg-muted text-muted-foreground",
};

const TIPOS = [
  { value: "medica", label: "Alta médica" },
  { value: "voluntaria", label: "Alta voluntaria" },
  { value: "traslado", label: "Traslado" },
  { value: "defuncion", label: "Defunción" },
  { value: "fuga", label: "Fuga" },
];

export default function AltaHospitalaria() {
  const { currentWorkspace } = useWorkspace();
  const { isAdmin } = useUserRole();
  const wsId = currentWorkspace?.id;
  const [altas, setAltas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({
    paciente_id: "", tipo_alta: "medica", diagnostico_principal: "",
    resumen_clinico: "", indicaciones_paciente: "", cuidados_domicilio: "",
    dieta_recomendada: "", actividad_fisica: "", signos_alarma: "",
    proxima_cita_fecha: "", proxima_cita_especialidad: "",
    medicamentos_alta_texto: "", medico_alta_id: "", notas_adicionales: "",
  });

  const cargar = async () => {
    if (!wsId) return;
    setLoading(true);
    const [a, p, m] = await Promise.all([
      (supabase.from("altas_hospitalarias") as any)
        .select("*, pacientes(nombre, apellido, cedula), personal_salud!medico_alta_id(nombre, apellido)")
        .eq("workspace_id", wsId).order("fecha_alta", { ascending: false }).limit(100),
      supabase.from("pacientes").select("id, nombre, apellido, cedula").eq("workspace_id", wsId).order("nombre"),
      supabase.from("personal_salud").select("id, nombre, apellido").eq("workspace_id", wsId).eq("activo", true),
    ]);
    setAltas(a.data || []);
    setPacientes(p.data || []);
    setMedicos(m.data || []);
    setLoading(false);
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [wsId]);

  const crear = async () => {
    if (!form.paciente_id) { toast.error("Selecciona el paciente"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const meds = form.medicamentos_alta_texto
      ? form.medicamentos_alta_texto.split("\n").filter(Boolean).map((l: string) => ({ descripcion: l.trim() }))
      : [];
    const payload: any = {
      workspace_id: wsId,
      paciente_id: form.paciente_id,
      tipo_alta: form.tipo_alta,
      diagnostico_principal: form.diagnostico_principal || null,
      resumen_clinico: form.resumen_clinico || null,
      indicaciones_paciente: form.indicaciones_paciente || null,
      cuidados_domicilio: form.cuidados_domicilio || null,
      dieta_recomendada: form.dieta_recomendada || null,
      actividad_fisica: form.actividad_fisica || null,
      signos_alarma: form.signos_alarma || null,
      proxima_cita_fecha: form.proxima_cita_fecha || null,
      proxima_cita_especialidad: form.proxima_cita_especialidad || null,
      medicamentos_alta: meds,
      medico_alta_id: form.medico_alta_id || null,
      notas_adicionales: form.notas_adicionales || null,
      created_by: user?.id,
      estado: "pendiente",
    };
    const { error } = await (supabase.from("altas_hospitalarias") as any).insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Alta hospitalaria registrada");
    setOpen(false);
    setForm({ ...form, paciente_id: "", diagnostico_principal: "", resumen_clinico: "",
      indicaciones_paciente: "", cuidados_domicilio: "", medicamentos_alta_texto: "", notas_adicionales: "" });
    cargar();
  };

  const cambiarEstado = async (id: string, estado: string) => {
    const { error } = await (supabase.from("altas_hospitalarias") as any).update({ estado }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Alta marcada como ${estado}`);
    cargar();
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileCheck className="h-7 w-7 text-primary" /> Alta Hospitalaria
          </h1>
          <p className="text-muted-foreground">Egreso de pacientes con resumen clínico, indicaciones y firma</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nueva alta</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar alta hospitalaria</DialogTitle></DialogHeader>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>Paciente *</Label>
                <Select value={form.paciente_id} onValueChange={v => setForm({ ...form, paciente_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona paciente..." /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {pacientes.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido} · {p.cedula || "s/c"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipo de alta</Label>
                <Select value={form.tipo_alta} onValueChange={v => setForm({ ...form, tipo_alta: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Médico que da el alta</Label>
                <Select value={form.medico_alta_id} onValueChange={v => setForm({ ...form, medico_alta_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Médico..." /></SelectTrigger>
                  <SelectContent>
                    {medicos.map((m: any) => <SelectItem key={m.id} value={m.id}>{m.nombre} {m.apellido}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Próxima cita (fecha)</Label>
                <Input type="date" value={form.proxima_cita_fecha} onChange={e => setForm({ ...form, proxima_cita_fecha: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Diagnóstico principal</Label>
                <Input value={form.diagnostico_principal} onChange={e => setForm({ ...form, diagnostico_principal: e.target.value })} placeholder="Ej: Apendicitis aguda no perforada" />
              </div>
              <div className="md:col-span-2">
                <Label>Resumen clínico</Label>
                <Textarea rows={3} value={form.resumen_clinico} onChange={e => setForm({ ...form, resumen_clinico: e.target.value })} placeholder="Evolución durante la hospitalización..." />
              </div>
              <div className="md:col-span-2">
                <Label>Indicaciones para el paciente</Label>
                <Textarea rows={3} value={form.indicaciones_paciente} onChange={e => setForm({ ...form, indicaciones_paciente: e.target.value })} />
              </div>
              <div>
                <Label>Cuidados en domicilio</Label>
                <Textarea rows={2} value={form.cuidados_domicilio} onChange={e => setForm({ ...form, cuidados_domicilio: e.target.value })} />
              </div>
              <div>
                <Label>Dieta recomendada</Label>
                <Textarea rows={2} value={form.dieta_recomendada} onChange={e => setForm({ ...form, dieta_recomendada: e.target.value })} />
              </div>
              <div>
                <Label>Actividad física</Label>
                <Textarea rows={2} value={form.actividad_fisica} onChange={e => setForm({ ...form, actividad_fisica: e.target.value })} />
              </div>
              <div>
                <Label>Signos de alarma</Label>
                <Textarea rows={2} value={form.signos_alarma} onChange={e => setForm({ ...form, signos_alarma: e.target.value })} placeholder="Ej: fiebre >38°C, sangrado..." />
              </div>
              <div className="md:col-span-2">
                <Label>Medicamentos al alta (uno por línea)</Label>
                <Textarea rows={4} value={form.medicamentos_alta_texto} onChange={e => setForm({ ...form, medicamentos_alta_texto: e.target.value })} placeholder="Amoxicilina 500mg c/8h x 7 días&#10;Paracetamol 500mg c/6h SOS" />
              </div>
              <div>
                <Label>Próxima cita - especialidad</Label>
                <Input value={form.proxima_cita_especialidad} onChange={e => setForm({ ...form, proxima_cita_especialidad: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Notas adicionales</Label>
                <Textarea rows={2} value={form.notas_adicionales} onChange={e => setForm({ ...form, notas_adicionales: e.target.value })} />
              </div>
            </div>
            <Button onClick={crear} className="mt-4">Registrar alta</Button>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="grid gap-3">
          {altas.length === 0 && (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              No hay altas registradas todavía.
            </CardContent></Card>
          )}
          {altas.map((a: any) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    {a.pacientes?.nombre} {a.pacientes?.apellido}
                    <Badge variant="outline">{TIPOS.find(t => t.value === a.tipo_alta)?.label || a.tipo_alta}</Badge>
                  </CardTitle>
                  <div className="flex gap-2 items-center">
                    <Badge className={ESTADO_COLOR[a.estado]}>{a.estado}</Badge>
                    <span className="text-xs text-muted-foreground">{format(new Date(a.fecha_alta), "PPp")}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {a.diagnostico_principal && <p><strong>Dx:</strong> {a.diagnostico_principal}</p>}
                {a.resumen_clinico && <p className="text-muted-foreground line-clamp-2">{a.resumen_clinico}</p>}
                {Array.isArray(a.medicamentos_alta) && a.medicamentos_alta.length > 0 && (
                  <p className="flex items-start gap-1"><Pill className="h-3.5 w-3.5 mt-0.5 text-primary" />
                    <span>{a.medicamentos_alta.length} medicamento(s) al alta</span>
                  </p>
                )}
                {a.signos_alarma && <p className="flex items-start gap-1 text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5" /> Signos de alarma definidos
                </p>}
                {a.proxima_cita_fecha && <p className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Próxima cita: {a.proxima_cita_fecha}
                  {a.proxima_cita_especialidad ? ` (${a.proxima_cita_especialidad})` : ""}
                </p>}
                <div className="flex gap-2 pt-2">
                  {a.estado === "pendiente" && (
                    <Button size="sm" variant="outline" onClick={() => cambiarEstado(a.id, "firmada")}>
                      <FileSignature className="h-3.5 w-3.5 mr-1" /> Marcar firmada
                    </Button>
                  )}
                  {a.estado === "firmada" && (
                    <Button size="sm" variant="outline" onClick={() => cambiarEstado(a.id, "entregada")}>
                      Entregar al paciente
                    </Button>
                  )}
                  {isAdmin && a.estado !== "anulada" && (
                    <Button size="sm" variant="ghost" onClick={() => cambiarEstado(a.id, "anulada")}>
                      Anular
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
