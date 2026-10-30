import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Baby, Activity, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface SilvermanApgarCalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGuardarScores?: (apgar: number, silverman: number) => void;
}

export const SilvermanApgarCalculatorModal: React.FC<SilvermanApgarCalculatorModalProps> = ({
  open,
  onOpenChange,
  onGuardarScores,
}) => {
  // Estado APGAR
  const [apgarFc, setApgarFc] = useState(2); // 0, 1, 2
  const [apgarResp, setApgarResp] = useState(2);
  const [apgarTono, setApgarTono] = useState(2);
  const [apgarReflejo, setApgarReflejo] = useState(2);
  const [apgarColor, setApgarColor] = useState(1);

  // Estado Silverman-Andersen
  const [silvermanTorax, setSilvermanTorax] = useState(0); // 0, 1, 2
  const [silvermanTiraje, setSilvermanTiraje] = useState(0);
  const [silvermanRetraccion, setSilvermanRetraccion] = useState(0);
  const [silvermanAleteo, setSilvermanAleteo] = useState(0);
  const [silvermanQuejido, setSilvermanQuejido] = useState(0);

  const totalApgar = apgarFc + apgarResp + apgarTono + apgarReflejo + apgarColor;
  const totalSilverman =
    silvermanTorax +
    silvermanTiraje +
    silvermanRetraccion +
    silvermanAleteo +
    silvermanQuejido;

  const apgarInterpretacion = () => {
    if (totalApgar >= 7) return { text: "Recién nacido vigoroso / Normal (7-10)", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" };
    if (totalApgar >= 4) return { text: "Depresión moderada (4-6) - Requiere estimulación y O2", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/30" };
    return { text: "Depresión severa (0-3) - Reanimación cardiopulmonar neonatal inmediata (NRP)", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" };
  };

  const silvermanInterpretacion = () => {
    if (totalSilverman === 0) return { text: "Sin dificultad respiratoria (0 puntos)", color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/30" };
    if (totalSilverman <= 3) return { text: "Dificultad respiratoria leve (1-3 puntos)", color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/30" };
    if (totalSilverman <= 6) return { text: "Dificultad respiratoria moderada (4-6 puntos) - CPAP Nasal", color: "text-orange-600", bg: "bg-orange-500/10 border-orange-500/30" };
    return { text: "Dificultad respiratoria severa (7-10 puntos) - Intubación / VMI", color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" };
  };

  const apgarInterp = apgarInterpretacion();
  const silvermanInterp = silvermanInterpretacion();

  const handleGuardar = () => {
    if (onGuardarScores) {
      onGuardarScores(totalApgar, totalSilverman);
    }
    toast.success(`Evaluación neonatal guardada: APGAR ${totalApgar}/10 | Silverman ${totalSilverman}/10`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Baby className="h-5 w-5 text-pink-500" />
            Evaluación Neonatal Inmediata — Test de APGAR & Silverman-Andersen
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="apgar" className="pt-2">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="apgar">Test de APGAR (Vitalidad)</TabsTrigger>
            <TabsTrigger value="silverman">Test de Silverman (Respiratorio)</TabsTrigger>
          </TabsList>

          {/* TAB APGAR */}
          <TabsContent value="apgar" className="space-y-4 pt-2">
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${apgarInterp.bg}`}>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Resultado APGAR:</span>
                <p className={`text-sm font-bold ${apgarInterp.color}`}>{apgarInterp.text}</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-mono font-bold text-foreground">{totalApgar}</span>
                <span className="text-xs text-muted-foreground"> / 10</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* FC */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">1. Frecuencia Cardíaca</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Ausente" },
                    { val: 1, label: "1 — < 100 lpm" },
                    { val: 2, label: "2 — > 100 lpm" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={apgarFc === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setApgarFc(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Esfuerzo Respiratorio */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">2. Esfuerzo Respiratorio</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Ausente" },
                    { val: 1, label: "1 — Débil / Irregular" },
                    { val: 2, label: "2 — Llanto vigoroso" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={apgarResp === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setApgarResp(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tono Muscular */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">3. Tono Muscular</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Flácido" },
                    { val: 1, label: "1 — Cierta flexión" },
                    { val: 2, label: "2 — Movimiento activo" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={apgarTono === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setApgarTono(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reflejos */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">4. Irritabilidad Refleja (Estímulo)</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Sin respuesta" },
                    { val: 1, label: "1 — Muecas" },
                    { val: 2, label: "2 — Tos / Estornudo" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={apgarReflejo === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setApgarReflejo(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">5. Coloración de la Piel</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Azul / Pálido" },
                    { val: 1, label: "1 — Acrocianosis (Cuerpo rosado)" },
                    { val: 2, label: "2 — Completamente rosado" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={apgarColor === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setApgarColor(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB SILVERMAN-ANDERSEN */}
          <TabsContent value="silverman" className="space-y-4 pt-2">
            <div className={`p-3 rounded-2xl border flex items-center justify-between ${silvermanInterp.bg}`}>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase">Score de Silverman-Andersen:</span>
                <p className={`text-sm font-bold ${silvermanInterp.color}`}>{silvermanInterp.text}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">A menor puntuación, mejor ventilación (0 = Normal)</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-mono font-bold text-foreground">{totalSilverman}</span>
                <span className="text-xs text-muted-foreground"> / 10</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Torax */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">1. Movimientos Toraco-Abdominales</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Rítmicos y regulares" },
                    { val: 1, label: "1 — Tórax inmóvil / Abdomen móvil" },
                    { val: 2, label: "2 — Disociación toraco-abdominal (Bamboleo)" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={silvermanTorax === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setSilvermanTorax(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tiraje */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">2. Tiraje Intercostal</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Ausente" },
                    { val: 1, label: "1 — Apenas visible" },
                    { val: 2, label: "2 — Marcado y constante" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={silvermanTiraje === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setSilvermanTiraje(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Retracción xifoidea */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">3. Retracción Xifoidea</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Ausente" },
                    { val: 1, label: "1 — Apenas visible" },
                    { val: 2, label: "2 — Marcada" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={silvermanRetraccion === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setSilvermanRetraccion(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Aleteo nasal */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">4. Aleteo Nasal</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Ausente" },
                    { val: 1, label: "1 — Discreto" },
                    { val: 2, label: "2 — Marcado" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={silvermanAleteo === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setSilvermanAleteo(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quejido espiratorio */}
              <div className="p-2.5 rounded-xl bg-card border border-border/70 space-y-1.5">
                <Label className="text-xs font-semibold">5. Quejido Espiratorio</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0, label: "0 — Ausente" },
                    { val: 1, label: "1 — Audible con fonendoscopio" },
                    { val: 2, label: "2 — Audible a distancia sin estetoscopio" },
                  ].map((opt) => (
                    <Button
                      key={opt.val}
                      type="button"
                      variant={silvermanQuejido === opt.val ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs font-normal"
                      onClick={() => setSilvermanQuejido(opt.val)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button size="sm" onClick={handleGuardar}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Guardar en Registro Neonatal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
