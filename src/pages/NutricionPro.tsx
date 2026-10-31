import { useState } from "react";
import { Apple, Scale, Utensils, Activity, Flame, Users, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTabParam } from "@/hooks/useTabParam";
import { useModoOperativo } from "@/hooks/useModoOperativo";
import { BioimpedanciaMetabolismo } from "@/components/nutricion/BioimpedanciaMetabolismo";
import { PlanificadorMinutasDietas } from "@/components/nutricion/PlanificadorMinutasDietas";

export default function NutricionPro() {
  const [activeTab, setActiveTab] = useTabParam("tab", "bioimpedancia");
  const { esModoClinica } = useModoOperativo();

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Principal de la Vertical */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
              <Apple className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Nutrición Clínica & Bariatría Pro
                </h1>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                  {esModoClinica ? "Policlínica / Centro" : "Consulta Independiente"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bioimpedancia segmental, cálculo BMR/TDEE con fórmula Mifflin-St Jeor y minutas de dieta personalizadas.
              </p>
            </div>
          </div>
        </div>

        {/* Resumen KPIs Operativos */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-card border border-border/70 text-right">
            <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <Scale className="h-3 w-3 text-emerald-600" /> Pacientes en Seguimiento
            </div>
            <div className="text-sm font-bold text-foreground">24 Activos</div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-card border border-border/70 text-right">
            <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <Flame className="h-3 w-3 text-amber-600" /> Adherencia Global
            </div>
            <div className="text-sm font-bold text-emerald-600">89.4%</div>
          </div>
        </div>
      </div>

      {/* Tabs Principales Sincronizadas con URL */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 border border-border/60 h-auto grid grid-cols-2 max-w-md">
          <TabsTrigger
            value="bioimpedancia"
            className="text-xs sm:text-sm py-2 gap-2 data-[state=active]:bg-background data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm"
          >
            <Scale className="h-4 w-4" />
            Bioimpedancia & Macros
          </TabsTrigger>

          <TabsTrigger
            value="planificador"
            className="text-xs sm:text-sm py-2 gap-2 data-[state=active]:bg-background data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm"
          >
            <Utensils className="h-4 w-4" />
            Minutas & Dietética
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bioimpedancia" className="m-0 focus-visible:outline-none">
          <BioimpedanciaMetabolismo />
        </TabsContent>

        <TabsContent value="planificador" className="m-0 focus-visible:outline-none">
          <PlanificadorMinutasDietas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
