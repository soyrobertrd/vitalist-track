import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Palette, Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  preview: string;
}

const colorPresets: ColorPreset[] = [
  { name: "Azul Clásico", primary: "217 91% 60%", secondary: "142 76% 36%", accent: "199 89% 48%", preview: "#3B82F6" },
  { name: "Verde Médico", primary: "142 76% 36%", secondary: "199 89% 48%", accent: "217 91% 60%", preview: "#22C55E" },
  { name: "Púrpura Elegante", primary: "262 83% 58%", secondary: "280 65% 60%", accent: "199 89% 48%", preview: "#8B5CF6" },
  { name: "Naranja Cálido", primary: "25 95% 53%", secondary: "38 92% 50%", accent: "199 89% 48%", preview: "#F97316" },
  { name: "Teal Moderno", primary: "173 80% 40%", secondary: "199 89% 48%", accent: "217 91% 60%", preview: "#14B8A6" },
  { name: "Rosa Suave", primary: "330 81% 60%", secondary: "340 82% 52%", accent: "199 89% 48%", preview: "#EC4899" },
];

interface ThemeCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemeCustomizer({ open, onOpenChange }: ThemeCustomizerProps) {
  const { theme, setTheme } = useTheme();
  const [selectedPreset, setSelectedPreset] = useState<ColorPreset | null>(null);
  const [saving, setSaving] = useState(false);

  const applyPreset = async (preset: ColorPreset) => {
    setSelectedPreset(preset);
    
    // Apply CSS variables
    const root = document.documentElement;
    root.style.setProperty('--primary', preset.primary);
    root.style.setProperty('--secondary', preset.secondary);
    root.style.setProperty('--accent', preset.accent);
    
    // Save to user settings
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        toast.success(`Tema "${preset.name}" aplicado`);
      }
    } catch (error) {
      console.error("Error saving theme:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Personalización de Tema
          </DialogTitle>
          <DialogDescription>
            Personaliza los colores y apariencia de tu interfaz
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label>Modo de Apariencia</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "light", label: "Claro", icon: Sun },
                { value: "dark", label: "Oscuro", icon: Moon },
                { value: "standard", label: "Mixto", icon: Monitor },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? "default" : "outline"}
                  className="flex flex-col gap-2 h-20"
                  onClick={() => setTheme(value as any)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Color Presets */}
          <div className="space-y-3">
            <Label>Esquema de Colores</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {colorPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    "relative p-4 rounded-lg border-2 transition-all hover:scale-105",
                    selectedPreset?.name === preset.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full shadow-inner"
                      style={{ backgroundColor: preset.preview }}
                    />
                    <span className="text-sm font-medium">{preset.name}</span>
                  </div>
                  {selectedPreset?.name === preset.name && (
                    <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <Label>Vista Previa</Label>
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  P
                </div>
                <div>
                  <p className="font-medium text-foreground">Ejemplo de Tarjeta</p>
                  <p className="text-sm text-muted-foreground">Vista previa de colores</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm">Primario</Button>
                <Button size="sm" variant="secondary">Secundario</Button>
                <Button size="sm" variant="outline">Outline</Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}