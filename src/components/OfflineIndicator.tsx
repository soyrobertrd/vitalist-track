import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const { isOnline, hasPendingSync } = useOfflineStatus();

  if (isOnline && !hasPendingSync) {
    return null;
  }

  return (
    <Badge 
      variant={isOnline ? "secondary" : "destructive"}
      className={cn(
        "gap-1.5 animate-pulse",
        !isOnline && "bg-destructive/90"
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      ) : hasPendingSync ? (
        <>
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Sincronizando...</span>
        </>
      ) : null}
    </Badge>
  );
}
