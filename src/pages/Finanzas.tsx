import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  RotateCcw,
  Building2,
  ClipboardCheck,
  FileText,
  ListChecks,
  TrendingUp,
  Receipt,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CierreCaja } from "@/components/cobros/CierreCaja";
import { NotasCredito } from "@/components/cobros/NotasCredito";
import { AseguradorasManager } from "@/components/ars/AseguradorasManager";
import { AutorizacionesManager } from "@/components/ars/AutorizacionesManager";
import { ReclamacionesManager } from "@/components/ars/ReclamacionesManager";
import { TarifariosManager } from "@/components/ars/TarifariosManager";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";

const TAB_TITLES: Record<string, { title: string; description: string }> = {
  caja: { title: "Caja & Arqueos", description: "Cierres diarios de caja, movimientos y arqueo de turnos" },
  devoluciones: { title: "Notas de Crédito", description: "Gestión de devoluciones, anulaciones y notas de crédito fiscales" },
  aseguradoras: { title: "Aseguradoras (ARS)", description: "Catálogo de aseguradoras y planes de salud afiliados" },
  tarifarios: { title: "Tarifarios ARS", description: "Precios y coberturas contratadas por procedimiento" },
  autorizaciones: { title: "Autorizaciones ARS", description: "Gestión de solicitudes de cobertura y pre-autorizaciones" },
  reclamaciones: { title: "Reclamaciones Médicas", description: "Lotes de reclamación, auditoría y radicación a aseguradoras" },
};

export default function Finanzas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get("tab") || "caja";
  const meta = TAB_TITLES[tab] || TAB_TITLES.caja;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Tesorería, Cobros & Gestión ARS"
        subtitle={meta.description}
        icon={DollarSign}
        badge="Finanzas Clínicas"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/comisiones-empleados")}
              className="rounded-xl border-border/80 text-xs gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" /> Liquidación Honorarios
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/forecast-ingresos")}
              className="rounded-xl border-border/80 text-xs gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Forecast Ingresos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/ar-aging")}
              className="rounded-xl border-border/80 text-xs gap-1.5"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-600" /> Cartera AR Aging
            </Button>
          </div>
        }
      />

      {/* Navegación por Pestañas */}
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", v);
          setSearchParams(next, { replace: true });
        }}
        className="w-full space-y-4"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="bg-card border border-border/80 rounded-xl p-1 h-auto flex flex-nowrap sm:flex-wrap gap-1 min-w-max sm:min-w-0">
            <TabsTrigger value="caja" className="rounded-lg text-xs gap-1.5 py-1.5">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Caja & Arqueo
            </TabsTrigger>
            <TabsTrigger value="devoluciones" className="rounded-lg text-xs gap-1.5 py-1.5">
              <RotateCcw className="h-3.5 w-3.5 text-amber-600" /> Notas de Crédito
            </TabsTrigger>
            <TabsTrigger value="aseguradoras" className="rounded-lg text-xs gap-1.5 py-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-600" /> Aseguradoras (ARS)
            </TabsTrigger>
            <TabsTrigger value="tarifarios" className="rounded-lg text-xs gap-1.5 py-1.5">
              <ListChecks className="h-3.5 w-3.5 text-purple-600" /> Tarifarios
            </TabsTrigger>
            <TabsTrigger value="autorizaciones" className="rounded-lg text-xs gap-1.5 py-1.5">
              <ClipboardCheck className="h-3.5 w-3.5 text-teal-600" /> Autorizaciones
            </TabsTrigger>
            <TabsTrigger value="reclamaciones" className="rounded-lg text-xs gap-1.5 py-1.5">
              <FileText className="h-3.5 w-3.5 text-rose-600" /> Reclamaciones
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="caja" className="mt-0">
          <CierreCaja />
        </TabsContent>
        <TabsContent value="devoluciones" className="mt-0">
          <NotasCredito />
        </TabsContent>
        <TabsContent value="aseguradoras" className="mt-0">
          <AseguradorasManager />
        </TabsContent>
        <TabsContent value="tarifarios" className="mt-0">
          <TarifariosManager />
        </TabsContent>
        <TabsContent value="autorizaciones" className="mt-0">
          <AutorizacionesManager />
        </TabsContent>
        <TabsContent value="reclamaciones" className="mt-0">
          <ReclamacionesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

