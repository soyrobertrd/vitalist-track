import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface InvitationDetails {
  valid: boolean;
  email?: string;
  role?: string;
  workspace_name?: string;
  expires_at?: string;
  error?: string;
}

export default function AceptarInvitacion() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();
  const { refresh, switchWorkspace } = useWorkspace();

  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) {
      setDetails({ valid: false, error: "Token no provisto" });
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("get_invitation_details", { _token: token });
      if (error) {
        setDetails({ valid: false, error: error.message });
      } else {
        setDetails(data as InvitationDetails);
      }
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    const { data, error } = await supabase.rpc("accept_workspace_invitation", { _token: token });
    setAccepting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as { success: boolean; workspace_id?: string; error?: string; already_member?: boolean };
    if (!result.success) {
      toast.error(result.error || "No se pudo aceptar la invitación");
      return;
    }
    toast.success(result.already_member ? "Ya eras miembro de esta organización" : "¡Bienvenido a la organización!");
    await refresh();
    if (result.workspace_id) switchWorkspace(result.workspace_id);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!details?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitación no válida</CardTitle>
            <CardDescription>{details?.error || "Esta invitación ya no es válida."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate("/")}>Volver al inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si no hay sesión, pedir registro
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Te invitaron a {details.workspace_name}</CardTitle>
            <CardDescription>
              Como <strong>{details.role === "admin" ? "Administrador" : "Miembro"}</strong>. Inicia sesión o regístrate con <strong>{details.email}</strong> para aceptar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => navigate(`/auth?redirect=/aceptar-invitacion?token=${token}&email=${encodeURIComponent(details.email!)}`)}>
              Iniciar sesión / Registrarme
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Únete a {details.workspace_name}</CardTitle>
          <CardDescription>
            Aceptando como <strong>{details.email}</strong> con rol <strong>{details.role === "admin" ? "Administrador" : "Miembro"}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleAccept} disabled={accepting}>
            {accepting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Aceptar invitación
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
