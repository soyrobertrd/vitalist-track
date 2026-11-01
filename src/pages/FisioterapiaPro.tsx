import { useTabParam } from "@/hooks/useTabParam";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useModoOperativo } from "@/hooks/useModoOperativo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dumbbell,
  Activity,
  Crosshair,
  Building2,
  Users,
  CalendarDays,
  DollarSign,
  FileText,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatCurrency, resolveCurrency } from "@/lib/currency";
import EvaluacionGoniometriaDaniels from "@/components/fisioterapia/EvaluacionGoniometriaDaniels";
import BoxesTerapiaFisicaBonos from "@/components/fisioterapia/BoxesTerapiaFisicaBonos";
import PrescripcionEjerciciosHEP from "@/components/fisioterapia/PrescripcionEjerciciosHEP";
import MapaPuntosGatilloMiofascial from "@/components/fisioterapia/MapaPuntosGatilloMiofascial";
import VerticalPersonalTab from "@/components/vertical/VerticalPersonalTab";
import VerticalCitasTab from "@/components/vertical/VerticalCitasTab";
import VerticalFacturacionTab from "@/components/vertical/VerticalFacturacionTab";
import VerticalNominaTab from "@/components/vertical/VerticalNominaTab";
import VerticalPacientesTab from "@/components/vertical/VerticalPacientesTab";
import VerticalFacturacionElectronicaTab from "@/components/vertical/VerticalFacturacionElectronicaTab";

export default function FisioterapiaPro() {
  const [tab, setTab] = useTabParam("goniometria");
  const { currentWorkspace } = useWorkspace();
  const { isCentro: esModoClinica } = useModoOperativo();
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Principal de Fisioterapia & Rehabilitación */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-500/20 shadow-sm">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Fisioterapia & Kinesiología Pro
                </h1>
                <Badge variant="outline" className="bg-teal-500/10 text-teal-700 border-teal-500/30 text-xs">
                  {esModoClinica ? "Policlínica / Centro de Rehabilitación" : "Gabinete Fisioterapéutico"}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Goniometría, balance muscular Daniels, programas de ejercicio domiciliario (HEP) y punción seca.
              </p>
            </div>
          </div>
        </div>

        {/* KPIs Rápidos de Rehabilitación */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-card border border-border/70 text-right">
            <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <Activity className="h-3 w-3 text-teal-600" /> Pacientes en Terapia
            </div>
            <div className="text-sm font-bold text-foreground">18 Activos</div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-card border border-border/70 text-right">
            <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <Building2 className="h-3 w-3 text-amber-600" /> Boxes / Gimnasio
            </div>
            <div className="text-sm font-bold text-amber-600">4 de 6 en uso</div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-card border border-border/70 text-right">
            <div className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Adherencia EVA
            </div>
            <div className="text-sm font-bold text-emerald-600">92%</div>
          </div>
        </div>
      </div>

      {/* Tabs Principales de Navegación Clínica */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-muted/60 p-1 border border-border/60 h-auto inline-flex flex-wrap gap-1 rounded-2xl">
            <TabsTrigger
              value="goniometria"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Activity className="h-3.5 w-3.5" />
              Goniometría & Daniels
            </TabsTrigger>

            <TabsTrigger
              value="ejercicios_hep"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Dumbbell className="h-3.5 w-3.5" />
              Ejercicios HEP
            </TabsTrigger>

            <TabsTrigger
              value="puntos_gatillo"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Crosshair className="h-3.5 w-3.5" />
              Puntos Gatillo & Punción
            </TabsTrigger>

            <TabsTrigger
              value="boxes_sesiones"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Building2 className="h-3.5 w-3.5" />
              Boxes & Paquetes
            </TabsTrigger>

            <TabsTrigger
              value="pacientes"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Users className="h-3.5 w-3.5" />
              Pacientes
            </TabsTrigger>

            <TabsTrigger
              value="citas"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Citas & Agenda
            </TabsTrigger>

            <TabsTrigger
              value="personal"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Users className="h-3.5 w-3.5" />
              Terapeutas
            </TabsTrigger>

            <TabsTrigger
              value="facturacion"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Facturación
            </TabsTrigger>

            <TabsTrigger
              value="nomina"
              className="text-xs py-2 px-3 gap-1.5 rounded-xl data-[state=active]:bg-background data-[state=active]:text-teal-700 data-[state=active]:shadow-sm font-semibold"
            >
              <Calculator className="h-3.5 w-3.5" />
              Nómina
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. GONIOMETRÍA, ESCALA DANIELS & EVA */}
        <TabsContent value="goniometria" className="space-y-6 m-0 focus-visible:outline-none">
          <EvaluacionGoniometriaDaniels />
        </TabsContent>

        {/* 2. PROGRAMA DE EJERCICIOS DOMICILIARIOS (HEP) */}
        <TabsContent value="ejercicios_hep" className="space-y-6 m-0 focus-visible:outline-none">
          <PrescripcionEjerciciosHEP />
        </TabsContent>

        {/* 3. PUNTOS GATILLO MIOFASCIALES & PUNCIÓN SECA */}
        <TabsContent value="puntos_gatillo" className="space-y-6 m-0 focus-visible:outline-none">
          <MapaPuntosGatilloMiofascial />
        </TabsContent>

        {/* 4. BOXES DE TERAPIA Y BONOS DE SESIONES */}
        <TabsContent value="boxes_sesiones" className="space-y-6 m-0 focus-visible:outline-none">
          <BoxesTerapiaFisicaBonos />
        </TabsContent>

        {/* 5. PACIENTES */}
        <TabsContent value="pacientes" className="m-0 focus-visible:outline-none">
          <VerticalPacientesTab pacienteLabel="Pacientes de Terapia Física" />
        </TabsContent>

        {/* 6. CITAS */}
        <TabsContent value="citas" className="m-0 focus-visible:outline-none">
          <VerticalCitasTab citaLabel="Citas de Fisioterapia" />
        </TabsContent>

        {/* 7. TERAPEUTAS Y PERSONAL */}
        <TabsContent value="personal" className="m-0 focus-visible:outline-none">
          <VerticalPersonalTab
            profesionalLabel="Fisioterapeutas / Kinesiólogos"
            especialidades={[
              "Fisioterapia deportiva",
              "Rehabilitación neurológica",
              "Terapia manual miofascial",
              "Punción seca",
              "Reeducación postural global (RPG)",
              "Fisioterapia respiratoria",
              "Fisioterapia traumatológica",
            ]}
          />
        </TabsContent>

        {/* 8. FACTURACIÓN */}
        <TabsContent value="facturacion" className="m-0 focus-visible:outline-none">
          <VerticalFacturacionTab />
        </TabsContent>

        {/* 9. NÓMINA */}
        <TabsContent value="nomina" className="m-0 focus-visible:outline-none">
          <VerticalNominaTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
