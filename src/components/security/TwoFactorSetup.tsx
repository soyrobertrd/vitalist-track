import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, KeyRound } from "lucide-react";

interface Factor { id: string; status: string; friendly_name?: string | null; }

export function TwoFactorSetup() {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (!error) setFactors((data?.totp ?? []) as any);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const iniciar = async () => {
    setBusy(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `TOTP ${new Date().toLocaleDateString()}`,
    });
    setBusy(false);
    if (error || !data) { toast.error(error?.message ?? "Error al iniciar 2FA"); return; }
    setEnrollment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const verificar = async () => {
    if (!enrollment || code.length !== 6) return;
    setBusy(true);
    const { data: ch, error: ce } = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
    if (ce || !ch) { setBusy(false); toast.error(ce?.message ?? "Error en challenge"); return; }
    const { error: ve } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId, challengeId: ch.id, code,
    });
    setBusy(false);
    if (ve) { toast.error(ve.message); return; }
    toast.success("2FA activado correctamente");
    setEnrollment(null); setCode("");
    cargar();
  };

  const remover = async (factorId: string) => {
    setBusy(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("2FA desactivado");
    cargar();
  };

  const activos = factors.filter((f) => f.status === "verified");

  if (loading) return <p className="text-sm text-muted-foreground">Cargando 2FA…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <KeyRound className="h-4 w-4" /> Autenticación en dos factores (TOTP)
          </h3>
          <p className="text-sm text-muted-foreground">
            Protege tu cuenta de admin con una app como Google Authenticator o Authy.
          </p>
        </div>
        {activos.length > 0
          ? <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"><ShieldCheck className="h-3 w-3 mr-1" />Activo</Badge>
          : <Badge variant="outline"><ShieldOff className="h-3 w-3 mr-1" />Inactivo</Badge>}
      </div>

      {activos.length > 0 && !enrollment && (
        <div className="space-y-2">
          {activos.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{f.friendly_name || "TOTP"}</p>
                <p className="text-xs text-muted-foreground">ID: {f.id.slice(0, 8)}…</p>
              </div>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => remover(f.id)}>
                Desactivar
              </Button>
            </div>
          ))}
        </div>
      )}

      {activos.length === 0 && !enrollment && (
        <Button onClick={iniciar} disabled={busy}>Activar 2FA</Button>
      )}

      {enrollment && (
        <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
          <p className="text-sm">1. Escanea el código QR con tu app de autenticación:</p>
          <div className="flex justify-center bg-white p-3 rounded-lg" dangerouslySetInnerHTML={{ __html: enrollment.qr }} />
          <div className="text-xs text-muted-foreground">
            ¿No puedes escanear? Usa la clave: <code className="px-1 py-0.5 bg-background rounded">{enrollment.secret}</code>
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">2. Ingresa el código de 6 dígitos</Label>
            <Input id="otp" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                   placeholder="123456" inputMode="numeric" maxLength={6} />
          </div>
          <div className="flex gap-2">
            <Button onClick={verificar} disabled={busy || code.length !== 6}>Verificar y activar</Button>
            <Button variant="outline" onClick={() => { setEnrollment(null); setCode(""); }} disabled={busy}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
