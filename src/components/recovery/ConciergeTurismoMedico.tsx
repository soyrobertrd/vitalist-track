import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Car, Utensils, BedDouble, Calendar, Sparkles, Plus, CheckCircle2, User, Phone } from "lucide-react";
import { toast } from "sonner";

export interface HuespedRecovery {
  id: string;
  nombre: string;
  paisOrigen: string;
  cirujanoTratante: string;
  fechaLlegadaVuelo: string;
  vueloInfo: string;
  transporteAeropuerto: "chofer_asignado" | "recogida_completada" | "no_requiere";
  suiteAsignada: string;
  tipoDieta: "hiperproteica" | "hiposodica_antiedema" | "blanda_antiemetica" | "vegetariana_postop";
  citasCirujano: string[];
  sesionesDrenaje: { total: number; completadas: number };
  contactoEmergencia: string;
}

const HUESPEDES_INICIALES: HuespedRecovery[] = [
  {
    id: "rec-101",
    nombre: "Katherine Vance",
    paisOrigen: "Estados Unidos (Miami, FL)",
    cirujanoTratante: "Dr. Héctor Méndez (Cirugía Plástica)",
    fechaLlegadaVuelo: "28 Oct 2026 - 02:40 PM",
    vueloInfo: "American Airlines AA-1422 (AILA - Santo Domingo)",
    transporteAeropuerto: "recogida_completada",
    suiteAsignada: "Suite VIP Orquídea (Cama Articulada Eléctrica)",
    tipoDieta: "hiperproteica",
    citasCirujano: ["30 Oct 11:00 AM - Retiro de drenajes", "04 Nov 09:30 AM - Alta médica definitiva"],
    sesionesDrenaje: { total: 10, completadas: 3 },
    contactoEmergencia: "+1 (305) 555-8912 (Hermana)",
  },
  {
    id: "rec-102",
    nombre: "Nathalie Dubois",
    paisOrigen: "Canadá (Montreal)",
    cirujanoTratante: "Dra. Altagracia Cabral",
    fechaLlegadaVuelo: "31 Oct 2026 - 05:15 PM",
    vueloInfo: "Air Canada AC-1804 (PUJ - Punta Cana)",
    transporteAeropuerto: "chofer_asignado",
    suiteAsignada: "Suite Semiprivada Las Palmas",
    tipoDieta: "hiposodica_antiedema",
    citasCirujano: ["02 Nov 03:00 PM - Primera revisión post-op"],
    sesionesDrenaje: { total: 8, completadas: 0 },
    contactoEmergencia: "+1 (514) 555-0144 (Esposo)",
  },
];

const dietaLabels: Record<string, string> = {
  hiperproteica: "Hiperproteica (Cicatrización tisular)",
  hiposodica_antiedema: "Hiposódica (Control de retención de líquidos)",
  blanda_antiemetica: "Blanda / Antiemética (Post-Anestesia)",
  vegetariana_postop: "Vegetariana balanceada rica en hierro",
};

export default function ConciergeTurismoMedico() {
  const [huespedes, setHuespedes] = useState<HuespedRecovery[]>(HUESPEDES_INICIALES);
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    paisOrigen: "Estados Unidos (New York)",
    cirujanoTratante: "Dr. Méndez",
    fechaLlegadaVuelo: "",
    vueloInfo: "",
    suiteAsignada: "Suite VIP Orquídea",
    tipoDieta: "hiperproteica" as HuespedRecovery["tipoDieta"],
    contactoEmergencia: "",
  });

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      toast.error("El nombre del huésped es obligatorio");
      return;
    }
    const nuevo: HuespedRecovery = {
      id: `rec-${Date.now()}`,
      nombre: form.nombre,
      paisOrigen: form.paisOrigen,
      cirujanoTratante: form.cirujanoTratante,
      fechaLlegadaVuelo: form.fechaLlegadaVuelo || "Por coordinar",
      vueloInfo: form.vueloInfo || "Vuelo pendiente de confirmación",
      transporteAeropuerto: "chofer_asignado",
      suiteAsignada: form.suiteAsignada,
      tipoDieta: form.tipoDieta,
      citasCirujano: ["Primera revisión en 48 horas post-ingreso"],
      sesionesDrenaje: { total: 10, completadas: 0 },
      contactoEmergencia: form.contactoEmergencia || "No especificado",
    };
    setHuespedes([...huespedes, nuevo]);
    toast.success("Nuevo huésped y concierge turístico registrado");
    setOpenModal(false);
  };

  const registrarSesionDrenaje = (id: string) => {
    setHuespedes((prev) =>
      prev.map((h) => {
        if (h.id === id && h.sesionesDrenaje.completadas < h.sesionesDrenaje.total) {
          return {
            ...h,
            sesionesDrenaje: {
              ...h.sesionesDrenaje,
              completadas: h.sesionesDrenaje.completadas + 1,
            },
          };
        }
        return h;
      })
    );
    toast.success("Sesión de drenaje linfático manual registrada");
  };

  return (
    <div className="space-y-6">
      {/* Header y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Plane className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Concierge de Turismo Médico & Recovery Home
            </h2>
            <p className="text-xs text-muted-foreground">
              Logística integral: vuelos, chofer VIP, suites clínicas, dietas especializadas y masajes linfáticos.
            </p>
          </div>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl gap-1.5 shadow-none">
              <Plus className="h-4 w-4" /> Registrar Huésped / Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <Plane className="h-5 w-5 text-purple-500" />
                Ingreso de Paciente Internacional
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrear} className="space-y-3 pt-2 text-xs">
              <div>
                <Label className="text-xs">Nombre Completo</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Katherine Vance"
                  className="rounded-xl mt-1 h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">País / Ciudad de Procedencia</Label>
                  <Input
                    value={form.paisOrigen}
                    onChange={(e) => setForm({ ...form, paisOrigen: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Cirujano Plástico Tratante</Label>
                  <Input
                    value={form.cirujanoTratante}
                    onChange={(e) => setForm({ ...form, cirujanoTratante: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Fecha y Hora Estimada de Llegada</Label>
                  <Input
                    placeholder="Ej. 30 Oct - 03:00 PM"
                    value={form.fechaLlegadaVuelo}
                    onChange={(e) => setForm({ ...form, fechaLlegadaVuelo: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs">Aerolínea / Vuelo / Aeropuerto</Label>
                  <Input
                    placeholder="AA-1422 (AILA)"
                    value={form.vueloInfo}
                    onChange={(e) => setForm({ ...form, vueloInfo: e.target.value })}
                    className="rounded-xl mt-1 h-8 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Suite Asignada</Label>
                  <Select
                    value={form.suiteAsignada}
                    onValueChange={(val) => setForm({ ...form, suiteAsignada: val })}
                  >
                    <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Suite VIP Orquídea">Suite VIP Orquídea (Privada)</SelectItem>
                      <SelectItem value="Suite Royal Palmera">Suite Royal Palmera (Privada)</SelectItem>
                      <SelectItem value="Suite Semiprivada Bahía">Suite Semiprivada Bahía</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Régimen Nutricional</Label>
                  <Select
                    value={form.tipoDieta}
                    onValueChange={(val: any) => setForm({ ...form, tipoDieta: val })}
                  >
                    <SelectTrigger className="rounded-xl mt-1 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hiperproteica">Hiperproteica (Cicatrización)</SelectItem>
                      <SelectItem value="hiposodica_antiedema">Hiposódica (Anti-edema)</SelectItem>
                      <SelectItem value="blanda_antiemetica">Blanda / Antiemética</SelectItem>
                      <SelectItem value="vegetariana_postop">Vegetariana balanceada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Teléfono / WhatsApp de Emergencia</Label>
                <Input
                  value={form.contactoEmergencia}
                  onChange={(e) => setForm({ ...form, contactoEmergencia: e.target.value })}
                  placeholder="+1 (809) 000-0000"
                  className="rounded-xl mt-1 h-8 text-xs"
                />
              </div>
              <Button type="submit" className="w-full rounded-xl mt-2 bg-purple-600 hover:bg-purple-700 text-white">
                Confirmar Registro de Concierge
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tarjetas de Huéspedes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {huespedes.map((h) => (
          <Card key={h.id} className="rounded-2xl border-border/80 shadow-none hover:border-purple-500/40 transition-all">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    {h.nombre}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {h.paisOrigen} · Cirujano: <strong className="text-foreground">{h.cirujanoTratante}</strong>
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-md text-[11px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">
                  {h.suiteAsignada}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3 text-xs">
              {/* Vuelo y Transporte */}
              <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Plane className="h-3.5 w-3.5 text-purple-500" />
                    <span>{h.vueloInfo}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    <Car className="h-3 w-3 mr-1" />
                    {h.transporteAeropuerto === "recogida_completada" ? "Recogida Completada" : "Chofer Programado"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Llegada: <span className="text-foreground font-semibold">{h.fechaLlegadaVuelo}</span>
                </p>
              </div>

              {/* Dieta y Masajes */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                    <Utensils className="h-3.5 w-3.5 text-amber-500" />
                    <span>Dieta Post-Op</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {dietaLabels[h.tipoDieta]}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center justify-between font-medium text-foreground text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                      <span>Drenajes Linfáticos</span>
                    </div>
                    <span className="font-bold tabular-nums">
                      {h.sesionesDrenaje.completadas}/{h.sesionesDrenaje.total}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full"
                      style={{ width: `${(h.sesionesDrenaje.completadas / h.sesionesDrenaje.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Citas con el Cirujano */}
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Citas de Revisión Programadas:
                </p>
                <div className="space-y-1">
                  {h.citasCirujano.map((c, i) => (
                    <div key={i} className="text-[11px] px-2 py-1 rounded-lg bg-card border border-border/60 text-foreground">
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="pt-2 flex items-center justify-between border-t border-border/50">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{h.contactoEmergencia}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs h-7 gap-1 border-border/80"
                  onClick={() => registrarSesionDrenaje(h.id)}
                >
                  <Sparkles className="h-3 w-3 text-teal-500" /> +1 Drenaje Linfático
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
