import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, ClipboardList, BarChart3, Trash2, Eye } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { EncuestaBuilder } from "@/components/EncuestaBuilder";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Encuesta {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: string;
  activo: boolean;
  created_at: string;
}

const Encuestas = () => {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [selectedEncuesta, setSelectedEncuesta] = useState<Encuesta | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo: "satisfaccion",
    activo: true,
    estructura: [] as any[],
  });

  const [mockStats] = useState({
    totalRespuestas: 156,
    promedioGeneral: 4.2,
    tasaRespuesta: 87,
    distribucion: [
      { puntuacion: "5 estrellas", cantidad: 78 },
      { puntuacion: "4 estrellas", cantidad: 52 },
      { puntuacion: "3 estrellas", cantidad: 18 },
      { puntuacion: "2 estrellas", cantidad: 6 },
      { puntuacion: "1 estrella", cantidad: 2 },
    ],
    porTipo: [
      { name: "Muy Satisfecho", value: 50, color: "hsl(var(--success))" },
      { name: "Satisfecho", value: 33, color: "hsl(var(--primary))" },
      { name: "Neutral", value: 12, color: "hsl(var(--warning))" },
      { name: "Insatisfecho", value: 5, color: "hsl(var(--destructive))" },
    ],
  });

  useEffect(() => {
    fetchEncuestas();
  }, []);

  const fetchEncuestas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("encuestas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error al cargar encuestas", variant: "destructive" });
    } else {
      setEncuestas(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (selectedEncuesta) {
      // Update existing survey
      const { error } = await supabase
        .from("encuestas")
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          tipo: formData.tipo,
          activo: formData.activo,
          estructura: formData.estructura,
        })
        .eq("id", selectedEncuesta.id);

      if (error) {
        toast({ title: "Error al actualizar encuesta", variant: "destructive" });
      } else {
        toast({ title: "Encuesta actualizada exitosamente" });
        setDialogOpen(false);
        setSelectedEncuesta(null);
        setFormData({
          nombre: "",
          descripcion: "",
          tipo: "satisfaccion",
          activo: true,
          estructura: [],
        });
        fetchEncuestas();
      }
    } else {
      // Create new survey
      const { error } = await supabase.from("encuestas").insert([
        {
          ...formData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        },
      ]);

      if (error) {
        toast({ title: "Error al crear encuesta", variant: "destructive" });
      } else {
        toast({ title: "Encuesta creada exitosamente" });
        setDialogOpen(false);
        setFormData({
          nombre: "",
          descripcion: "",
          tipo: "satisfaccion",
          activo: true,
          estructura: [],
        });
        fetchEncuestas();
      }
    }
  };

  const toggleEncuesta = async (id: string, activo: boolean) => {
    const { error } = await supabase.from("encuestas").update({ activo }).eq("id", id);

    if (error) {
      toast({ title: "Error al actualizar encuesta", variant: "destructive" });
    } else {
      toast({ title: activo ? "Encuesta activada" : "Encuesta desactivada" });
      fetchEncuestas();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("encuestas").delete().eq("id", id);

    if (error) {
      toast({ title: "Error al eliminar encuesta", variant: "destructive" });
    } else {
      toast({ title: "Encuesta eliminada" });
      fetchEncuestas();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Encuestas</h1>
          <p className="text-muted-foreground">Gestiona encuestas de satisfacción y seguimiento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Encuesta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedEncuesta ? 'Editar Encuesta' : 'Nueva Encuesta'}</DialogTitle>
          </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la Encuesta</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Satisfacción Post-Consulta"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el propósito de esta encuesta"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Encuesta</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="satisfaccion">Satisfacción</SelectItem>
                    <SelectItem value="seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="autoconsulta">Autoconsulta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Preguntas de la Encuesta</h3>
                <EncuestaBuilder
                  preguntas={formData.estructura}
                  onChange={(preguntas) => setFormData({ ...formData, estructura: preguntas })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Activar encuesta</Label>
                <Switch
                  checked={formData.activo}
                  onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false);
                  setSelectedEncuesta(null);
                  setFormData({
                    nombre: "",
                    descripcion: "",
                    tipo: "satisfaccion",
                    activo: true,
                    estructura: [],
                  });
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {selectedEncuesta ? 'Actualizar' : 'Crear'} Encuesta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center">Cargando encuestas...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {encuestas.map((encuesta) => (
            <GlassCard key={encuesta.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className={`h-4 w-4 ${encuesta.activo ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="font-semibold text-foreground">{encuesta.nombre}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{encuesta.descripcion}</p>
                  <Badge variant="outline">{encuesta.tipo}</Badge>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Switch
                  checked={encuesta.activo}
                  onCheckedChange={(checked) => toggleEncuesta(encuesta.id, checked)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEncuesta(encuesta);
                      setStatsOpen(true);
                    }}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Load encuesta for editing
                      setFormData({
                        nombre: encuesta.nombre,
                        descripcion: encuesta.descripcion || '',
                        tipo: encuesta.tipo,
                        activo: encuesta.activo,
                        estructura: (encuesta as any).estructura || []
                      });
                      setSelectedEncuesta(encuesta);
                      setDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(encuesta.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Análisis de Resultados: {selectedEncuesta?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <GlassCard className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Total Respuestas</p>
                <p className="text-3xl font-bold">{mockStats.totalRespuestas}</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Promedio General</p>
                <p className="text-3xl font-bold">{mockStats.promedioGeneral}/5</p>
              </GlassCard>
              <GlassCard className="p-4">
                <p className="text-sm text-muted-foreground mb-1">Tasa de Respuesta</p>
                <p className="text-3xl font-bold">{mockStats.tasaRespuesta}%</p>
              </GlassCard>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <GlassCard className="p-4">
                <h3 className="font-semibold mb-4">Distribución de Respuestas</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={mockStats.distribucion}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="puntuacion" className="text-xs" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </GlassCard>

              <GlassCard className="p-4">
                <h3 className="font-semibold mb-4">Nivel de Satisfacción</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={mockStats.porTipo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.value}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {mockStats.porTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </GlassCard>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Encuestas;
