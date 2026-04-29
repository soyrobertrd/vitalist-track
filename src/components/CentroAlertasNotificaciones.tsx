import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, Check } from "lucide-react";
import { Link } from "react-router-dom";

interface Notif {
  id: string; titulo: string; cuerpo: string | null; severidad: string | null;
  leido: boolean; created_at: string; alerta_id: string | null;
}

export default function CentroAlertasNotificaciones() {
  const [items, setItems] = useState<Notif[]>([]);

  const cargar = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await (supabase.from("alertas_notificaciones") as any)
      .select("id, titulo, cuerpo, severidad, leido, created_at, alerta_id")
      .eq("destinatario_user_id", u.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as any) || []);
  };

  useEffect(() => { cargar(); }, []);

  const marcarLeido = async (id: string) => {
    await (supabase.from("alertas_notificaciones") as any).update({ leido: true }).eq("id", id);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, leido: true } : n));
  };

  const marcarTodos = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await (supabase.from("alertas_notificaciones") as any).update({ leido: true }).eq("destinatario_user_id", u.user.id).eq("leido", false);
    cargar();
  };

  const noLeidos = items.filter((n) => !n.leido).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {noLeidos > 0 ? <BellRing className="h-5 w-5 text-amber-500 animate-pulse" /> : <Bell className="h-5 w-5" />}
          Notificaciones de seguridad
          {noLeidos > 0 && <Badge variant="destructive">{noLeidos}</Badge>}
        </CardTitle>
        {noLeidos > 0 && <Button size="sm" variant="outline" onClick={marcarTodos}><Check className="h-4 w-4 mr-1" />Marcar todas</Button>}
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin notificaciones</p>}
        {items.map((n) => (
          <div key={n.id} className={`rounded-md border p-3 ${!n.leido ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{n.titulo}</span>
                  {n.severidad && <Badge variant={n.severidad === "alta" ? "destructive" : "default"} className="text-[10px]">{n.severidad}</Badge>}
                </div>
                {n.cuerpo && <p className="text-xs text-muted-foreground mt-1">{n.cuerpo}</p>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("es-DO")}</p>
              </div>
              <div className="flex flex-col gap-1">
                {n.alerta_id && (
                  <Link to={`/auditoria?alerta=${n.alerta_id}`}>
                    <Button size="sm" variant="ghost">Ver</Button>
                  </Link>
                )}
                {!n.leido && (
                  <Button size="sm" variant="ghost" onClick={() => marcarLeido(n.id)}>
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
