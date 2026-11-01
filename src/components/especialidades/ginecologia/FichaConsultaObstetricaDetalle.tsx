import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Baby,
  Heart,
  Calendar,
  Share2,
  AlertTriangle,
  Scale,
  Ruler,
  Activity,
  FileText,
  Printer,
  ShieldCheck,
  Stethoscope,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

export interface ConsultaGinecoData {
  id: string;
  paciente_nombre: string;
  edad_gestacional_semanas?: number;
  tipo_consulta: string;
  fecha: string;
  ta: string;
  peso_kg: number;
  altura_uterina_cm?: number;
  fcf_lpm?: number;
  fum?: string;
  fpp?: string;
  bishop_score?: number;
  tamizaje_pap?: string;
  diagnostico: string;
  plan_conducta: string;
}

interface FichaProps {
  consulta: ConsultaGinecoData | null;
  onCopiarInforme: (c: ConsultaGinecoData) => void;
  tipoConsultaNombre?: string;
}

export function FichaConsultaObstetricaDetalle({
  consulta,
  onCopiarInforme,
  tipoConsultaNombre,
}: FichaProps) {
  if (!consulta) {
    return (
      <div className="h-full min-h-[420px] rounded-2xl border border-dashed border-border flex flex-col items-center justify-center p-8 text-center bg-muted/10">
        <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground mb-3">
          <Baby className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Ninguna paciente seleccionada</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Seleccione una paciente gestante o ginecológica del censo para revisar el carnet perinatal.
        </p>
      </div>
    );
  }

  const [sistolica, diastolica] = (consulta.ta || "120/80")
    .split("/")
    .map((v) => parseInt(v.trim()) || 0);
  const isHipertension = sistolica >= 140 || diastolica >= 90;
  const isFcfAnormal =
    consulta.fcf_lpm !== undefined && (consulta.fcf_lpm < 110 || consulta.fcf_lpm > 160);

  const handleImprimir = () => {
    toast.info("Generando volante perinatal...");
    window.print();
  };

  return (
    <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
      {/* Cabecera de la Paciente */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 font-bold text-sm shrink-0">
              {consulta.paciente_nombre.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-foreground leading-tight">
                  {consulta.paciente_nombre}
                </h3>
                {consulta.edad_gestacional_semanas !== undefined && (
                  <Badge variant="outline" className="text-xs font-mono bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30">
                    <Baby className="h-3 w-3 mr-1" />
                    {consulta.edad_gestacional_semanas} sem de gestación
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                {consulta.fpp && (
                  <span>FPP (Naegele): <strong className="text-foreground">{consulta.fpp}</strong></span>
                )}
                {consulta.fum && (
                  <>
                    <span>·</span>
                    <span>FUM: {consulta.fum}</span>
                  </>
                )}
                <span>·</span>
                <span className="font-mono">{consulta.id}</span>
              </p>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopiarInforme(consulta)}
              className="h-8 text-xs border-border/80"
              title="Copiar informe para WhatsApp"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5 text-sky-600" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleImprimir}
              className="h-8 text-xs border-border/80"
              title="Imprimir carnet prenatal"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Badges de Triaje Perinatal */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
            {tipoConsultaNombre || consulta.tipo_consulta}
          </Badge>

          {isHipertension ? (
            <Badge className="bg-rose-600 text-white animate-pulse text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" /> Alerta: TA Elevada ({consulta.ta})
            </Badge>
          ) : (
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 text-xs">
              TA Normotensa ({consulta.ta})
            </Badge>
          )}

          {consulta.fcf_lpm !== undefined && (
            <Badge
              variant="outline"
              className={
                isFcfAnormal
                  ? "border-rose-500/40 text-rose-700 bg-rose-500/10 text-xs"
                  : "border-border/80 text-foreground bg-card text-xs font-mono"
              }
            >
              <Heart className={`h-3 w-3 mr-1 ${isFcfAnormal ? "text-rose-600 animate-bounce" : "text-rose-500"}`} />
              FCF: {consulta.fcf_lpm} lpm
            </Badge>
          )}

          {consulta.tamizaje_pap && (
            <Badge variant="outline" className="text-xs border-border/70 text-muted-foreground">
              PAP: {consulta.tamizaje_pap}
            </Badge>
          )}

          <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(consulta.fecha), "dd/MM/yyyy")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Vitrina de Parámetros Perinatales */}
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Biometría Feto-Materna
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-border/80 bg-card">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Heart className="h-3 w-3 text-rose-500" /> Frec. Cardíaca Fetal
              </div>
              <div className="text-base font-bold font-mono text-foreground mt-0.5">
                {consulta.fcf_lpm ? `${consulta.fcf_lpm} lpm` : "N/D"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Rango normal: 110 - 160 lpm
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-card">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3 text-blue-600" /> Altura Uterina
              </div>
              <div className="text-base font-bold font-mono text-foreground mt-0.5">
                {consulta.altura_uterina_cm ? `${consulta.altura_uterina_cm} cm` : "N/D"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Acorde a edad gestacional
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-card">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3 text-purple-600" /> Tensión Arterial
              </div>
              <div className={`text-base font-bold font-mono mt-0.5 ${isHipertension ? "text-rose-600" : "text-foreground"}`}>
                {consulta.ta} mmHg
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {isHipertension ? "Descartar Preeclampsia" : "Normotensa"}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-card">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Scale className="h-3 w-3 text-emerald-600" /> Peso Materno
              </div>
              <div className="text-base font-bold font-mono text-foreground mt-0.5">
                {consulta.peso_kg} kg
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Control de ganancia ponderal
              </div>
            </div>
          </div>
        </div>

        {/* Diagnóstico Obstétrico / Ginecológico */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/15 space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Diagnóstico Clínico
          </div>
          <p className="text-xs text-foreground font-medium leading-relaxed">
            {consulta.diagnostico}
          </p>
        </div>

        {/* Plan de Conducta y Recomendaciones Obstétricas */}
        <div className="p-3.5 rounded-xl border border-rose-500/25 bg-rose-500/5 space-y-1.5">
          <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-rose-600" />
            Plan Terapéutico & Recomendaciones de Alarma
          </div>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
            {consulta.plan_conducta}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
