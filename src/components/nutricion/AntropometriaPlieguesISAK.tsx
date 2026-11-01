import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Activity,
  Sparkles,
  Share2,
  Printer,
  Plus,
  Scale,
  CheckCircle2,
  HeartPulse,
  Flame,
  ShieldCheck,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

export interface EvaluacionISAK {
  id: string;
  fecha: string;
  paciente: string;
  sexo: "M" | "F";
  edad: number;
  pesoKg: number;
  estaturaCm: number;
  // Pliegues cutáneos (mm)
  pliegues: {
    tricipital: number;
    subescapular: number;
    bicipital: number;
    crestaIliaca: number;
    supraespinal: number;
    abdominal: number;
    musloFrontal: number;
    pantorrillaMedia: number;
  };
  // Perímetros (cm)
  perimetros: {
    brazoRelajado: number;
    brazoContraido: number;
    cintura: number;
    cadera: number;
    musloMedio: number;
    pantorrilla: number;
  };
  // Cálculos automáticos
  suma6Pliegues: number;
  grasaFaulknerPct: number;
  indiceCinturaCadera: number;
  riesgoCardiovascular: "Bajo" | "Moderado" | "Alto";
  indiceCinturaEstatura: number;
}

export default function AntropometriaPlieguesISAK() {
  const [paciente] = useState({
    nombre: "Camila Peña",
    edad: 32,
    sexo: "F" as "M" | "F",
    estaturaCm: 164,
  });

  const [formulario, setFormulario] = useState({
    pesoKg: 66.8,
    // Pliegues mm
    tricipital: 14,
    subescapular: 12,
    bicipital: 7,
    crestaIliaca: 18,
    supraespinal: 13,
    abdominal: 19,
    musloFrontal: 22,
    pantorrillaMedia: 15,
    // Perímetros cm
    brazoRelajado: 27.5,
    brazoContraido: 29.0,
    cintura: 72,
    cadera: 98,
    musloMedio: 54,
    pantorrilla: 35.5,
  });

  const suma6 =
    formulario.tricipital +
    formulario.subescapular +
    formulario.supraespinal +
    formulario.abdominal +
    formulario.musloFrontal +
    formulario.pantorrillaMedia;

  // Fórmula de Faulkner para % graso: (Suma 4 pliegues tricipital + subescapular + supraespinal + abdominal) * 0.153 + 5.783
  const suma4 = formulario.tricipital + formulario.subescapular + formulario.supraespinal + formulario.abdominal;
  const pctGrasa = Math.round((suma4 * 0.153 + 5.783) * 10) / 10;

  // Índice Cintura-Cadera (ICC)
  const icc = Math.round((formulario.cintura / formulario.cadera) * 100) / 100;
  // En mujeres, normal < 0.80, riesgo >= 0.85; en hombres normal < 0.90, riesgo >= 1.0
  const riesgoCV =
    paciente.sexo === "F"
      ? icc < 0.8
        ? "Bajo"
        : icc < 0.85
        ? "Moderado"
        : "Alto"
      : icc < 0.9
      ? "Bajo"
      : icc < 1.0
      ? "Moderado"
      : "Alto";

  // Índice Cintura-Estatura (ICE) -> Normal < 0.50
  const ice = Math.round((formulario.cintura / paciente.estaturaCm) * 100) / 100;

  const [historial, setHistorial] = useState<EvaluacionISAK[]>([
    {
      id: "isak-1",
      fecha: "2026-09-20",
      paciente: "Camila Peña",
      sexo: "F",
      edad: 32,
      pesoKg: 68.5,
      estaturaCm: 164,
      pliegues: {
        tricipital: 16,
        subescapular: 14,
        bicipital: 8,
        crestaIliaca: 21,
        supraespinal: 15,
        abdominal: 23,
        musloFrontal: 25,
        pantorrillaMedia: 17,
      },
      perimetros: {
        brazoRelajado: 28.5,
        brazoContraido: 29.5,
        cintura: 76,
        cadera: 101,
        musloMedio: 56,
        pantorrilla: 36,
      },
      suma6Pliegues: 110,
      grasaFaulknerPct: 24.5,
      indiceCinturaCadera: 0.75,
      riesgoCardiovascular: "Bajo",
      indiceCinturaEstatura: 0.46,
    },
  ]);

  const guardarEvaluacion = (e: React.FormEvent) => {
    e.preventDefault();
    const nueva: EvaluacionISAK = {
      id: `isak-${Date.now()}`,
      fecha: new Date().toISOString().split("T")[0],
      paciente: paciente.nombre,
      sexo: paciente.sexo,
      edad: paciente.edad,
      pesoKg: formulario.pesoKg,
      estaturaCm: paciente.estaturaCm,
      pliegues: {
        tricipital: formulario.tricipital,
        subescapular: formulario.subescapular,
        bicipital: formulario.bicipital,
        crestaIliaca: formulario.crestaIliaca,
        supraespinal: formulario.supraespinal,
        abdominal: formulario.abdominal,
        musloFrontal: formulario.musloFrontal,
        pantorrillaMedia: formulario.pantorrillaMedia,
      },
      perimetros: {
        brazoRelajado: formulario.brazoRelajado,
        brazoContraido: formulario.brazoContraido,
        cintura: formulario.cintura,
        cadera: formulario.cadera,
        musloMedio: formulario.musloMedio,
        pantorrilla: formulario.pantorrilla,
      },
      suma6Pliegues: suma6,
      grasaFaulknerPct: pctGrasa,
      indiceCinturaCadera: icc,
      riesgoCardiovascular: riesgoCV,
      indiceCinturaEstatura: ice,
    };
    setHistorial([nueva, ...historial]);
    toast.success("Evaluación antropométrica ISAK guardada exitosamente");
  };

  const compartirWhatsApp = () => {
    const texto = `📊 *INFORME ANTROPOMÉTRICO ISAK*\n*Paciente:* ${paciente.nombre}\n*Peso Actual:* ${formulario.pesoKg} kg | *Estatura:* ${paciente.estaturaCm} cm\n*Suma 6 Pliegues:* ${suma6} mm\n*% Grasa Estimado (Faulkner):* ${pctGrasa}%\n*Cintura:* ${formulario.cintura} cm | *Cadera:* ${formulario.cadera} cm\n*Índice Cintura/Cadera (ICC):* ${icc} (Riesgo CV: ${riesgoCV})\n*Índice Cintura/Estatura (ICE):* ${ice} (Objetivo saludable < 0.50)`;
    navigator.clipboard.writeText(texto);
    toast.success("Resumen copiado para enviar por WhatsApp");
  };

  return (
    <div className="space-y-6">
      {/* Header ISAK */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-600 text-white shadow-sm">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                Antropometría ISAK: Pliegues & Perímetros
              </h2>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                Perfil Restringido ISAK Nivel 1/2
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Paciente: <span className="font-semibold text-foreground">{paciente.nombre}</span> ({paciente.edad} años) • Estatura: {paciente.estaturaCm} cm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={compartirWhatsApp}
            className="rounded-xl gap-1.5 text-xs font-semibold border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10"
          >
            <Share2 className="h-3.5 w-3.5" />
            Enviar a WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl gap-1.5 text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen Inmediato de Cálculos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border/80 p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Suma 6 Pliegues</span>
          <div className="text-2xl font-black text-foreground mt-1">{suma6} mm</div>
          <span className="text-[11px] text-emerald-600 font-medium">Buena masa magra</span>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">% Graso (Faulkner)</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{pctGrasa}%</div>
          <span className="text-[11px] text-muted-foreground">Rango atleta / óptimo</span>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Índice Cintura/Cadera</span>
          <div className="text-2xl font-black text-foreground mt-1">{icc}</div>
          <Badge
            variant="outline"
            className={
              riesgoCV === "Bajo"
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px]"
                : "bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px]"
            }
          >
            Riesgo CV {riesgoCV}
          </Badge>
        </Card>

        <Card className="rounded-2xl border-border/80 p-4 shadow-sm">
          <span className="text-xs text-muted-foreground font-medium">Cintura / Estatura (ICE)</span>
          <div className="text-2xl font-black text-foreground mt-1">{ice}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Saludable (&lt; 0.50)</span>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Formulario de Pliegues y Perímetros (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-600" />
                Mediciones con Plicómetro & Cinta Lufkin
              </CardTitle>
              <CardDescription className="text-xs">
                Valores en milímetros (mm) para pliegues y centímetros (cm) para perímetros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={guardarEvaluacion} className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    1. Pliegues Cutáneos (mm)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <Label className="text-[11px]">Tricipital</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.tricipital}
                        onChange={(e) => setFormulario({ ...formulario, tricipital: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Subescapular</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.subescapular}
                        onChange={(e) => setFormulario({ ...formulario, subescapular: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Bicipital</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.bicipital}
                        onChange={(e) => setFormulario({ ...formulario, bicipital: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Cresta Ilíaca</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.crestaIliaca}
                        onChange={(e) => setFormulario({ ...formulario, crestaIliaca: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Supraespinal</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.supraespinal}
                        onChange={(e) => setFormulario({ ...formulario, supraespinal: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Abdominal</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.abdominal}
                        onChange={(e) => setFormulario({ ...formulario, abdominal: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Muslo Frontal</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.musloFrontal}
                        onChange={(e) => setFormulario({ ...formulario, musloFrontal: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Pantorrilla Med.</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.pantorrillaMedia}
                        onChange={(e) => setFormulario({ ...formulario, pantorrillaMedia: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    2. Perímetros Corporales (cm)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <Label className="text-[11px]">Cintura (mínima)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.cintura}
                        onChange={(e) => setFormulario({ ...formulario, cintura: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Cadera (glútea)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.cadera}
                        onChange={(e) => setFormulario({ ...formulario, cadera: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs font-bold text-emerald-600"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Brazo Relajado</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.brazoRelajado}
                        onChange={(e) => setFormulario({ ...formulario, brazoRelajado: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Brazo Contraído</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.brazoContraido}
                        onChange={(e) => setFormulario({ ...formulario, brazoContraido: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Muslo Medio</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.musloMedio}
                        onChange={(e) => setFormulario({ ...formulario, musloMedio: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Pantorrilla Máx.</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={formulario.pantorrilla}
                        onChange={(e) => setFormulario({ ...formulario, pantorrilla: Number(e.target.value) })}
                        className="rounded-xl h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Guardar Evaluación ISAK
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Historial Evolutivo ISAK (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl border-border/80 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Historial de Mediciones ISAK
              </CardTitle>
              <CardDescription className="text-xs">
                Evolución de pliegues grasos y masa muscular
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {historial.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-border/70 bg-card hover:border-emerald-500/40 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{item.fecha}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.pesoKg} kg
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ICC: {item.indiceCinturaCadera} • ICE: {item.indiceCinturaEstatura}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-emerald-600">
                        {item.grasaFaulknerPct}%
                      </div>
                      <span className="text-[10px] text-muted-foreground">Faulkner</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2 rounded-xl">
                    <div>
                      <span className="text-muted-foreground">Suma 6: </span>
                      <span className="font-semibold">{item.suma6Pliegues} mm</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cintura: </span>
                      <span className="font-semibold">{item.perimetros.cintura} cm</span>
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
