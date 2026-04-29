import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, ScanText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  onCedulaDetectada: (cedula: string, nombres?: string, apellidos?: string) => void;
}

export function OcrCedulaScanner({ onCedulaDetectada }: Props) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagen muy grande (máx 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ocr-cedula", {
          body: { imageBase64: base64 },
        });
        if (error) throw error;
        if (data?.cedula) {
          toast.success(`Cédula detectada: ${data.cedula}`);
          onCedulaDetectada(data.cedula, data.nombres, data.apellidos);
        } else {
          toast.error("No se pudo detectar la cédula. Intente otra foto.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Error al procesar la imagen");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ScanText className="h-5 w-5" /> Escanear cédula (OCR)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Subir o tomar foto de la cédula</Label>
          <Input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={loading}
          />
        </div>
        {preview && (
          <div className="rounded border overflow-hidden">
            <img src={preview} alt="Cédula" className="w-full max-h-48 object-contain bg-muted" />
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Procesando con IA...
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          La imagen no se almacena. Se procesa para extraer cédula y nombres.
        </p>
      </CardContent>
    </Card>
  );
}
