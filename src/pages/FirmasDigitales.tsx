import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileSignature, Plus, CheckCircle2, XCircle, Eraser } from "lucide-react";
import { format } from "date-fns";

const TIPOS = [
  { v: "medicamento_entrega", l: "Entrega de medicamento" },
  { v: "documento_recepcion", l: "Recepción de documento" },
  { v: "alta_medica", l: "Alta médica" },
  { v: "consentimiento", l: "Consentimiento" },
  { v: "equipo_entrega", l: "Entrega de equipo" },
  { v: "muestra_lab", l: "Recepción de muestra" },
  { v: "otro", l: "Otro" },
];

function PadFirma({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const inicio = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const r = c.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - r.left : e.clientX - r.left;
    const y = "touches" in e ? e.touches[0].clientY - r.top : e.clientY - r.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const mover = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const r = c.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - r.left : e.clientX - r.left;
    const y = "touches" in e ? e.touches[0].clientY - r.top : e.clientY - r.top;
    ctx.lineTo(x, y); ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#111"; ctx.stroke();
    onChange(c.toDataURL("image/png"));
  };
  const fin = () => { drawing.current = false; };
  const limpiar = () => {
    const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    onChange(null);
  };

  return (
    <div>
      <Label>Firma</Label>
      <div className="border rounded-md bg-white">
        <canvas
          ref={ref} width={500} height={150}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={inicio} onMouseMove={mover} onMouseUp={fin} onMouseLeave={fin}
          onTouchStart={inicio} onTouchMove={mover} onTouchEnd={fin}
        />
      </div>
      <Button variant="ghost" size="sm" onClick={limpiar} className="mt-1">
        <Eraser className="h-3 w-3 mr-1" /> Limpiar
      </Button>
    </div>
  );
}

export default function FirmasDigitales() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [firmas, setFirmas] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [firmaImg, setFirmaImg] = useState<string | null>(null);
  const [form, setForm] = useState<any>({
    tipo_documento: "medicamento_entrega", paciente_id: "",
    firmante_nombre: "", firmante_cedula: "", firmante_rol: "paciente",
    notas: "", contenido: "",
  });

  const cargar = async () => {
    if (!wsId) return;
    const [f, p] = await Promise.all([
      (supabase.from("firmas_digitales") as any).select("*, pacientes(nombre, apellido)")
        .eq("workspace_id", wsId).order("firmado_at", { ascending: false }).limit(100),
      supabase.from("pacientes").select("id, nombre, apellido, cedula").eq("workspace_id", wsId).order("nombre"),
    ]);
    setFirmas(f.data || []);
    setPacientes(p.data || []);
  };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [wsId]);

  const guardar = async () => {
    if (!form.firmante_nombre) { toast.error("Nombre del firmante requerido"); return; }
    if (!firmaImg) { toast.error("Falta la firma"); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from("firmas_digitales") as any).insert({
      workspace_id: wsId,
      tipo_documento: form.tipo_documento,
      paciente_id: form.paciente_id || null,
      firmante_nombre: form.firmante_nombre,
      firmante_cedula: form.firmante_cedula || null,
      firmante_rol: form.firmante_rol || null,
      firma_imagen_url: firmaImg,
      contenido_firmado: form.contenido ? { descripcion: form.contenido } : null,
      notas: form.notas || null,
      user_agent: navigator.userAgent,
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Firma registrada");
    setOpen(false);
    setFirmaImg(null);
    setForm({ ...form, paciente_id: "", firmante_nombre: "", firmante_cedula: "", notas: "", contenido: "" });
    cargar();
  };

  const anular = async (id: string) => {
    const motivo = prompt("Motivo de anulación:");
    if (!motivo) return;
    await (supabase.from("firmas_digitales") as any).update({
      estado: "anulada", motivo_anulacion: motivo,
    }).eq("id", id);
    cargar();
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSignature className="h-7 w-7 text-primary" /> Firmas digitales
          </h1>
          <p className="text-muted-foreground">Entrega de medicamentos, documentos, alta médica y más, con firma manuscrita.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Capturar firma</Button></DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Capturar firma digital</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tipo de documento</Label>
                  <Select value={form.tipo_documento} onValueChange={v => setForm({ ...form, tipo_documento: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Paciente</Label>
                  <Select value={form.paciente_id} onValueChange={v => setForm({ ...form, paciente_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {pacientes.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nombre} {p.apellido}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Firmante</Label><Input value={form.firmante_nombre} onChange={e => setForm({ ...form, firmante_nombre: e.target.value })} placeholder="Nombre completo" /></div>
                <div><Label>Cédula</Label><Input value={form.firmante_cedula} onChange={e => setForm({ ...form, firmante_cedula: e.target.value })} /></div>
              </div>
              <div>
                <Label>Rol del firmante</Label>
                <Select value={form.firmante_rol} onValueChange={v => setForm({ ...form, firmante_rol: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paciente">Paciente</SelectItem>
                    <SelectItem value="familiar">Familiar / Acompañante</SelectItem>
                    <SelectItem value="medico">Médico</SelectItem>
                    <SelectItem value="enfermera">Enfermería</SelectItem>
                    <SelectItem value="recepcion">Recepción</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descripción de lo firmado</Label>
                <Textarea rows={2} value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })} placeholder="Ej: Entrega de Amoxicilina 500mg x 21 tabletas" />
              </div>
              <div>
                <Label>Notas</Label>
                <Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
              </div>
              <PadFirma onChange={setFirmaImg} />
              <Button onClick={guardar} className="w-full">Guardar firma</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-2">
        {firmas.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sin firmas registradas.</p>}
        {firmas.map((f: any) => (
          <Card key={f.id}>
            <CardContent className="py-3 flex items-start gap-3">
              {f.firma_imagen_url && (
                <img src={f.firma_imagen_url} alt="firma" className="w-24 h-16 object-contain border rounded bg-white" />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-sm">{f.firmante_nombre} <span className="text-muted-foreground">({f.firmante_rol})</span></p>
                    <p className="text-xs text-muted-foreground">
                      {TIPOS.find(t => t.v === f.tipo_documento)?.l}
                      {f.pacientes && ` · ${f.pacientes.nombre} ${f.pacientes.apellido}`}
                    </p>
                  </div>
                  <Badge variant={f.estado === "valida" ? "default" : "destructive"}>
                    {f.estado === "valida" ? <CheckCircle2 className="h-3 w-3 mr-0.5" /> : <XCircle className="h-3 w-3 mr-0.5" />}
                    {f.estado}
                  </Badge>
                </div>
                {f.contenido_firmado?.descripcion && <p className="text-sm mt-1">{f.contenido_firmado.descripcion}</p>}
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(f.firmado_at), "PPp")}</p>
                {f.motivo_anulacion && <p className="text-xs text-destructive">Anulada: {f.motivo_anulacion}</p>}
                {f.estado === "valida" && (
                  <Button size="sm" variant="ghost" className="mt-1 h-7 text-xs" onClick={() => anular(f.id)}>Anular</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
