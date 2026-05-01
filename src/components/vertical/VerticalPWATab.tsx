import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Wifi, WifiOff, Camera, Bell, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function VerticalPWATab() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleInstall);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setCanInstall(false);
    setDeferredPrompt(null);
  };

  const features = [
    { icon: Smartphone, label: "App instalable", desc: "Instala desde el navegador como app nativa", ready: true },
    { icon: isOnline ? Wifi : WifiOff, label: "Estado de conexión", desc: isOnline ? "Conectado" : "Sin conexión — modo offline activo", ready: true },
    { icon: Camera, label: "Cámara clínica", desc: "Captura fotos clínicas directamente", ready: true },
    { icon: Bell, label: "Notificaciones push", desc: "Alertas de citas y recordatorios", ready: true },
    { icon: Download, label: "Cache offline", desc: "Datos clínicos disponibles sin internet", ready: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">App Móvil / PWA</h3>
        <Badge variant={isOnline ? "default" : "destructive"}>
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {canInstall && (
        <Card className="p-4 border-primary/50 bg-primary/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Instalar aplicación</p>
              <p className="text-sm text-muted-foreground">Acceso rápido desde tu pantalla de inicio</p>
            </div>
            <Button onClick={handleInstall}><Download className="h-4 w-4 mr-1" /> Instalar</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <Card key={f.label}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10"><f.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{f.label}</p>
                    <Badge variant="outline" className="text-[10px]">{f.ready ? "Disponible" : "Próximamente"}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="py-6 text-center">
          <Smartphone className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <h4 className="font-medium mb-1">Cómo instalar</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>iPhone:</strong> Safari → Compartir → Agregar a pantalla de inicio</p>
            <p><strong>Android:</strong> Chrome → Menú (⋮) → Instalar aplicación</p>
            <p><strong>Desktop:</strong> Barra de dirección → Icono de instalación</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
