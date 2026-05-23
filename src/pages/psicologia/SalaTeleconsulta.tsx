import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
// auth user fetched directly from supabase below
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Video, PhoneOff, Lock, Loader2 } from "lucide-react";
import ChatTeleconsulta from "@/components/psicologia/ChatTeleconsulta";
import DocumentosCompartidos from "@/components/psicologia/DocumentosCompartidos";
import ConsentimientoTeleconsulta from "@/components/psicologia/ConsentimientoTeleconsulta";

export default function SalaTeleconsulta() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [user, setUser] = useState<any>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUser(data.user)); }, []);
  const [tc, setTc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consentOpen, setConsentOpen] = useState(false);
  const [enSala, setEnSala] = useState(false);

  const cargar = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("teleconsultas").select("*").eq("id", id).maybeSingle();
    if (error) { toast.error(error.message); return; }
    setTc(data);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [id]);

  const jitsiUrl = useMemo(() => {
    if (!tc?.sala_codigo) return "";
    const name = (user?.email || "Usuario").split("@")[0];
    return `https://meet.jit.si/lovable-psico-${tc.sala_codigo}#userInfo.displayName="${encodeURIComponent(name)}"&config.prejoinPageEnabled=false&config.disableDeepLinking=true`;
  }, [tc, user]);

  const iniciar = async () => {
    if (!tc.consentimiento_id) {
      setConsentOpen(true);
      return;
    }
    await supabase.from("teleconsultas").update({
      estado: "en_curso", inicio_at: new Date().toISOString(),
    }).eq("id", id);
    setEnSala(true);
    cargar();
  };

  const finalizar = async () => {
    const fin = new Date();
    const dur = tc.inicio_at ? Math.round((fin.getTime() - new Date(tc.inicio_at).getTime()) / 60000) : null;
    await supabase.from("teleconsultas").update({
      estado: "finalizada", fin_at: fin.toISOString(), duracion_min: dur,
    }).eq("id", id);
    toast.success("Teleconsulta finalizada");
    nav("/psicologia-pro?tab=sesiones");
  };

  const tieneConsentimiento = !!tc?.consentimiento_id;

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!tc) return <div className="p-8">Teleconsulta no encontrada.</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" /> Sala virtual
          </h1>
          <p className="text-xs text-muted-foreground">
            Código sala: <code>{tc.sala_codigo?.slice(0,8)}</code> · PIN paciente: <code>{tc.pin_paciente}</code>
          </p>
        </div>
        <Badge variant={tc.estado === "en_curso" ? "default" : "secondary"}>{tc.estado}</Badge>
      </div>

      {!enSala && tc.estado !== "en_curso" && (
        <Card>
          <CardHeader><CardTitle>Pre-check</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              {tieneConsentimiento ? (
                <span className="flex items-center gap-2 text-green-600"><Lock className="h-4 w-4" />Consentimiento firmado</span>
              ) : (
                <span className="text-amber-600">Falta firmar el consentimiento del paciente.</span>
              )}
            </p>
            <div className="flex gap-2">
              {!tieneConsentimiento && (
                <Button variant="outline" onClick={() => setConsentOpen(true)}>Firmar consentimiento</Button>
              )}
              <Button onClick={iniciar} disabled={!tieneConsentimiento}>
                <Video className="h-4 w-4 mr-1" />Iniciar teleconsulta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(enSala || tc.estado === "en_curso") && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <div className="space-y-3">
            <div className="aspect-video bg-black rounded overflow-hidden">
              <iframe
                src={jitsiUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                title="Videoconferencia"
              />
            </div>
            <Button variant="destructive" onClick={finalizar}>
              <PhoneOff className="h-4 w-4 mr-1" />Finalizar sesión
            </Button>
          </div>
          <div className="space-y-3 h-[calc(100vh-200px)] flex flex-col">
            <div className="flex-1 min-h-[300px]">
              <ChatTeleconsulta
                teleconsultaId={tc.id}
                autorTipo="terapeuta"
                autorUserId={user?.id}
              />
            </div>
            <DocumentosCompartidos
              teleconsultaId={tc.id}
              workspaceId={tc.workspace_id}
              pacienteId={tc.paciente_id}
            />
          </div>
        </div>
      )}

      <ConsentimientoTeleconsulta
        open={consentOpen}
        onOpenChange={setConsentOpen}
        workspaceId={tc.workspace_id}
        pacienteId={tc.paciente_id}
        onSigned={async (consentId) => {
          await supabase.from("teleconsultas").update({ consentimiento_id: consentId }).eq("id", id);
          cargar();
        }}
      />
    </div>
  );
}
