import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Stethoscope } from "lucide-react";

export default function CatalogosClinicos() {
  const [cie10, setCie10] = useState<any[]>([]);
  const [cpt, setCpt] = useState<any[]>([]);
  const [qCie, setQCie] = useState("");
  const [qCpt, setQCpt] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: a }, { data: b }] = await Promise.all([
        (supabase as any).from("catalogo_cie10").select("*").eq("activo", true).order("codigo").limit(500),
        (supabase as any).from("catalogo_cpt").select("*").eq("activo", true).order("codigo").limit(500),
      ]);
      setCie10(a || []);
      setCpt(b || []);
    })();
  }, []);

  const cieFilt = cie10.filter(x => !qCie || x.codigo.toLowerCase().includes(qCie.toLowerCase()) || x.descripcion.toLowerCase().includes(qCie.toLowerCase()));
  const cptFilt = cpt.filter(x => !qCpt || x.codigo.toLowerCase().includes(qCpt.toLowerCase()) || x.descripcion.toLowerCase().includes(qCpt.toLowerCase()));

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" /> Catálogos Clínicos
        </h1>
        <p className="text-sm text-muted-foreground">Codificación estandarizada CIE-10 y CPT</p>
      </div>

      <Tabs defaultValue="cie10">
        <TabsList>
          <TabsTrigger value="cie10">CIE-10 ({cie10.length})</TabsTrigger>
          <TabsTrigger value="cpt">CPT ({cpt.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="cie10" className="space-y-3">
          <Input placeholder="Buscar diagnóstico..." value={qCie} onChange={e => setQCie(e.target.value)} className="max-w-md" />
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descripción</TableHead><TableHead>Categoría</TableHead><TableHead>Capítulo</TableHead></TableRow></TableHeader>
              <TableBody>
                {cieFilt.map(x => (
                  <TableRow key={x.codigo}>
                    <TableCell className="font-mono"><Badge variant="outline">{x.codigo}</Badge></TableCell>
                    <TableCell>{x.descripcion}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{x.categoria}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{x.capitulo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="cpt" className="space-y-3">
          <Input placeholder="Buscar procedimiento..." value={qCpt} onChange={e => setQCpt(e.target.value)} className="max-w-md" />
          <Card>
            <Table>
              <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Descripción</TableHead><TableHead>Categoría</TableHead><TableHead className="text-right">Tarifa</TableHead></TableRow></TableHeader>
              <TableBody>
                {cptFilt.map(x => (
                  <TableRow key={x.codigo}>
                    <TableCell className="font-mono"><Badge variant="outline"><Stethoscope className="h-3 w-3 mr-1" />{x.codigo}</Badge></TableCell>
                    <TableCell>{x.descripcion}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{x.categoria}</TableCell>
                    <TableCell className="text-right font-mono">${Number(x.tarifa_referencia || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
