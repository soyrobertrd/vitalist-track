import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Stethoscope, CheckCircle2, ShieldCheck, HeartPulse, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface FastHugsItem {
  id: string;
  letra: string;
  concepto: string;
  descripcion: string;
  cumplido: boolean;
  observacion?: string;
}

const ITEMS_FAST_HUGS_INICIALES: FastHugsItem[] = [
  { id: "f", letra: "F", concepto: "Feeding (Nutrición)", descripcion: "Nutrición enteral u oral tolerada / calculada", cumplido: true },
  { id: "a", letra: "A", concepto: "Analgesia", descripcion: "Evaluación del dolor (EVA < 3/10) sin exceso de opioides", cumplido: true },
  { id: "s", letra: "S", concepto: "Sedation (Sedación)", descripcion: "Nivel de sedación RASS objetivo evaluado", cumplido: true },
  { id: "t", letra: "T", concepto: "Thromboprophylaxis", descripcion: "Profilaxis tromboembólica mecánica o farmacológica activa", cumplido: true },
  { id: "h", letra: "H", concepto: "Head of bed", descripcion: "Cabecera a 30° - 45° para prevenir neumonía por aspiración", cumplido: true },
  { id: "u", letra: "U", concepto: "Ulcer prophylaxis", descripcion: "Protección gástrica antiácida indicada en pacientes de riesgo", cumplido: true },
  { id: "g", letra: "G", concepto: "Glycemic control", descripcion: "Glucemias capilares en rango objetivo (140-180 mg/dL)", cumplido: true },
  { id: "s2", letra: "S", concepto: "Spontaneous / Sondas", descripcion: "¿Se puede retirar sonda vesical o vía venosa central hoy?", cumplido: false },
  { id: "b", letra: "B", concepto: "Bowel function", descripcion: "Presencia de ruidos hidroaéreos y tránsito intestinal", cumplido: true },
  { id: "i", letra: "I", concepto: "Infection / Catheters", descripcion: "Inspección de signos de flebitis en accesos invasivos", cumplido: true },
  { id: "d", letra: "D", concepto: "De-escalation", descripcion: "¿Cultivos listos para desescalar o suspender antibióticos?", cumplido: false },
];

interface FastHugsChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNombre: string;
  cama: string;
  onGuardarChecklist: (items: FastHugsItem[], notas: string) => void;
}

export function FastHugsChecklistModal({
  open,
  onOpenChange,
  pacienteNombre,
  cama,
  onGuardarChecklist,
}: FastHugsChecklistModalProps) {
  const [items, setItems] = useState<FastHugsItem[]>(ITEMS_FAST_HUGS_INICIALES);
  const [notasRonda, setNotasRonda] = useState("Paciente con evolución favorable. Se retira sonda vesical a las 14:00 y se pasa antibiótico a vía oral.");

  const handleToggle = (id: string) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, cumplido: !item.cumplido } : item)));
  };

  const cumplidos = items.filter(i => i.cumplido).length;
  const porcentaje = Math.round((cumplidos / items.length) * 100);

  const handleGuardar = () => {
    onGuardarChecklist(items, notasRonda);
    toast.success(`Checklist FAST-HUGS-BID registrado (${porcentaje}% cumplimiento).`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-teal-700 bg-teal-50 dark:bg-teal-950/40 border-teal-300 gap-1 text-[11px]">
                <Stethoscope className="h-3.5 w-3.5" /> Protocolo Multidisciplinar FAST-HUGS-BID
              </Badge>
              <Badge className="bg-primary text-primary-foreground text-[10px] font-mono">
                {porcentaje}% Verificado
              </Badge>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-muted text-foreground">
              {cama}
            </span>
          </div>
          <DialogTitle className="text-base font-bold text-foreground mt-1">
            Pase de Visita Multidisciplinar: {pacienteNombre}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Bundle internacional de prevención de eventos adversos e infecciones asociadas a la atención médica.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Grid de Ítems del Mnemónico FAST-HUGS-BID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {items.map(item => (
              <div
                key={item.id}
                onClick={() => handleToggle(item.id)}
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  item.cumplido
                    ? "bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200"
                    : "bg-muted/30 border-border/70 text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <Checkbox
                  checked={item.cumplido}
                  onCheckedChange={() => handleToggle(item.id)}
                  className="mt-0.5 rounded-md"
                />
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-mono">
                      {item.letra}
                    </span>
                    <span className="truncate">{item.concepto}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-tight">{item.descripcion}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plan del Día & Decisiones Clínicas de la Ronda */}
          <div className="space-y-1.5 pt-2">
            <Label className="text-xs font-semibold text-foreground">
              Plan del Día & Decisiones del Equipo Multidisciplinar:
            </Label>
            <Textarea
              rows={3}
              value={notasRonda}
              onChange={e => setNotasRonda(e.target.value)}
              placeholder="Conducta médica acordada en ronda (medicación, retiro de sondas, solicitud de laboratorios, movilización fuera de cama)..."
              className="text-xs rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Cancelar
          </Button>
          <Button size="sm" onClick={handleGuardar} className="rounded-xl text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            Certificar Ronda Médica
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
