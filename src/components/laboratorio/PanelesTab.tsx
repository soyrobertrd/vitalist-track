import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export interface PanelesTabProps {
  workspaceId: string | null;
  paneles: any[];
  queryClient: any;
}

export function PanelesTab({ workspaceId, paneles, queryClient }: PanelesTabProps) {
  const [showNew, setShowNew] = useState(false);
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pruebasTexto, setPruebasTexto] = useState("");

  const createPanel = useMutation({
    mutationFn: async () => {
      if (!workspaceId || !nombre) throw new Error("Nombre requerido");
      const pruebas = pruebasTexto.split("\n").filter(Boolean).map((l) => {
        const parts = l.split("|").map((s) => s.trim());
        return { nombre: parts[0], categoria: parts[1] || "", rango: parts[2] || "" };
      });
      const { error } = await supabase.from("paneles_laboratorio").insert({
        workspace_id: workspaceId,
        nombre,
        codigo: codigo || null,
        descripcion: descripcion || null,
        pruebas_incluidas: pruebas,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Panel de laboratorio creado con éxito");
      queryClient.invalidateQueries({ queryKey: ["paneles_laboratorio"] });
      setShowNew(false);
      setNombre("");
      setCodigo("");
      setDescripcion("");
      setPruebasTexto("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl border border-border/80">
        <div>
          <h3 className="font-bold text-foreground">Catálogo de Perfiles Bioquímicos</h3>
          <p className="text-xs text-muted-foreground">Grupos de analíticas estandarizadas para solicitud en un clic</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)} className="rounded-xl gap-1.5 bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="h-4 w-4" /> Crear Perfil
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paneles.map((p: any) => {
          const tests = (p.pruebas_incluidas as any[]) || [];
          return (
            <Card key={p.id} className="rounded-2xl border-border/80 shadow-sm hover:border-teal-500/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-bold">{p.nombre}</CardTitle>
                  {p.codigo && <Badge variant="outline" className="font-mono text-xs">{p.codigo}</Badge>}
                </div>
                {p.descripcion && <CardDescription className="text-xs">{p.descripcion}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tests.slice(0, 8).map((t: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[11px] rounded-md font-normal">
                      {typeof t === "string" ? t : t.nombre}
                    </Badge>
                  ))}
                  {tests.length > 8 && (
                    <Badge variant="outline" className="text-[11px] rounded-md">
                      +{tests.length - 8} más
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {paneles.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full py-8 text-center">No hay paneles configurados</p>
        )}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" /> Nuevo Panel de Pruebas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold">Nombre del Perfil *</Label>
              <Input className="rounded-xl mt-1" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Perfil Hepático Completo" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Código Mnemónico</Label>
              <Input className="rounded-xl mt-1" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: LFT, CBC, IONO" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Descripción Asistencial</Label>
              <Textarea className="rounded-xl mt-1" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
            </div>
            <div>
              <Label className="text-xs font-semibold">Pruebas (nombre | categoría | rango ref)</Label>
              <Textarea
                className="rounded-xl mt-1 font-mono text-xs"
                value={pruebasTexto}
                onChange={(e) => setPruebasTexto(e.target.value)}
                rows={5}
                placeholder={"Bilirrubina Total | Química | 0.2 - 1.2 mg/dL\nALT / TGP | Química | 7 - 56 U/L\nAST / TGO | Química | 10 - 40 U/L\nFosfatasa Alcalina | Química | 44 - 147 U/L"}
              />
            </div>
            <Button className="w-full rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold py-5" onClick={() => createPanel.mutate()} disabled={createPanel.isPending || !nombre}>
              {createPanel.isPending ? "Creando..." : "Guardar Panel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
