import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, ClipboardList, ShieldCheck, Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { CobrosPaciente } from "@/components/cobros/CobrosPaciente";

interface Props {
  pacienteId: string;
}

type Alergia = {
  id: string;
  paciente_id: string;
  sustancia: string;
  tipo: string;
  severidad: string;
  reaccion: string | null;
  notas: string | null;
};

type Antecedente = {
  id: string;
  paciente_id: string;
  tipo: string;
  condicion: string;
  ano: number | null;
  parentesco: string | null;
  activo: boolean;
  notas: string | null;
};

type Seguro = {
  id: string;
  paciente_id: string;
  aseguradora: string;
  numero_poliza: string | null;
  numero_afiliado: string | null;
  plan: string | null;
  titular: string | null;
  parentesco_titular: string | null;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  activo: boolean;
  notas: string | null;
};

const SEVERIDAD_COLORS: Record<string, string> = {
  leve: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300",
  moderada: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300",
  severa: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300",
  anafilaxia: "bg-red-200 text-red-900 border-red-400 dark:bg-red-900 dark:text-red-200",
};

export function FichaClinicaPaciente({ pacienteId }: Props) {
  const [alergias, setAlergias] = useState<Alergia[]>([]);
  const [antecedentes, setAntecedentes] = useState<Antecedente[]>([]);
  const [seguros, setSeguros] = useState<Seguro[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [alergiaDialog, setAlergiaDialog] = useState<{ open: boolean; data: Partial<Alergia> | null }>({ open: false, data: null });
  const [antecedenteDialog, setAntecedenteDialog] = useState<{ open: boolean; data: Partial<Antecedente> | null }>({ open: false, data: null });
  const [seguroDialog, setSeguroDialog] = useState<{ open: boolean; data: Partial<Seguro> | null }>({ open: false, data: null });

  const fetchAll = async () => {
    setLoading(true);
    const [a, b, c] = await Promise.all([
      supabase.from("alergias_paciente").select("*").eq("paciente_id", pacienteId).order("created_at", { ascending: false }),
      supabase.from("antecedentes_medicos").select("*").eq("paciente_id", pacienteId).order("created_at", { ascending: false }),
      supabase.from("seguros_paciente").select("*").eq("paciente_id", pacienteId).order("activo", { ascending: false }),
    ]);
    if (a.data) setAlergias(a.data as Alergia[]);
    if (b.data) setAntecedentes(b.data as Antecedente[]);
    if (c.data) setSeguros(c.data as Seguro[]);
    setLoading(false);
  };

  useEffect(() => {
    if (pacienteId) fetchAll();
  }, [pacienteId]);

  // ---- Save handlers ----
  const saveAlergia = async () => {
    const d = alergiaDialog.data;
    if (!d?.sustancia) {
      toast.error("Sustancia es requerida");
      return;
    }
    const payload = {
      paciente_id: pacienteId,
      sustancia: d.sustancia,
      tipo: d.tipo || "medicamento",
      severidad: d.severidad || "leve",
      reaccion: d.reaccion || null,
      notas: d.notas || null,
    };
    const { error } = d.id
      ? await supabase.from("alergias_paciente").update(payload).eq("id", d.id)
      : await supabase.from("alergias_paciente").insert(payload);
    if (error) {
      toast.error("Error al guardar alergia");
      return;
    }
    toast.success("Alergia guardada");
    setAlergiaDialog({ open: false, data: null });
    fetchAll();
  };

  const saveAntecedente = async () => {
    const d = antecedenteDialog.data;
    if (!d?.condicion) {
      toast.error("Condición es requerida");
      return;
    }
    const payload = {
      paciente_id: pacienteId,
      tipo: d.tipo || "personal",
      condicion: d.condicion,
      ano: d.ano || null,
      parentesco: d.tipo === "familiar" ? (d.parentesco || null) : null,
      activo: d.activo ?? true,
      notas: d.notas || null,
    };
    const { error } = d.id
      ? await supabase.from("antecedentes_medicos").update(payload).eq("id", d.id)
      : await supabase.from("antecedentes_medicos").insert(payload);
    if (error) {
      toast.error("Error al guardar antecedente");
      return;
    }
    toast.success("Antecedente guardado");
    setAntecedenteDialog({ open: false, data: null });
    fetchAll();
  };

  const saveSeguro = async () => {
    const d = seguroDialog.data;
    if (!d?.aseguradora) {
      toast.error("Aseguradora es requerida");
      return;
    }
    const payload = {
      paciente_id: pacienteId,
      aseguradora: d.aseguradora,
      numero_poliza: d.numero_poliza || null,
      numero_afiliado: d.numero_afiliado || null,
      plan: d.plan || null,
      titular: d.titular || null,
      parentesco_titular: d.parentesco_titular || null,
      fecha_inicio: d.fecha_inicio || null,
      fecha_vencimiento: d.fecha_vencimiento || null,
      activo: d.activo ?? true,
      notas: d.notas || null,
    };
    const { error } = d.id
      ? await supabase.from("seguros_paciente").update(payload).eq("id", d.id)
      : await supabase.from("seguros_paciente").insert(payload);
    if (error) {
      toast.error("Error al guardar seguro");
      return;
    }
    toast.success("Seguro guardado");
    setSeguroDialog({ open: false, data: null });
    fetchAll();
  };

  // ---- Delete handlers ----
  const deleteItem = async (table: "alergias_paciente" | "antecedentes_medicos" | "seguros_paciente", id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Eliminado");
    fetchAll();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Cargando ficha clínica...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Ficha Clínica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="alergias" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alergias" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alergias ({alergias.length})
            </TabsTrigger>
            <TabsTrigger value="antecedentes" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Antecedentes ({antecedentes.length})
            </TabsTrigger>
            <TabsTrigger value="seguros" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Seguros ({seguros.length})
            </TabsTrigger>
            <TabsTrigger value="cobros" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Cobros
            </TabsTrigger>
          </TabsList>

          {/* ALERGIAS */}
          <TabsContent value="alergias" className="space-y-2 mt-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAlergiaDialog({ open: true, data: { tipo: "medicamento", severidad: "leve" } })}>
                <Plus className="h-4 w-4 mr-1" /> Agregar alergia
              </Button>
            </div>
            {alergias.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No hay alergias registradas</p>
            ) : (
              alergias.map((a) => (
                <div key={a.id} className="p-3 border rounded-lg flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{a.sustancia}</p>
                      <Badge variant="outline" className="capitalize">{a.tipo}</Badge>
                      <Badge variant="outline" className={SEVERIDAD_COLORS[a.severidad] || ""}>
                        {a.severidad}
                      </Badge>
                    </div>
                    {a.reaccion && <p className="text-sm text-muted-foreground mt-1">Reacción: {a.reaccion}</p>}
                    {a.notas && <p className="text-sm text-muted-foreground mt-1">{a.notas}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setAlergiaDialog({ open: true, data: a })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteItem("alergias_paciente", a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* ANTECEDENTES */}
          <TabsContent value="antecedentes" className="space-y-2 mt-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setAntecedenteDialog({ open: true, data: { tipo: "personal", activo: true } })}>
                <Plus className="h-4 w-4 mr-1" /> Agregar antecedente
              </Button>
            </div>
            {antecedentes.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No hay antecedentes registrados</p>
            ) : (
              antecedentes.map((ant) => (
                <div key={ant.id} className="p-3 border rounded-lg flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{ant.condicion}</p>
                      <Badge variant="outline" className="capitalize">{ant.tipo}</Badge>
                      {ant.ano && <Badge variant="secondary">{ant.ano}</Badge>}
                      {!ant.activo && <Badge variant="outline">Resuelto</Badge>}
                    </div>
                    {ant.parentesco && <p className="text-sm text-muted-foreground mt-1">Parentesco: {ant.parentesco}</p>}
                    {ant.notas && <p className="text-sm text-muted-foreground mt-1">{ant.notas}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setAntecedenteDialog({ open: true, data: ant })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteItem("antecedentes_medicos", ant.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* SEGUROS */}
          <TabsContent value="seguros" className="space-y-2 mt-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setSeguroDialog({ open: true, data: { activo: true } })}>
                <Plus className="h-4 w-4 mr-1" /> Agregar seguro
              </Button>
            </div>
            {seguros.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No hay seguros registrados</p>
            ) : (
              seguros.map((s) => (
                <div key={s.id} className="p-3 border rounded-lg flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{s.aseguradora}</p>
                      {s.plan && <Badge variant="outline">{s.plan}</Badge>}
                      {s.activo ? <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">Activo</Badge> : <Badge variant="outline">Inactivo</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm">
                      {s.numero_afiliado && <p><span className="text-muted-foreground">Afiliado:</span> {s.numero_afiliado}</p>}
                      {s.numero_poliza && <p><span className="text-muted-foreground">Póliza:</span> {s.numero_poliza}</p>}
                      {s.titular && <p><span className="text-muted-foreground">Titular:</span> {s.titular}</p>}
                      {s.parentesco_titular && <p><span className="text-muted-foreground">Parentesco:</span> {s.parentesco_titular}</p>}
                      {s.fecha_vencimiento && <p><span className="text-muted-foreground">Vence:</span> {new Date(s.fecha_vencimiento + "T12:00:00").toLocaleDateString()}</p>}
                    </div>
                    {s.notas && <p className="text-sm text-muted-foreground mt-1">{s.notas}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setSeguroDialog({ open: true, data: s })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteItem("seguros_paciente", s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* COBROS */}
          <TabsContent value="cobros" className="space-y-2 mt-4">
            <CobrosPaciente pacienteId={pacienteId} />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* ALERGIA DIALOG */}
      <Dialog open={alergiaDialog.open} onOpenChange={(o) => setAlergiaDialog({ open: o, data: o ? alergiaDialog.data : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alergiaDialog.data?.id ? "Editar" : "Nueva"} alergia</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Sustancia *</Label>
              <Input
                value={alergiaDialog.data?.sustancia || ""}
                onChange={(e) => setAlergiaDialog({ ...alergiaDialog, data: { ...alergiaDialog.data, sustancia: e.target.value } })}
                placeholder="Ej: Penicilina, Maní, Polen..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={alergiaDialog.data?.tipo || "medicamento"}
                  onValueChange={(v) => setAlergiaDialog({ ...alergiaDialog, data: { ...alergiaDialog.data, tipo: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medicamento">Medicamento</SelectItem>
                    <SelectItem value="alimento">Alimento</SelectItem>
                    <SelectItem value="ambiental">Ambiental</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severidad</Label>
                <Select
                  value={alergiaDialog.data?.severidad || "leve"}
                  onValueChange={(v) => setAlergiaDialog({ ...alergiaDialog, data: { ...alergiaDialog.data, severidad: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leve">Leve</SelectItem>
                    <SelectItem value="moderada">Moderada</SelectItem>
                    <SelectItem value="severa">Severa</SelectItem>
                    <SelectItem value="anafilaxia">Anafilaxia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Reacción</Label>
              <Input
                value={alergiaDialog.data?.reaccion || ""}
                onChange={(e) => setAlergiaDialog({ ...alergiaDialog, data: { ...alergiaDialog.data, reaccion: e.target.value } })}
                placeholder="Ej: Urticaria, dificultad respiratoria..."
              />
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={alergiaDialog.data?.notas || ""}
                onChange={(e) => setAlergiaDialog({ ...alergiaDialog, data: { ...alergiaDialog.data, notas: e.target.value } })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlergiaDialog({ open: false, data: null })}>Cancelar</Button>
            <Button onClick={saveAlergia}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ANTECEDENTE DIALOG */}
      <Dialog open={antecedenteDialog.open} onOpenChange={(o) => setAntecedenteDialog({ open: o, data: o ? antecedenteDialog.data : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{antecedenteDialog.data?.id ? "Editar" : "Nuevo"} antecedente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Condición *</Label>
              <Input
                value={antecedenteDialog.data?.condicion || ""}
                onChange={(e) => setAntecedenteDialog({ ...antecedenteDialog, data: { ...antecedenteDialog.data, condicion: e.target.value } })}
                placeholder="Ej: Diabetes tipo 2, Hipertensión, Apendicectomía..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={antecedenteDialog.data?.tipo || "personal"}
                  onValueChange={(v) => setAntecedenteDialog({ ...antecedenteDialog, data: { ...antecedenteDialog.data, tipo: v } })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="familiar">Familiar</SelectItem>
                    <SelectItem value="quirurgico">Quirúrgico</SelectItem>
                    <SelectItem value="hospitalizacion">Hospitalización</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Año</Label>
                <Input
                  type="number"
                  value={antecedenteDialog.data?.ano || ""}
                  onChange={(e) => setAntecedenteDialog({ ...antecedenteDialog, data: { ...antecedenteDialog.data, ano: e.target.value ? parseInt(e.target.value) : null } })}
                  placeholder="2020"
                />
              </div>
            </div>
            {antecedenteDialog.data?.tipo === "familiar" && (
              <div>
                <Label>Parentesco</Label>
                <Input
                  value={antecedenteDialog.data?.parentesco || ""}
                  onChange={(e) => setAntecedenteDialog({ ...antecedenteDialog, data: { ...antecedenteDialog.data, parentesco: e.target.value } })}
                  placeholder="Madre, padre, hermano..."
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo-ant"
                checked={antecedenteDialog.data?.activo ?? true}
                onChange={(e) => setAntecedenteDialog({ ...antecedenteDialog, data: { ...antecedenteDialog.data, activo: e.target.checked } })}
              />
              <Label htmlFor="activo-ant" className="cursor-pointer">Condición activa</Label>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={antecedenteDialog.data?.notas || ""}
                onChange={(e) => setAntecedenteDialog({ ...antecedenteDialog, data: { ...antecedenteDialog.data, notas: e.target.value } })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAntecedenteDialog({ open: false, data: null })}>Cancelar</Button>
            <Button onClick={saveAntecedente}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEGURO DIALOG */}
      <Dialog open={seguroDialog.open} onOpenChange={(o) => setSeguroDialog({ open: o, data: o ? seguroDialog.data : null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{seguroDialog.data?.id ? "Editar" : "Nuevo"} seguro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <Label>Aseguradora / ARS *</Label>
              <Input
                value={seguroDialog.data?.aseguradora || ""}
                onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, aseguradora: e.target.value } })}
                placeholder="Ej: SeNaSa, Humano, ARS Palic..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Plan</Label>
                <Input
                  value={seguroDialog.data?.plan || ""}
                  onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, plan: e.target.value } })}
                />
              </div>
              <div>
                <Label>N° Afiliado</Label>
                <Input
                  value={seguroDialog.data?.numero_afiliado || ""}
                  onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, numero_afiliado: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <Label>N° Póliza</Label>
              <Input
                value={seguroDialog.data?.numero_poliza || ""}
                onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, numero_poliza: e.target.value } })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Titular</Label>
                <Input
                  value={seguroDialog.data?.titular || ""}
                  onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, titular: e.target.value } })}
                />
              </div>
              <div>
                <Label>Parentesco titular</Label>
                <Input
                  value={seguroDialog.data?.parentesco_titular || ""}
                  onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, parentesco_titular: e.target.value } })}
                  placeholder="Titular, hijo, cónyuge..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={seguroDialog.data?.fecha_inicio || ""}
                  onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, fecha_inicio: e.target.value } })}
                />
              </div>
              <div>
                <Label>Fecha vencimiento</Label>
                <Input
                  type="date"
                  value={seguroDialog.data?.fecha_vencimiento || ""}
                  onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, fecha_vencimiento: e.target.value } })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activo-seg"
                checked={seguroDialog.data?.activo ?? true}
                onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, activo: e.target.checked } })}
              />
              <Label htmlFor="activo-seg" className="cursor-pointer">Seguro activo</Label>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea
                value={seguroDialog.data?.notas || ""}
                onChange={(e) => setSeguroDialog({ ...seguroDialog, data: { ...seguroDialog.data, notas: e.target.value } })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeguroDialog({ open: false, data: null })}>Cancelar</Button>
            <Button onClick={saveSeguro}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
