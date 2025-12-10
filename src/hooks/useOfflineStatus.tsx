import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexión restaurada", {
        description: "Los datos se sincronizarán automáticamente"
      });
      
      // Trigger background sync if supported
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          // @ts-ignore - sync is not in the standard types yet
          if (registration.sync) {
            // @ts-ignore
            registration.sync.register('sync-pending-actions');
          }
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Sin conexión", {
        description: "Trabajando en modo offline. Los cambios se guardarán localmente."
      });
    };

    // Listen for service worker messages
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_COMPLETE') {
        setHasPendingSync(false);
        toast.success("Sincronización completada");
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleSWMessage);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleSWMessage);
    };
  }, []);

  const savePendingAction = (action: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  }) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SAVE_PENDING_ACTION',
        action
      });
      setHasPendingSync(true);
    }
  };

  const cacheData = (storeName: string, data: any) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_DATA',
        storeName,
        data
      });
    }
  };

  return {
    isOnline,
    hasPendingSync,
    savePendingAction,
    cacheData
  };
}
