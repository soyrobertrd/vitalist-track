import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Globe, Accessibility, Eye, Type, Monitor, Palette } from "lucide-react";

const idiomas = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];

const zonasHorarias = [
  { value: "America/Santo_Domingo", label: "Santo Domingo (AST)" },
  { value: "America/New_York", label: "New York (EST)" },
  { value: "America/Chicago", label: "Chicago (CST)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PST)" },
  { value: "Europe/Madrid", label: "Madrid (CET)" },
  { value: "Europe/Paris", label: "París (CET)" },
];

const formatosFecha = [
  { value: "dd/MM/yyyy", label: "dd/MM/yyyy" },
  { value: "MM/dd/yyyy", label: "MM/dd/yyyy" },
  { value: "yyyy-MM-dd", label: "yyyy-MM-dd" },
];

const formatosMoneda = [
  { value: "DOP", label: "DOP (RD$)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

const tamanosFuente = [
  { value: "normal", label: "Normal" },
  { value: "grande", label: "Grande" },
  { value: "extra_grande", label: "Extra grande" },
];

const tiposDaltonismo = [
  { value: "ninguno", label: "Ninguno" },
  { value: "protanopia", label: "Protanopía (rojo)" },
  { value: "deuteranopia", label: "Deuteranopía (verde)" },
  { value: "tritanopia", label: "Tritanopía (azul)" },
];

export default function VerticalIdiomaAccesibilidadTab() {
  const qc = useQueryClient();

  // Idioma state
  const [idioma, setIdioma] = useState("es");
  const [zona, setZona] = useState("America/Santo_Domingo");
  const [fmtFecha, setFmtFecha] = useState("dd/MM/yyyy");
  const [fmtMoneda, setFmtMoneda] = useState("DOP");

  // Accesibilidad state
  const [altoContraste, setAltoContraste] = useState(false);
  const [tamFuente, setTamFuente] = useState("normal");
  const [reducirMov, setReducirMov] = useState(false);
  const [lectorPantalla, setLectorPantalla] = useState(false);
  const [navTeclado, setNavTeclado] = useState(false);
  const [daltonismo, setDaltonismo] = useState("ninguno");

  const { data: prefIdioma } = useQuery({
    queryKey: ["preferencias_idioma"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await (supabase.from("preferencias_idioma") as any)
        .select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
  });

  const { data: prefAccesibilidad } = useQuery({
    queryKey: ["configuracion_accesibilidad"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await (supabase.from("configuracion_accesibilidad") as any)
        .select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (prefIdioma) {
      setIdioma(prefIdioma.idioma || "es");
      setZona(prefIdioma.zona_horaria || "America/Santo_Domingo");
      setFmtFecha(prefIdioma.formato_fecha || "dd/MM/yyyy");
      setFmtMoneda(prefIdioma.formato_moneda || "DOP");
    }
  }, [prefIdioma]);

  useEffect(() => {
    if (prefAccesibilidad) {
      setAltoContraste(prefAccesibilidad.alto_contraste || false);
      setTamFuente(prefAccesibilidad.tamano_fuente || "normal");
      setReducirMov(prefAccesibilidad.reducir_movimiento || false);
      setLectorPantalla(prefAccesibilidad.lector_pantalla || false);
      setNavTeclado(prefAccesibilidad.navegacion_teclado || false);
      setDaltonismo(prefAccesibilidad.daltonismo || "ninguno");
    }
  }, [prefAccesibilidad]);

  const guardarIdioma = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const payload = { user_id: user.id, idioma, zona_horaria: zona, formato_fecha: fmtFecha, formato_moneda: fmtMoneda };
      const { error } = await (supabase.from("preferencias_idioma") as any).upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Preferencias de idioma guardadas"); qc.invalidateQueries({ queryKey: ["preferencias_idioma"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const guardarAccesibilidad = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");
      const payload = {
        user_id: user.id, alto_contraste: altoContraste, tamano_fuente: tamFuente,
        reducir_movimiento: reducirMov, lector_pantalla: lectorPantalla,
        navegacion_teclado: navTeclado, daltonismo,
      };
      const { error } = await (supabase.from("configuracion_accesibilidad") as any).upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Preferencias de accesibilidad guardadas"); qc.invalidateQueries({ queryKey: ["configuracion_accesibilidad"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Idioma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Globe className="h-5 w-5" /> Idioma y Localización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Idioma</Label>
              <Select value={idioma} onValueChange={setIdioma}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{idiomas.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Zona horaria</Label>
              <Select value={zona} onValueChange={setZona}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{zonasHorarias.map(z => <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Formato de fecha</Label>
              <Select value={fmtFecha} onValueChange={setFmtFecha}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{formatosFecha.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Moneda</Label>
              <Select value={fmtMoneda} onValueChange={setFmtMoneda}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{formatosMoneda.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => guardarIdioma.mutate()}>Guardar preferencias de idioma</Button>
        </CardContent>
      </Card>

      {/* Accesibilidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Accessibility className="h-5 w-5" /> Accesibilidad (WCAG 2.1 AA)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2"><Eye className="h-4 w-4" /><span className="text-sm font-medium">Alto contraste</span></div>
              <Switch checked={altoContraste} onCheckedChange={setAltoContraste} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2"><Monitor className="h-4 w-4" /><span className="text-sm font-medium">Reducir movimiento</span></div>
              <Switch checked={reducirMov} onCheckedChange={setReducirMov} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2"><Accessibility className="h-4 w-4" /><span className="text-sm font-medium">Lector de pantalla</span></div>
              <Switch checked={lectorPantalla} onCheckedChange={setLectorPantalla} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2"><Type className="h-4 w-4" /><span className="text-sm font-medium">Navegación por teclado</span></div>
              <Switch checked={navTeclado} onCheckedChange={setNavTeclado} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Tamaño de fuente</Label>
              <Select value={tamFuente} onValueChange={setTamFuente}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{tamanosFuente.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="flex items-center gap-1"><Palette className="h-3.5 w-3.5" /> Daltonismo</Label>
              <Select value={daltonismo} onValueChange={setDaltonismo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{tiposDaltonismo.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => guardarAccesibilidad.mutate()}>Guardar accesibilidad</Button>
        </CardContent>
      </Card>
    </div>
  );
}
