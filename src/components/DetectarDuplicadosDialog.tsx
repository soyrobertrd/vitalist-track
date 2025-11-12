import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, Search, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DuplicateGroup {
  criterion: string;
  patients: any[];
}

export const DetectarDuplicadosDialog = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [manualSearch, setManualSearch] = useState("");
  const [manualResults, setManualResults] = useState<any[]>([]);

  const detectarAutomatico = async () => {
    setLoading(true);
    try {
      const { data: pacientes, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("status_px", "activo");

      if (error) throw error;
      if (!pacientes) return;

      const duplicateGroups: DuplicateGroup[] = [];

      // Detectar por nombre completo
      const byName = new Map<string, any[]>();
      pacientes.forEach(p => {
        const key = `${p.nombre} ${p.apellido}`.toLowerCase().trim();
        if (!byName.has(key)) byName.set(key, []);
        byName.get(key)!.push(p);
      });

      byName.forEach((patients, key) => {
        if (patients.length > 1) {
          duplicateGroups.push({
            criterion: `Nombre completo: ${key}`,
            patients
          });
        }
      });

      // Detectar por cédula
      const byCedula = new Map<string, any[]>();
      pacientes.forEach(p => {
        if (p.cedula && p.cedula.trim()) {
          const key = p.cedula.trim();
          if (!byCedula.has(key)) byCedula.set(key, []);
          byCedula.get(key)!.push(p);
        }
      });

      byCedula.forEach((patients, key) => {
        if (patients.length > 1) {
          duplicateGroups.push({
            criterion: `Cédula: ${key}`,
            patients
          });
        }
      });

      // Detectar por teléfono
      const sanitizePhone = (phone: string) => phone?.replace(/\D/g, '') || '';
      const byPhone = new Map<string, any[]>();
      
      pacientes.forEach(p => {
        const phones = [
          sanitizePhone(p.contacto_px),
          sanitizePhone(p.contacto_cuidador)
        ].filter(ph => ph.length >= 10);

        phones.forEach(phone => {
          if (!byPhone.has(phone)) byPhone.set(phone, []);
          const existing = byPhone.get(phone)!;
          if (!existing.find(ep => ep.id === p.id)) {
            existing.push(p);
          }
        });
      });

      byPhone.forEach((patients, key) => {
        if (patients.length > 1) {
          duplicateGroups.push({
            criterion: `Teléfono: ${key}`,
            patients
          });
        }
      });

      setDuplicates(duplicateGroups);
      
      if (duplicateGroups.length === 0) {
        toast.success("No se encontraron pacientes duplicados");
      } else {
        toast.info(`Se encontraron ${duplicateGroups.length} grupos de posibles duplicados`);
      }
    } catch (error: any) {
      console.error("Error al detectar duplicados:", error);
      toast.error("Error al detectar duplicados");
    } finally {
      setLoading(false);
    }
  };

  const buscarManual = async () => {
    if (!manualSearch.trim()) {
      toast.error("Ingrese un criterio de búsqueda");
      return;
    }

    setLoading(true);
    try {
      const searchTerm = `%${manualSearch.trim()}%`;
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("status_px", "activo")
        .or(`nombre.ilike.${searchTerm},apellido.ilike.${searchTerm},cedula.ilike.${searchTerm},contacto_px.ilike.${searchTerm},contacto_cuidador.ilike.${searchTerm}`);

      if (error) throw error;

      setManualResults(data || []);
      
      if (!data || data.length === 0) {
        toast.info("No se encontraron pacientes con ese criterio");
      } else if (data.length === 1) {
        toast.info("Se encontró 1 paciente");
      } else {
        toast.info(`Se encontraron ${data.length} pacientes similares`);
      }
    } catch (error: any) {
      console.error("Error en búsqueda manual:", error);
      toast.error("Error al buscar pacientes");
    } finally {
      setLoading(false);
    }
  };

  const renderPacienteCard = (paciente: any) => (
    <Card key={paciente.id} className="mb-3">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {paciente.nombre} {paciente.apellido}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium text-muted-foreground">Cédula:</span>
            <p>{paciente.cedula || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Zona:</span>
            <p>{paciente.zona || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Tel. Paciente:</span>
            <p>{paciente.contacto_px || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Tel. Cuidador:</span>
            <p>{paciente.contacto_cuidador || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Barrio:</span>
            <p>{paciente.barrio || "N/A"}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Creado:</span>
            <p>{new Date(paciente.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserX className="mr-2 h-4 w-4" />
          Detectar Duplicados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Detectar Pacientes Duplicados
          </DialogTitle>
          <DialogDescription>
            Busque pacientes duplicados automáticamente o manualmente usando diferentes criterios
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="automatico" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="automatico">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Detección Automática
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Search className="mr-2 h-4 w-4" />
              Búsqueda Manual
            </TabsTrigger>
          </TabsList>

          {/* Detección Automática */}
          <TabsContent value="automatico" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={detectarAutomatico} disabled={loading}>
                {loading ? "Analizando..." : "Detectar Duplicados"}
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Criterios de detección:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Mismo nombre completo (Nombre + Apellido)</li>
                <li>• Misma cédula</li>
                <li>• Mismo número de teléfono (paciente o cuidador)</li>
              </ul>
            </div>

            {duplicates.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {duplicates.length} Grupos de Duplicados Encontrados
                  </h3>
                  <Badge variant="destructive">
                    {duplicates.reduce((acc, g) => acc + g.patients.length, 0)} pacientes afectados
                  </Badge>
                </div>

                {duplicates.map((group, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        {group.criterion}
                        <Badge>{group.patients.length} pacientes</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        {group.patients.map(renderPacienteCard)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {duplicates.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Haga clic en "Detectar Duplicados" para comenzar el análisis</p>
              </div>
            )}
          </TabsContent>

          {/* Búsqueda Manual */}
          <TabsContent value="manual" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nombre, apellido, cédula o teléfono..."
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarManual()}
              />
              <Button onClick={buscarManual} disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>

            {manualResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {manualResults.length} Pacientes Encontrados
                  </h3>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Zona</TableHead>
                      <TableHead>Barrio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualResults.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.nombre} {p.apellido}
                        </TableCell>
                        <TableCell>{p.cedula || "N/A"}</TableCell>
                        <TableCell>
                          {p.contacto_px || p.contacto_cuidador || "N/A"}
                        </TableCell>
                        <TableCell>{p.zona || "N/A"}</TableCell>
                        <TableCell>{p.barrio || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {manualResults.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Ingrese un criterio de búsqueda para encontrar pacientes similares</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
