import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";

interface ConfiguracionSeguridadTabProps {
  changingPassword: boolean;
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  setPasswordData: React.Dispatch<
    React.SetStateAction<{
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }>
  >;
  onPasswordChange: (e: React.FormEvent) => void;
}

export function ConfiguracionSeguridadTab({
  changingPassword,
  passwordData,
  setPasswordData,
  onPasswordChange,
}: ConfiguracionSeguridadTabProps) {
  return (
    <GlassCard className="p-6 space-y-6 shadow-none">
      <div>
        <h2 className="text-2xl font-bold mb-2">Seguridad</h2>
        <p className="text-muted-foreground">
          Actualiza tu contraseña y gestiona la seguridad de tu cuenta
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Cambiar Contraseña</h3>
          <form onSubmit={onPasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? "Actualizando..." : "Actualizar Contraseña"}
            </Button>
          </form>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Autenticación de Dos Factores (2FA)</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Añade una capa adicional de seguridad a tu cuenta
          </p>
          <TwoFactorSetup />
        </div>
      </div>
    </GlassCard>
  );
}
