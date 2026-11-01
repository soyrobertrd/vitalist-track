import { useState, useId } from "react";
import { 
  Utensils, 
  Calendar, 
  Sparkles, 
  Share2, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Apple, 
  Coffee, 
  Sun, 
  Moon, 
  ShoppingBag,
  Pill,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useModoOperativo } from "@/hooks/useModoOperativo";

export interface TiempoComida {
  id: string;
  nombre: string;
  horaSugerida: string;
  caloriasAprox: number;
  platoPrincipal: string;
  porcionesDetalle: string;
  bebidaRecomendada: string;
  icono: "coffee" | "apple" | "sun" | "moon";
}

export interface PlanSemanalDieta {
  id: string;
  pacienteNombre: string;
  objetivoNombre: string;
  caloriasTotales: number;
  tiempos: TiempoComida[];
  suplementacion: string;
  pautasGenerales: string;
  fechaCreacion: string;
}

const PLANES_INICIALES: PlanSemanalDieta[] = [
  {
    id: "PLAN-201",
    pacienteNombre: "Camila Peña",
    objetivoNombre: "Déficit Calórico & Definición Muscular",
    caloriasTotales: 1550,
    fechaCreacion: "2026-10-31",
    suplementacion: "Whey Protein Isolate (1 scoop post-entreno) + Magnesio Bisglicinato (300mg antes de dormir)",
    pautasGenerales: "Consumir al menos 2.2L de agua. Evitar bebidas azucaradas y salsas procesadas.",
    tiempos: [
      {
        id: "T1",
        nombre: "Desayuno Energético",
        horaSugerida: "07:30 AM",
        caloriasAprox: 380,
        platoPrincipal: "Omelette de 2 huevos enteros + 2 claras con espinacas y champiñones",
        porcionesDetalle: "1 rebanada de pan integral de masa madre + 1/3 de aguacate",
        bebidaRecomendada: "Café negro o infusión sin azúcar añadida",
        icono: "coffee",
      },
      {
        id: "T2",
        nombre: "Colación Matutina",
        horaSugerida: "10:30 AM",
        caloriasAprox: 180,
        platoPrincipal: "Yogur griego natural sin azúcar (150g) con puñado de arándanos",
        porcionesDetalle: "15g de almendras tostadas sin sal",
        bebidaRecomendada: "Agua mineral con limón",
        icono: "apple",
      },
      {
        id: "T3",
        nombre: "Almuerzo Principal",
        horaSugerida: "01:30 PM",
        caloriasAprox: 520,
        platoPrincipal: "Pechuga de pollo a la plancha (150g) con hierbas aromáticas",
        porcionesDetalle: "120g de batata o quinoa cocida + ensalada verde mixta con aceite de oliva extra virgen (1 cdta)",
        bebidaRecomendada: "Agua natural",
        icono: "sun",
      },
      {
        id: "T4",
        nombre: "Merienda de la Tarde",
        horaSugerida: "05:00 PM",
        caloriasAprox: 170,
        platoPrincipal: "Batido de 1 scoop de proteína de suero + 1/2 banana verde",
        porcionesDetalle: "200ml de leche de almendras sin azúcar",
        bebidaRecomendada: "Infusión de manzanilla o té verde",
        icono: "apple",
      },
      {
        id: "T5",
        nombre: "Cena Reparadora",
        horaSugerida: "08:00 PM",
        caloriasAprox: 300,
        platoPrincipal: "Filete de salmón o merluza al horno (140g)",
        porcionesDetalle: "Espárragos y calabacines asados al vapor con semillas de chía",
        bebidaRecomendada: "Infusión de valeriana",
        icono: "moon",
      },
    ],
  },
];

export function PlanificadorMinutasDietas() {
  const { isCentro: esModoClinica } = useModoOperativo();
  const [planes, setPlanes] = useState<PlanSemanalDieta[]>(PLANES_INICIALES);
  const [planActivo, setPlanActivo] = useState<PlanSemanalDieta>(PLANES_INICIALES[0]);

  // Formulario nuevo tiempo de comida
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaHora, setNuevaHora] = useState("08:00 AM");
  const [nuevasCalorias, setNuevasCalorias] = useState(300);
  const [nuevoPlato, setNuevoPlato] = useState("");
  const [nuevasPorciones, setNuevasPorciones] = useState("");
  const [nuevaBebida, setNuevaBebida] = useState("Agua fresca");
  const [nuevoIcono, setNuevoIcono] = useState<"coffee" | "apple" | "sun" | "moon">("sun");

  // Formulario nuevo plan
  const [modalNuevoPlan, setModalNuevoPlan] = useState(false);
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [objetivoPlan, setObjetivoPlan] = useState("Recomposición Corporal");
  const [suplementos, setSuplementos] = useState("Omega 3 (1000mg) + Creatina (5g)");

  const pacienteId = useId();
  const objId = useId();
  const supleId = useId();
  const platoId = useId();
  const porcionId = useId();
  const bebidaId = useId();
  const horaId = useId();
  const calsId = useId();

  const handleAgregarTiempo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoPlato.trim()) {
      toast.error("Indique el plato principal de la comida");
      return;
    }

    const nuevoT: TiempoComida = {
      id: `T-${Date.now().toString().slice(-4)}`,
      nombre: nuevoNombre || "Tiempo de comida",
      horaSugerida: nuevaHora,
      caloriasAprox: nuevasCalorias,
      platoPrincipal: nuevoPlato,
      porcionesDetalle: nuevasPorciones || "Porción pesada al gusto",
      bebidaRecomendada: nuevaBebida,
      icono: nuevoIcono,
    };

    const actualizado: PlanSemanalDieta = {
      ...planActivo,
      tiempos: [...planActivo.tiempos, nuevoT],
      caloriasTotales: planActivo.caloriasTotales + nuevasCalorias,
    };

    setPlanActivo(actualizado);
    setPlanes(planes.map((p) => (p.id === actualizado.id ? actualizado : p)));
    setNuevoPlato("");
    setNuevasPorciones("");
    toast.success("Tiempo de comida añadido al menú");
  };

  const handleEliminarTiempo = (tiempoId: string) => {
    const tiempo = planActivo.tiempos.find((t) => t.id === tiempoId);
    const caloriasRestadas = tiempo ? tiempo.caloriasAprox : 0;
    const actualizado: PlanSemanalDieta = {
      ...planActivo,
      tiempos: planActivo.tiempos.filter((t) => t.id !== tiempoId),
      caloriasTotales: Math.max(0, planActivo.caloriasTotales - caloriasRestadas),
    };

    setPlanActivo(actualizado);
    setPlanes(planes.map((p) => (p.id === actualizado.id ? actualizado : p)));
    toast.info("Tiempo de comida removido");
  };

  const handleCrearNuevoPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombrePaciente.trim()) {
      toast.error("Ingrese el nombre del paciente");
      return;
    }

    const nuevo: PlanSemanalDieta = {
      id: `PLAN-${Date.now().toString().slice(-4)}`,
      pacienteNombre: nombrePaciente,
      objetivoNombre: objetivoPlan,
      caloriasTotales: 0,
      fechaCreacion: new Date().toISOString().split("T")[0],
      suplementacion: suplementos,
      pautasGenerales: "Mastique despacio cada bocado. Mantenga la ingesta hídrica activa.",
      tiempos: [],
    };

    setPlanes([nuevo, ...planes]);
    setPlanActivo(nuevo);
    setNombrePaciente("");
    setModalNuevoPlan(false);
    toast.success(`Plan de dieta creado para ${nuevo.pacienteNombre}`);
  };

  const handleCompartirWhatsApp = () => {
    let mensaje = `🥗 *PLAN NUTRICIONAL & MINUTA DIARIA PERSONALIZADA*
👤 *Paciente:* ${planActivo.pacienteNombre}
🎯 *Objetivo:* ${planActivo.objetivoNombre}
🔥 *Calorías Estimadas:* ~${planActivo.caloriasTotales} kcal/día

📅 *TIEMPOS DE COMIDA PROGRAMADOS:*\n`;

    planActivo.tiempos.forEach((t, idx) => {
      mensaje += `\n*${idx + 1}. ${t.nombre.toUpperCase()}* (${t.horaSugerida} - ~${t.caloriasAprox} kcal)
🍽️ *Menú:* ${t.platoPrincipal}
⚖️ *Porciones:* ${t.porcionesDetalle}
🥤 *Bebida:* ${t.bebidaRecomendada}\n`;
    });

    if (planActivo.suplementacion) {
      mensaje += `\n💊 *Suplementación Sugerida:*\n${planActivo.suplementacion}\n`;
    }

    if (planActivo.pautasGenerales) {
      mensaje += `\n📝 *Pautas de Éxito:*\n${planActivo.pautasGenerales}\n`;
    }

    mensaje += `\n✨ *Tu Nutriólogo te acompaña en cada paso hacia tu meta.*`;

    navigator.clipboard.writeText(mensaje);
    toast.success("Minuta completa copiada al portapapeles para WhatsApp");
  };

  return (
    <div className="space-y-6">
      {/* Header Operativo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Planificador de Minutas & Dietética</h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                {planActivo.tiempos.length} Tiempos de comida
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Diagramación de comidas, porcionado exacto y prescripción de suplementación.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalNuevoPlan(!modalNuevoPlan)}
            variant="outline"
            className="text-xs gap-1.5 h-9"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo Plan Dieta
          </Button>

          <Button
            onClick={handleCompartirWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
          >
            <Share2 className="h-3.5 w-3.5" />
            Exportar Menú WhatsApp
          </Button>
        </div>
      </div>

      {/* Modal / Formulario Colapsable para Crear Nuevo Plan */}
      {modalNuevoPlan && (
        <form onSubmit={handleCrearNuevoPlan} className="p-4 rounded-2xl bg-card border border-emerald-500/40 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Crear Nueva Pauta Nutricional</h4>
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalNuevoPlan(false)} className="h-6 text-xs">
              Cancelar
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor={pacienteId} className="text-xs">Nombre Paciente</Label>
              <Input
                id={pacienteId}
                placeholder="Ej. Roberto Gómez"
                value={nombrePaciente}
                onChange={(e) => setNombrePaciente(e.target.value)}
                className="text-xs h-8"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={objId} className="text-xs">Objetivo Clínico</Label>
              <Input
                id={objId}
                placeholder="Ej. Bajar Grasa Visceral / Bariatría"
                value={objetivoPlan}
                onChange={(e) => setObjetivoPlan(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={supleId} className="text-xs">Suplementación</Label>
              <Input
                id={supleId}
                placeholder="Ej. Creatina, Omega 3, Whey"
                value={suplementos}
                onChange={(e) => setSuplementos(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 w-full">
            Crear Plan y Comenzar a Cargar Comidas
          </Button>
        </form>
      )}

      {/* Selector de Planes Existentes */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {planes.map((p) => (
          <button
            key={p.id}
            onClick={() => setPlanActivo(p)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border text-left whitespace-nowrap transition-all ${
              planActivo.id === p.id
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                : "bg-card border-border/60 hover:bg-muted/40 text-muted-foreground"
            }`}
          >
            <div className="font-semibold text-foreground">{p.pacienteNombre}</div>
            <div className="text-[10px] text-muted-foreground">~{p.caloriasTotales} kcal | {p.objetivoNombre}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Tiempos de Comida del Plan Activo */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Minuta Diaria para {planActivo.pacienteNombre}
                </h3>
                <p className="text-xs text-muted-foreground">{planActivo.objetivoNombre}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Calorías Totales</div>
                <div className="text-base font-bold text-emerald-600">~{planActivo.caloriasTotales} kcal</div>
              </div>
            </div>

            {planActivo.tiempos.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-xl p-6">
                <Apple className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                No hay tiempos de comida agregados todavía. Utiliza el formulario lateral para añadir comidas.
              </div>
            ) : (
              <div className="space-y-3">
                {planActivo.tiempos.map((tiempo) => (
                  <div
                    key={tiempo.id}
                    className="p-3.5 rounded-xl border border-border/70 bg-card hover:bg-muted/20 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                          {tiempo.icono === "coffee" && <Coffee className="h-4 w-4" />}
                          {tiempo.icono === "apple" && <Apple className="h-4 w-4" />}
                          {tiempo.icono === "sun" && <Sun className="h-4 w-4" />}
                          {tiempo.icono === "moon" && <Moon className="h-4 w-4" />}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-foreground">{tiempo.nombre}</span>
                          <span className="text-[11px] text-muted-foreground ml-2">({tiempo.horaSugerida})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                          ~{tiempo.caloriasAprox} kcal
                        </Badge>
                        <IconButton label="Eliminar"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminarTiempo(tiempo.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </div>

                    <div className="text-xs text-foreground font-medium pl-8">
                      🍽️ {tiempo.platoPrincipal}
                    </div>

                    <div className="text-[11px] text-muted-foreground pl-8 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span>⚖️ {tiempo.porcionesDetalle}</span>
                      <span>🥤 {tiempo.bebidaRecomendada}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Suplementación y Recomendaciones */}
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5 text-xs">
              <div className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5" /> Suplementación Prescrita
              </div>
              <p className="text-muted-foreground text-[11px]">
                {planActivo.suplementacion || "Ninguna suplementación adicional prescrita."}
              </p>
            </div>
          </div>
        </div>

        {/* Añadir Nuevo Tiempo de Comida */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Plus className="h-4 w-4 text-emerald-600" />
                Añadir Comida al Plan
              </h3>
              <span className="text-[11px] text-muted-foreground">Porcionado limpio</span>
            </div>

            <form onSubmit={handleAgregarTiempo} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tiempo</Label>
                  <Select value={nuevoNombre} onValueChange={setNuevoNombre}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Desayuno">Desayuno</SelectItem>
                      <SelectItem value="Colación Matutina">Colación Matutina</SelectItem>
                      <SelectItem value="Almuerzo Principal">Almuerzo Principal</SelectItem>
                      <SelectItem value="Merienda Tarde">Merienda Tarde</SelectItem>
                      <SelectItem value="Cena">Cena</SelectItem>
                      <SelectItem value="Snack Post-Entreno">Snack Post-Entreno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={horaId} className="text-xs">Hora Sugerida</Label>
                  <Input
                    id={horaId}
                    value={nuevaHora}
                    onChange={(e) => setNuevaHora(e.target.value)}
                    className="text-xs h-8"
                    placeholder="08:00 AM"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor={platoId} className="text-xs">Plato Principal / Alimento Clave</Label>
                <Input
                  id={platoId}
                  value={nuevoPlato}
                  onChange={(e) => setNuevoPlato(e.target.value)}
                  placeholder="Ej. Pechuga de pavo con batatas asadas"
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={porcionId} className="text-xs">Gramajes & Porciones Detalladas</Label>
                <Input
                  id={porcionId}
                  value={nuevasPorciones}
                  onChange={(e) => setNuevasPorciones(e.target.value)}
                  placeholder="Ej. 150g pavo + 100g batata + ensalada verde libre"
                  className="text-xs h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={calsId} className="text-xs">Calorías Aprox</Label>
                  <Input
                    id={calsId}
                    type="number"
                    value={nuevasCalorias}
                    onChange={(e) => setNuevasCalorias(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Icono</Label>
                  <Select value={nuevoIcono} onValueChange={(v: any) => setNuevoIcono(v)}>
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="coffee">☕ Desayuno</SelectItem>
                      <SelectItem value="apple">🍏 Snack</SelectItem>
                      <SelectItem value="sun">☀️ Almuerzo</SelectItem>
                      <SelectItem value="moon">🌙 Cena</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor={bebidaId} className="text-xs">Bebida Acompañante</Label>
                <Input
                  id={bebidaId}
                  value={nuevaBebida}
                  onChange={(e) => setNuevaBebida(e.target.value)}
                  placeholder="Ej. Té verde sin azúcar o agua de coco"
                  className="text-xs h-8"
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 gap-1.5 mt-2">
                <Plus className="h-4 w-4" />
                Agregar Tiempo al Menú
              </Button>
            </form>
          </div>

          {/* Tips de Adherencia Nutricional */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2 text-xs">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <ShoppingBag className="h-4 w-4 text-emerald-600" /> Tips de Adherencia en Consulta
            </div>
            <ul className="space-y-1 text-muted-foreground text-[11px] list-disc pl-4">
              <li>El éxito no está en la restricción extrema sino en la constancia calórica semanal.</li>
              <li>Recomiende cocinar en lote (Meal Prep) 2 días fijos por semana.</li>
              <li>Todas las verduras de hoja verde son libres en volumen y ricas en micronutrientes.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
