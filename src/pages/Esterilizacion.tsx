import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Package, Activity, ShieldCheck } from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { TrazabilidadCajasTab } from "@/components/esterilizacion/TrazabilidadCajasTab";
import { ControlCalidadAutoclaveTab } from "@/components/esterilizacion/ControlCalidadAutoclaveTab";

export default function Esterilizacion() {
  const [tab, setTab] = useState("trazabilidad");

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      <ClinicalPageHeader
        title="Central de Esterilización & RUMED (CEYE)"
        subtitle="Trazabilidad integral de instrumental quirúrgico, validación biológica de autoclaves y empaque con testigos clase 5/6"
        badge="CEYE & RUMED"
        icon={Sparkles}
      />

      {/* KPI Cards de Esterilización */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Cajas Estériles en Almacén"
          value="48 Cajas"
          subtitle="Listas para uso inmediato"
          icon={Package}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Cajas en Quirófano"
          value="12 Cajas"
          subtitle="En intervenciones activas"
          icon={Activity}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Autoclaves Validados"
          value="100%"
          subtitle="Bowie-Dick y Esporas OK"
          icon={ShieldCheck}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Instrumental en Zona Roja"
          value="6 Cajas"
          subtitle="En lavado y descontaminación"
          icon={Sparkles}
          variant="primary"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="trazabilidad" className="gap-1.5">
            <Package className="h-4 w-4" /> Trazabilidad de Cajas e Instrumental
          </TabsTrigger>
          <TabsTrigger value="calidad" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Control de Autoclaves & Esporas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trazabilidad" className="space-y-4 pt-2">
          <TrazabilidadCajasTab />
        </TabsContent>

        <TabsContent value="calidad" className="space-y-4 pt-2">
          <ControlCalidadAutoclaveTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
