import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workspaceId: string;
  pacienteId: string;
  onSigned: (consentimientoId: string) => void;
}

const TEXTO_CONSENTIMIENTO = `
CONSENTIMIENTO INFORMADO PARA TELECONSULTA PSICOLÓGICA / PSIQUIÁTRICA

1. Comprendo que esta sesión se realizará por videoconferencia cifrada de extremo a extremo.
2. Acepto que la teleconsulta tiene las mismas implicaciones de confidencialidad que una sesión presencial,
   y que mis datos están protegidos conforme a HIPAA / GDPR / ley local.
3. Entiendo que NO se grabará la sesión sin mi autorización expresa por escrito.
4. Acepto que si existe riesgo inmediato para mi vida o la de otros, el profesional podrá romper la
   confidencialidad para activar protocolos de emergencia.
5. Asumo la responsabilidad de contar con un entorno privado durante la sesión.
6. Este consentimiento es válido por 12 meses, renovable.
`.trim();

export default function ConsentimientoTeleconsulta({ open, onOpenChange, workspaceId, pacienteId, onSigned }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [acepta, setAcepta] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [saving, setSaving] = useState(false);

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
    setDrawing(true);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!;
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top);
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  const end = () => setDrawing(false);
  const clear = () => {
    const c = canvasRef.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
  };

  const guardar = async () => {
    if (!acepta) { toast.error("Debes aceptar el consentimiento"); return; }
    const dataUrl = canvasRef.current?.toDataURL("image/png");
    if (!dataUrl || dataUrl.length < 200) { toast.error("Firma requerida"); return; }
    setSaving(true);
    const { data, error } = await supabase
      .from("consentimientos_teleconsulta")
      .insert({
        workspace_id: workspaceId,
        paciente_id: pacienteId,
        texto_version: "v1.0",
        firma_data: dataUrl,
        user_agent: navigator.userAgent.slice(0, 200),
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Consentimiento firmado");
    onSigned(data.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Consentimiento para teleconsulta</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded max-h-48 overflow-auto">
            {TEXTO_CONSENTIMIENTO}
          </pre>
          <div className="flex items-center gap-2">
            <Checkbox id="acepto" checked={acepta} onCheckedChange={(v) => setAcepta(!!v)} />
            <Label htmlFor="acepto">He leído y acepto el consentimiento</Label>
          </div>
          <div>
            <Label>Firma del paciente</Label>
            <canvas
              ref={canvasRef}
              width={500}
              height={140}
              onPointerDown={start}
              onPointerMove={move}
              onPointerUp={end}
              onPointerLeave={end}
              className="border rounded w-full touch-none bg-background"
            />
            <Button variant="ghost" size="sm" onClick={clear}>Borrar firma</Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving || !acepta}>Firmar y continuar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
