import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, RotateCcw } from "lucide-react";
import { MobilePageHeader } from "@/components/MobilePageHeader";
import { CierreCaja } from "@/components/cobros/CierreCaja";
import { NotasCredito } from "@/components/cobros/NotasCredito";

export default function Finanzas() {
  return (
    <div className="space-y-6">
      <MobilePageHeader
        title="Finanzas"
        description="Cierre de caja y devoluciones"
      />

      <Tabs defaultValue="caja" className="w-full">
        <TabsList>
          <TabsTrigger value="caja" className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" /> Cierre de Caja
          </TabsTrigger>
          <TabsTrigger value="devoluciones" className="flex items-center gap-1.5">
            <RotateCcw className="h-4 w-4" /> Notas de Crédito
          </TabsTrigger>
        </TabsList>

        <TabsContent value="caja" className="mt-4">
          <CierreCaja />
        </TabsContent>

        <TabsContent value="devoluciones" className="mt-4">
          <NotasCredito />
        </TabsContent>
      </Tabs>
    </div>
  );
}
