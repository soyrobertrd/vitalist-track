import { useState } from "react";
import {
  Apple,
  Scale,
  Utensils,
  Activity,
  Flame,
  Users,
  CalendarDays,
  DollarSign,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTabParam } from "@/hooks/useTabParam";
import { useModoOperativo } from "@/hooks/useModoOperativo";
import { BioimpedanciaMetabolismo } from "@/components/nutricion/BioimpedanciaMetabolismo";
import { PlanificadorMinutasDietas } from "@/components/nutricion/PlanificadorMinutasDietas";
import SeguimientoBariatricoEWL from "@/components/nutricion/SeguimientoBariatricoEWL";
import AntropometriaPlieguesISAK from "@/components/nutricion/AntropometriaPlieguesISAK";
import VerticalPersonalTab from "@/components/vertical/VerticalPersonalTab";
import VerticalCitasTab from "@/components/vertical/VerticalCitasTab";
import VerticalFacturacionTab from "@/components/vertical/VerticalFacturacionTab";
import VerticalPacientesTab from "@/components/vertical/VerticalPacientesTab";

export default function NutricionPro() {
  const [activeTab, setActiveTab] = useTabParam("bioimpedancia");
  const { isCentro: esModoClinica } = useModoOperativo();

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Principal de Nutrición & Bariatría */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-sm">
              <Apple className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Nutrición Clínica & Bariatría Pro
                </h1>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                  {esModoClinica ? "Policlínica / Centro Metabólico" : "Consulta Privada de Nutrición"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bioimpedancia segmental, pliegues ISAK, dietoterapia por fases y seguimiento bariátrico (% EWL).
              </p>
            </div>
          </div>
        </div>

        {/* Resumen KPIs Operativos */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-card border border-border/70 text-right">
            <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <Scale className="h-3 w-3 text-emerald-600" /> Pacientes en Seguimiento
            </div>
            <div className="text-sm font-bold text-foreground">24 Activos</div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-card border border-border/70 text-right">
            <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <HeartPulse className="h-3 w-3 text-purple-600" /> Casos Bariátricos
            </div>
            <div className="text-sm font-bold text-purple-600">8 en Fase 1-4</div>
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
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-muted/60 p-1 border border-border/60 h-auto inline-flex flex-wrap gap-1 rounded-2xl">
            <TabsTrigger
              value="bioimpedancia"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Scale className="h-3.5 w-3.5" />
              Bioimpedancia & Macros
            </TabsTrigger>

            <TabsTrigger
              value="antropometria_isak"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Activity className="h-3.5 w-3.5" />
              Pliegues ISAK & Perímetros
            </TabsTrigger>

            <TabsTrigger
              value="planificador"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Utensils className="h-3.5 w-3.5" />
              Minutas & Dietética
            </TabsTrigger>

            <TabsTrigger
              value="bariatria"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold"
            >
              <HeartPulse className="h-3.5 w-3.5" />
              Protocolo Bariátrico (% EWL)
            </TabsTrigger>

            <TabsTrigger
              value="pacientes"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Users className="h-3.5 w-3.5" />
              Pacientes
            </TabsTrigger>

            <TabsTrigger
              value="citas"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Citas & Agenda
            </TabsTrigger>

            <TabsTrigger
              value="personal"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Users className="h-3.5 w-3.5" />
              Nutricionistas
            </TabsTrigger>

            <TabsTrigger
              value="facturacion"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Facturación & Planes
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. BIOIMPEDANCIA & MACROS */}
        <TabsContent value="bioimpedancia" className="m-0 focus-visible:outline-none">
          <BioimpedanciaMetabolismo />
        </TabsContent>

        {/* 2. ANTROPOMETRÍA ISAK */}
        <TabsContent value="antropometria_isak" className="m-0 focus-visible:outline-none">
          <AntropometriaPlieguesISAK />
        </TabsContent>

        {/* 3. MINUTAS & DIETÉTICA */}
        <TabsContent value="planificador" className="m-0 focus-visible:outline-none">
          <PlanificadorMinutasDietas />
        </TabsContent>

        {/* 4. PROTOCOLO BARIÁTRICO */}
        <TabsContent value="bariatria" className="m-0 focus-visible:outline-none">
          <SeguimientoBariatricoEWL />
        </TabsContent>

        {/* 5. PACIENTES */}
        <TabsContent value="pacientes" className="m-0 focus-visible:outline-none">
          <VerticalPacientesTab pacienteLabel="Pacientes de Nutrición & Dietética" />
        </TabsContent>

        {/* 6. CITAS */}
        <TabsContent value="citas" className="m-0 focus-visible:outline-none">
          <VerticalCitasTab citaLabel="Citas de Nutrición" />
        </TabsContent>

        {/* 7. NUTRICIONISTAS & PERSONAL */}
        <TabsContent value="personal" className="m-0 focus-visible:outline-none">
          <VerticalPersonalTab
            profesionalLabel="Nutricionistas / Dietistas Clínicos"
            especialidades={[
              "Nutrición clínica",
              "Nutrición bariátrica",
              "Nutrición deportiva",
              "Nutrición pediátrica",
              "Enfermedad renal crónica y diabetes",
              "Trastornos de la conducta alimentaria (TCA)",
            ]}
          />
        </TabsContent>

        {/* 8. FACTURACIÓN */}
        <TabsContent value="facturacion" className="m-0 focus-visible:outline-none">
          <VerticalFacturacionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
