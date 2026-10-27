import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, differenceInMonths, isBefore, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PawPrint, Plus, Syringe, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ESPECIES = ["perro", "gato", "ave", "conejo", "reptil", "roedor", "equino", "otro"] as const;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Mascota {
  id: string;
  paciente_id: string;
  especie: string;
  raza: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null;
  peso_kg: number | null;
  esterilizado: boolean;
  tutor_nombre: string;
  tutor_telefono: string | null;
  pacientes: { nombre: string } | null;
}
interface Vacuna {
  id: string;
  vacuna: string;
  fecha_aplicada: string;
  proxima_dosis: string | null;
  pacientes: { nombre: string } | null;
}

const edad = (fecha: string | null) => {
  if (!fecha) return "—";
  const m = differenceInMonths(new Date(), new Date(fecha));
  return m < 12 ? `${m} meses` : `${Math.floor(m / 12)} años`;
};

const MASCOTA_VACIA = {
  nombre: "", especie: "perro", raza: "", sexo: "", fecha_nacimiento: "", peso_kg: "",
  esterilizado: false, tutor_nombre: "", tutor_telefono: "",
};

export default function VetCarePro() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "mascotas";

  const [mascotas, setMascotas] = useState<Mascota[] | null>(null);
  const [vacunas, setVacunas] = useState<Vacuna[] | null>(null);
  const [nuevaMascota, setNuevaMascota] = useState<typeof MASCOTA_VACIA | null>(null);
  const [nuevaVacuna, setNuevaVacuna] = useState<{ paciente_id: string; vacuna: string; fecha_aplicada: string; proxima_dosis: string; lote: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!wsId) return;
    const [m, v] = await Promise.all([
      (supabase.from("vet_mascotas" as any) as any)
        .select("id, paciente_id, especie, raza, sexo, fecha_nacimiento, peso_kg, esterilizado, tutor_nombre, tutor_telefono, pacientes(nombre)")
        .eq("workspace_id", wsId)
        .order("created_at", { ascending: false }),
      (supabase.from("vet_vacunas" as any) as any)
        .select("id, vacuna, fecha_aplicada, proxima_dosis, pacientes(nombre)")
        .eq("workspace_id", wsId)
        .order("proxima_dosis", { ascending: true, nullsFirst: false }),
    ]);
    if (m.error || v.error) toast.error("No se pudieron cargar los datos veterinarios");
    setMascotas(m.data ?? []);
    setVacunas(v.data ?? []);
  }, [wsId]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardarMascota = async () => {
    if (!wsId || !nuevaMascota) return;
    const f = nuevaMascota;
    if (!f.nombre.trim() || !f.tutor_nombre.trim()) {
      toast.error("El nombre de la mascota y del tutor son obligatorios");
      return;
    }
    setGuardando(true);
    try {
      // La mascota es el "paciente"; el apellido de la familia sale del tutor.
      const apellido = f.tutor_nombre.trim().split(/\s+/).pop() ?? "";
      const { data: px, error: e1 } = await supabase
        .from("pacientes")
        .insert({ nombre: f.nombre.trim(), apellido, contacto_px: f.tutor_telefono || null, workspace_id: wsId, vertical: "veterinaria" } as any)
        .select("id")
        .single();
      if (e1) throw e1;
      const { error: e2 } = await (supabase.from("vet_mascotas" as any) as any).insert({
        workspace_id: wsId,
        paciente_id: px.id,
        especie: f.especie,
        raza: f.raza || null,
        sexo: f.sexo || null,
        fecha_nacimiento: f.fecha_nacimiento || null,
        peso_kg: f.peso_kg ? Number(f.peso_kg) : null,
        esterilizado: f.esterilizado,
        tutor_nombre: f.tutor_nombre.trim(),
        tutor_telefono: f.tutor_telefono || null,
      });
      if (e2) {
        await supabase.from("pacientes").delete().eq("id", px.id);
        throw e2;
      }
      toast.success("Mascota registrada");
      setNuevaMascota(null);
      cargar();
    } catch (e: any) {
      toast.error(e.message ?? "No se pudo registrar la mascota");
    } finally {
      setGuardando(false);
    }
  };

  const guardarVacuna = async () => {
    if (!wsId || !nuevaVacuna) return;
    const f = nuevaVacuna;
    if (!f.paciente_id || !f.vacuna.trim() || !f.fecha_aplicada) {
      toast.error("Mascota, vacuna y fecha son obligatorias");
      return;
    }
    setGuardando(true);
    const { error } = await (supabase.from("vet_vacunas" as any) as any).insert({
      workspace_id: wsId,
      paciente_id: f.paciente_id,
      vacuna: f.vacuna.trim(),
      fecha_aplicada: f.fecha_aplicada,
      proxima_dosis: f.proxima_dosis || null,
      lote: f.lote || null,
    });
    setGuardando(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Vacuna registrada");
    setNuevaVacuna(null);
    cargar();
  };

  const setM = (k: keyof typeof MASCOTA_VACIA, v: string | boolean) => setNuevaMascota((p) => (p ? { ...p, [k]: v } : p));
  const hoy = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <PawPrint className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">VetCare Pro</h1>
            <p className="text-sm text-muted-foreground">Mascotas, tutores y calendario de vacunas</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(t) => setParams({ tab: t }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="mascotas">Mascotas</TabsTrigger>
          <TabsTrigger value="vacunas">Vacunas</TabsTrigger>
        </TabsList>

        <TabsContent value="mascotas">
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Mascotas registradas</CardTitle>
              <Button size="sm" onClick={() => setNuevaMascota({ ...MASCOTA_VACIA })}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Nueva mascota
              </Button>
            </CardHeader>
            <CardContent>
              {mascotas === null ? (
                <Skeleton className="h-40" />
              ) : mascotas.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay mascotas. Registra la primera.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mascota</TableHead>
                        <TableHead>Especie / Raza</TableHead>
                        <TableHead>Edad</TableHead>
                        <TableHead>Peso</TableHead>
                        <TableHead>Tutor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mascotas.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium">
                            {m.pacientes?.nombre ?? "—"}
                            {m.esterilizado && <Badge variant="outline" className="ml-2 text-[10px]">Esterilizado</Badge>}
                          </TableCell>
                          <TableCell>{capital(m.especie)}{m.raza ? ` · ${m.raza}` : ""}{m.sexo ? ` · ${capital(m.sexo)}` : ""}</TableCell>
                          <TableCell className="tabular-nums">{edad(m.fecha_nacimiento)}</TableCell>
                          <TableCell className="tabular-nums">{m.peso_kg ? `${m.peso_kg} kg` : "—"}</TableCell>
                          <TableCell>
                            {m.tutor_nombre}
                            {m.tutor_telefono && <span className="block text-xs text-muted-foreground tabular-nums">{m.tutor_telefono}</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacunas">
          <Card className="shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Calendario de vacunas</CardTitle>
              <Button
                size="sm"
                disabled={!mascotas?.length}
                onClick={() => setNuevaVacuna({ paciente_id: "", vacuna: "", fecha_aplicada: format(hoy, "yyyy-MM-dd"), proxima_dosis: "", lote: "" })}
              >
                <Syringe className="mr-1.5 h-4 w-4" aria-hidden="true" /> Registrar vacuna
              </Button>
            </CardHeader>
            <CardContent>
              {vacunas === null ? (
                <Skeleton className="h-40" />
              ) : vacunas.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Sin vacunas registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mascota</TableHead>
                        <TableHead>Vacuna</TableHead>
                        <TableHead>Aplicada</TableHead>
                        <TableHead>Próxima dosis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vacunas.map((v) => {
                        const proxima = v.proxima_dosis ? new Date(v.proxima_dosis + "T12:00:00") : null;
                        const vencida = proxima && isBefore(proxima, hoy);
                        const pronto = proxima && !vencida && isBefore(proxima, addDays(hoy, 15));
                        return (
                          <TableRow key={v.id}>
                            <TableCell className="font-medium">{v.pacientes?.nombre ?? "—"}</TableCell>
                            <TableCell>{v.vacuna}</TableCell>
                            <TableCell className="tabular-nums">{format(new Date(v.fecha_aplicada + "T12:00:00"), "dd MMM yyyy", { locale: es })}</TableCell>
                            <TableCell className="tabular-nums">
                              {proxima ? format(proxima, "dd MMM yyyy", { locale: es }) : "—"}
                              {vencida && <Badge variant="outline" className="ml-2 border-destructive/30 bg-destructive/10 text-[10px] text-destructive">Vencida</Badge>}
                              {pronto && <Badge variant="outline" className="ml-2 border-warning/30 bg-warning/10 text-[10px] text-warning">Próxima</Badge>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!nuevaMascota} onOpenChange={(o) => !o && setNuevaMascota(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Nueva mascota</DialogTitle></DialogHeader>
          {nuevaMascota && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vm-nombre">Nombre de la mascota *</Label>
                <Input id="vm-nombre" value={nuevaMascota.nombre} onChange={(e) => setM("nombre", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vm-especie">Especie *</Label>
                <Select value={nuevaMascota.especie} onValueChange={(v) => setM("especie", v)}>
                  <SelectTrigger id="vm-especie"><SelectValue /></SelectTrigger>
                  <SelectContent>{ESPECIES.map((e) => <SelectItem key={e} value={e}>{capital(e)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vm-raza">Raza</Label>
                <Input id="vm-raza" value={nuevaMascota.raza} onChange={(e) => setM("raza", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vm-sexo">Sexo</Label>
                <Select value={nuevaMascota.sexo} onValueChange={(v) => setM("sexo", v)}>
                  <SelectTrigger id="vm-sexo"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vm-nac">Fecha de nacimiento</Label>
                <Input id="vm-nac" type="date" value={nuevaMascota.fecha_nacimiento} onChange={(e) => setM("fecha_nacimiento", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vm-peso">Peso (kg)</Label>
                <Input id="vm-peso" type="number" min="0" step="0.01" value={nuevaMascota.peso_kg} onChange={(e) => setM("peso_kg", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vm-tutor">Tutor *</Label>
                <Input id="vm-tutor" value={nuevaMascota.tutor_nombre} onChange={(e) => setM("tutor_nombre", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vm-tel">Teléfono del tutor</Label>
                <Input id="vm-tel" type="tel" value={nuevaMascota.tutor_telefono} onChange={(e) => setM("tutor_telefono", e.target.value)} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <Switch id="vm-ester" checked={nuevaMascota.esterilizado} onCheckedChange={(c) => setM("esterilizado", c)} />
                <Label htmlFor="vm-ester">Esterilizado</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNuevaMascota(null)}>Cancelar</Button>
            <Button onClick={guardarMascota} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!nuevaVacuna} onOpenChange={(o) => !o && setNuevaVacuna(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar vacuna</DialogTitle></DialogHeader>
          {nuevaVacuna && (
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vv-masc">Mascota *</Label>
                <Select value={nuevaVacuna.paciente_id} onValueChange={(v) => setNuevaVacuna({ ...nuevaVacuna, paciente_id: v })}>
                  <SelectTrigger id="vv-masc"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                  <SelectContent>
                    {(mascotas ?? []).map((m) => (
                      <SelectItem key={m.paciente_id} value={m.paciente_id}>{m.pacientes?.nombre} · {m.tutor_nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vv-vac">Vacuna *</Label>
                <Input id="vv-vac" placeholder="Rabia, Séxtuple, Triple felina..." value={nuevaVacuna.vacuna} onChange={(e) => setNuevaVacuna({ ...nuevaVacuna, vacuna: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vv-apl">Fecha aplicada *</Label>
                  <Input id="vv-apl" type="date" value={nuevaVacuna.fecha_aplicada} onChange={(e) => setNuevaVacuna({ ...nuevaVacuna, fecha_aplicada: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vv-prox">Próxima dosis</Label>
                  <Input id="vv-prox" type="date" value={nuevaVacuna.proxima_dosis} onChange={(e) => setNuevaVacuna({ ...nuevaVacuna, proxima_dosis: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vv-lote">Lote</Label>
                <Input id="vv-lote" value={nuevaVacuna.lote} onChange={(e) => setNuevaVacuna({ ...nuevaVacuna, lote: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNuevaVacuna(null)}>Cancelar</Button>
            <Button onClick={guardarVacuna} disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
