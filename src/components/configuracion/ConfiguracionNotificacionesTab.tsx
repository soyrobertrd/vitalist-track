import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface NotificacionesState {
  email: boolean;
  push: boolean;
  llamadas: boolean;
  visitas: boolean;
}

interface ConfiguracionNotificacionesTabProps {
  notificaciones: NotificacionesState;
  setNotificaciones: React.Dispatch<React.SetStateAction<NotificacionesState>>;
}

export function ConfiguracionNotificacionesTab({
  notificaciones,
  setNotificaciones,
}: ConfiguracionNotificacionesTabProps) {
  const handleGuardar = () => {
    toast.success("Preferencias de notificaciones guardadas");
  };

  return (
    <GlassCard className="p-6 space-y-6 shadow-none">
      <div>
        <h2 className="text-2xl font-bold mb-2">Notificaciones y Alertas</h2>
        <p className="text-muted-foreground">Configura cómo y cuándo recibir notificaciones</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
          <div>
            <Label className="text-base">Notificaciones por Email</Label>
            <p className="text-sm text-muted-foreground">Recibir alertas en tu correo electrónico</p>
          </div>
          <Switch
            checked={notificaciones.email}
            onCheckedChange={(checked) =>
              setNotificaciones({ ...notificaciones, email: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
          <div>
            <Label className="text-base">Notificaciones Push</Label>
            <p className="text-sm text-muted-foreground">Alertas en tiempo real en la aplicación</p>
          </div>
          <Switch
            checked={notificaciones.push}
            onCheckedChange={(checked) =>
              setNotificaciones({ ...notificaciones, push: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
          <div>
            <Label className="text-base">Recordatorios de Llamadas</Label>
            <p className="text-sm text-muted-foreground">Avisos de llamadas programadas</p>
          </div>
          <Switch
            checked={notificaciones.llamadas}
            onCheckedChange={(checked) =>
              setNotificaciones({ ...notificaciones, llamadas: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
          <div>
            <Label className="text-base">Recordatorios de Visitas</Label>
            <p className="text-sm text-muted-foreground">Avisos de visitas programadas</p>
          </div>
          <Switch
            checked={notificaciones.visitas}
            onCheckedChange={(checked) =>
              setNotificaciones({ ...notificaciones, visitas: checked })
            }
          />
        </div>

        <Button onClick={handleGuardar}>Guardar Preferencias</Button>
      </div>
    </GlassCard>
  );
}
