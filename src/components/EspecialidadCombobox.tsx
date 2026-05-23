import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  value: string;
  onChange: (v: string) => void;
  categoria?: string;
  placeholder?: string;
}

export function EspecialidadCombobox({ value, onChange, categoria, placeholder = "Seleccionar especialidad" }: Props) {
  const { currentWorkspace } = useWorkspace();
  const [opts, setOpts] = useState<Array<{ nombre: string; categoria: string }>>([]);

  useEffect(() => {
    (async () => {
      let q = supabase.from("especialidades_catalogo").select("nombre,categoria").eq("activo", true).order("nombre");
      if (categoria) q = q.eq("categoria", categoria);
      const { data } = await q;
      setOpts((data as any) || []);
    })();
  }, [currentWorkspace?.id, categoria]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent className="max-h-72">
        {opts.map((o) => (
          <SelectItem key={o.nombre} value={o.nombre}>{o.nombre}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
