import { Navigate } from "react-router-dom";
import { useTabParam } from "@/hooks/useTabParam";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Dumbbell, CalendarDays, DollarSign, Calculator, Users, Building2, HeartHandshake, Sparkles } from "lucide-react";
import { formatCurrency, resolveCurrency } from "@/lib/currency";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import EvaluacionGoniometriaDaniels from "@/components/fisioterapia/EvaluacionGoniometriaDaniels";
import BoxesTerapiaFisicaBonos from "@/components/fisioterapia/BoxesTerapiaFisicaBonos";
import VerticalPersonalTab from "@/components/vertical/VerticalPersonalTab";
import VerticalCitasTab from "@/components/vertical/VerticalCitasTab";
import VerticalFacturacionTab from "@/components/vertical/VerticalFacturacionTab";
import VerticalNominaTab from "@/components/vertical/VerticalNominaTab";
import VerticalPacientesTab from "@/components/vertical/VerticalPacientesTab";
import VerticalFacturacionElectronicaTab from "@/components/vertical/VerticalFacturacionElectronicaTab";

export default function FisioterapiaPro() {
  const [tab] = useTabParam("");
  if (!tab) return <Navigate to="/dashboard" replace />;
  return <FisioterapiaProContent />;
}

function FisioterapiaProContent() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const fmt = (v: number) => formatCurrency(v, cur);
  const [tab, setTab] = useTabParam("goniometria");

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Fisioterapia & Kinesiología Pro"
        subtitle="Centros de rehabilitación, fisiatras independientes, kinesiología deportiva y terapia física integral"
        icon={Dumbbell}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="hidden">
          <TabsTrigger value="goniometria">Goniometría & Daniels</TabsTrigger>
          <TabsTrigger value="boxes_sesiones">Boxes & Paquetes</TabsTrigger>
          <TabsTrigger value="pacientes"><Users className="h-3.5 w-3.5 mr-1" />Pacientes</TabsTrigger>
          <TabsTrigger value="citas"><CalendarDays className="h-3.5 w-3.5 mr-1" />Citas</TabsTrigger>
          <TabsTrigger value="personal"><Users className="h-3.5 w-3.5 mr-1" />Terapeutas</TabsTrigger>
          <TabsTrigger value="facturacion"><DollarSign className="h-3.5 w-3.5 mr-1" />Facturación</TabsTrigger>
          <TabsTrigger value="nomina"><Calculator className="h-3.5 w-3.5 mr-1" />Nómina</TabsTrigger>
          <TabsTrigger value="ecf">e-CF / DGII</TabsTrigger>
        </TabsList>

        {/* GONIOMETRÍA, DANIELS & EVA */}
        <TabsContent value="goniometria" className="space-y-6 mt-4">
          <EvaluacionGoniometriaDaniels />
        </TabsContent>

        {/* BOXES DE TERAPIA Y PAQUETES */}
        <TabsContent value="boxes_sesiones" className="space-y-6 mt-4">
          <BoxesTerapiaFisicaBonos />
        </TabsContent>

        {/* TABS COMPARTIDAS */}
        <TabsContent value="pacientes" className="mt-4">
          <VerticalPacientesTab pacienteLabel="Pacientes de Terapia" />
        </TabsContent>

        <TabsContent value="citas" className="mt-4">
          <VerticalCitasTab citaLabel="Citas de Fisioterapia" />
        </TabsContent>

        <TabsContent value="personal" className="mt-4">
          <VerticalPersonalTab
            profesionalLabel="Fisioterapeutas / Kinesiólogos"
            especialidades={[
              "Fisioterapia deportiva",
              "Rehabilitación neurológica",
              "Terapia manual miofascial",
              "Punción seca",
              "Reeducación postural global (RPG)",
              "Fisioterapia respiratoria",
              "Fisioterapia traumatológica"
            ]}
          />
        </TabsContent>

        <TabsContent value="facturacion" className="mt-4">
          <VerticalFacturacionTab />
        </TabsContent>

        <TabsContent value="nomina" className="mt-4">
          <VerticalNominaTab />
        </TabsContent>

        <TabsContent value="ecf" className="mt-4">
          <VerticalFacturacionElectronicaTab verticalTipo="recovery" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
