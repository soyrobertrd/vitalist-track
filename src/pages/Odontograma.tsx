import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInYears } from "date-fns";
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Cake, Mail, Phone, X } from "lucide-react";
import { DientePieza, COLOR_HALLAZGO, type Cara, type HallazgoDiente } from "@/components/dental/DientePieza";
import { avatarColor, iniciales } from "@/lib/avatar";

// Numeración FDI, tal como se ve en boca (derecha del paciente a la izquierda de la pantalla)
const SUPERIOR = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const INFERIOR = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const HALLAZGOS_RAPIDOS = ["caries", "fractura", "movilidad", "ausente"] as const;

// Servicios dentales: cada uno deja constancia en el diente (tipo de hallazgo) y crea el tratamiento
const SERVICIOS: { label: string; tipo: string; requiereCara?: boolean }[] = [
  { label: "Examen", tipo: "sano" },
  { label: "Radiografía", tipo: "sano" },
  { label: "Profilaxis", tipo: "sano" },
  { label: "Periodoncia", tipo: "sano" },
  { label: "Resina", tipo: "obturacion", requiereCara: true },
  { label: "Amalgama", tipo: "obturacion", requiereCara: true },
  { label: "Sellante", tipo: "sellante", requiereCara: true },
  { label: "Endodoncia", tipo: "endodoncia" },
  { label: "Corona", tipo: "corona" },
  { label: "Carilla", tipo: "corona" },
  { label: "Extracción", tipo: "ausente" },
  { label: "Implante", tipo: "implante" },
  { label: "Puente", tipo: "protesis" },
  { label: "Prótesis parcial", tipo: "protesis" },
  { label: "Prótesis total", tipo: "protesis" },
];

const capital = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : s);
const ESTADO_TRAT: Record<string, "warning" | "info" | "success" | "danger"> = {
  pendiente: "warning", en_proceso: "info", completado: "success", cancelado: "danger",
};

interface Paciente {
  id: string; nombre: string; apellido: string; cedula: string | null;
  fecha_nacimiento: string | null; email_px: string | null; contacto_px: string | null;
}

const Odontograma = () => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("carta");
  const [busqueda, setBusqueda] = useState("");
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [odontogramaId, setOdontogramaId] = useState<string | null>(null);
  const [diente, setDiente] = useState<number | null>(null);
  const [cara, setCara] = useState<Cara | null>(null);
  const [servicio, setServicio] = useState<(typeof SERVICIOS)[number] | null>(null);
  const [costo, setCosto] = useState("");
  const [notas, setNotas] = useState("");

  const { data: resultados } = useQuery({
    queryKey: ["pacientes-odonto", currentWorkspace?.id, busqueda],
    queryFn: async () => {
      let q = supabase
        .from("pacientes")
        .select("id, nombre, apellido, cedula, fecha_nacimiento, email_px, contacto_px")
        .eq("workspace_id", currentWorkspace!.id)
        .limit(8);
      q = q.or(`nombre.ilike.%${busqueda}%,apellido.ilike.%${busqueda}%,cedula.ilike.%${busqueda}%`);
      const { data } = await q;
      return (data ?? []) as Paciente[];
    },
    enabled: !!currentWorkspace?.id && busqueda.trim().length >= 2,
  });

  const { data: odontogramas } = useQuery({
    queryKey: ["odontogramas", paciente?.id],
    queryFn: async () => {
      const { data } = await supabase.from("odontogramas").select("*").eq("paciente_id", paciente!.id).order("fecha_evaluacion", { ascending: false });
      if (data?.length && !odontogramaId) setOdontogramaId(data[0].id);
      return data ?? [];
    },
    enabled: !!paciente,
  });

  const { data: hallazgos = [] } = useQuery({
    queryKey: ["hallazgos", odontogramaId],
    queryFn: async () => {
      const { data } = await supabase.from("hallazgos_dentales").select("*").eq("odontograma_id", odontogramaId!);
      return (data ?? []) as (HallazgoDiente & { numero_diente: number; notas: string | null; created_at: string })[];
    },
    enabled: !!odontogramaId,
  });

  const { data: tratamientos = [] } = useQuery({
    queryKey: ["tratamientos-dental", odontogramaId, hallazgos.length],
    queryFn: async () => {
      const { data } = await supabase
        .from("tratamientos_dentales")
        .select("*, hallazgos_dentales(numero_diente, cara)")
        .in("hallazgo_id", hallazgos.map((h) => h.id))
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: hallazgos.length > 0,
  });

  const { data: presupuestos = [] } = useQuery({
    queryKey: ["presupuestos-dental", paciente?.id],
    queryFn: async () => {
      const { data } = await supabase.from("presupuestos_dentales").select("*").eq("paciente_id", paciente!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!paciente,
  });

  const crearOdontograma = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("odontogramas")
        .insert({ workspace_id: currentWorkspace!.id, paciente_id: paciente!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["odontogramas"] });
      setOdontogramaId(data.id);
      toast.success("Nueva evaluación creada");
    },
    onError: () => toast.error("No se pudo crear la evaluación"),
  });

  const registrar = useMutation({
    mutationFn: async (p: { tipo: string; procedimiento?: string }) => {
      if (!odontogramaId || !diente) throw new Error("Selecciona un diente");
      const { data: h, error } = await supabase
        .from("hallazgos_dentales")
        .insert({
          odontograma_id: odontogramaId,
          numero_diente: diente,
          tipo: p.tipo as any,
          cara: cara as any,
          estado: p.procedimiento ? "tratado" : "activo",
          notas: notas || null,
        })
        .select("id")
        .single();
      if (error) throw error;
      if (p.procedimiento) {
        const { error: e2 } = await supabase.from("tratamientos_dentales").insert({
          hallazgo_id: h.id,
          procedimiento: p.procedimiento,
          costo_estimado: Number(costo) || 0,
          notas: notas || null,
        });
        if (e2) throw e2;
      }
    },
    onSuccess: (_, p) => {
      queryClient.invalidateQueries({ queryKey: ["hallazgos"] });
      queryClient.invalidateQueries({ queryKey: ["tratamientos-dental"] });
      toast.success(p.procedimiento ? `${p.procedimiento} registrado en el diente ${diente}` : `${capital(p.tipo)} marcado en el diente ${diente}`);
      setServicio(null);
      setCosto("");
      setNotas("");
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo registrar"),
  });

  const seleccionar = (n: number, c: Cara | null) => {
    if (diente === n && cara === c) { setDiente(null); setCara(null); return; }
    setDiente(n);
    setCara(c);
  };

  const edad = paciente?.fecha_nacimiento ? differenceInYears(new Date(), new Date(paciente.fecha_nacimiento)) : null;
  const deDiente = (n: number) => hallazgos.filter((h) => h.numero_diente === n);
  const sinEvaluacion = !odontogramaId;

  return (
    <div className="space-y-5">
      {/* Encabezado del paciente (como la barra de la referencia) */}
      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
          {paciente ? (
            <>
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${avatarColor(paciente.id)}`}>
                  {iniciales(paciente.nombre, paciente.apellido)}
                </span>
                <div>
                  <p className="font-semibold">
                    {paciente.nombre} {paciente.apellido}{edad !== null && <span className="font-normal text-muted-foreground">, {edad} años</span>}
                  </p>
                  {paciente.cedula && <p className="text-xs text-muted-foreground tabular-nums">Cédula {paciente.cedula}</p>}
                </div>
              </div>
              {paciente.fecha_nacimiento && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Cake className="h-4 w-4" aria-hidden="true" />{new Date(paciente.fecha_nacimiento + "T12:00:00").toLocaleDateString("es-DO")}</span>
              )}
              {paciente.email_px && <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-4 w-4" aria-hidden="true" />{paciente.email_px}</span>}
              {paciente.contacto_px && <span className="flex items-center gap-1.5 text-sm text-muted-foreground tabular-nums"><Phone className="h-4 w-4" aria-hidden="true" />{paciente.contacto_px}</span>}
              <Button variant="ghost" size="sm" className="ml-auto" onClick={() => { setPaciente(null); setOdontogramaId(null); setDiente(null); }}>
                <X className="mr-1.5 h-4 w-4" aria-hidden="true" /> Cambiar paciente
              </Button>
            </>
          ) : (
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Buscar paciente por nombre, apellido o cédula..."
                aria-label="Buscar paciente"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9"
              />
              {!!resultados?.length && (
                <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border bg-popover shadow-lg">
                  {resultados.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => { setPaciente(p); setBusqueda(""); setOdontogramaId(null); setDiente(null); }}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${avatarColor(p.id)}`}>{iniciales(p.nombre, p.apellido)}</span>
                        <span>{p.nombre} {p.apellido}</span>
                        {p.cedula && <span className="ml-auto text-xs text-muted-foreground tabular-nums">{p.cedula}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!paciente ? (
        <Card className="shadow-none">
          <CardContent className="py-16 text-center text-sm text-muted-foreground">
            Busca un paciente para ver su odontograma y registrar tratamientos.
          </CardContent>
        </Card>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <TabsList>
              <TabsTrigger value="carta">Carta dental</TabsTrigger>
              <TabsTrigger value="hallazgos">Hallazgos ({hallazgos.length})</TabsTrigger>
              <TabsTrigger value="tratamientos">Tratamientos ({tratamientos.length})</TabsTrigger>
              <TabsTrigger value="presupuestos">Presupuestos</TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {(odontogramas ?? []).map((o) => (
                <Button
                  key={o.id}
                  size="sm"
                  variant={odontogramaId === o.id ? "default" : "outline"}
                  className="h-8 rounded-full tabular-nums"
                  onClick={() => setOdontogramaId(o.id)}
                >
                  {new Date(o.fecha_evaluacion + "T12:00:00").toLocaleDateString("es-DO")}
                </Button>
              ))}
              <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => crearOdontograma.mutate()} disabled={crearOdontograma.isPending}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Nueva evaluación
              </Button>
            </div>
          </div>

          <TabsContent value="carta" className="space-y-5 pt-4">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* Carta dental */}
              <Card className="shadow-none">
                <CardContent className="space-y-4 p-5">
                  {sinEvaluacion ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">Crea una evaluación para empezar a marcar la carta dental.</p>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <div className="mx-auto w-max space-y-3">
                          {[{ fila: SUPERIOR, superior: true }, { fila: INFERIOR, superior: false }].map(({ fila, superior }) => (
                            <div key={String(superior)} className="flex gap-1.5">
                              {fila.map((n, i) => (
                                <div key={n} className={i === 8 ? "border-l border-dashed pl-1.5" : undefined}>
                                  <DientePieza
                                    numero={n}
                                    superior={superior}
                                    hallazgos={deDiente(n)}
                                    seleccionado={diente === n}
                                    caraSeleccionada={diente === n ? cara : null}
                                    onSeleccionar={seleccionar}
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3" aria-label="Leyenda">
                        {Object.entries(COLOR_HALLAZGO).map(([k, v]) => (
                          <li key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: v.fill }} aria-hidden="true" />
                            {v.label}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Panel de tratamiento */}
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tratamiento</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {diente ? (
                      <>Diente <strong className="text-foreground">{diente}</strong>{cara && <> · cara <strong className="text-foreground">{cara}</strong></>}</>
                    ) : "Selecciona un diente o una de sus caras en la carta."}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hallazgo</p>
                    <div className="flex flex-wrap gap-2">
                      {HALLAZGOS_RAPIDOS.map((t) => (
                        <Button
                          key={t}
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-full"
                          disabled={!diente || sinEvaluacion || registrar.isPending}
                          onClick={() => registrar.mutate({ tipo: t })}
                        >
                          <span className="mr-1.5 h-2 w-2 rounded-full" style={{ background: COLOR_HALLAZGO[t].fill }} aria-hidden="true" />
                          {COLOR_HALLAZGO[t].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Servicios</p>
                    <div className="grid grid-cols-3 gap-2">
                      {SERVICIOS.map((s) => (
                        <button
                          key={s.label}
                          type="button"
                          disabled={!diente || sinEvaluacion || (s.requiereCara && !cara)}
                          title={s.requiereCara && !cara ? "Selecciona una cara del diente" : undefined}
                          onClick={() => setServicio(s)}
                          className="min-h-11 rounded-xl border bg-card px-2 py-2 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumen de tratamientos */}
            <Card className="shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
              <CardContent>
                {tratamientos.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Sin tratamientos en esta evaluación.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Procedimiento</TableHead>
                          <TableHead>Diente</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Notas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tratamientos.map((t: any) => (
                          <TableRow key={t.id}>
                            <TableCell className="tabular-nums">{new Date(t.created_at).toLocaleDateString("es-DO")}</TableCell>
                            <TableCell className="font-medium">{t.procedimiento}</TableCell>
                            <TableCell className="tabular-nums">{t.hallazgos_dentales?.numero_diente}{t.hallazgos_dentales?.cara ? ` · ${t.hallazgos_dentales.cara}` : ""}</TableCell>
                            <TableCell className="tabular-nums">RD$ {Number(t.costo_estimado).toLocaleString("es-DO")}</TableCell>
                            <TableCell><Badge variant={ESTADO_TRAT[t.estado] ?? "neutral"} dot>{capital(t.estado)}</Badge></TableCell>
                            <TableCell className="max-w-56 truncate text-muted-foreground">{t.notas || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hallazgos" className="pt-4">
            <Card className="shadow-none">
              <CardContent className="p-0">
                {hallazgos.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No hay hallazgos registrados.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diente</TableHead>
                        <TableHead>Hallazgo</TableHead>
                        <TableHead>Cara</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hallazgos.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell className="font-semibold tabular-nums">{h.numero_diente}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLOR_HALLAZGO[h.tipo]?.fill ?? "hsl(var(--muted))" }} aria-hidden="true" />
                              {COLOR_HALLAZGO[h.tipo]?.label ?? capital(h.tipo)}
                            </span>
                          </TableCell>
                          <TableCell>{h.cara ? capital(h.cara) : "Pieza completa"}</TableCell>
                          <TableCell><Badge variant={h.estado === "activo" ? "danger" : h.estado === "tratado" ? "success" : "warning"} dot>{capital(h.estado)}</Badge></TableCell>
                          <TableCell className="text-muted-foreground">{h.notas || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tratamientos" className="pt-4">
            <Card className="shadow-none">
              <CardContent className="p-0">
                {tratamientos.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No hay tratamientos registrados.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diente</TableHead>
                        <TableHead>Procedimiento</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Realizado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tratamientos.map((t: any) => (
                        <TableRow key={t.id}>
                          <TableCell className="tabular-nums">{t.hallazgos_dentales?.numero_diente}</TableCell>
                          <TableCell className="font-medium">{t.procedimiento}</TableCell>
                          <TableCell className="tabular-nums">RD$ {Number(t.costo_estimado).toLocaleString("es-DO")}</TableCell>
                          <TableCell><Badge variant={ESTADO_TRAT[t.estado] ?? "neutral"} dot>{capital(t.estado)}</Badge></TableCell>
                          <TableCell className="tabular-nums">{t.fecha_realizado || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presupuestos" className="pt-4">
            <Card className="shadow-none">
              <CardContent className="p-0">
                {presupuestos.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">No hay presupuestos dentales.</p>
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
                      {presupuestos.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono">{p.numero}</TableCell>
                          <TableCell className="tabular-nums">RD$ {Number(p.total).toLocaleString("es-DO")}</TableCell>
                          <TableCell><Badge variant={p.estado === "aceptado" ? "success" : p.estado === "rechazado" ? "danger" : "neutral"} dot>{capital(p.estado)}</Badge></TableCell>
                          <TableCell className="tabular-nums">{new Date(p.created_at).toLocaleDateString("es-DO")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={!!servicio} onOpenChange={(o) => !o && setServicio(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{servicio?.label} · diente {diente}{cara ? ` (${cara})` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="od-costo">Costo estimado (RD$)</Label>
              <Input id="od-costo" type="number" min="0" step="50" inputMode="decimal" value={costo} onChange={(e) => setCosto(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="od-notas">Notas</Label>
              <Textarea id="od-notas" rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServicio(null)}>Cancelar</Button>
            <Button
              onClick={() => servicio && registrar.mutate({ tipo: servicio.tipo, procedimiento: servicio.label })}
              disabled={registrar.isPending}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Odontograma;
