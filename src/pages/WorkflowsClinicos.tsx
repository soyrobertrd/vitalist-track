import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Workflow, Play, Sparkles } from "lucide-react";

interface Plantilla {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  categoria: string | null;
  evento_disparador: string;
  acciones: any[];
  es_global: boolean;
  activo: boolean;
}

const categoriaColor: Record<string, string> = {
  sepsis: "bg-destructive/10 text-destructive",
  alta_hospitalaria: "bg-blue-500/10 text-blue-700",
  post_cirugia: "bg-purple-500/10 text-purple-700",
  alergia_detectada: "bg-orange-500/10 text-orange-700",
  seguimiento: "bg-green-500/10 text-green-700",
};

export default function WorkflowsClinicos() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [pacienteId, setPacienteId] = useState("");
  const [selPlantilla, setSelPlantilla] = useState<Plantilla | null>(null);
  const [ejecutando, setEjecutando] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("workflow_plantillas")
        .select("*")
        .eq("activo", true)
        .order("es_global", { ascending: false })
        .order("nombre");
      setPlantillas((data as unknown as Plantilla[]) || []);
      setLoading(false);
    })();
  }, []);

  const ejecutar = async () => {
    if (!selPlantilla || !pacienteId) return;
    setEjecutando(true);
    const { data, error } = await supabase.rpc("workflow_ejecutar_plantilla", {
      _plantilla_id: selPlantilla.id,
      _paciente_id: pacienteId,
      _contexto: {},
    });
    setEjecutando(false);
    const result = data as { ok?: boolean; error?: string; plantilla?: string } | null;
    if (error || !result?.ok) {
      toast({
        title: "Error al ejecutar workflow",
        description: result?.error || error?.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Workflow ejecutado",
      description: `${result.plantilla} aplicado al paciente.`,
    });
    setOpen(false);
    setPacienteId("");
    setSelPlantilla(null);
  };

  if (loading) return <div className="p-6">Cargando workflows...</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Workflow className="h-7 w-7 text-primary" /> Workflows Clínicos
        </h1>
        <p className="text-sm text-muted-foreground">
          Plantillas predefinidas que automatizan flujos entre módulos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plantillas.map((p) => (
          <Card key={p.id} className="hover:shadow-md transition">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{p.nombre}</CardTitle>
                {p.es_global && (
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" /> Global
                  </Badge>
                )}
              </div>
              {p.categoria && (
                <Badge className={categoriaColor[p.categoria] || ""} variant="secondary">
                  {p.categoria.replace("_", " ")}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{p.descripcion}</p>
              <div className="text-xs">
                <span className="font-medium">Disparador:</span>{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded">{p.evento_disparador}</code>
              </div>
              <div className="text-xs">
                <span className="font-medium">{p.acciones?.length || 0} acciones encadenadas</span>
              </div>
              <Dialog open={open && selPlantilla?.id === p.id} onOpenChange={(o) => {
                setOpen(o);
                if (o) setSelPlantilla(p); else setSelPlantilla(null);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full">
                    <Play className="h-4 w-4 mr-2" /> Ejecutar en paciente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ejecutar: {p.nombre}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="pid">ID del paciente (UUID)</Label>
                      <Input
                        id="pid"
                        value={pacienteId}
                        onChange={(e) => setPacienteId(e.target.value)}
                        placeholder="00000000-0000-0000-0000-000000000000"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Se planificarán {p.acciones?.length || 0} acciones automáticas.
                    </div>
                    <Button
                      onClick={ejecutar}
                      disabled={!pacienteId || ejecutando}
                      className="w-full"
                    >
                      {ejecutando ? "Ejecutando..." : "Confirmar ejecución"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
