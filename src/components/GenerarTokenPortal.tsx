import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, ExternalLink, Link2 } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface Props {
  pacienteId: string;
  pacienteNombre: string;
}

export function GenerarTokenPortal({ pacienteId, pacienteNombre }: Props) {
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);

  const generar = async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("portal_paciente_tokens").insert({
      workspace_id: currentWorkspace.id,
      paciente_id: pacienteId,
      created_by: user.user?.id,
    }).select("token").single();

    if (error) {
      toast.error("Error al generar token");
    } else {
      const url = `${window.location.origin}/portal-paciente?token=${data.token}`;
      setLink(url);
      toast.success("Enlace generado");
    }
    setLoading(false);
  };

  const copiar = () => {
    navigator.clipboard.writeText(link);
    toast.success("Enlace copiado al portapapeles");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Link2 className="h-4 w-4" /> Portal paciente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Portal del paciente: {pacienteNombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Genera un enlace seguro para que el paciente pueda ver sus citas, recetas, alergias y seguros desde su dispositivo. El enlace expira en 30 días.
          </p>
          {!link ? (
            <Button onClick={generar} disabled={loading} className="w-full">
              {loading ? "Generando..." : "Generar enlace de acceso"}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={link} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={copiar}><Copy className="h-4 w-4" /></Button>
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={() => window.open(link, "_blank")}>
                <ExternalLink className="h-4 w-4" /> Abrir portal
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
