import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Smartphone, RefreshCw, WifiOff, Wifi, Trash2 } from "lucide-react";

export default function PWAOffline() {
  const { currentWorkspace } = useWorkspace();
  const [queue, setQueue] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => { window.removeEventListener("online", onOn); window.removeEventListener("offline", onOff); };
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [q, d] = await Promise.all([
      supabase.from("offline_sync_queue").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
      supabase.from("device_registrations").select("*").eq("user_id", user.id),
    ]);
    setQueue(q.data || []);
    setDevices(d.data || []);
  };

  useEffect(() => { load(); }, [currentWorkspace?.id]);

  const registrarDispositivo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !currentWorkspace) return;
    const deviceId = localStorage.getItem("device_id") || crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
    const platform = /Mobi|Android/i.test(navigator.userAgent) ? "android" : /iPhone|iPad/i.test(navigator.userAgent) ? "ios" : "web";
    const { error } = await supabase.from("device_registrations").upsert({
      user_id: user.id,
      workspace_id: currentWorkspace.id,
      device_id: deviceId,
      device_name: navigator.userAgent.substring(0, 80),
      platform,
      app_version: "1.0.0",
      last_sync_at: new Date().toISOString(),
      activo: true,
    }, { onConflict: "user_id,device_id" });
    if (error) { toast.error(error.message); return; }
    toast.success("Dispositivo registrado");
    load();
  };

  const sincronizar = async () => {
    setSyncing(true);
    const pendientes = queue.filter(q => q.estado === "pendiente");
    let ok = 0, fail = 0;
    for (const item of pendientes) {
      try {
        // Replay operation
        if (item.operation_type === "insert") {
          const { error } = await supabase.from(item.table_name as any).insert(item.payload);
          if (error) throw error;
        } else if (item.operation_type === "update" && item.record_id) {
          const { error } = await supabase.from(item.table_name as any).update(item.payload).eq("id", item.record_id);
          if (error) throw error;
        } else if (item.operation_type === "delete" && item.record_id) {
          const { error } = await supabase.from(item.table_name as any).delete().eq("id", item.record_id);
          if (error) throw error;
        }
        await supabase.from("offline_sync_queue").update({
          estado: "sincronizado",
          synced_at: new Date().toISOString(),
        }).eq("id", item.id);
        ok++;
      } catch (e: any) {
        await supabase.from("offline_sync_queue").update({
          estado: "error",
          intentos: (item.intentos || 0) + 1,
          error_message: e.message,
        }).eq("id", item.id);
        fail++;
      }
    }
    setSyncing(false);
    toast.success(`Sync: ${ok} OK, ${fail} fallos`);
    load();
  };

  const limpiarSincronizados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("offline_sync_queue").delete().eq("user_id", user.id).eq("estado", "sincronizado");
    toast.success("Cola limpia");
    load();
  };

  const stats = {
    pendientes: queue.filter(q => q.estado === "pendiente").length,
    sincronizados: queue.filter(q => q.estado === "sincronizado").length,
    errores: queue.filter(q => q.estado === "error").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">PWA Offline & Dispositivos</h1>
          <p className="text-muted-foreground">Sincronización offline y gestión de dispositivos móviles</p>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? <Badge className="bg-green-500"><Wifi className="h-3 w-3 mr-1" />En línea</Badge>
                    : <Badge variant="destructive"><WifiOff className="h-3 w-3 mr-1" />Sin conexión</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-orange-500">{stats.pendientes}</div><p className="text-xs text-muted-foreground">Pendientes</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-green-500">{stats.sincronizados}</div><p className="text-xs text-muted-foreground">Sincronizados</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold text-destructive">{stats.errores}</div><p className="text-xs text-muted-foreground">Errores</p></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{devices.length}</div><p className="text-xs text-muted-foreground">Dispositivos</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cola de sincronización</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={limpiarSincronizados}><Trash2 className="h-4 w-4 mr-1" />Limpiar</Button>
              <Button size="sm" onClick={sincronizar} disabled={!isOnline || syncing || stats.pendientes === 0}>
                <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? "animate-spin" : ""}`} />Sincronizar ahora
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-auto">
            {queue.map(q => (
              <div key={q.id} className="border rounded p-2 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{q.operation_type}</Badge>
                  <span className="font-mono text-xs">{q.table_name}</span>
                  <Badge variant={q.estado === "sincronizado" ? "default" : q.estado === "error" ? "destructive" : "secondary"}>{q.estado}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(q.client_timestamp).toLocaleString()}</span>
              </div>
            ))}
            {queue.length === 0 && <p className="text-sm text-muted-foreground">Sin operaciones en cola. Las acciones realizadas offline aparecerán aquí.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dispositivos registrados</CardTitle>
            <Button size="sm" onClick={registrarDispositivo}><Smartphone className="h-4 w-4 mr-1" />Registrar este dispositivo</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {devices.map(d => (
              <div key={d.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    {d.platform?.toUpperCase()} <Badge variant="outline">{d.app_version}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-md">{d.device_name}</div>
                  <div className="text-xs text-muted-foreground">Última sync: {d.last_sync_at ? new Date(d.last_sync_at).toLocaleString() : "Nunca"}</div>
                </div>
                <Badge variant={d.activo ? "default" : "secondary"}>{d.activo ? "Activo" : "Inactivo"}</Badge>
              </div>
            ))}
            {devices.length === 0 && <p className="text-sm text-muted-foreground">Sin dispositivos. Registra el actual para habilitar push y sync offline.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
