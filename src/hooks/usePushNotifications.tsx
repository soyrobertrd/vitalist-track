import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
};

// Public VAPID key - se setea como secret VITE_VAPID_PUBLIC_KEY si se quiere
const VAPID_PUBLIC_KEY = ""; // placeholder, las notifs locales del SW funcionan sin push real

export function usePushNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const ok = "Notification" in window && "serviceWorker" in navigator;
    setSupported(ok);
    if (ok) setPermission(Notification.permission);
  }, []);

  const enable = useCallback(async () => {
    if (!supported) {
      toast.error("Tu navegador no soporta notificaciones");
      return false;
    }
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.error("Permiso denegado");
        return false;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub && VAPID_PUBLIC_KEY) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      if (sub) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const json = sub.toJSON() as any;
          await supabase.from("push_subscriptions").upsert({
            user_id: user.id,
            endpoint: sub.endpoint,
            p256dh: json.keys?.p256dh ?? "",
            auth_key: json.keys?.auth ?? "",
            user_agent: navigator.userAgent,
            activo: true,
          }, { onConflict: "endpoint" });
        }
        setSubscribed(true);
      } else {
        // Sin VAPID, al menos podemos mostrar notificaciones locales desde la app
        setSubscribed(true);
      }
      toast.success("Notificaciones activadas");
      return true;
    } catch (e: any) {
      toast.error(e.message);
      return false;
    }
  }, [supported]);

  const notify = useCallback((title: string, body: string) => {
    if (permission !== "granted") return;
    new Notification(title, { body, icon: "/placeholder.svg" });
  }, [permission]);

  return { supported, permission, subscribed, enable, notify };
}
