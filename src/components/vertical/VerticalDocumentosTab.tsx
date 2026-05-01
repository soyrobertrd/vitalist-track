import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, Upload, Signature, ScanSearch, Plus, Eye, History, Shield } from "lucide-react";

interface Props {
  verticalTipo: "dental" | "estetica" | "recovery" | "vision";
}

const tiposDocumento = [
  { value: "historia_clinica", label: "Historia clínica" },
  { value: "consentimiento", label: "Consentimiento" },
  { value: "receta", label: "Receta" },
  { value: "resultado_lab", label: "Resultado laboratorio" },
  { value: "imagen", label: "Imagen diagnóstica" },
  { value: "otro", label: "Otro" },
];

export default function VerticalDocumentosTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const qc = useQueryClient();

  const [showUpload, setShowUpload] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("otro");
  const [subtab, setSubtab] = useState("documentos");

  const { data: documentos = [] } = useQuery({
    queryKey: ["documentos_clinicos_v", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("documentos_clinicos") as any)
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const { data: firmas = [] } = useQuery({
    queryKey: ["firmas_electronicas", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("firmas_electronicas") as any)
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: escaneos = [] } = useQuery({
    queryKey: ["escaneos_ocr", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await (supabase.from("escaneos_ocr") as any)
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const crearDocumento = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await (supabase.from("documentos_clinicos") as any).insert({
        workspace_id: wsId,
        titulo,
        descripcion: descripcion || null,
        tipo,
        created_by: user?.id,
        version: 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Documento registrado");
      qc.invalidateQueries({ queryKey: ["documentos_clinicos_v"] });
      setShowUpload(false);
      setTitulo("");
      setDescripcion("");
      setTipo("otro");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" /> Gestión Documental
        </h3>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo documento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar documento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nombre del documento" /></div>
              <div><Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {tiposDocumento.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Descripción</Label><Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción opcional..." /></div>
              <Button onClick={() => crearDocumento.mutate()} disabled={!titulo}>Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={subtab} onValueChange={setSubtab}>
        <TabsList>
          <TabsTrigger value="documentos"><FileText className="h-3.5 w-3.5 mr-1" />Expedientes</TabsTrigger>
          <TabsTrigger value="firmas"><Signature className="h-3.5 w-3.5 mr-1" />Firmas</TabsTrigger>
          <TabsTrigger value="ocr"><ScanSearch className="h-3.5 w-3.5 mr-1" />OCR</TabsTrigger>
        </TabsList>

        <TabsContent value="documentos" className="mt-3">
          <div className="grid gap-3">
            {documentos.map((doc: any) => (
              <Card key={doc.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      {doc.titulo}
                      <Badge variant="outline" className="text-xs">{tiposDocumento.find(t => t.value === (doc.tipo || doc.categoria))?.label || doc.tipo || doc.categoria}</Badge>
                      {doc.firmado && <Badge className="text-xs bg-green-600"><Shield className="h-3 w-3 mr-0.5" />Firmado</Badge>}
                    </p>
                    {doc.descripcion && <p className="text-sm text-muted-foreground">{doc.descripcion}</p>}
                    <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                      {doc.version > 1 && <span className="flex items-center gap-0.5"><History className="h-3 w-3" />v{doc.version}</span>}
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      {doc.tamano_bytes && <span>{(doc.tamano_bytes / 1024).toFixed(0)} KB</span>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {doc.archivo_url && <Button size="sm" variant="ghost"><Eye className="h-4 w-4" /></Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {documentos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay documentos registrados.</p>}
          </div>
        </TabsContent>

        <TabsContent value="firmas" className="mt-3">
          <div className="grid gap-3">
            {firmas.map((f: any) => (
              <Card key={f.id}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{f.nombre_firmante || "Firmante"}</p>
                      <p className="text-xs text-muted-foreground">Tipo: {f.tipo_firmante} · {new Date(f.created_at).toLocaleString()}</p>
                      {f.ip_address && <p className="text-xs text-muted-foreground">IP: {f.ip_address}</p>}
                    </div>
                    <Badge variant="default"><Signature className="h-3 w-3 mr-1" />Verificada</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {firmas.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay firmas electrónicas registradas.</p>}
          </div>
        </TabsContent>

        <TabsContent value="ocr" className="mt-3">
          <div className="grid gap-3">
            {escaneos.map((e: any) => (
              <Card key={e.id}>
                <CardContent className="py-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Badge variant={e.estado === "completado" ? "default" : "secondary"} className="mb-1">{e.estado}</Badge>
                      {e.texto_extraido && <p className="text-sm mt-1 line-clamp-3">{e.texto_extraido}</p>}
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        {e.confianza && <span>Confianza: {e.confianza}%</span>}
                        {e.idioma_detectado && <span>Idioma: {e.idioma_detectado}</span>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {escaneos.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No hay escaneos OCR.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
