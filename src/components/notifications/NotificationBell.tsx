import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Calendar, AlertTriangle, Sparkles, Check, Clock, DollarSign } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { db } from "@/integrations/db/client";
import { format, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "cita" | "alerta" | "sistema" | "cobro";
  read: boolean;
  url: string;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { currentWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-demo-1",
      title: "Cita médica confirmada",
      description: "Ana Pérez ha confirmado su consulta ambulatoria para hoy.",
      time: "Hoy",
      type: "cita",
      read: false,
      url: "/app/citas",
    },
  ]);

  // Cargar notificaciones dinámicas reales
  useEffect(() => {
    const fetchAlertas = async () => {
      const hoy = new Date();
      const desde = startOfDay(hoy).toISOString();
      const hasta = endOfDay(hoy).toISOString();

      try {
        const [citasRes, facturasRes] = await Promise.all([
          db
            .from("control_visitas")
            .select("id, fecha_hora_visita, estado, pacientes(nombre, apellido)")
            .gte("fecha_hora_visita", desde)
            .lte("fecha_hora_visita", hasta)
            .eq("estado", "pendiente")
            .limit(4),
          db
            .from("facturas")
            .select("id, monto_total, descripcion, pacientes(nombre, apellido)")
            .eq("estado", "pendiente")
            .limit(3),
        ]);

        const items: NotificationItem[] = [];

        // Alertas de citas próximas
        (citasRes.data || []).forEach((c: any) => {
          const hora = c.fecha_hora_visita ? format(new Date(c.fecha_hora_visita), "hh:mm a") : "Hoy";
          items.push({
            id: `cita-${c.id}`,
            title: `Cita pendiente (${hora})`,
            description: `${c.pacientes?.nombre || "Paciente"} ${c.pacientes?.apellido || ""} tiene cita programada.`,
            time: hora,
            type: "cita",
            read: false,
            url: "/recepcion",
          });
        });

        // Alertas de cobros pendientes
        (facturasRes.data || []).forEach((f: any) => {
          items.push({
            id: `fac-${f.id}`,
            title: "Pago o Copago pendiente",
            description: `${f.pacientes?.nombre || "Paciente"} ${f.pacientes?.apellido || ""}: RD$ ${Number(f.monto_total || 0).toLocaleString()}`,
            time: "Pendiente",
            type: "cobro",
            read: false,
            url: "/recepcion",
          });
        });

        if (items.length > 0) {
          setNotifications(items);
        }
      } catch {
        // En caso de error de red, mantener notificaciones por defecto
      }
    };

    fetchAlertas();
  }, [currentWorkspace?.id]);

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
      case "cobro":
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
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
