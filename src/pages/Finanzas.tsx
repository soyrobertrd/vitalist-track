import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, RotateCcw, Building2, ClipboardCheck, FileText, ListChecks } from "lucide-react";
import { MobilePageHeader } from "@/components/MobilePageHeader";
import { CierreCaja } from "@/components/cobros/CierreCaja";
import { NotasCredito } from "@/components/cobros/NotasCredito";
import { AseguradorasManager } from "@/components/ars/AseguradorasManager";
import { AutorizacionesManager } from "@/components/ars/AutorizacionesManager";
import { ReclamacionesManager } from "@/components/ars/ReclamacionesManager";
import { TarifariosManager } from "@/components/ars/TarifariosManager";
import { useSearchParams } from "react-router-dom";

const TAB_TITLES: Record<string, { title: string; description: string }> = {
  caja: { title: "Caja", description: "Cierres diarios y arqueo" },
  devoluciones: { title: "Notas de crédito", description: "Devoluciones y ajustes" },
  aseguradoras: { title: "Aseguradoras (ARS)", description: "Catálogo de ARS y planes" },
  tarifarios: { title: "Tarifarios ARS", description: "Precios por procedimiento y ARS" },
  autorizaciones: { title: "Autorizaciones", description: "Solicitudes y aprobaciones de ARS" },
  reclamaciones: { title: "Reclamaciones", description: "Lotes de reclamación a ARS" },
};

export default function Finanzas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "caja";
  const meta = TAB_TITLES[tab] || TAB_TITLES.caja;

  return (
    <div className="space-y-6">
      <MobilePageHeader
        title={meta.title}
        description={meta.description}
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", v);
          setSearchParams(next, { replace: true });
        }}
        className="w-full"
      >
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="caja" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" /> Caja
          </TabsTrigger>
          <TabsTrigger value="devoluciones" className="flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4" /> Notas Crédito
          </TabsTrigger>
          <TabsTrigger value="aseguradoras" className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" /> ARS
          </TabsTrigger>
          <TabsTrigger value="tarifarios" className="flex items-center gap-1.5">
            <ListChecks className="h-4 w-4" /> Tarifarios
          </TabsTrigger>
          <TabsTrigger value="autorizaciones" className="flex items-center gap-1.5">
            <ClipboardCheck className="h-4 w-4" /> Autorizaciones
          </TabsTrigger>
          <TabsTrigger value="reclamaciones" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> Reclamaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="caja" className="mt-4"><CierreCaja /></TabsContent>
        <TabsContent value="devoluciones" className="mt-4"><NotasCredito /></TabsContent>
        <TabsContent value="aseguradoras" className="mt-4"><AseguradorasManager /></TabsContent>
        <TabsContent value="tarifarios" className="mt-4"><TarifariosManager /></TabsContent>
        <TabsContent value="autorizaciones" className="mt-4"><AutorizacionesManager /></TabsContent>
        <TabsContent value="reclamaciones" className="mt-4"><ReclamacionesManager /></TabsContent>
      </Tabs>
    </div>
  );
}
