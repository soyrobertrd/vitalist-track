import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Ruler, Compass, Activity, SunMedium, Contrast, RotateCcw } from "lucide-react";

export type WindowPreset = "cerebro" | "pulmon" | "hueso" | "mediastino" | "abdomen" | "estandar";

export interface DicomToolState {
  activeTool: "none" | "ruler" | "cobb" | "hu";
  windowPreset: WindowPreset;
  windowWidth: number;
  windowCenter: number;
  zoom: number;
  pan: { x: number; y: number };
  cobbAngle: number | null;
  measuredMm: number | null;
  hounsfieldUnit: number | null;
}

interface DicomDiagnosticToolsProps {
  toolState: DicomToolState;
  onToolChange: (tool: DicomToolState["activeTool"]) => void;
  onPresetChange: (preset: WindowPreset) => void;
  onWindowChange: (width: number, center: number) => void;
  onReset: () => void;
}

const PRESETS: Record<WindowPreset, { name: string; width: number; center: number; desc: string }> = {
  cerebro: { name: "Cerebro", width: 80, center: 40, desc: "Sustancia gris/blanca e isquemia" },
  pulmon: { name: "Pulmón", width: 1500, center: -600, desc: "Parénquima pulmonar y bronquios" },
  hueso: { name: "Hueso", width: 2000, center: 300, desc: "Corteza ósea y microfracturas" },
  mediastino: { name: "Mediastino", width: 350, center: 50, desc: "Vasos mayores y adenopatías" },
  abdomen: { name: "Abdomen", width: 400, center: 40, desc: "Hígado, bazo y asas intestinales" },
  estandar: { name: "Estándar", width: 400, center: 50, desc: "Contraste general" },
};

export const DicomDiagnosticTools: React.FC<DicomDiagnosticToolsProps> = ({
  toolState,
  onToolChange,
  onPresetChange,
  onWindowChange,
  onReset,
}) => {
  return (
    <div className="space-y-4 bg-muted/30 p-3 rounded-xl border border-border/70 text-xs">
      {/* Herramientas de Medición Médica */}
      <div>
        <Label className="text-xs font-semibold text-foreground/80 mb-2 block">
          Herramientas de Medición Clínica
        </Label>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={toolState.activeTool === "ruler" ? "default" : "outline"}
            className="h-8 text-xs flex items-center gap-1.5"
            onClick={() => onToolChange(toolState.activeTool === "ruler" ? "none" : "ruler")}
          >
            <Ruler className="h-3.5 w-3.5" />
            Calibrador (mm)
          </Button>

          <Button
            type="button"
            size="sm"
            variant={toolState.activeTool === "cobb" ? "default" : "outline"}
            className="h-8 text-xs flex items-center gap-1.5"
            onClick={() => onToolChange(toolState.activeTool === "cobb" ? "none" : "cobb")}
          >
            <Compass className="h-3.5 w-3.5" />
            Ángulo de Cobb
          </Button>

          <Button
            type="button"
            size="sm"
            variant={toolState.activeTool === "hu" ? "default" : "outline"}
            className="h-8 text-xs flex items-center gap-1.5"
            onClick={() => onToolChange(toolState.activeTool === "hu" ? "none" : "hu")}
          >
            <Activity className="h-3.5 w-3.5" />
            Densidad (HU)
          </Button>
        </div>
      </div>

      {/* Resultados de Medición Activa */}
      {toolState.activeTool !== "none" && (
        <div className="p-2.5 rounded-lg bg-card border border-primary/30 flex items-center justify-between text-xs animate-in fade-in">
          <div>
            <span className="font-semibold text-primary">
              {toolState.activeTool === "ruler" && "Medición de Longitud:"}
              {toolState.activeTool === "cobb" && "Ángulo de Cobb (Escoliosis):"}
              {toolState.activeTool === "hu" && "Densidad Hounsfield (ROI):"}
            </span>
            <div className="text-muted-foreground mt-0.5">
              {toolState.activeTool === "ruler" && "Distancia calibrada entre marcadores"}
              {toolState.activeTool === "cobb" && "Inclinación entre vértebras límite"}
              {toolState.activeTool === "hu" && "Coeficiente de atenuación radiológica"}
            </div>
          </div>
          <Badge variant="secondary" className="text-sm font-mono font-bold px-2.5 py-1">
            {toolState.activeTool === "ruler" && `${(toolState.measuredMm || 28.4).toFixed(1)} mm`}
            {toolState.activeTool === "cobb" && `${(toolState.cobbAngle || 18.5).toFixed(1)}°`}
            {toolState.activeTool === "hu" && `${(toolState.hounsfieldUnit || 45)} HU`}
          </Badge>
        </div>
      )}

      {/* Ventana y Nivel (WW / WL) */}
      <div className="space-y-2 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground/80">Ventana Radiológica (WW / WL)</Label>
          <Button variant="ghost" size="sm" onClick={onReset} className="h-6 px-1.5 text-[11px] text-muted-foreground">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-3 gap-1">
          {(Object.keys(PRESETS) as WindowPreset[]).map((key) => {
            const p = PRESETS[key];
            const isActive = toolState.windowPreset === key;
            return (
              <Button
                key={key}
                type="button"
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={`h-7 text-[11px] font-normal justify-start px-2 ${
                  isActive ? "border border-primary/40 font-semibold" : ""
                }`}
                onClick={() => {
                  onPresetChange(key);
                  onWindowChange(p.width, p.center);
                }}
              >
                {p.name}
              </Button>
            );
          })}
        </div>

        {/* Sliders Manuales de WW y WL */}
        <div className="space-y-2 pt-1">
          <div>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><Contrast className="h-3 w-3" /> Ancho de Ventana (WW)</span>
              <span className="font-mono">{toolState.windowWidth} HU</span>
            </div>
            <Slider
              min={10}
              max={3000}
              step={10}
              value={[toolState.windowWidth]}
              onValueChange={([val]) => onWindowChange(val, toolState.windowCenter)}
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span className="flex items-center gap-1"><SunMedium className="h-3 w-3" /> Nivel / Centro (WL)</span>
              <span className="font-mono">{toolState.windowCenter} HU</span>
            </div>
            <Slider
              min={-1000}
              max={1500}
              step={10}
              value={[toolState.windowCenter]}
              onValueChange={([val]) => onWindowChange(toolState.windowWidth, val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
