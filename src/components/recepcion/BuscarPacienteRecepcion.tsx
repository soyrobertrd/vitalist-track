import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FichaClinicaPaciente } from "@/components/ficha-clinica/FichaClinicaPaciente";

interface Props {
  cedulaInicial?: string;
}

export function BuscarPacienteRecepcion({ cedulaInicial = "" }: Props) {
  const [query, setQuery] = useState(cedulaInicial);
  const [resultados, setResultados] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pacienteSel, setPacienteSel] = useState<string | null>(null);

  const buscar = async (q?: string) => {
    const term = (q ?? query).trim();
    if (term.length < 3) {
      toast.error("Escriba al menos 3 caracteres");
      return;
    }
    setLoading(true);
    const cleaned = term.replace(/\D/g, "");
    let qb = supabase
      .from("pacientes")
      .select("id, nombre, apellido, cedula, fecha_nacimiento, numero_principal, contacto_px")
      .limit(10);
    if (cleaned.length >= 8) {
      qb = qb.ilike("cedula", `%${cleaned}%`);
    } else {
      qb = qb.or(`nombre.ilike.%${term}%,apellido.ilike.%${term}%,cedula.ilike.%${term}%`);
    }
    const { data, error } = await qb;
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResultados(data || []);
    if (!data || data.length === 0) toast.info("Sin resultados");
  };

  // permitir trigger externo
  if (cedulaInicial && cedulaInicial !== query) {
    setQuery(cedulaInicial);
    setTimeout(() => buscar(cedulaInicial), 100);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" /> Buscar paciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Cédula, nombre o apellido"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && buscar()}
            />
            <Button onClick={() => buscar()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {resultados.length > 0 && (
            <div className="space-y-2">
              {resultados.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between border rounded p-3 hover:bg-muted/50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{p.nombre} {p.apellido}</p>
                      <p className="text-xs text-muted-foreground">
                        Cédula: {p.cedula || "—"}
                        {p.numero_principal ? ` · ${p.numero_principal}` : ""}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setPacienteSel(p.id)}>
                    <FileText className="h-4 w-4 mr-1" /> Historial
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pacienteSel} onOpenChange={(o) => !o && setPacienteSel(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial clínico</DialogTitle>
          </DialogHeader>
          {pacienteSel && <FichaClinicaPaciente pacienteId={pacienteSel} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
