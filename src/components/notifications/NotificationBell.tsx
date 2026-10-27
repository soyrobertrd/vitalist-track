import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Calendar, AlertTriangle, Sparkles, Check, Clock } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "cita" | "alerta" | "sistema";
  read: boolean;
  url: string;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Cita médica confirmada",
      description: "Ana Pérez ha confirmado su consulta ambulatoria para hoy a las 09:30 AM.",
      time: "Hace 15 min",
      type: "cita",
      read: false,
      url: "/app/citas",
    },
    {
      id: "notif-2",
      title: "Recordatorio por enviar",
      description: "3 pacientes tienen citas programadas para mañana sin confirmación.",
      time: "Hace 1 hora",
      type: "alerta",
      read: false,
      url: "/app/citas",
    },
    {
      id: "notif-3",
      title: "Capacidad del centro",
      description: `Operando en ${currentWorkspace?.nombre || "tu centro"} con cuota médica activa.`,
      time: "Hoy",
      type: "sistema",
      read: true,
      url: "/app/planes",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClickItem = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    setOpen(false);
    navigate(item.url);
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "cita":
        return <Calendar className="h-4 w-4 text-primary" />;
      case "alerta":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "sistema":
        return <Sparkles className="h-4 w-4 text-primary" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} no leídas)` : ""}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground tabular-nums">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-md border-border" align="end">
        <div className="flex items-center justify-between p-3.5 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Notificaciones</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                {unreadCount} nuevas
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar leídas
            </Button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">
              No tienes notificaciones pendientes
            </p>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleClickItem(item)}
                className={`p-3 text-left cursor-pointer transition-colors hover:bg-muted/50 flex gap-3 items-start ${
                  !item.read ? "bg-primary/5" : ""
                }`}
              >
                <div className="p-1.5 rounded-full bg-background border mt-0.5 shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-medium truncate ${!item.read ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t text-center bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              navigate("/app/citas");
            }}
            className="w-full text-xs h-7 text-primary hover:text-primary"
          >
            Ver todas las citas y avisos
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
