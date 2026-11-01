import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Scale,
  Sparkles,
  Share2,
  Printer,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Pill,
  HeartPulse,
  Activity,
  Flame,
  User,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export interface RegistroBariatrico {
  id: string;
  fecha: string;
  semanasPostOp: number;
  faseActual: "fase1_liquidos_claros" | "fase2_liquidos_completos" | "fase3_pures" | "fase4_solidos_blandos" | "mantenimiento";
  pesoKg: number;
  ewlPorcentaje: number; // % Excess Weight Loss
  toleranciaProteicaGramos: number; // Meta: 60-80g/día
  aguaMl: number; // Meta: >1500ml/día
  sintomasDumping: boolean;
  detallesDumping: string;
  adherenciaSuplementos: "alta" | "media" | "baja";
  observaciones: string;
}

const FASES_BARIATRICAS = {
  fase1_liquidos_claros: {
    nombre: "Fase 1: Líquidos Claros (Días 1-7)",
    descripcion: "Caldos desgrasados, infusiones, agua, gelatina light. Tomas de 30-50 ml cada 20 min.",
    badgeColor: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  },
  fase2_liquidos_completos: {
    nombre: "Fase 2: Líquidos Completos & Batidos Proteicos (Sem 2-3)",
    descripcion: "Aislado de suero (whey isolate), leche vegetal fortificada, yogur griego descremado.",
    badgeColor: "bg-purple-500/10 text-purple-700 border-purple-500/30",
  },
  fase3_pures: {
    nombre: "Fase 3: Papillas & Purés Suaves (Sem 3-4)",
    descripcion: "Pescado blanco desmenuzado, pollo licuado con caldo, huevo poché, puré de calabaza.",
    badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  },
  fase4_solidos_blandos: {
    nombre: "Fase 4: Sólidos Blandos de Transición (Sem 5+)",
    descripcion: "Masticación minuciosa (30 veces por bocado). Separar líquidos de sólidos 30 minutos.",
    badgeColor: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  },
  mantenimiento: {
    nombre: "Dieta Bariátrica de Mantenimiento",
    descripcion: "Patrón hiperproteico balanceado, rica en micronutrientes y prevención de déficit nutricional.",
    badgeColor: "bg-teal-500/10 text-teal-700 border-teal-500/30",
  },
};

export default function SeguimientoBariatricoEWL() {
  const [paciente] = useState({
    nombre: "Valeria Montero",
    edad: 38,
    tipoCirugia: "Bypass Gástrico en Y de Roux",
    fechaCirugia: "2026-09-15",
    tallaCm: 162,
    pesoInicialKg: 114,
    pesoIdealKg: 60, // Peso base para cálculo de exceso de peso
  });

  const pesoExcesoTotal = paciente.pesoInicialKg - paciente.pesoIdealKg; // 54 kg de exceso

  const [registros, setRegistros] = useState<RegistroBariatrico[]>([
    {
      id: "bar-1",
      fecha: "2026-10-01",
      semanasPostOp: 2,
      faseActual: "fase2_liquidos_completos",
      pesoKg: 106,
      ewlPorcentaje: Math.round(((114 - 106) / pesoExcesoTotal) * 100 * 10) / 10, // 14.8%
      toleranciaProteicaGramos: 65,
      aguaMl: 1600,
      sintomasDumping: false,
      detallesDumping: "Sin náuseas ni dumping precoz.",
      adherenciaSuplementos: "alta",
      observaciones: "Buena tolerancia al aislado de proteína sabor neutro.",
    },
    {
      id: "bar-2",
      fecha: "2026-10-22",
      semanasPostOp: 5,
      faseActual: "fase4_solidos_blandos",
      pesoKg: 98.5,
      ewlPorcentaje: Math.round(((114 - 98.5) / pesoExcesoTotal) * 100 * 10) / 10, // 28.7%
      toleranciaProteicaGramos: 75,
      aguaMl: 1800,
      sintomasDumping: true,
      detallesDumping: "Episodio de sudoración y taquicardia leve por ingerir jugo con fructosa concentrada.",
      adherenciaSuplementos: "alta",
      observaciones: "Se reitera prohibición estricta de azúcares simples para evitar Síndrome de Dumping.",
    },
  ]);

  const registroActual = registros[registros.length - 1] || registros[0];
  const pesoActual = registroActual.pesoKg;
  const pesoPerdidoKg = Math.round((paciente.pesoInicialKg - pesoActual) * 10) / 10;
  const ewlActual = Math.round((pesoPerdidoKg / pesoExcesoTotal) * 100 * 10) / 10;

  const [nuevoForm, setNuevoForm] = useState({
    pesoKg: 96,
    faseActual: "fase4_solidos_blandos" as RegistroBariatrico["faseActual"],
    toleranciaProteicaGramos: 75,
    aguaMl: 1800,
    sintomasDumping: false,
    detallesDumping: "",
    adherenciaSuplementos: "alta" as RegistroBariatrico["adherenciaSuplementos"],
    observaciones: "",
  });

  const agregarControl = (e: React.FormEvent) => {
    e.preventDefault();
    const pesoNum = Number(nuevoForm.pesoKg);
    if (!pesoNum || pesoNum <= 0) {
      toast.error("Indique un peso válido");
      return;
    }

    const perdido = paciente.pesoInicialKg - pesoNum;
    const calcEWL = Math.round((perdido / pesoExcesoTotal) * 100 * 10) / 10;
    const semanas = Math.max(1, Math.round((Date.now() - new Date(paciente.fechaCirugia).getTime()) / (1000 * 60 * 60 * 24 * 7)));

    const nuevo: RegistroBariatrico = {
      id: `bar-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      semanasPostOp: semanas,
      faseActual: nuevoForm.faseActual,
      pesoKg: pesoNum,
      ewlPorcentaje: calcEWL,
      toleranciaProteicaGramos: Number(nuevoForm.toleranciaProteicaGramos) || 70,
      aguaMl: Number(nuevoForm.aguaMl) || 1600,
      sintomasDumping: nuevoForm.sintomasDumping,
      detallesDumping: nuevoForm.detallesDumping || "Sin episodios de dumping reportados",
      adherenciaSuplementos: nuevoForm.adherenciaSuplementos,
      observaciones: nuevoForm.observaciones || "Control de evolución post-bariátrica habitual.",
    };

    setRegistros([...registros, nuevo]);
    toast.success(`Control post-operatorio registrado (% EWL alcanzado: ${calcEWL}%)`);
  };

  const compartirPlanBariatricoWhatsApp = () => {
    const texto = `🏥 *PROTOCOLO BARIÁTRICO & RECOMENDACIONES*\n*Paciente:* ${paciente.nombre}\n*Cirugía:* ${paciente.tipoCirugia}\n*Peso Inicial:* ${paciente.pesoInicialKg} kg | *Peso Actual:* ${pesoActual} kg\n*Pérdida Total:* -${pesoPerdidoKg} kg (*${ewlActual}% EWL*)\n*Fase Nutricional:* ${FASES_BARIATRICAS[registroActual.faseActual].nombre}\n\n📌 *Pautas Críticas:*\n1. Meta Proteica: Mínimo ${registroActual.toleranciaProteicaGramos}g/día (priorizar suero whey isolate).\n2. Hidratación: ${registroActual.aguaMl} ml/día a pequeños sorbos fuera de las comidas.\n3. Regla de los 30 min: No beber líquidos 30 min antes ni 30 min después de comer sólidos.\n4. Masticar cada bocado al menos 25 a 30 veces.\n5. Evitar azúcares refinados para prevenir Síndrome de Dumping.`;
    navigator.clipboard.writeText(texto);
    toast.success("Resumen copiado para enviar por WhatsApp");
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Bariátrico & KPIs de Pérdida */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Control & Seguimiento Bariátrico (% EWL)
                </h2>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                  Cirugía de la Obesidad & Metabólica
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Paciente: <span className="font-semibold text-foreground">{paciente.nombre}</span> ({paciente.edad} años) • {paciente.tipoCirugia} • Fecha: {paciente.fechaCirugia}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={compartirPlanBariatricoWhatsApp}
            className="rounded-xl gap-1.5 text-xs font-semibold border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
          >
            <Share2 className="h-3.5 w-3.5" />
            Enviar Pautas por WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl gap-1.5 text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Reporte
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Bariátricas Clave */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 shadow-sm p-4">
          <span className="text-xs text-muted-foreground font-medium">Pérdida Total de Peso</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">-{pesoPerdidoKg} kg</div>
          <span className="text-[11px] text-muted-foreground">De {paciente.pesoInicialKg} kg a {pesoActual} kg</span>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-sm p-4">
          <span className="text-xs text-muted-foreground font-medium">% EWL Alcanzado</span>
          <div className="text-2xl font-black text-foreground mt-1">{ewlActual}%</div>
          <div className="mt-2">
            <Progress value={Math.min(100, ewlActual)} className="h-2 bg-muted" />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Meta estándar año 1: &gt; 50%</span>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-sm p-4">
          <span className="text-xs text-muted-foreground font-medium">Aporte Proteico Diario</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{registroActual.toleranciaProteicaGramos} g/d</div>
          <span className="text-[11px] text-emerald-700 font-medium">Cumple meta (60-80g/d)</span>
        </Card>

        <Card className="rounded-2xl border-border/80 shadow-sm p-4">
          <span className="text-xs text-muted-foreground font-medium">Riesgo de Dumping</span>
          <div className="text-2xl font-black mt-1">
            {registroActual.sintomasDumping ? (
              <span className="text-amber-600 flex items-center gap-1.5 text-lg">
                <AlertTriangle className="h-5 w-5" /> Alerta Leve
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1.5 text-lg">
                <CheckCircle2 className="h-5 w-5" /> Controlado
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">Evitar azúcares rápidos</span>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulario de Nuevo Control Post-Operatorio (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                Registrar Control Evolutivo
              </CardTitle>
              <CardDescription className="text-xs">
                Seguimiento de peso, tolerancia gástrica y micronutrientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={agregarControl} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Peso Actual (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={nuevoForm.pesoKg}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, pesoKg: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fase Alimentaria</Label>
                    <Select
                      value={nuevoForm.faseActual}
                      onValueChange={(v: any) => setNuevoForm({ ...nuevoForm, faseActual: v })}
                    >
                      <SelectTrigger className="rounded-xl text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fase1_liquidos_claros">Fase 1: Líquidos Claros</SelectItem>
                        <SelectItem value="fase2_liquidos_completos">Fase 2: Líquidos Completos</SelectItem>
                        <SelectItem value="fase3_pures">Fase 3: Papillas / Purés</SelectItem>
                        <SelectItem value="fase4_solidos_blandos">Fase 4: Sólidos Blandos</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento Bariátrico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Proteína Diaria (g)</Label>
                    <Input
                      type="number"
                      value={nuevoForm.toleranciaProteicaGramos}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, toleranciaProteicaGramos: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Ingesta Hídrica (ml/d)</Label>
                    <Input
                      type="number"
                      value={nuevoForm.aguaMl}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, aguaMl: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">¿Presentó Síntomas de Dumping?</span>
                    <Button
                      type="button"
                      variant={nuevoForm.sintomasDumping ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => setNuevoForm({ ...nuevoForm, sintomasDumping: !nuevoForm.sintomasDumping })}
                      className="h-7 text-xs rounded-lg"
                    >
                      {nuevoForm.sintomasDumping ? "Sí (Dumping)" : "No"}
                    </Button>
                  </div>
                  {nuevoForm.sintomasDumping && (
                    <Input
                      placeholder="Describa el alimento desencadenante y síntomas..."
                      value={nuevoForm.detallesDumping}
                      onChange={(e) => setNuevoForm({ ...nuevoForm, detallesDumping: e.target.value })}
                      className="rounded-xl text-xs bg-background"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-xs">Adherencia a Suplementos Bariátricos</Label>
                  <Select
                    value={nuevoForm.adherenciaSuplementos}
                    onValueChange={(v: any) => setNuevoForm({ ...nuevoForm, adherenciaSuplementos: v })}
                  >
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta (Multivitamínico + Calcio + B12 + Hierro diarios)</SelectItem>
                      <SelectItem value="media">Media (Olvida dosis ocasionalmente)</SelectItem>
                      <SelectItem value="baja">Baja (Riesgo de desnutrición / anemia)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Indicaciones y Plan Nutricional</Label>
                  <Textarea
                    placeholder="Instrucciones dietéticas de masticación y ajuste proteico..."
                    rows={2}
                    value={nuevoForm.observaciones}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, observaciones: e.target.value })}
                    className="rounded-xl text-xs"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Guardar Control Bariátrico
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Historial Evolutivo Bariátrico (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    Historial de Controles Post-Cirugía ({registros.length})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Curva de descenso ponderal y transición de fases dietéticas
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {registros.map((reg) => (
                <div
                  key={reg.id}
                  className="p-3.5 rounded-2xl border border-border/70 bg-card hover:border-emerald-500/40 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">Semana {reg.semanasPostOp}</span>
                        <Badge variant="outline" className={FASES_BARIATRICAS[reg.faseActual]?.badgeColor || ""}>
                          {FASES_BARIATRICAS[reg.faseActual]?.nombre || reg.faseActual}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{reg.fecha}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reg.observaciones}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-600">{reg.pesoKg} kg</div>
                      <Badge className="bg-emerald-600 text-white text-[10px] py-0 font-bold">
                        {reg.ewlPorcentaje}% EWL
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs bg-muted/40 p-2.5 rounded-xl">
                    <div>
                      <span className="text-muted-foreground">Proteína: </span>
                      <span className="font-semibold text-foreground">{reg.toleranciaProteicaGramos} g/d</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Agua: </span>
                      <span className="font-semibold text-foreground">{reg.aguaMl} ml/d</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dumping: </span>
                      <span className={`font-semibold ${reg.sintomasDumping ? "text-amber-600" : "text-emerald-700"}`}>
                        {reg.sintomasDumping ? "Presente" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
