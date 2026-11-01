import { useState, useId } from "react";
import { 
  Scale, 
  Activity, 
  Flame, 
  TrendingDown, 
  TrendingUp, 
  Sparkles, 
  Share2, 
  Plus, 
  FileCheck2, 
  User, 
  Calendar,
  CheckCircle2,
  Percent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useModoOperativo } from "@/hooks/useModoOperativo";

export interface EvaluacionBioimpedancia {
  id: string;
  fecha: string;
  pacienteNombre: string;
  pacienteEdad: number;
  sexo: "M" | "F";
  pesoKg: number;
  tallaCm: number;
  imc: number;
  clasificacionImc: string;
  grasaCorporalPct: number;
  grasaVisceralNivel: number;
  masaMuscularPct: number;
  aguaCorporalPct: number;
  bmrKcal: number;
  actividadFactor: number;
  tdeeKcal: number;
  objetivoKcal: number;
  objetivoTipo: "deficit" | "mantenimiento" | "superavit";
  macros: {
    proteinaGramos: number;
    carbosGramos: number;
    grasasGramos: number;
  };
  profesional: string;
}

const EVALUACIONES_INICIALES: EvaluacionBioimpedancia[] = [
  {
    id: "BIO-101",
    fecha: "2026-10-31",
    pacienteNombre: "Camila Peña",
    pacienteEdad: 32,
    sexo: "F",
    pesoKg: 68.5,
    tallaCm: 164,
    imc: 25.5,
    clasificacionImc: "Sobrepeso Leve",
    grasaCorporalPct: 31.4,
    grasaVisceralNivel: 6,
    masaMuscularPct: 29.8,
    aguaCorporalPct: 48.5,
    bmrKcal: 1420,
    actividadFactor: 1.375,
    tdeeKcal: 1952,
    objetivoKcal: 1550,
    objetivoTipo: "deficit",
    macros: {
      proteinaGramos: 120,
      carbosGramos: 140,
      grasasGramos: 55,
    },
    profesional: "Lic. Andrea Morales (Nutricionista)",
  },
  {
    id: "BIO-102",
    fecha: "2026-10-30",
    pacienteNombre: "Marcos Villanueva",
    pacienteEdad: 41,
    sexo: "M",
    pesoKg: 89.2,
    tallaCm: 178,
    imc: 28.2,
    clasificacionImc: "Sobrepeso Grado II",
    grasaCorporalPct: 26.8,
    grasaVisceralNivel: 11,
    masaMuscularPct: 37.1,
    aguaCorporalPct: 52.0,
    bmrKcal: 1845,
    actividadFactor: 1.55,
    tdeeKcal: 2860,
    objetivoKcal: 2350,
    objetivoTipo: "deficit",
    macros: {
      proteinaGramos: 165,
      carbosGramos: 240,
      grasasGramos: 75,
    },
    profesional: "Dr. Carlos Brea (Bariatra)",
  },
];

export function BioimpedanciaMetabolismo() {
  const { isCentro: esModoClinica } = useModoOperativo();
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionBioimpedancia[]>(EVALUACIONES_INICIALES);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState<EvaluacionBioimpedancia>(EVALUACIONES_INICIALES[0]);

  // Formulario nueva evaluación
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [pacienteEdad, setPacienteEdad] = useState(30);
  const [sexo, setSexo] = useState<"M" | "F">("F");
  const [pesoKg, setPesoKg] = useState(70);
  const [tallaCm, setTallaCm] = useState(165);
  const [grasaPct, setGrasaPct] = useState(28);
  const [grasaVisceral, setGrasaVisceral] = useState(7);
  const [musculoPct, setMusculoPct] = useState(32);
  const [aguaPct, setAguaPct] = useState(50);
  const [actividad, setActividad] = useState(1.375);
  const [objetivo, setObjetivo] = useState<"deficit" | "mantenimiento" | "superavit">("deficit");
  const [profesional, setProfesional] = useState("Lic. Andrea Morales");

  const pacienteId = useId();
  const edadId = useId();
  const pesoId = useId();
  const tallaId = useId();
  const grasaId = useId();
  const visceralId = useId();
  const musculoId = useId();
  const aguaId = useId();

  // Cálculos reactivos
  const imcCalculado = Number((pesoKg / Math.pow(tallaCm / 100, 2)).toFixed(1));
  const clasificacionImc = 
    imcCalculado < 18.5 ? "Bajo Peso" :
    imcCalculado < 25.0 ? "Normopeso Saludable" :
    imcCalculado < 30.0 ? "Sobrepeso" :
    imcCalculado < 35.0 ? "Obesidad Tipo I" : "Obesidad Severa";

  // Fórmula Mifflin-St Jeor:
  // Hombres: 10 * peso + 6.25 * talla - 5 * edad + 5
  // Mujeres: 10 * peso + 6.25 * talla - 5 * edad - 161
  const bmrCalculado = Math.round(
    10 * pesoKg + 6.25 * tallaCm - 5 * pacienteEdad + (sexo === "M" ? 5 : -161)
  );

  const tdeeCalculado = Math.round(bmrCalculado * actividad);

  const caloriasMeta = 
    objetivo === "deficit" ? Math.round(tdeeCalculado - 450) :
    objetivo === "superavit" ? Math.round(tdeeCalculado + 350) :
    tdeeCalculado;

  // Macros recomendados por defecto (proteína 1.8g/kg para déficit/fuerza)
  const proteinaGramos = Math.round(pesoKg * (objetivo === "deficit" ? 2.0 : 1.8));
  const caloriasProteina = proteinaGramos * 4;
  const caloriasGrasa = Math.round(caloriasMeta * 0.28);
  const grasasGramos = Math.round(caloriasGrasa / 9);
  const caloriasCarbos = Math.max(0, caloriasMeta - caloriasProteina - caloriasGrasa);
  const carbosGramos = Math.round(caloriasCarbos / 4);

  const handleGuardarEvaluacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteNombre.trim()) {
      toast.error("Indique el nombre del paciente");
      return;
    }

    const nueva: EvaluacionBioimpedancia = {
      id: `BIO-${Date.now().toString().slice(-4)}`,
      fecha: new Date().toISOString().split("T")[0],
      pacienteNombre,
      pacienteEdad,
      sexo,
      pesoKg,
      tallaCm,
      imc: imcCalculado,
      clasificacionImc,
      grasaCorporalPct: grasaPct,
      grasaVisceralNivel: grasaVisceral,
      masaMuscularPct: musculoPct,
      aguaCorporalPct: aguaPct,
      bmrKcal: bmrCalculado,
      actividadFactor: actividad,
      tdeeKcal: tdeeCalculado,
      objetivoKcal: caloriasMeta,
      objetivoTipo: objetivo,
      macros: {
        proteinaGramos,
        carbosGramos,
        grasasGramos,
      },
      profesional: esModoClinica ? profesional : "Consultorio Nutricional",
    };

    setEvaluaciones([nueva, ...evaluaciones]);
    setEvaluacionSeleccionada(nueva);
    setPacienteNombre("");
    toast.success("Evaluación de bioimpedancia y gasto metabólico guardada");
  };

  const handleCopiarInforme = (ev: EvaluacionBioimpedancia) => {
    const texto = `🍏 *INFORME NUTRICIONAL & BIOIMPEDANCIA*
👤 *Paciente:* ${ev.pacienteNombre} (${ev.pacienteEdad} años - ${ev.sexo === "M" ? "Masc" : "Fem"})
📅 *Fecha:* ${ev.fecha}
⚖️ *Peso:* ${ev.pesoKg} kg | *Talla:* ${ev.tallaCm} cm
📊 *IMC:* ${ev.imc} (${ev.clasificacionImc})
🔬 *Composición Corporal:*
- Grasa Corporal: ${ev.grasaCorporalPct}%
- Grasa Visceral: Nivel ${ev.grasaVisceralNivel}
- Masa Muscular: ${ev.masaMuscularPct}%
- Hidratación Celular: ${ev.aguaCorporalPct}%

🔥 *Metabolismo & Gasto Energético:*
- Tasa Metabólica Basal (BMR): ${ev.bmrKcal} kcal/día
- Gasto Energético Diario (TDEE): ${ev.tdeeKcal} kcal/día
🎯 *Prescripción Calórica:* ${ev.objetivoKcal} kcal/día (${ev.objetivoTipo.toUpperCase()})

🥗 *Distribución de Macronutrientes:*
🥩 Proteína: ${ev.macros.proteinaGramos} g (${ev.macros.proteinaGramos * 4} kcal)
🍚 Carbohidratos: ${ev.macros.carbosGramos} g (${ev.macros.carbosGramos * 4} kcal)
🥑 Grasas saludables: ${ev.macros.grasasGramos} g (${ev.macros.grasasGramos * 9} kcal)
💧 *Hidratación Recomendada:* ${Math.round(ev.pesoKg * 35)} ml de agua al día.

👨‍⚕️ *Atendido por:* ${ev.profesional}`;

    navigator.clipboard.writeText(texto);
    toast.success("Informe copiado al portapapeles listo para WhatsApp");
  };

  return (
    <div className="space-y-6">
      {/* Header Operativo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Bioimpedancia & Tasa Metabólica</h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                Mifflin-St Jeor OMS
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Composición corporal segmental, BMR, TDEE y prescripción de macronutrientes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Modo activo:</span>
          <Badge variant="secondary" className="rounded-lg">
            {esModoClinica ? "Policlínica / Bariatría" : "Nutricionista Independiente"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Evaluación */}
        <div className="lg:col-span-7 bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-600" />
              Nueva Consulta & Medición Segmental
            </h3>
            <span className="text-xs text-muted-foreground">Cálculo en tiempo real</span>
          </div>

          <form onSubmit={handleGuardarEvaluacion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor={pacienteId} className="text-xs">Nombre del Paciente</Label>
                <Input
                  id={pacienteId}
                  placeholder="Ej. Laura Méndez"
                  value={pacienteNombre}
                  onChange={(e) => setPacienteNombre(e.target.value)}
                  className="text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={edadId} className="text-xs">Edad (años)</Label>
                <Input
                  id={edadId}
                  type="number"
                  min="5"
                  max="110"
                  value={pacienteEdad}
                  onChange={(e) => setPacienteEdad(Number(e.target.value))}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Sexo Biológico</Label>
                <Select value={sexo} onValueChange={(v: "M" | "F") => setSexo(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="F">Femenino</SelectItem>
                    <SelectItem value="M">Masculino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={pesoId} className="text-xs">Peso Actual (kg)</Label>
                <Input
                  id={pesoId}
                  type="number"
                  step="0.1"
                  value={pesoKg}
                  onChange={(e) => setPesoKg(Number(e.target.value))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={tallaId} className="text-xs">Talla (cm)</Label>
                <Input
                  id={tallaId}
                  type="number"
                  value={tallaCm}
                  onChange={(e) => setTallaCm(Number(e.target.value))}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">IMC Dinámico</Label>
                <div className="h-9 px-3 rounded-xl bg-muted/60 flex items-center justify-between text-xs font-semibold">
                  <span>{imcCalculado}</span>
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-emerald-500/40 text-emerald-600">
                    {clasificacionImc.split(" ")[0]}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Parámetros de Bioimpedancia */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Percent className="h-3.5 w-3.5 text-emerald-600" />
                Lecturas de Báscula Bioimpedanciométrica
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={grasaId} className="text-[11px] text-muted-foreground">% Grasa Corporal</Label>
                  <Input
                    id={grasaId}
                    type="number"
                    step="0.1"
                    value={grasaPct}
                    onChange={(e) => setGrasaPct(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={visceralId} className="text-[11px] text-muted-foreground">Grasa Visceral (1-59)</Label>
                  <Input
                    id={visceralId}
                    type="number"
                    value={grasaVisceral}
                    onChange={(e) => setGrasaVisceral(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={musculoId} className="text-[11px] text-muted-foreground">% M. Muscular</Label>
                  <Input
                    id={musculoId}
                    type="number"
                    step="0.1"
                    value={musculoPct}
                    onChange={(e) => setMusculoPct(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={aguaId} className="text-[11px] text-muted-foreground">% Agua Corporal</Label>
                  <Input
                    id={aguaId}
                    type="number"
                    step="0.1"
                    value={aguaPct}
                    onChange={(e) => setAguaPct(Number(e.target.value))}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* Factores Metabólicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nivel de Actividad Física (PAL)</Label>
                <Select value={String(actividad)} onValueChange={(v) => setActividad(Number(v))}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.2">Sedentario (Oficina / Reposo)</SelectItem>
                    <SelectItem value="1.375">Ligero (1-3 días ejercicio/sem)</SelectItem>
                    <SelectItem value="1.55">Moderado (3-5 días ejercicio/sem)</SelectItem>
                    <SelectItem value="1.725">Intenso (6-7 días ejercicio duro)</SelectItem>
                    <SelectItem value="1.9">Atleta de Alto Rendimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Objetivo Nutricional</Label>
                <Select value={objetivo} onValueChange={(v: any) => setObjetivo(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deficit">Déficit Calórico (-450 kcal)</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento Normocalórico</SelectItem>
                    <SelectItem value="superavit">Superávit Hipertrofia (+350 kcal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {esModoClinica && (
              <div className="space-y-1.5">
                <Label className="text-xs">Profesional / Nutriólogo a Cargo</Label>
                <Select value={profesional} onValueChange={setProfesional}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lic. Andrea Morales">Lic. Andrea Morales (Nutrición Deportiva)</SelectItem>
                    <SelectItem value="Dr. Carlos Brea">Dr. Carlos Brea (Bariatría & Metabólica)</SelectItem>
                    <SelectItem value="Dra. Raquel Santos">Dra. Raquel Santos (Nutrición Clínica)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Preview de resultados calculados */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3 text-emerald-600" /> BMR Basal
                </div>
                <div className="text-base font-bold text-foreground mt-0.5">{bmrCalculado} <span className="text-[10px] font-normal">kcal</span></div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <Activity className="h-3 w-3 text-blue-600" /> TDEE Total
                </div>
                <div className="text-base font-bold text-foreground mt-0.5">{tdeeCalculado} <span className="text-[10px] font-normal">kcal</span></div>
              </div>

              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <div className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  {objetivo === "deficit" ? <TrendingDown className="h-3 w-3 text-purple-600" /> : <TrendingUp className="h-3 w-3 text-purple-600" />} Meta Diaria
                </div>
                <div className="text-base font-bold text-purple-700 dark:text-purple-300 mt-0.5">{caloriasMeta} <span className="text-[10px] font-normal">kcal</span></div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-10">
              <CheckCircle2 className="h-4 w-4" />
              Guardar Evaluación & Generar Prescripción
            </Button>
          </form>
        </div>

        {/* Ficha de Evaluación Seleccionada & Despacho */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Prescripción de Macronutrientes</h3>
                <p className="text-xs text-muted-foreground">Distribución personalizada</p>
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                {evaluacionSeleccionada.pacienteNombre}
              </Badge>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-foreground">Calorías Prescritas</div>
                  <div className="text-[11px] text-muted-foreground">Objetivo: {evaluacionSeleccionada.objetivoTipo}</div>
                </div>
                <div className="text-xl font-bold text-emerald-600">
                  {evaluacionSeleccionada.objetivoKcal} <span className="text-xs font-normal text-muted-foreground">kcal/día</span>
                </div>
              </div>

              {/* Barras de Macros */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Proteína (4 kcal/g)
                  </span>
                  <span className="font-semibold text-foreground">{evaluacionSeleccionada.macros.proteinaGramos}g ({evaluacionSeleccionada.macros.proteinaGramos * 4} kcal)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(evaluacionSeleccionada.macros.proteinaGramos * 4 / evaluacionSeleccionada.objetivoKcal) * 100}%` }} />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Carbohidratos (4 kcal/g)
                  </span>
                  <span className="font-semibold text-foreground">{evaluacionSeleccionada.macros.carbosGramos}g ({evaluacionSeleccionada.macros.carbosGramos * 4} kcal)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(evaluacionSeleccionada.macros.carbosGramos * 4 / evaluacionSeleccionada.objetivoKcal) * 100}%` }} />
                </div>

                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Grasas Saludables (9 kcal/g)
                  </span>
                  <span className="font-semibold text-foreground">{evaluacionSeleccionada.macros.grasasGramos}g ({evaluacionSeleccionada.macros.grasasGramos * 9} kcal)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(evaluacionSeleccionada.macros.grasasGramos * 9 / evaluacionSeleccionada.objetivoKcal) * 100}%` }} />
                </div>
              </div>

              {/* Guía Hídrica */}
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs text-sky-800 dark:text-sky-300 flex items-center justify-between">
                <span>💧 Ingesta hídrica recomendada:</span>
                <span className="font-bold">{Math.round(evaluacionSeleccionada.pesoKg * 35)} ml/día</span>
              </div>
            </div>

            <Button
              onClick={() => handleCopiarInforme(evaluacionSeleccionada)}
              variant="outline"
              className="w-full gap-2 text-xs border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 h-9"
            >
              <Share2 className="h-3.5 w-3.5" />
              Copiar Informe Formateado para WhatsApp
            </Button>
          </div>

          {/* Histórico Reciente */}
          <div className="bg-card rounded-2xl border border-border/80 p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Historial de Evaluaciones
            </h4>

            <div className="space-y-2">
              {evaluaciones.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setEvaluacionSeleccionada(item)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    evaluacionSeleccionada.id === item.id
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                      : "border-border/60 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{item.pacienteNombre}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {item.fecha}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-muted-foreground text-[11px]">
                    <span>Peso: {item.pesoKg} kg</span>
                    <span>IMC: {item.imc}</span>
                    <span>Meta: {item.objetivoKcal} kcal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
