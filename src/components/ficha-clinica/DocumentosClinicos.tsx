import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2, Download, FileText, FlaskConical, Image as ImageIcon, FileCheck, Pill } from "lucide-react";
import { toast } from "sonner";

interface Documento {
  id: string;
  paciente_id: string;
  categoria: string;
  titulo: string;
  descripcion: string | null;
  storage_path: string;
  mime_type: string | null;
  tamano_bytes: number | null;
  fecha_documento: string | null;
  created_at: string;
}

const CATEGORIA_ICON: Record<string, any> = {
  laboratorio: FlaskConical,
  imagen: ImageIcon,
  receta: Pill,
  informe: FileText,
  consentimiento: FileCheck,
  otro: FileText,
};

const CATEGORIA_LABEL: Record<string, string> = {
  laboratorio: "Laboratorios",
  imagen: "Imágenes",
  receta: "Recetas",
  informe: "Informes",
  consentimiento: "Consentimientos",
  otro: "Otros",
};

const formatBytes = (b: number | null) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

export function DocumentosClinicos({ pacienteId }: { pacienteId: string }) {
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; data: { titulo: string; descripcion: string; categoria: string; fecha_documento: string; file: File | null } }>({
    open: false,
    data: { titulo: "", descripcion: "", categoria: "laboratorio", fecha_documento: new Date().toISOString().slice(0, 10), file: null },
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("documentos_clinicos")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("fecha_documento", { ascending: false, nullsFirst: false });
    setDocs((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (pacienteId) fetchData();
  }, [pacienteId]);

  const upload = async () => {
    const { titulo, descripcion, categoria, fecha_documento, file } = dialog.data;
    if (!file) {
      toast.error("Selecciona un archivo");
      return;
    }
    if (!titulo.trim()) {
      toast.error("Título es requerido");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Archivo muy grande (máx 25MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${pacienteId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("documentos-clinicos").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("documentos_clinicos").insert({
        paciente_id: pacienteId,
        categoria,
        titulo,
        descripcion: descripcion || null,
        storage_path: path,
        mime_type: file.type,
        tamano_bytes: file.size,
        fecha_documento,
      });
      if (insErr) throw insErr;

      toast.success("Documento subido");
      setDialog({ open: false, data: { titulo: "", descripcion: "", categoria: "laboratorio", fecha_documento: new Date().toISOString().slice(0, 10), file: null } });
      fetchData();
    } catch (e: any) {
      toast.error("Error al subir: " + (e.message || ""));
    } finally {
      setUploading(false);
    }
  };

  const download = async (doc: Documento) => {
    const { data, error } = await supabase.storage.from("documentos-clinicos").createSignedUrl(doc.storage_path, 60);
    if (error || !data) {
      toast.error("No se pudo generar enlace");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const remove = async (doc: Documento) => {
    if (!confirm(`¿Eliminar "${doc.titulo}"?`)) return;
    await supabase.storage.from("documentos-clinicos").remove([doc.storage_path]);
    const { error } = await supabase.from("documentos_clinicos").delete().eq("id", doc.id);
    if (error) {
      toast.error("Error al eliminar");
      return;
    }
    toast.success("Eliminado");
    fetchData();
  };

  const categorias = ["todos", "laboratorio", "imagen", "receta", "informe", "consentimiento", "otro"];

  if (loading) return <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialog({ ...dialog, open: true })}>
          <Plus className="h-4 w-4 mr-1" /> Subir documento
        </Button>
      </div>

      <Tabs defaultValue="todos">
        <TabsList className="flex-wrap h-auto">
          {categorias.map((c) => (
            <TabsTrigger key={c} value={c} className="capitalize">
              {c === "todos" ? "Todos" : CATEGORIA_LABEL[c]} ({c === "todos" ? docs.length : docs.filter((d) => d.categoria === c).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {categorias.map((cat) => {
          const list = cat === "todos" ? docs : docs.filter((d) => d.categoria === cat);
          return (
            <TabsContent key={cat} value={cat} className="space-y-2 mt-3">
              {list.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">Sin documentos</p>
              ) : (
                list.map((d) => {
                  const Icon = CATEGORIA_ICON[d.categoria] || FileText;
                  return (
                    <div key={d.id} className="p-3 border rounded-lg flex items-center gap-3">
                      <Icon className="h-8 w-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{d.titulo}</p>
                          <Badge variant="outline" className="capitalize">{CATEGORIA_LABEL[d.categoria]}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {d.fecha_documento && new Date(d.fecha_documento + "T12:00:00").toLocaleDateString("es-DO")}
                          {d.tamano_bytes && ` • ${formatBytes(d.tamano_bytes)}`}
                        </p>
                        {d.descripcion && <p className="text-sm text-muted-foreground truncate">{d.descripcion}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => download(d)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove(d)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ ...dialog, open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subir documento clínico</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Archivo *</Label>
              <Input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf,.doc,.docx"
                onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, file: e.target.files?.[0] || null } })}
              />
              <p className="text-xs text-muted-foreground mt-1">Imágenes, PDF, Word. Máx 25MB.</p>
            </div>
            <div>
              <Label>Título *</Label>
              <Input
                value={dialog.data.titulo}
                onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, titulo: e.target.value } })}
                placeholder="Ej: Hemograma completo enero 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoría</Label>
                <Select value={dialog.data.categoria} onValueChange={(v) => setDialog({ ...dialog, data: { ...dialog.data, categoria: v } })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laboratorio">Laboratorio</SelectItem>
                    <SelectItem value="imagen">Imagen / Estudio</SelectItem>
                    <SelectItem value="receta">Receta</SelectItem>
                    <SelectItem value="informe">Informe</SelectItem>
                    <SelectItem value="consentimiento">Consentimiento</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha del documento</Label>
                <Input
                  type="date"
                  value={dialog.data.fecha_documento}
                  onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, fecha_documento: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={dialog.data.descripcion}
                onChange={(e) => setDialog({ ...dialog, data: { ...dialog.data, descripcion: e.target.value } })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog({ ...dialog, open: false })} disabled={uploading}>Cancelar</Button>
            <Button onClick={upload} disabled={uploading}>{uploading ? "Subiendo..." : "Subir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
