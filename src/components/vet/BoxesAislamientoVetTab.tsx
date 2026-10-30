import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bed, ShieldAlert, Heart, Activity, AlertTriangle, Plus, Sparkles, Dog, Cat, Droplets, Thermometer, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export interface BoxVeterinario {
  id: string;
  codigo: string;
  zona: "canina" | "felina_cat_friendly" | "aislamiento_infeccioso" | "uci_criticos";
  tamano: "pequeno" | "mediano" | "grande" | "suite_gigante";
  estado: "disponible" | "ocupado" | "desinfeccion_pendiente";
  mascotaNombre?: string;
  especie?: "canino" | "felino" | "exotico";
  tutorNombre?: string;
  diagnostico?: string;
  bombaInfusionMlHora?: number;
  temperatura?: number;
  protocoloBarrera?: boolean;
}

const BOXES_INICIALES: BoxVeterinario[] = [
  {
    id: "box-c1",
    codigo: "BOX-CAN-01",
    zona: "canina",
    tamano: "grande",
    estado: "ocupado",
    mascotaNombre: "Rocky (Golden Retriever)",
    especie: "canino",
    tutorNombre: "Carlos Santana",
    diagnostico: "Post-quirúrgico TPLO (Rodilla)",
    bombaInfusionMlHora: 45,
    temperatura: 38.6,
    protocoloBarrera: false,
  },
  {
    id: "box-f1",
    codigo: "BOX-FEL-01",
    zona: "felina_cat_friendly",
    tamano: "mediano",
    estado: "ocupado",
    mascotaNombre: "Mishi (Siamés)",
    especie: "felino",
    tutorNombre: "Laura Medina",
    diagnostico: "Obstrucción uretral felina (FLUTD)",
    bombaInfusionMlHora: 15,
    temperatura: 38.2,
    protocoloBarrera: false,
  },
  {
    id: "box-ais1",
    codigo: "BOX-AIS-01",
    zona: "aislamiento_infeccioso",
    tamano: "mediano",
    estado: "ocupado",
    mascotaNombre: "Toby (Cachorro Mestizo 3m)",
    especie: "canino",
    tutorNombre: "Juan Morales",
    diagnostico: "Parvovirus Canino Positivo (Gastroenteritis hemorrágica)",
    bombaInfusionMlHora: 30,
    temperatura: 39.4,
    protocoloBarrera: true,
  },
  {
    id: "box-ais2",
    codigo: "BOX-AIS-02",
    zona: "aislamiento_infeccioso",
    tamano: "pequeno",
    estado: "desinfeccion_pendiente",
    diagnostico: "Esclusa en cuarentena con amonio cuaternario",
    protocoloBarrera: true,
  },
  {
    id: "box-c2",
    codigo: "BOX-CAN-02",
    zona: "canina",
    tamano: "mediano",
    estado: "disponible",
    protocoloBarrera: false,
  },
  {
    id: "box-f2",
    codigo: "BOX-FEL-02",
    zona: "felina_cat_friendly",
    tamano: "pequeno",
    estado: "disponible",
    protocoloBarrera: false,
  },
];

const zonaColorMap = {
  canina: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  felina_cat_friendly: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  aislamiento_infeccioso: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40",
  uci_criticos: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
};

export function BoxesAislamientoVetTab() {
  const [boxes, setBoxes] = useState<BoxVeterinario[]>(BOXES_INICIALES);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    codigo: "",
    zona: "canina" as BoxVeterinario["zona"],
    tamano: "mediano" as BoxVeterinario["tamano"],
    mascotaNombre: "",
    especie: "canino" as BoxVeterinario["especie"],
    tutorNombre: "",
    diagnostico: "",
    bombaInfusionMlHora: 20,
    temperatura: 38.5,
  });

  const handleIngresar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.mascotaNombre.trim()) {
      toast.error("El código del box y el nombre del paciente son obligatorios");
      return;
    }
    const nuevo: BoxVeterinario = {
      id: `box-${Date.now()}`,
      codigo: form.codigo,
      zona: form.zona,
      tamano: form.tamano,
      estado: "ocupado",
      mascotaNombre: form.mascotaNombre,
      especie: form.especie,
      tutorNombre: form.tutorNombre || "Tutor registrado",
      diagnostico: form.diagnostico || "Observación clínica",
      bombaInfusionMlHora: Number(form.bombaInfusionMlHora),
      temperatura: Number(form.temperatura),
      protocoloBarrera: form.zona === "aislamiento_infeccioso",
    };
    setBoxes([...boxes, nuevo]);
    toast.success("Paciente ingresado en box de hospitalización veterinaria");
    setOpenModal(false);
  };

  const liberarBox = (id: string) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, estado: "desinfeccion_pendiente", mascotaNombre: undefined } : b))
    );
    toast.info("Box liberado. Pendiente de protocolo de desinfección");
  };

  const sanitizarBox = (id: string) => {
    setBoxes((prev) =>
      prev.map((b) => (b.id === id ? { ...b, estado: "disponible" } : b))
    );
    toast.success("Box desinfectado y listo para nuevo ingreso");
  };

  const ocupadosCount = boxes.filter((b) => b.estado === "ocupado").length;
  const infecciososCount = boxes.filter((b) => b.zona === "aislamiento_infeccioso" && b.estado === "ocupado").length;

  return (
    <div className="space-y-6">
      {/* Encabezado y KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-none col-span-1 md:col-span-2">
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Bed className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Hospitalización & Boxes de Aislamiento
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Separación Canina, Felina Cat-Friendly y Aislamiento Bioseguro (Parvo / Moquillo)
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Ambientes climatizados con barrera acústica y control de zoonosis.
            </p>
            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-xl gap-1.5 shadow-none">
                  <Plus className="h-4 w-4" /> Ingresar Paciente
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Bed className="h-5 w-5 text-purple-500" />
                    Ingreso a Hospitalización Veterinaria
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleIngresar} className="space-y-3 pt-2 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Código / Número de Box</Label>
                      <Input
                        placeholder="Ej. BOX-CAN-03"
                        value={form.codigo}
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                        className="rounded-xl mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Área de Hospitalización</Label>
                      <Select
                        value={form.zona}
                        onValueChange={(val: any) => setForm({ ...form, zona: val })}
                      >
                        <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="canina">Área Canina</SelectItem>
                          <SelectItem value="felina_cat_friendly">Área Felina (Cat-Friendly)</SelectItem>
                          <SelectItem value="aislamiento_infeccioso">Aislamiento Infeccioso (Parvo/Moquillo)</SelectItem>
                          <SelectItem value="uci_criticos">UCI / Cuidados Críticos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nombre del Paciente</Label>
                      <Input
                        placeholder="Ej. Thor (Pitbull 2a)"
                        value={form.mascotaNombre}
                        onChange={(e) => setForm({ ...form, mascotaNombre: e.target.value })}
                        className="rounded-xl mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Tutor / Dueño</Label>
                      <Input
                        placeholder="Ej. Manuel Peralta"
                        value={form.tutorNombre}
                        onChange={(e) => setForm({ ...form, tutorNombre: e.target.value })}
                        className="rounded-xl mt-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Diagnóstico & Plan de Cuidados</Label>
                    <Input
                      placeholder="Ej. Deshidratación 8%, gastroenteritis aguda..."
                      value={form.diagnostico}
                      onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
                      className="rounded-xl mt-1 h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Bomba de Fluidoterapia (ml/h)</Label>
                      <Input
                        type="number"
                        value={form.bombaInfusionMlHora}
                        onChange={(e) => setForm({ ...form, bombaInfusionMlHora: Number(e.target.value) })}
                        className="rounded-xl mt-1 h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Temperatura Inicial (°C)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={form.temperatura}
                        onChange={(e) => setForm({ ...form, temperatura: Number(e.target.value) })}
                        className="rounded-xl mt-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full rounded-xl mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                    Confirmar Admisión
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">{ocupadosCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Pacientes ingresados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${infecciososCount > 0 ? "bg-rose-500/20 text-rose-600 animate-pulse" : "bg-emerald-500/10 text-emerald-600"}`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none text-rose-600 dark:text-rose-400">
                {infecciososCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">En aislamiento bioseguro</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boxes.map((b) => (
          <Card key={b.id} className="rounded-2xl border-border/80 shadow-none hover:border-purple-500/40 transition-all">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                    {b.especie === "felino" ? <Cat className="h-4 w-4 text-purple-500" /> : <Dog className="h-4 w-4 text-blue-500" />}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {b.codigo}
                    </CardTitle>
                    <CardDescription className="text-[10px] capitalize">
                      {b.tamano}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className={`rounded-md text-[10px] uppercase font-semibold ${zonaColorMap[b.zona]}`}>
                  {b.zona.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3 text-xs">
              {b.estado === "ocupado" ? (
                <>
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                    <p className="font-semibold text-foreground text-xs">{b.mascotaNombre}</p>
                    <p className="text-[11px] text-muted-foreground">Tutor: {b.tutorNombre}</p>
                    <p className="text-[11px] text-foreground/90 font-medium pt-1 border-t border-border/40">
                      Dx: {b.diagnostico}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-secondary/50 flex items-center gap-1.5">
                      <Droplets className="h-3.5 w-3.5 text-blue-500" />
                      <span>{b.bombaInfusionMlHora || 0} ml/h</span>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary/50 flex items-center gap-1.5">
                      <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                      <span>{b.temperatura || 38.5} °C</span>
                    </div>
                  </div>

                  {b.protocoloBarrera && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-[10px] flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>Uso estricto de guantes, bata y desinfección de calzado al salir.</span>
                    </div>
                  )}

                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full rounded-xl text-xs h-7 border-border/80 text-rose-600 hover:bg-rose-500/10"
                      onClick={() => liberarBox(b.id)}
                    >
                      Dar Alta / Liberar Box
                    </Button>
                  </div>
                </>
              ) : b.estado === "desinfeccion_pendiente" ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 space-y-2 text-center">
                  <p className="font-semibold text-xs">Desinfección Pendiente</p>
                  <p className="text-[10px]">Requiere protocolo con amonio cuaternario antes de nuevo ingreso.</p>
                  <Button
                    size="sm"
                    className="w-full rounded-xl text-xs h-7 bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => sanitizarBox(b.id)}
                  >
                    Confirmar Sanitización
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-center space-y-1">
                  <Sparkles className="h-5 w-5 mx-auto text-emerald-500" />
                  <p className="font-semibold text-xs">Box Disponible</p>
                  <p className="text-[10px] text-muted-foreground">Limpio y listo para asignación</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
