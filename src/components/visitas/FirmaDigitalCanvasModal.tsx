import { useRef, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PenTool, RotateCcw, CheckCircle2, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface FirmaDigitalCanvasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNombre: string;
  onGuardarFirma: (datos: { firmaUrl: string; firmanteNombre: string; parentesco: string }) => void;
}

export function FirmaDigitalCanvasModal({
  open,
  onOpenChange,
  pacienteNombre,
  onGuardarFirma,
}: FirmaDigitalCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(false);
  const [tieneFirma, setTieneFirma] = useState(false);
  const [firmanteNombre, setFirmanteNombre] = useState(pacienteNombre);
  const [parentesco, setParentesco] = useState("Paciente titular");

  useEffect(() => {
    if (open) {
      setFirmanteNombre(pacienteNombre);
      setTieneFirma(false);
      setTimeout(limpiarCanvas, 100);
    }
  }, [open, pacienteNombre]);

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Línea guía
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 35);
    ctx.lineTo(canvas.width - 20, canvas.height - 35);
    ctx.stroke();
    ctx.setLineDash([]);
    setTieneFirma(false);
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const iniciarTrazo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
    setDibujando(true);
    setTieneFirma(true);
  };

  const dibujar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dibujando) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const detenerTrazo = () => {
    setDibujando(false);
  };

  const handleGuardar = () => {
    if (!tieneFirma) {
      toast.error("Por favor solicite la firma del paciente o familiar en pantalla");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onGuardarFirma({
      firmaUrl: dataUrl,
      firmanteNombre: firmanteNombre.trim() || pacienteNombre,
      parentesco: parentesco.trim() || "Paciente titular",
    });
    toast.success("Firma de conformidad registrada correctamente");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-border/80 p-5">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            Firma Digital de Conformidad Domiciliaria
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Firme en el recuadro con el dedo o puntero para avalar la atención recibida en el domicilio.
          </p>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-semibold">Nombre del Firmante</Label>
              <Input
                value={firmanteNombre}
                onChange={e => setFirmanteNombre(e.target.value)}
                className="rounded-xl mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Parentesco / Rol</Label>
              <Input
                value={parentesco}
                onChange={e => setParentesco(e.target.value)}
                className="rounded-xl mt-1 text-xs"
                placeholder="Titular, Hijo/a, Cuidador..."
              />
            </div>
          </div>

          <div className="relative border-2 border-dashed border-border rounded-2xl overflow-hidden bg-white shadow-inner">
            <canvas
              ref={canvasRef}
              width={380}
              height={180}
              className="touch-none w-full h-[180px] cursor-crosshair block"
              onMouseDown={iniciarTrazo}
              onMouseMove={dibujar}
              onMouseUp={detenerTrazo}
              onMouseLeave={detenerTrazo}
              onTouchStart={iniciarTrazo}
              onTouchMove={dibujar}
              onTouchEnd={detenerTrazo}
            />
            <span className="absolute bottom-2 left-4 text-[10px] text-slate-400 pointer-events-none select-none">
              Firma del paciente o familiar responsable
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={limpiarCanvas}
              className="rounded-xl text-muted-foreground hover:text-foreground h-8 px-2 gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Borrar y repetir
            </Button>
            <span className="text-[11px] text-muted-foreground">
              {tieneFirma ? "✓ Firma detectada" : "Esperando trazo..."}
            </span>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" className="rounded-xl text-xs" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="rounded-xl text-xs shadow-none gap-1.5" onClick={handleGuardar}>
            <CheckCircle2 className="h-4 w-4" /> Confirmar Firma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
