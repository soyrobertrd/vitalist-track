import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Stethoscope } from "lucide-react";
import { toast } from "sonner";

interface Diagnostico {
  id: string;
  paciente_id: string;
  codigo_cie10: string | null;
  descripcion: string;
  tipo: string;
  estado: string;
  fecha_diagnostico: string;
  fecha_resolucion: string | null;
  notas: string | null;
}

const ESTADO_COLORS: Record<string, string> = {
  activo: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
  resuelto: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300",
  cronico: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
  descartado: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900 dark:text-gray-400",
};

export function DiagnosticosPaciente({ pacienteId }: { pacienteId: string }) {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; data: Partial<Diagnostico> | null }>({ open: false, data: null });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("diagnosticos_paciente")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("estado", { ascending: true })
      .order("fecha_diagnostico", { ascending: false });
    setDiagnosticos((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (pacienteId) fetchData();
  }, [pacienteId]);

  const save = async () => {
    const d = dialog.data;
    if (!d?.descripcion) {
      toast.error("Descripción del diagnóstico es requerida");
      return;
    }
    const payload = {
      paciente_id: pacienteId,
      codigo_cie10: d.codigo_cie10 || null,
      descripcion: d.descripcion,
      tipo: d.tipo || "principal",
      estado: d.estado || "activo",
      fecha_diagnostico: d.fecha_diagnostico || new Date().toISOString().slice(0, 10),
      fecha_resolucion: d.estado === "resuelto" ? (d.fecha_resolucion || new Date().toISOString().slice(0, 10)) : null,
      notas: d.notas || null,
    };
    const { error } = d.id
      ? await supabase.from("diagnosticos_paciente").update(payload).eq("id", d.id)
      : await supabase.from("diagnosticos_paciente").insert(payload);
    if (error) {
      toast.error("Error al guardar diagnóstico");
      return;
    }
    toast.success("Diagnóstico guardado");
    setDialog({ open: false, data: null });
    fetchData();
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este diagnóstico?")) return;
    const { error } = await supabase.from("diagnosticos_paciente").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Eliminado");
    fetchData();
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog({ open: true, data: { tipo: "principal", estado: "activo" } })}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo diagnóstico
        </Button>
      </div>

      {diagnosticos.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">No hay diagnósticos registrados</p>
      ) : (
        diagnosticos.map((d) => (
          <div key={d.id} className="p-3 border rounded-lg flex justify-between items-start gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Stethoscope className="h-4 w-4 text-primary" />
                {d.codigo_cie10 && <Badge variant="outline" className="font-mono">{d.codigo_cie10}</Badge>}
                <p className="font-medium">{d.descripcion}</p>
                <Badge variant="outline" className="capitalize">{d.tipo}</Badge>
                <Badge variant="outline" className={ESTADO_COLORS[d.estado]}>{d.estado}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Diagnosticado: {new Date(d.fecha_diagnostico + "T12:00:00").toLocaleDateString("es-DO")}
                {d.fecha_resolucion && ` • Resuelto: ${new Date(d.fecha_resolucion + "T12:00:00").toLocaleDateString("es-DO")}`}
              </p>
              {d.notas && <p className="text-sm text-muted-foreground mt-1">{d.notas}</p>}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => setDialog({ open: true, data: d })}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(d.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))
      )}

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o, data: o ? dialog.data : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.data?.id ? "Editar" : "Nuevo"} diagnóstico</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Código CIE-10</Label>
                <Input
                  placeholder="Ej: I10"
                  value={dialog.data?.codigo_cie10 || ""}
                  onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, codigo_cie10: e.target.value.toUpperCase() } })}
                />
              </div>
              <div className="col-span-2">
                <Label>Descripción *</Label>
                <Input
                  placeholder="Ej: Hipertensión arterial esencial"
                  value={dialog.data?.descripcion || ""}
                  onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, descripcion: e.target.value } })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={dialog.data?.tipo || "principal"} onValueChange={(v) => setDialog({ ...dialog, data: { ...dialog.data, tipo: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="secundario">Secundario</SelectItem>
                    <SelectItem value="presuntivo">Presuntivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={dialog.data?.estado || "activo"} onValueChange={(v) => setDialog({ ...dialog, data: { ...dialog.data, estado: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="cronico">Crónico</SelectItem>
                    <SelectItem value="resuelto">Resuelto</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha diagnóstico</Label>
                <Input
                  type="date"
                  value={dialog.data?.fecha_diagnostico || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, fecha_diagnostico: e.target.value } })}
                />
              </div>
              {dialog.data?.estado === "resuelto" && (
                <div>
                  <Label>Fecha resolución</Label>
                  <Input
                    type="date"
                    value={dialog.data?.fecha_resolucion || ""}
                    onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, fecha_resolucion: e.target.value } })}
                  />
                </div>
              )}
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={dialog.data?.notas || ""}
                onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, notas: e.target.value } })}
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
