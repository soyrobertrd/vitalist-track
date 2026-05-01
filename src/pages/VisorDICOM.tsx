import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Image as ImageIcon, Upload, Eye } from "lucide-react";

export default function VisorDICOM() {
  const { currentWorkspace } = useWorkspace();
  const [studies, setStudies] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [openViewer, setOpenViewer] = useState<any | null>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);

  const [form, setForm] = useState({
    paciente_id: "", study_instance_uid: "", accession_number: "", study_date: "",
    modality: "CR", description: "", referring_physician: "",
  });

  const load = async () => {
    if (!currentWorkspace) return;
    const [s, p] = await Promise.all([
      supabase.from("dicom_studies").select("*, pacientes(nombre, apellido)").eq("workspace_id", currentWorkspace.id).order("study_date", { ascending: false }).limit(100),
      supabase.from("pacientes").select("id, nombre, apellido").limit(200),
    ]);
    setStudies(s.data || []);
    setPacientes(p.data || []);
  };

  useEffect(() => { load(); }, [currentWorkspace?.id]);

  const crearEstudio = async () => {
    if (!currentWorkspace) return;
    const uid = form.study_instance_uid || `1.2.826.${Date.now()}.${Math.floor(Math.random() * 1000)}`;
    const { error } = await supabase.from("dicom_studies").insert({
      workspace_id: currentWorkspace.id,
      paciente_id: form.paciente_id || null,
      study_instance_uid: uid,
      accession_number: form.accession_number || null,
      study_date: form.study_date || null,
      modality: form.modality,
      description: form.description || null,
      referring_physician: form.referring_physician || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Estudio DICOM registrado");
    setOpenNew(false);
    setForm({ paciente_id: "", study_instance_uid: "", accession_number: "", study_date: "", modality: "CR", description: "", referring_physician: "" });
    load();
  };

  const abrirVisor = async (study: any) => {
    setOpenViewer(study);
    setCurrentIdx(0);
    const { data: series } = await supabase.from("dicom_series").select("id").eq("study_id", study.id);
    if (!series || series.length === 0) { setInstances([]); return; }
    const { data: insts } = await supabase.from("dicom_instances").select("*").in("series_id", series.map(s => s.id)).order("instance_number");
    setInstances(insts || []);
  };

  const modalityColor: Record<string, string> = {
    CT: "bg-blue-500", MR: "bg-purple-500", CR: "bg-green-500", DX: "bg-green-500",
    US: "bg-yellow-500", MG: "bg-pink-500", PT: "bg-orange-500", NM: "bg-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Visor DICOM</h1>
          <p className="text-muted-foreground">Estudios de imagenología con visor integrado</p>
        </div>
        <Dialog open={openNew} onOpenChange={setOpenNew}>
          <DialogTrigger asChild><Button><Upload className="h-4 w-4 mr-1" />Nuevo estudio</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar estudio DICOM</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Paciente</Label>
                <Select value={form.paciente_id} onValueChange={v => setForm({...form, paciente_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {pacientes.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Modalidad</Label>
                  <Select value={form.modality} onValueChange={v => setForm({...form, modality: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CT">CT - Tomografía</SelectItem>
                      <SelectItem value="MR">MR - Resonancia</SelectItem>
                      <SelectItem value="CR">CR - Rayos X</SelectItem>
                      <SelectItem value="DX">DX - Digital X-Ray</SelectItem>
                      <SelectItem value="US">US - Ultrasonido</SelectItem>
                      <SelectItem value="MG">MG - Mamografía</SelectItem>
                      <SelectItem value="PT">PT - PET</SelectItem>
                      <SelectItem value="NM">NM - Medicina Nuclear</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Fecha estudio</Label><Input type="date" value={form.study_date} onChange={e => setForm({...form, study_date: e.target.value})} /></div>
              </div>
              <div><Label>Accession #</Label><Input value={form.accession_number} onChange={e => setForm({...form, accession_number: e.target.value})} /></div>
              <div><Label>Study UID (auto si vacío)</Label><Input value={form.study_instance_uid} onChange={e => setForm({...form, study_instance_uid: e.target.value})} className="font-mono text-xs" /></div>
              <div><Label>Descripción</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div><Label>Médico solicitante</Label><Input value={form.referring_physician} onChange={e => setForm({...form, referring_physician: e.target.value})} /></div>
              <Button onClick={crearEstudio} className="w-full">Guardar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Estudios ({studies.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {studies.map(s => (
              <Card key={s.id} className="hover:shadow-md transition cursor-pointer" onClick={() => abrirVisor(s)}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={modalityColor[s.modality] || "bg-gray-500"}>{s.modality}</Badge>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="font-semibold text-sm">{s.pacientes ? `${s.pacientes.nombre} ${s.pacientes.apellido}` : "Sin paciente"}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.description || "—"}</div>
                  <div className="text-xs mt-2 flex justify-between">
                    <span>{s.study_date || "—"}</span>
                    <span>{s.num_instances} img</span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {studies.length === 0 && <p className="text-sm text-muted-foreground col-span-full">Sin estudios. Registra uno arriba.</p>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!openViewer} onOpenChange={(o) => !o && setOpenViewer(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Visor: {openViewer?.description || openViewer?.modality}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[1fr_200px] gap-4">
            <div className="bg-black rounded-lg aspect-square flex items-center justify-center overflow-hidden relative">
              {instances.length > 0 ? (
                <div
                  className="text-white text-center"
                  style={{ filter: `brightness(${brightness}%)`, transform: `scale(${zoom / 100})` }}
                >
                  <ImageIcon className="h-32 w-32 mx-auto opacity-30" />
                  <p className="text-xs mt-2 font-mono">{instances[currentIdx]?.sop_instance_uid?.substring(0, 30)}...</p>
                  <p className="text-xs">Imagen {currentIdx + 1} de {instances.length}</p>
                </div>
              ) : (
                <div className="text-white/50 text-center">
                  <ImageIcon className="h-24 w-24 mx-auto" />
                  <p className="text-sm mt-2">Sin instancias DICOM cargadas</p>
                  <p className="text-xs mt-1">Sube archivos .dcm al storage `dicom-files`</p>
                </div>
              )}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-xs">Estudio</Label>
                <div className="font-mono text-xs break-all">{openViewer?.study_instance_uid}</div>
              </div>
              <div>
                <Label className="text-xs">Modalidad</Label>
                <Badge>{openViewer?.modality}</Badge>
              </div>
              <div>
                <Label className="text-xs">Zoom: {zoom}%</Label>
                <Input type="range" min={50} max={300} value={zoom} onChange={e => setZoom(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Brillo: {brightness}%</Label>
                <Input type="range" min={20} max={200} value={brightness} onChange={e => setBrightness(+e.target.value)} />
              </div>
              {instances.length > 1 && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>◀</Button>
                  <Button size="sm" variant="outline" onClick={() => setCurrentIdx(Math.min(instances.length - 1, currentIdx + 1))} disabled={currentIdx === instances.length - 1}>▶</Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
