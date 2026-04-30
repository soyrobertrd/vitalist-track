import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Search, CircleDot } from "lucide-react";

const TEETH_UPPER = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const TEETH_LOWER = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

const TIPO_HALLAZGO_COLORS: Record<string, string> = {
  caries: "bg-red-500",
  fractura: "bg-orange-500",
  ausente: "bg-gray-400",
  corona: "bg-yellow-500",
  endodoncia: "bg-purple-500",
  implante: "bg-blue-500",
  sellante: "bg-green-400",
  obturacion: "bg-green-600",
  protesis: "bg-cyan-500",
  movilidad: "bg-pink-500",
  sano: "bg-emerald-300",
};

const TIPO_OPTIONS = ["caries","fractura","ausente","corona","endodoncia","implante","sellante","obturacion","protesis","movilidad","sano"] as const;
const CARA_OPTIONS = ["oclusal","mesial","distal","vestibular","lingual","palatina","incisal"] as const;

const Odontograma = () => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("carta");
  const [searchPaciente, setSearchPaciente] = useState("");
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [selectedOdontogramaId, setSelectedOdontogramaId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showHallazgoDialog, setShowHallazgoDialog] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [hallazgoForm, setHallazgoForm] = useState({ tipo: "caries" as string, cara: "" as string, notas: "" });

  // Fetch pacientes for search
  const { data: pacientes } = useQuery({
    queryKey: ["pacientes-odonto", currentWorkspace?.id, searchPaciente],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      let q = supabase.from("pacientes").select("id, nombre, apellido, cedula").eq("workspace_id", currentWorkspace.id).limit(20);
      if (searchPaciente) q = q.or(`nombre.ilike.%${searchPaciente}%,apellido.ilike.%${searchPaciente}%,cedula.ilike.%${searchPaciente}%`);
      const { data } = await q;
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  // Fetch odontogramas for selected patient
  const { data: odontogramas } = useQuery({
    queryKey: ["odontogramas", selectedPacienteId],
    queryFn: async () => {
      if (!selectedPacienteId) return [];
      const { data } = await supabase.from("odontogramas").select("*").eq("paciente_id", selectedPacienteId).order("fecha_evaluacion", { ascending: false });
      return data || [];
    },
    enabled: !!selectedPacienteId,
  });

  // Fetch hallazgos for selected odontograma
  const { data: hallazgos } = useQuery({
    queryKey: ["hallazgos", selectedOdontogramaId],
    queryFn: async () => {
      if (!selectedOdontogramaId) return [];
      const { data } = await supabase.from("hallazgos_dentales").select("*").eq("odontograma_id", selectedOdontogramaId);
      return data || [];
    },
    enabled: !!selectedOdontogramaId,
  });

  // Fetch tratamientos
  const { data: tratamientos } = useQuery({
    queryKey: ["tratamientos-dental", selectedOdontogramaId],
    queryFn: async () => {
      if (!selectedOdontogramaId) return [];
      const { data } = await supabase.from("tratamientos_dentales").select("*, hallazgos_dentales(numero_diente, tipo)").in("hallazgo_id", (hallazgos || []).map(h => h.id));
      return data || [];
    },
    enabled: !!selectedOdontogramaId && (hallazgos || []).length > 0,
  });

  // Fetch presupuestos
  const { data: presupuestos } = useQuery({
    queryKey: ["presupuestos-dental", selectedPacienteId],
    queryFn: async () => {
      if (!selectedPacienteId) return [];
      const { data } = await supabase.from("presupuestos_dentales").select("*").eq("paciente_id", selectedPacienteId).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!selectedPacienteId,
  });

  // Create odontograma
  const createOdontograma = useMutation({
    mutationFn: async () => {
      if (!currentWorkspace?.id || !selectedPacienteId) throw new Error("Seleccione paciente");
      const { data, error } = await supabase.from("odontogramas").insert({ workspace_id: currentWorkspace.id, paciente_id: selectedPacienteId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["odontogramas"] });
      setSelectedOdontogramaId(data.id);
      setShowNewDialog(false);
      toast.success("Odontograma creado");
    },
    onError: () => toast.error("Error al crear odontograma"),
  });

  // Add hallazgo
  const addHallazgo = useMutation({
    mutationFn: async () => {
      if (!selectedOdontogramaId || !selectedTooth) throw new Error("Datos incompletos");
      const { error } = await supabase.from("hallazgos_dentales").insert({
        odontograma_id: selectedOdontogramaId,
        numero_diente: selectedTooth,
        tipo: hallazgoForm.tipo as any,
        cara: hallazgoForm.cara ? hallazgoForm.cara as any : null,
        notas: hallazgoForm.notas || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hallazgos"] });
      setShowHallazgoDialog(false);
      setHallazgoForm({ tipo: "caries", cara: "", notas: "" });
      toast.success("Hallazgo registrado");
    },
    onError: () => toast.error("Error al registrar hallazgo"),
  });

  const getToothHallazgos = (toothNum: number) => (hallazgos || []).filter(h => h.numero_diente === toothNum);

  const handleToothClick = (toothNum: number) => {
    if (!selectedOdontogramaId) {
      toast.info("Seleccione o cree un odontograma primero");
      return;
    }
    setSelectedTooth(toothNum);
    setShowHallazgoDialog(true);
  };

  const renderTooth = (num: number) => {
    const th = getToothHallazgos(num);
    const mainType = th.length > 0 ? th[0].tipo : "sano";
    const colorClass = TIPO_HALLAZGO_COLORS[mainType || "sano"] || "bg-muted";
    return (
      <button
        key={num}
        onClick={() => handleToothClick(num)}
        className={`w-10 h-12 rounded-md border-2 border-border flex flex-col items-center justify-center text-xs font-bold transition-all hover:scale-110 hover:shadow-md ${colorClass} text-white relative`}
        title={`Diente ${num}: ${mainType}`}
      >
        {num}
        {th.length > 1 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">{th.length}</span>}
      </button>
    );
  };

  const selectedPaciente = pacientes?.find(p => p.id === selectedPacienteId);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Odontograma</h1>
      </div>

      {/* Patient selector */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label>Buscar paciente</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Nombre, apellido o cédula..." value={searchPaciente} onChange={e => setSearchPaciente(e.target.value)} className="pl-8" />
              </div>
            </div>
            {selectedPacienteId && (
              <Button onClick={() => setShowNewDialog(true)} size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Odontograma</Button>
            )}
          </div>
          {searchPaciente && pacientes && pacientes.length > 0 && (
            <div className="mt-2 border rounded-md max-h-40 overflow-auto">
              {pacientes.map(p => (
                <button key={p.id} className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${p.id === selectedPacienteId ? "bg-primary/10 font-semibold" : ""}`}
                  onClick={() => { setSelectedPacienteId(p.id); setSearchPaciente(""); setSelectedOdontogramaId(null); }}>
                  {p.nombre} {p.apellido} {p.cedula ? `(${p.cedula})` : ""}
                </button>
              ))}
            </div>
          )}
          {selectedPaciente && <p className="mt-2 text-sm text-muted-foreground">Paciente: <strong>{selectedPaciente.nombre} {selectedPaciente.apellido}</strong></p>}
        </CardContent>
      </Card>

      {selectedPacienteId && (
        <>
          {/* Odontograma selector */}
          {odontogramas && odontogramas.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {odontogramas.map(o => (
                <Button key={o.id} variant={selectedOdontogramaId === o.id ? "default" : "outline"} size="sm"
                  onClick={() => setSelectedOdontogramaId(o.id)}>
                  {new Date(o.fecha_evaluacion + "T12:00:00").toLocaleDateString()}
                </Button>
              ))}
            </div>
          )}

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="carta">Carta Dental</TabsTrigger>
              <TabsTrigger value="hallazgos">Hallazgos</TabsTrigger>
              <TabsTrigger value="tratamientos">Tratamientos</TabsTrigger>
              <TabsTrigger value="presupuestos">Presupuestos</TabsTrigger>
            </TabsList>

            <TabsContent value="carta">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Tooth className="h-5 w-5" /> Carta Dental Interactiva</CardTitle></CardHeader>
                <CardContent>
                  {!selectedOdontogramaId ? (
                    <p className="text-muted-foreground text-center py-8">Seleccione o cree un odontograma para ver la carta dental.</p>
                  ) : (
                    <div className="space-y-6">
                      {/* Legend */}
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(TIPO_HALLAZGO_COLORS).map(([tipo, color]) => (
                          <div key={tipo} className="flex items-center gap-1 text-xs"><div className={`w-3 h-3 rounded ${color}`} />{tipo}</div>
                        ))}
                      </div>
                      {/* Upper arch */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 text-center">Maxilar Superior</p>
                        <div className="flex justify-center gap-1 flex-wrap">{TEETH_UPPER.map(renderTooth)}</div>
                      </div>
                      <hr className="border-dashed" />
                      {/* Lower arch */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1 text-center">Maxilar Inferior</p>
                        <div className="flex justify-center gap-1 flex-wrap">{TEETH_LOWER.map(renderTooth)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hallazgos">
              <Card>
                <CardContent className="pt-4">
                  {(hallazgos || []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay hallazgos registrados.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Diente</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cara</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(hallazgos || []).map(h => (
                          <TableRow key={h.id}>
                            <TableCell className="font-bold">{h.numero_diente}</TableCell>
                            <TableCell><Badge variant="outline">{h.tipo}</Badge></TableCell>
                            <TableCell>{h.cara || "—"}</TableCell>
                            <TableCell><Badge variant={h.estado === "activo" ? "destructive" : "secondary"}>{h.estado}</Badge></TableCell>
                            <TableCell className="text-sm">{h.notas || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tratamientos">
              <Card>
                <CardContent className="pt-4">
                  {(tratamientos || []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay tratamientos registrados.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Diente</TableHead>
                          <TableHead>Procedimiento</TableHead>
                          <TableHead>Costo Est.</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(tratamientos || []).map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell>{t.hallazgos_dentales?.numero_diente}</TableCell>
                            <TableCell>{t.procedimiento}</TableCell>
                            <TableCell>RD$ {Number(t.costo_estimado).toLocaleString()}</TableCell>
                            <TableCell><Badge variant={t.estado === "completado" ? "default" : "outline"}>{t.estado}</Badge></TableCell>
                            <TableCell>{t.fecha_realizado || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="presupuestos">
              <Card>
                <CardContent className="pt-4">
                  {(presupuestos || []).length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay presupuestos dentales.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(presupuestos || []).map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono">{p.numero}</TableCell>
                            <TableCell>RD$ {Number(p.total).toLocaleString()}</TableCell>
                            <TableCell><Badge variant={p.estado === "aceptado" ? "default" : "outline"}>{p.estado}</Badge></TableCell>
                            <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* New odontograma dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo Odontograma</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Se creará una nueva evaluación dental para <strong>{selectedPaciente?.nombre} {selectedPaciente?.apellido}</strong>.</p>
          <Button onClick={() => createOdontograma.mutate()} disabled={createOdontograma.isPending}>Crear</Button>
        </DialogContent>
      </Dialog>

      {/* Add hallazgo dialog */}
      <Dialog open={showHallazgoDialog} onOpenChange={setShowHallazgoDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Hallazgo — Diente {selectedTooth}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tipo de hallazgo</Label>
              <Select value={hallazgoForm.tipo} onValueChange={v => setHallazgoForm(f => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TIPO_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cara dental (opcional)</Label>
              <Select value={hallazgoForm.cara} onValueChange={v => setHallazgoForm(f => ({ ...f, cara: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{CARA_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notas</Label>
              <Textarea value={hallazgoForm.notas} onChange={e => setHallazgoForm(f => ({ ...f, notas: e.target.value }))} />
            </div>
            <Button onClick={() => addHallazgo.mutate()} disabled={addHallazgo.isPending} className="w-full">Guardar Hallazgo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Odontograma;
