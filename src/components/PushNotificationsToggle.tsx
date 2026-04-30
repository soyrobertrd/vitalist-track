import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, BellRing } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationsToggle() {
  const { supported, permission, subscribed, enable } = usePushNotifications();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BellRing className="h-5 w-5" /> Notificaciones del navegador
        </CardTitle>
        <CardDescription>
          Recibe alertas críticas de auditoría aunque la pestaña esté en segundo plano.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!supported && (
          <p className="text-sm text-muted-foreground">Tu navegador no soporta notificaciones push.</p>
        )}
        {supported && (
          <>
            <p className="text-sm">
              Estado actual:{" "}
              <strong className={
                permission === "granted" ? "text-green-600" :
                permission === "denied" ? "text-destructive" : "text-muted-foreground"
              }>
                {permission === "granted" ? "Activado" : permission === "denied" ? "Bloqueado" : "Sin configurar"}
              </strong>
            </p>
            <Button onClick={enable} disabled={permission === "denied"}>
              {subscribed
                ? <><Bell className="h-4 w-4 mr-2" />Re-suscribir</>
                : <><BellOff className="h-4 w-4 mr-2" />Activar notificaciones</>}
            </Button>
            {permission === "denied" && (
              <p className="text-xs text-muted-foreground">
                Habilita notificaciones desde la configuración del navegador para este sitio.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
