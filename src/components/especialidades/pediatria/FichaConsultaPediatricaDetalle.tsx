import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import {
  Baby,
  User,
  Calendar,
  Share2,
  Syringe,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Ruler,
  Brain,
  FileText,
  Clock,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export interface ConsultaPediatricaData {
  id: string;
  paciente_nombre: string;
  edad_meses: number;
  sexo: "M" | "F";
  tutor_nombre: string;
  tipo_consulta: string;
  fecha: string;
  peso_kg: number;
  talla_cm: number;
  pc_cm?: number;
  percentil_peso_edad: string;
  percentil_talla_edad: string;
  score_wood_downes?: number;
  vacunas_al_dia: boolean;
  diagnostico: string;
  plan_conducta: string;
}

interface FichaProps {
  consulta: ConsultaPediatricaData | null;
  onCopiarInforme: (c: ConsultaPediatricaData) => void;
  tipoConsultaNombre?: string;
}

export function FichaConsultaPediatricaDetalle({
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
        <h4 className="text-sm font-semibold text-foreground">Ningún paciente seleccionado</h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Seleccione una consulta del censo para visualizar el expediente pediátrico y antropometría OMS.
        </p>
      </div>
    );
  }

  const edadAnos = (consulta.edad_meses / 12).toFixed(1);
  const isWoodDownesAlto = (consulta.score_wood_downes ?? 0) >= 4;

  const handleImprimir = () => {
    toast.info("Generando volante de control pediátrico...");
    window.print();
  };

  return (
    <Card className="rounded-2xl border-border/80 shadow-none overflow-hidden">
      {/* Cabecera del Expediente */}
      <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {consulta.paciente_nombre.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-foreground leading-tight">
                  {consulta.paciente_nombre}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {consulta.edad_meses} meses ({edadAnos} años) · {consulta.sexo === "M" ? "Masculino" : "Femenino"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>Tutor: <strong className="text-foreground">{consulta.tutor_nombre}</strong></span>
                <span>·</span>
                <span className="font-mono">{consulta.id}</span>
              </p>
            </div>
          </div>

          {/* Acciones de Cabecera */}
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
              title="Imprimir resumen médico"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Badges de Triaje Clínico */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
            {tipoConsultaNombre || consulta.tipo_consulta}
          </Badge>

          <Badge
            variant="outline"
            className={
              consulta.vacunas_al_dia
                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 text-xs"
                : "border-rose-500/40 text-rose-700 dark:text-rose-400 bg-rose-500/10 text-xs"
            }
          >
            <Syringe className="h-3 w-3 mr-1" />
            {consulta.vacunas_al_dia ? "Esquema PAI Al Día" : "Vacunas Pendientes"}
          </Badge>

          {consulta.score_wood_downes !== undefined && (
            <Badge
              className={
                consulta.score_wood_downes >= 8
                  ? "bg-rose-600 text-white animate-pulse text-xs"
                  : consulta.score_wood_downes >= 4
                  ? "bg-amber-600 text-white text-xs"
                  : "bg-emerald-600 text-white text-xs"
              }
            >
              <Wind className="h-3 w-3 mr-1" />
              Wood-Downes: {consulta.score_wood_downes} pts (
              {consulta.score_wood_downes >= 8 ? "Severa" : consulta.score_wood_downes >= 4 ? "Moderada" : "Leve"})
            </Badge>
          )}

          <span className="text-[11px] text-muted-foreground ml-auto flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(consulta.fecha), "dd/MM/yyyy hh:mm a")}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Vitrina Antropométrica */}
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Antropometría & Percentiles OMS
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl border border-border/80 bg-card">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Scale className="h-3 w-3 text-emerald-600" /> Peso Corporal
              </div>
              <div className="text-base font-bold font-mono text-foreground mt-0.5">
                {consulta.peso_kg} kg
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Percentil: <strong className="text-foreground">{consulta.percentil_peso_edad}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-card">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Ruler className="h-3 w-3 text-blue-600" /> Talla / Longitud
              </div>
              <div className="text-base font-bold font-mono text-foreground mt-0.5">
                {consulta.talla_cm} cm
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Percentil: <strong className="text-foreground">{consulta.percentil_talla_edad}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-card">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3 text-purple-600" /> Per. Cefálico
              </div>
              <div className="text-base font-bold font-mono text-foreground mt-0.5">
                {consulta.pc_cm ? `${consulta.pc_cm} cm` : "N/D"}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                Neurodesarrollo craneal
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-card">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-primary" /> Estado Nutricional
              </div>
              <div className="text-xs font-bold text-foreground mt-1 line-clamp-1">
                {consulta.percentil_peso_edad.includes("p50")
                  ? "Eutrófico Adecuado"
                  : consulta.percentil_peso_edad.includes("<")
                  ? "Bajo Peso / Alerta"
                  : "Normopeso"}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                OMS Crecimiento 2006
              </div>
            </div>
          </div>
        </div>

        {/* Diagnóstico Clínico */}
        <div className="p-3.5 rounded-xl border border-border/80 bg-muted/15 space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-primary" />
            Diagnóstico Pediátrico
          </div>
          <p className="text-xs text-foreground font-medium leading-relaxed">
            {consulta.diagnostico}
          </p>
        </div>

        {/* Plan de Conducta y Recomendaciones para Padres */}
        <div className="p-3.5 rounded-xl border border-primary/25 bg-primary/5 space-y-1.5">
          <div className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            Plan de Conducta & Pautas para Padres
          </div>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
            {consulta.plan_conducta}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
