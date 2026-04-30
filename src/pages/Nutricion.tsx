import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Apple, Scale, UtensilsCrossed, ClipboardList } from "lucide-react";

const TIPOS_DIETA = [
  "normal","blanda","liquida","hipocalorica","hipercalorica","hiposodica",
  "diabetica","renal","hepatica","sin_gluten","sin_lactosa","parenteral","enteral"
];

const DIAGNOSTICOS_NUT = [
  "desnutricion_severa","desnutricion_moderada","desnutricion_leve","normal",
  "sobrepeso","obesidad_i","obesidad_ii","obesidad_iii"
];

const Nutricion = () => {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("evaluaciones");
  const [showNewEval, setShowNewEval] = useState(false);
  const [showNewDieta, setShowNewDieta] = useState(false);
  const [searchPac, setSearchPac] = useState("");

  const { data: evaluaciones } = useQuery({
    queryKey: ["eval-nutri", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await supabase.from("evaluaciones_nutricionales")
        .select("*, pacientes(nombre, apellido)")
        .eq("workspace_id", currentWorkspace.id)
        .order("fecha", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  const { data: dietas } = useQuery({
    queryKey: ["dietas-hosp", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data } = await supabase.from("dietas_hospitalarias")
        .select("*, pacientes(nombre, apellido)")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!currentWorkspace?.id,
  });

  const activas = (dietas || []).filter(d => d.estado === "activa").length;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Nutrición y Dietética</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><Scale className="h-6 w-6 mx-auto text-primary" /><p className="text-2xl font-bold">{(evaluaciones || []).length}</p><p className="text-xs text-muted-foreground">Evaluaciones</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><UtensilsCrossed className="h-6 w-6 mx-auto text-green-500" /><p className="text-2xl font-bold">{activas}</p><p className="text-xs text-muted-foreground">Dietas activas</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><Apple className="h-6 w-6 mx-auto text-red-500" /><p className="text-2xl font-bold">{(dietas || []).length}</p><p className="text-xs text-muted-foreground">Total dietas</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
          <TabsTrigger value="dietas">Dietas Hospitalarias</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluaciones">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Paciente</TableHead><TableHead>Fecha</TableHead><TableHead>Peso</TableHead><TableHead>Talla</TableHead><TableHead>IMC</TableHead><TableHead>Diagnóstico</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(evaluaciones || []).map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.pacientes?.nombre} {e.pacientes?.apellido}</TableCell>
                      <TableCell>{new Date(e.fecha + "T12:00:00").toLocaleDateString()}</TableCell>
                      <TableCell>{e.peso_kg ? `${e.peso_kg} kg` : "—"}</TableCell>
                      <TableCell>{e.talla_cm ? `${e.talla_cm} cm` : "—"}</TableCell>
                      <TableCell className="font-bold">{e.imc || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{(e.diagnostico_nutricional || "—").replace(/_/g, " ")}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dietas">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Paciente</TableHead><TableHead>Tipo</TableHead><TableHead>Calorías</TableHead><TableHead>Estado</TableHead><TableHead>Inicio</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(dietas || []).map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.pacientes?.nombre} {d.pacientes?.apellido}</TableCell>
                      <TableCell><Badge variant="outline">{(d.tipo_dieta || "").replace(/_/g, " ")}</Badge></TableCell>
                      <TableCell>{d.calorias_objetivo ? `${d.calorias_objetivo} kcal` : "—"}</TableCell>
                      <TableCell><Badge variant={d.estado === "activa" ? "default" : "secondary"}>{d.estado}</Badge></TableCell>
                      <TableCell>{new Date(d.fecha_inicio + "T12:00:00").toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Nutricion;
