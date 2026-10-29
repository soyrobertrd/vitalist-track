import { useState } from "react";
import { FARMACOS_VETERINARIOS, Mascota, FarmacoDosisVet } from "./vet-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, AlertTriangle, CheckCircle2, Copy, Sparkles, Syringe, Pill, Info } from "lucide-react";
import { toast } from "sonner";

interface CalculadoraDosisVetTabProps {
  mascotas: Mascota[];
}

export function CalculadoraDosisVetTab({ mascotas }: CalculadoraDosisVetTabProps) {
  const [mascotaSeleccionadaId, setMascotaSeleccionadaId] = useState<string>(mascotas[0]?.id || "");
  const [pesoManual, setPesoManual] = useState<string>(mascotas[0]?.peso_kg ? String(mascotas[0].peso_kg) : "10");
  const [farmacoId, setFarmacoId] = useState<string>("meloxicam");
  const [especie, setEspecie] = useState<"canino" | "felino">("canino");

  const farmaco = FARMACOS_VETERINARIOS.find(f => f.id === farmacoId) || FARMACOS_VETERINARIOS[0];
  const [concentracion, setConcentracion] = useState<number>(farmaco.concentracion_default_mg_ml);

  // Cuando cambia la mascota seleccionada
  const handleSeleccionarMascota = (id: string) => {
    setMascotaSeleccionadaId(id);
    const m = mascotas.find(p => p.id === id);
    if (m) {
      if (m.peso_kg) setPesoManual(String(m.peso_kg));
      if (m.especie === "gato") setEspecie("felino");
      else setEspecie("canino");
    }
  };

  // Cuando cambia el fármaco
  const handleCambiarFarmaco = (id: string) => {
    setFarmacoId(id);
    const f = FARMACOS_VETERINARIOS.find(item => item.id === id);
    if (f) setConcentracion(f.concentracion_default_mg_ml);
  };

  const pesoNum = Math.max(0.1, Number(pesoManual) || 0);
  const dosisMgKg = especie === "felino" ? farmaco.dosis_felina_mg_kg : farmaco.dosis_canina_mg_kg;

  const dosisTotalMg = Number((pesoNum * dosisMgKg).toFixed(2));
  const volumenMl = concentracion > 0 ? Number((dosisTotalMg / concentracion).toFixed(2)) : 0;

  const handleCopiarIndicacion = () => {
    const texto = `${farmaco.nombre}: Administrar ${volumenMl} ml (${dosisTotalMg} mg) por vía ${farmaco.vias}. Paciente: ${pesoNum} kg (${especie}).`;
    navigator.clipboard.writeText(texto);
    toast.success("Indicación farmacológica copiada al portapapeles");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-600" />
              Calculadora Farmacológica Ponderal Veterinaria
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Cálculo milimétrico de dosis y volumen por kilogramo de peso según especie y presentación comercial
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Paciente y Peso */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Cargar de Paciente</Label>
                <Select value={mascotaSeleccionadaId} onValueChange={handleSeleccionarMascota}>
                  <SelectTrigger className="rounded-xl mt-1 text-xs">
                    <SelectValue placeholder="Elegir..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {mascotas.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre} ({m.peso_kg || "?"} kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Peso del Paciente (kg) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={pesoManual}
                  onChange={e => setPesoManual(e.target.value)}
                  className="rounded-xl mt-1 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Especie Metabólica</Label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  <Button
                    type="button"
                    variant={especie === "canino" ? "default" : "outline"}
                    className="rounded-xl text-xs h-9"
                    onClick={() => setEspecie("canino")}
                  >
                    🐶 Canino
                  </Button>
                  <Button
                    type="button"
                    variant={especie === "felino" ? "default" : "outline"}
                    className="rounded-xl text-xs h-9"
                    onClick={() => setEspecie("felino")}
                  >
                    🐱 Felino
                  </Button>
                </div>
              </div>
            </div>

            {/* Fármaco y Concentración */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div>
                <Label className="text-xs font-semibold">Fármaco Veterinario</Label>
                <Select value={farmacoId} onValueChange={handleCambiarFarmaco}>
                  <SelectTrigger className="rounded-xl mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-72">
                    {FARMACOS_VETERINARIOS.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nombre} ({f.categoria.split("/")[0]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Concentración Comercial (mg/ml)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={concentracion}
                  onChange={e => setConcentracion(Math.max(0.01, Number(e.target.value)))}
                  className="rounded-xl mt-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Ficha del Fármaco */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-foreground text-sm">{farmaco.nombre}</span>
                <Badge variant="outline" className="text-[10px] rounded-full">
                  {farmaco.categoria}
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px]">{farmaco.indicacion}</p>
              <div className="flex flex-wrap gap-4 pt-1 text-[11px]">
                <span>Dosis teórica: <strong className="font-mono text-foreground">{dosisMgKg} mg/kg</strong></span>
                <span>Vías aprobadas: <strong className="text-foreground">{farmaco.vias}</strong></span>
              </div>
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{farmaco.precauciones}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de Resultados y Cálculo */}
      <div className="space-y-4">
        <Card className="rounded-2xl border-border/80 shadow-none bg-muted/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
              Dosis Calculada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-5 bg-card rounded-2xl border border-border/70 space-y-1">
              <span className="text-xs uppercase text-muted-foreground font-semibold block">
                Volumen a Administrar
              </span>
              <span className="text-5xl font-black text-primary tabular-nums font-mono">
                {volumenMl}
              </span>
              <span className="text-2xl font-bold text-muted-foreground"> ml</span>

              <div className="pt-2">
                <Badge className="rounded-full text-xs font-mono font-semibold px-3 py-1 bg-emerald-600 text-white">
                  Equivalente a {dosisTotalMg} mg
                </Badge>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground p-3 bg-card rounded-xl border border-border/60">
              <div className="flex justify-between">
                <span>Peso del paciente:</span>
                <span className="font-mono font-bold text-foreground">{pesoNum} kg</span>
              </div>
              <div className="flex justify-between">
                <span>Dosis seleccionada:</span>
                <span className="font-mono font-bold text-foreground">{dosisMgKg} mg/kg</span>
              </div>
              <div className="flex justify-between">
                <span>Concentración vial:</span>
                <span className="font-mono font-bold text-foreground">{concentracion} mg/ml</span>
              </div>
            </div>

            <Button className="w-full rounded-xl shadow-none" onClick={handleCopiarIndicacion}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar Receta / Posología
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
