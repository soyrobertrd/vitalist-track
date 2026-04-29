import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ShieldOff, PlayCircle, EyeOff, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Candidato {
  paciente_id: string;
  nombre_completo: string;
  ultima_actividad: string;
  meses_inactivo: number;
  motivo: string;
}

export default function PanelRetencion() {
  const { currentWorkspace } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [ejecutando, setEjecutando] = useState(false);
  const [confirmar, setConfirmar] = useState<Candidato | null>(null);
  const [confirmarMasivo, setConfirmarMasivo] = useState(false);

  const cargar = async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("listar_pacientes_para_anonimizar", {
        _workspace_id: currentWorkspace.id,
      });
      if (error) throw error;
      setCandidatos((data ?? []) as Candidato[]);
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  const anonimizarUno = async (c: Candidato) => {
    try {
      const { data, error } = await (supabase as any).rpc("anonimizar_paciente_seguro", {
        _paciente_id: c.paciente_id,
        _motivo: "Anonimización manual desde panel",
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Falló");
      toast.success(`Paciente ${c.nombre_completo} anonimizado`);
      setConfirmar(null);
      cargar();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    }
  };

  const ejecutarPolitica = async (dryRun: boolean) => {
    if (!currentWorkspace?.id) return;
    setEjecutando(true);
    try {
      const { data, error } = await (supabase as any).rpc("aplicar_politica_retencion", {
        _workspace_id: currentWorkspace.id,
        _dry_run: dryRun,
      });
      if (error) throw error;
      const r = data as any;
      toast.success(
        dryRun
          ? `Simulación: ${r.pacientes_anonimizados} pacientes elegibles · ${r.pacientes_para_aviso} próximos a aviso`
          : `Política aplicada: ${r.pacientes_anonimizados} anonimizados`
      );
      setConfirmarMasivo(false);
      cargar();
    } catch (e: any) {
      toast.error("Error: " + e.message);
    } finally {
      setEjecutando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5" /> Anonimización y retención
            </CardTitle>
            <CardDescription>
              Pacientes inactivos elegibles para anonimización según la política configurada.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => ejecutarPolitica(true)} disabled={ejecutando}>
              <EyeOff className="h-4 w-4 mr-2" /> Simular
            </Button>
            <Button size="sm" onClick={() => setConfirmarMasivo(true)} disabled={ejecutando || candidatos.length === 0}>
              <PlayCircle className="h-4 w-4 mr-2" /> Aplicar política
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Última actividad</TableHead>
              <TableHead>Inactividad</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Cargando…
                </TableCell>
              </TableRow>
            )}
            {!loading && candidatos.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  Ningún paciente cumple los criterios de anonimización.
                </TableCell>
              </TableRow>
            )}
            {candidatos.map((c) => (
              <TableRow key={c.paciente_id}>
                <TableCell className="text-sm font-medium">{c.nombre_completo}</TableCell>
                <TableCell className="text-xs">
                  {format(new Date(c.ultima_actividad), "dd MMM yyyy", { locale: es })}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {Number(c.meses_inactivo).toFixed(1)} meses
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setConfirmar(c)}>
                    Anonimizar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <AlertDialog open={!!confirmar} onOpenChange={(o) => !o && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Confirmar anonimización
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es <strong>irreversible</strong>. Los datos identificables de{" "}
              <strong>{confirmar?.nombre_completo}</strong> serán reemplazados por valores genéricos.
              Se conservarán los datos clínicos y estadísticos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmar && anonimizarUno(confirmar)}>
              Anonimizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarMasivo} onOpenChange={setConfirmarMasivo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Aplicar política masivamente
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se anonimizarán <strong>{candidatos.length}</strong> pacientes inactivos según la política.
              Esta acción es irreversible y queda registrada en auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ejecutando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => ejecutarPolitica(false)} disabled={ejecutando}>
              {ejecutando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Aplicar ahora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
