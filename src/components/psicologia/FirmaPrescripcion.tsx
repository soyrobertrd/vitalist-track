import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PenLine, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function FirmaPrescripcion({ prescripcion, onSigned }: { prescripcion: any; onSigned?: () => void }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const start = (e: React.PointerEvent) => {
    drawing.current = true;
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!; ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    const ctx = c.getContext("2d")!; ctx.lineWidth = 2; ctx.strokeStyle = "#111";
    ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.stroke();
  };
  const end = () => { drawing.current = false; };
  const clear = () => { const c = canvasRef.current!; c.getContext("2d")!.clearRect(0,0,c.width,c.height); };

  const firmar = async () => {
    const c = canvasRef.current!;
    const firma = c.toDataURL("image/png");
    if (firma.length < 2000) { toast.error("Firma requerida"); return; }
    const contenido = JSON.stringify({
      id: prescripcion.id, medicamento: prescripcion.medicamento, dosis: prescripcion.dosis,
      frecuencia: prescripcion.frecuencia, notas: prescripcion.notas, paciente_id: prescripcion.paciente_id,
    });
    const hash = await sha256Hex(contenido);
    const { error } = await (supabase as any).rpc("firmar_prescripcion_psiquiatrica", {
      _prescripcion_id: prescripcion.id,
      _firma_base64: firma,
      _hash_contenido: hash,
      _user_agent: navigator.userAgent,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Prescripción firmada digitalmente");
    setOpen(false); onSigned?.();
  };

  if (prescripcion.firmada) {
    return <Badge variant="default" className="gap-1"><ShieldCheck className="h-3 w-3" />Firmada</Badge>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><PenLine className="h-4 w-4 mr-1" />Firmar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Firma digital de receta</DialogTitle></DialogHeader>
        <Card><CardContent className="pt-4 text-sm space-y-1">
          <p><strong>{prescripcion.medicamento}</strong></p>
          <p className="text-muted-foreground">{prescripcion.dosis} — {prescripcion.frecuencia}</p>
        </CardContent></Card>
        <p className="text-xs text-muted-foreground">Firme con el mouse o lápiz dentro del recuadro. Esta acción registra hash SHA-256 + IP + user agent y es irreversible.</p>
        <canvas
          ref={canvasRef} width={460} height={160}
          className="border border-border rounded bg-background touch-none"
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
        />
        <div className="flex justify-between">
          <Button variant="ghost" onClick={clear}>Limpiar</Button>
          <Button onClick={firmar}>Firmar receta</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
