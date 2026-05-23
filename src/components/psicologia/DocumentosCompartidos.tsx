import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, FileText, Download, Trash2 } from "lucide-react";

interface Props {
  teleconsultaId: string;
  workspaceId: string;
  pacienteId: string;
  readOnly?: boolean;
}

interface Doc {
  id: string;
  nombre: string;
  storage_path: string;
  permiso: string;
  mime_type?: string;
}

export default function DocumentosCompartidos({ teleconsultaId, workspaceId, pacienteId, readOnly }: Props) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);

  const cargar = async () => {
    const { data } = await supabase
      .from("documentos_compartidos_psico")
      .select("*")
      .eq("teleconsulta_id", teleconsultaId)
      .order("created_at", { ascending: false });
    setDocs((data as any) || []);
  };

  useEffect(() => { cargar(); }, [teleconsultaId]);

  const subir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const path = `${pacienteId}/${Date.now()}-${f.name}`;
    const { error: upErr } = await supabase.storage.from("teleconsulta-docs").upload(path, f);
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { error } = await supabase.from("documentos_compartidos_psico").insert({
      workspace_id: workspaceId,
      teleconsulta_id: teleconsultaId,
      paciente_id: pacienteId,
      nombre: f.name,
      storage_path: path,
      mime_type: f.type,
      tamano_bytes: f.size,
      permiso: "descargar",
    });
    setUploading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Documento compartido");
    e.target.value = "";
    cargar();
  };

  const descargar = async (d: Doc) => {
    const { data, error } = await supabase.storage
      .from("teleconsulta-docs")
      .createSignedUrl(d.storage_path, 3600);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  };

  const eliminar = async (d: Doc) => {
    await supabase.storage.from("teleconsulta-docs").remove([d.storage_path]);
    await supabase.from("documentos_compartidos_psico").delete().eq("id", d.id);
    cargar();
  };

  return (
    <div className="border rounded bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium">Documentos compartidos</div>
        {!readOnly && (
          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={subir} disabled={uploading} />
            <Button size="sm" variant="outline" asChild disabled={uploading}>
              <span><Upload className="h-3 w-3 mr-1" />Subir</span>
            </Button>
          </label>
        )}
      </div>
      <div className="space-y-1 max-h-56 overflow-auto">
        {docs.length === 0 && <p className="text-xs text-muted-foreground">Sin documentos.</p>}
        {docs.map(d => (
          <div key={d.id} className="flex items-center gap-2 text-sm border-b pb-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 truncate">{d.nombre}</span>
            <Button size="icon" variant="ghost" onClick={() => descargar(d)}>
              <Download className="h-3 w-3" />
            </Button>
            {!readOnly && (
              <Button size="icon" variant="ghost" onClick={() => eliminar(d)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
