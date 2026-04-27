/**
 * Bloque de configuración de videoconsulta para una visita.
 * Se inserta dentro de los formularios de visita cuando modalidad === "virtual".
 */
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Video, Wand2, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import {
  VIDEO_PROVEEDORES,
  generarSalaJitsi,
  validarEnlaceVideo,
  type VideoProveedor,
} from "@/lib/videoLinks";
import { toast } from "sonner";

interface VideoConsultaFieldsProps {
  proveedor: VideoProveedor | null;
  enlace: string;
  notas: string;
  visitaId?: string | null;
  workspaceSlug?: string | null;
  onChange: (next: { proveedor: VideoProveedor | null; enlace: string; notas: string }) => void;
}

export function VideoConsultaFields({
  proveedor,
  enlace,
  notas,
  visitaId,
  workspaceSlug,
  onChange,
}: VideoConsultaFieldsProps) {
  const [copied, setCopied] = useState(false);
  const proveedorMeta = VIDEO_PROVEEDORES.find((p) => p.value === proveedor);
  const error = enlace && proveedor ? validarEnlaceVideo(proveedor, enlace) : null;

  // Auto-genera Jitsi la primera vez que se selecciona
  useEffect(() => {
    if (proveedor === "jitsi" && !enlace) {
      const url = generarSalaJitsi({
        workspaceSlug,
        visitaId: visitaId ?? crypto.randomUUID(),
      });
      onChange({ proveedor, enlace: url, notas });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proveedor]);

  const handleProveedor = (v: string) => {
    const next = v as VideoProveedor;
    if (next === "jitsi") {
      onChange({
        proveedor: next,
        enlace: generarSalaJitsi({
          workspaceSlug,
          visitaId: visitaId ?? crypto.randomUUID(),
        }),
        notas,
      });
    } else {
      onChange({ proveedor: next, enlace: "", notas });
    }
  };

  const handleCopy = async () => {
    if (!enlace) return;
    await navigator.clipboard.writeText(enlace);
    setCopied(true);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <Video className="h-4 w-4" /> Sala de videoconsulta
      </div>

      <div>
        <Label className="text-xs">Proveedor</Label>
        <Select value={proveedor ?? ""} onValueChange={handleProveedor}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un proveedor…" />
          </SelectTrigger>
          <SelectContent>
            {VIDEO_PROVEEDORES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {proveedor && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs">Enlace de la sala</Label>
            {proveedorMeta?.autoGenera && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() =>
                  onChange({
                    proveedor,
                    enlace: generarSalaJitsi({
                      workspaceSlug,
                      visitaId: visitaId ?? crypto.randomUUID(),
                    }),
                    notas,
                  })
                }
              >
                <Wand2 className="h-3 w-3 mr-1" /> Regenerar
              </Button>
            )}
          </div>
          <div className="flex gap-1">
            <Input
              value={enlace}
              onChange={(e) => onChange({ proveedor, enlace: e.target.value, notas })}
              placeholder={
                proveedor === "zoom"
                  ? "https://us02web.zoom.us/j/…"
                  : proveedor === "meet"
                  ? "https://meet.google.com/abc-defg-hij"
                  : proveedor === "teams"
                  ? "https://teams.microsoft.com/l/meetup-join/…"
                  : "https://…"
              }
              readOnly={proveedor === "jitsi"}
            />
            {enlace && (
              <>
                <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button type="button" variant="outline" size="icon" asChild>
                  <a href={enlace} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
          </div>
          {error && (
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <div>
        <Label className="text-xs">Notas (opcional)</Label>
        <Input
          value={notas}
          onChange={(e) => onChange({ proveedor, enlace, notas: e.target.value })}
          placeholder="Instrucciones para el paciente…"
        />
      </div>

      {proveedor === "jitsi" && (
        <p className="text-xs text-muted-foreground">
          ✓ Sala Jitsi gratuita, sin cuenta. El enlace se incluirá en el ticket público y recordatorios.
        </p>
      )}
    </div>
  );
}
