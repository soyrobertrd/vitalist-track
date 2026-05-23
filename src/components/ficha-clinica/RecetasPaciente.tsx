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
import { Plus, Pencil, Trash2, Pill, Printer, X } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useActiveSucursal } from "@/contexts/ActiveSucursalContext";
import { useProfessionalVertical } from "@/hooks/useProfessionalVertical";

interface RecetaItem {
  id?: string;
  medicamento: string;
  presentacion: string;
  dosis: string;
  via_administracion: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  indicaciones: string;
  orden: number;
}

interface Receta {
  id: string;
  paciente_id: string;
  profesional_id: string;
  diagnostico_texto: string | null;
  indicaciones_generales: string | null;
  vigencia_dias: number;
  estado: string;
  fecha_emision: string;
  personal_salud?: { nombre: string; apellido: string } | null;
  items?: RecetaItem[];
}

const ESTADO_COLORS: Record<string, string> = {
  activa: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  dispensada: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  vencida: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  cancelada: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const EMPTY_ITEM: RecetaItem = {
  medicamento: "", presentacion: "", dosis: "", via_administracion: "oral",
  frecuencia: "", duracion: "", cantidad: "", indicaciones: "", orden: 0,
};

interface Props {
  pacienteId: string;
}

export function RecetasPaciente({ pacienteId }: Props) {
  const { currentWorkspace } = useWorkspace();
  const { activeSucursalId } = useActiveSucursal();
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReceta, setEditingReceta] = useState<Partial<Receta> | null>(null);
  const [items, setItems] = useState<RecetaItem[]>([{ ...EMPTY_ITEM }]);
  const [profesionales, setProfesionales] = useState<{ id: string; nombre: string; apellido: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchRecetas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recetas")
      .select("*, personal_salud:profesional_id(nombre, apellido)")
      .eq("paciente_id", pacienteId)
      .order("fecha_emision", { ascending: false });

    if (!error && data) {
      // Fetch items for each receta
      const ids = data.map((r: any) => r.id);
      const { data: allItems } = ids.length > 0
        ? await supabase.from("recetas_items").select("*").in("receta_id", ids).order("orden")
        : { data: [] };

      const recetasWithItems = data.map((r: any) => ({
        ...r,
        items: (allItems || []).filter((i: any) => i.receta_id === r.id),
      }));
      setRecetas(recetasWithItems);
    }
    setLoading(false);
  }, [pacienteId]);

  useEffect(() => {
    fetchRecetas();
  }, [fetchRecetas]);

  useEffect(() => {
    const fetchProf = async () => {
      const { data } = await supabase
        .from("personal_salud")
        .select("id, nombre, apellido")
        .order("nombre");
      if (data) setProfesionales(data);
    };
    fetchProf();
  }, []);

  const openNew = () => {
    setEditingReceta({ vigencia_dias: 30, estado: "activa" });
    setItems([{ ...EMPTY_ITEM }]);
    setDialogOpen(true);
  };

  const openEdit = (r: Receta) => {
    setEditingReceta(r);
    setItems(r.items && r.items.length > 0 ? r.items : [{ ...EMPTY_ITEM }]);
    setDialogOpen(true);
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM, orden: prev.length }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof RecetaItem, value: string) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const save = async () => {
    if (!editingReceta?.profesional_id) {
      toast.error("Seleccione un profesional");
      return;
    }
    const validItems = items.filter(i => i.medicamento.trim());
    if (validItems.length === 0) {
      toast.error("Agregue al menos un medicamento");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        paciente_id: pacienteId,
        profesional_id: editingReceta.profesional_id,
        diagnostico_texto: editingReceta.diagnostico_texto || null,
        indicaciones_generales: editingReceta.indicaciones_generales || null,
        vigencia_dias: editingReceta.vigencia_dias || 30,
        estado: (editingReceta.estado as any) || "activa",
        workspace_id: currentWorkspace?.id || null,
        sucursal_id: activeSucursalId || null,
      };

      let recetaId = editingReceta.id;

      if (recetaId) {
        const { error } = await supabase.from("recetas").update(payload).eq("id", recetaId);
        if (error) throw error;
        // Delete old items, re-insert
        await supabase.from("recetas_items").delete().eq("receta_id", recetaId);
      } else {
        const { data, error } = await supabase.from("recetas").insert(payload).select("id").single();
        if (error) throw error;
        recetaId = data.id;
      }

      const itemsPayload = validItems.map((it, idx) => ({
        receta_id: recetaId!,
        medicamento: it.medicamento,
        presentacion: it.presentacion || null,
        dosis: it.dosis || null,
        via_administracion: it.via_administracion || "oral",
        frecuencia: it.frecuencia || null,
        duracion: it.duracion || null,
        cantidad: it.cantidad || null,
        indicaciones: it.indicaciones || null,
        orden: idx,
      }));

      const { error: itemsError } = await supabase.from("recetas_items").insert(itemsPayload);
      if (itemsError) throw itemsError;

      toast.success("Receta guardada");
      setDialogOpen(false);
      fetchRecetas();
    } catch (err: any) {
      toast.error("Error al guardar receta: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const deleteReceta = async (id: string) => {
    if (!confirm("¿Eliminar esta receta?")) return;
    const { error } = await supabase.from("recetas").delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Receta eliminada");
    fetchRecetas();
  };

  const printReceta = (r: Receta) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const prof = r.personal_salud ? `Dr(a). ${r.personal_salud.nombre} ${r.personal_salud.apellido}` : "";
    const fecha = new Date(r.fecha_emision).toLocaleDateString();
    const itemsHtml = (r.items || []).map((it, i) =>
      `<tr><td>${i + 1}</td><td><strong>${it.medicamento}</strong>${it.presentacion ? ` (${it.presentacion})` : ""}</td><td>${it.dosis || ""}</td><td>${it.via_administracion}</td><td>${it.frecuencia || ""}</td><td>${it.duracion || ""}</td><td>${it.cantidad || ""}</td></tr>`
    ).join("");

    w.document.write(`<!DOCTYPE html><html><head><title>Receta</title><style>
      body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:20px}
      h1{font-size:20px;text-align:center}table{width:100%;border-collapse:collapse;margin:16px 0}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:13px}
      th{background:#f5f5f5}.footer{margin-top:40px;text-align:center;font-size:12px;color:#666}
      .sig{margin-top:60px;border-top:1px solid #333;width:200px;margin-left:auto;margin-right:auto;text-align:center;padding-top:8px}
    </style></head><body>
      <h1>RECETA MÉDICA</h1>
      <p><strong>Fecha:</strong> ${fecha} &nbsp; <strong>Médico:</strong> ${prof}</p>
      ${r.diagnostico_texto ? `<p><strong>Diagnóstico:</strong> ${r.diagnostico_texto}</p>` : ""}
      <table><thead><tr><th>#</th><th>Medicamento</th><th>Dosis</th><th>Vía</th><th>Frecuencia</th><th>Duración</th><th>Cant.</th></tr></thead><tbody>${itemsHtml}</tbody></table>
      ${r.indicaciones_generales ? `<p><strong>Indicaciones:</strong> ${r.indicaciones_generales}</p>` : ""}
      <div class="sig">${prof}</div>
      <p class="footer">Vigencia: ${r.vigencia_dias} días</p>
    </body></html>`);
    w.document.close();
    w.print();
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4 text-center">Cargando recetas...</p>;

  return (
    <div className="space-y-3">
      <RecetasNewButton onClick={openNew} />


      {recetas.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">No hay recetas registradas</p>
      ) : (
        recetas.map(r => (
          <Card key={r.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Pill className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">
                      {new Date(r.fecha_emision).toLocaleDateString()}
                    </span>
                    <Badge variant="outline" className={ESTADO_COLORS[r.estado] || ""}>
                      {r.estado}
                    </Badge>
                    {r.personal_salud && (
                      <span className="text-sm text-muted-foreground">
                        Dr(a). {r.personal_salud.nombre} {r.personal_salud.apellido}
                      </span>
                    )}
                  </div>
                  {r.diagnostico_texto && (
                    <p className="text-sm text-muted-foreground">Dx: {r.diagnostico_texto}</p>
                  )}
                  <div className="mt-2 space-y-1">
                    {(r.items || []).map((it, i) => (
                      <div key={i} className="text-sm flex gap-2">
                        <span className="text-muted-foreground">{i + 1}.</span>
                        <span className="font-medium">{it.medicamento}</span>
                        {it.dosis && <span>— {it.dosis}</span>}
                        {it.frecuencia && <span className="text-muted-foreground">c/{it.frecuencia}</span>}
                        {it.duracion && <span className="text-muted-foreground">x {it.duracion}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => printReceta(r)} title="Imprimir">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteReceta(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Dialog crear/editar receta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingReceta?.id ? "Editar Receta" : "Nueva Receta"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Profesional *</Label>
                <Select
                  value={editingReceta?.profesional_id || ""}
                  onValueChange={v => setEditingReceta(prev => ({ ...prev, profesional_id: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {profesionales.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select
                  value={editingReceta?.estado || "activa"}
                  onValueChange={v => setEditingReceta(prev => ({ ...prev, estado: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="dispensada">Dispensada</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Diagnóstico</Label>
              <Input
                value={editingReceta?.diagnostico_texto || ""}
                onChange={e => setEditingReceta(prev => ({ ...prev, diagnostico_texto: e.target.value }))}
                placeholder="Diagnóstico asociado"
              />
            </div>

            <div>
              <Label>Vigencia (días)</Label>
              <Input
                type="number" min={1} max={365}
                value={editingReceta?.vigencia_dias || 30}
                onChange={e => setEditingReceta(prev => ({ ...prev, vigencia_dias: parseInt(e.target.value) || 30 }))}
              />
            </div>

            {/* Items / Medicamentos */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-base font-semibold">Medicamentos</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2 relative">
                    {items.length > 1 && (
                      <Button
                        size="icon" variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeItem(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div className="col-span-2 sm:col-span-1">
                        <Label className="text-xs">Medicamento *</Label>
                        <Input
                          value={item.medicamento}
                          onChange={e => updateItem(idx, "medicamento", e.target.value)}
                          placeholder="Nombre"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Presentación</Label>
                        <Input
                          value={item.presentacion}
                          onChange={e => updateItem(idx, "presentacion", e.target.value)}
                          placeholder="Tab, Cap, Jarabe..."
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Dosis</Label>
                        <Input
                          value={item.dosis}
                          onChange={e => updateItem(idx, "dosis", e.target.value)}
                          placeholder="500mg"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Vía</Label>
                        <Select value={item.via_administracion} onValueChange={v => updateItem(idx, "via_administracion", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oral">Oral</SelectItem>
                            <SelectItem value="iv">IV</SelectItem>
                            <SelectItem value="im">IM</SelectItem>
                            <SelectItem value="sc">SC</SelectItem>
                            <SelectItem value="topica">Tópica</SelectItem>
                            <SelectItem value="oftalmica">Oftálmica</SelectItem>
                            <SelectItem value="otica">Ótica</SelectItem>
                            <SelectItem value="inhalatoria">Inhalatoria</SelectItem>
                            <SelectItem value="rectal">Rectal</SelectItem>
                            <SelectItem value="sublingual">Sublingual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Frecuencia</Label>
                        <Input
                          value={item.frecuencia}
                          onChange={e => updateItem(idx, "frecuencia", e.target.value)}
                          placeholder="c/8h"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duración</Label>
                        <Input
                          value={item.duracion}
                          onChange={e => updateItem(idx, "duracion", e.target.value)}
                          placeholder="7 días"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cantidad</Label>
                        <Input
                          value={item.cantidad}
                          onChange={e => updateItem(idx, "cantidad", e.target.value)}
                          placeholder="21 tab"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Indicaciones</Label>
                      <Input
                        value={item.indicaciones}
                        onChange={e => updateItem(idx, "indicaciones", e.target.value)}
                        placeholder="Tomar con alimentos..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Indicaciones generales</Label>
              <Textarea
                value={editingReceta?.indicaciones_generales || ""}
                onChange={e => setEditingReceta(prev => ({ ...prev, indicaciones_generales: e.target.value }))}
                placeholder="Instrucciones adicionales para el paciente"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Guardando..." : "Guardar receta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecetasNewButton({ onClick }: { onClick: () => void }) {
  const { canActHere, verticalProfesional } = useProfessionalVertical();
  return (
    <div className="flex justify-end items-center gap-2">
      {!canActHere && verticalProfesional && (
        <span className="text-xs text-muted-foreground">Tu vertical asignada: <b>{verticalProfesional}</b></span>
      )}
      <Button size="sm" onClick={onClick} disabled={!canActHere} title={!canActHere ? "No autorizado en esta vertical" : ""}>
        <Plus className="h-4 w-4 mr-1" /> Nueva receta
      </Button>
    </div>
  );
}

