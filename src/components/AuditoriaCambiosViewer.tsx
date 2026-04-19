import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Eye, History } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface AuditRow {
  id: string;
  tabla: string;
  registro_id: string | null;
  accion: string;
  usuario_id: string | null;
  datos_anteriores: any;
  datos_nuevos: any;
  created_at: string;
  usuario_nombre?: string;
}

const TABLAS = [
  { value: "todas", label: "Todas las tablas" },
  { value: "pacientes", label: "Pacientes" },
  { value: "control_visitas", label: "Visitas" },
  { value: "registro_llamadas", label: "Llamadas" },
  { value: "personal_salud", label: "Personal" },
  { value: "user_roles", label: "Roles de usuario" },
  { value: "medicamentos_paciente", label: "Medicamentos" },
  { value: "atencion_paciente", label: "Atención" },
];

const ACCIONES = [
  { value: "todas", label: "Todas las acciones" },
  { value: "INSERT", label: "Creación" },
  { value: "UPDATE", label: "Modificación" },
  { value: "DELETE", label: "Eliminación" },
];

const accionColor = (accion: string) => {
  switch (accion) {
    case "INSERT": return "bg-green-500/15 text-green-700 dark:text-green-400";
    case "UPDATE": return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
    case "DELETE": return "bg-red-500/15 text-red-700 dark:text-red-400";
    default: return "";
  }
};

export const AuditoriaCambiosViewer = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabla, setTabla] = useState("todas");
  const [accion, setAccion] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("auditoria_cambios")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (tabla !== "todas") query = query.eq("tabla", tabla);
      if (accion !== "todas") query = query.eq("accion", accion);

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data as AuditRow[]) || [];

      // Resolver nombres de usuarios
      const userIds = Array.from(new Set(rows.map(r => r.usuario_id).filter(Boolean))) as string[];
      let usuariosMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nombre, apellido, email")
          .in("id", userIds);
        profiles?.forEach(p => {
          usuariosMap[p.id] = `${p.nombre} ${p.apellido}`.trim() || p.email;
        });
      }

      setRows(rows.map(r => ({
        ...r,
        usuario_nombre: r.usuario_id ? (usuariosMap[r.usuario_id] || "Usuario desconocido") : "Sistema",
      })));
    } catch (e: any) {
      console.error(e);
      toast.error("Error al cargar auditoría");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [tabla, accion]);

  const filteredRows = rows.filter(r => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      r.usuario_nombre?.toLowerCase().includes(q) ||
      r.tabla.toLowerCase().includes(q) ||
      r.registro_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5" />
            Auditoría de Cambios
          </h3>
          <p className="text-sm text-muted-foreground">
            Registro de creaciones, modificaciones y eliminaciones en el sistema (últimos 200 eventos).
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAudit} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Select value={tabla} onValueChange={setTabla}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TABLAS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={accion} onValueChange={setAccion}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACCIONES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          placeholder="Buscar por usuario, tabla o ID..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredRows.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No hay eventos de auditoría que coincidan con los filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">Fecha</th>
                  <th className="text-left p-3 font-medium">Usuario</th>
                  <th className="text-left p-3 font-medium">Tabla</th>
                  <th className="text-left p-3 font-medium">Acción</th>
                  <th className="text-left p-3 font-medium">Registro</th>
                  <th className="text-right p-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r, i) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="p-3 whitespace-nowrap">
                      {format(new Date(r.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                    </td>
                    <td className="p-3">{r.usuario_nombre}</td>
                    <td className="p-3 font-mono text-xs">{r.tabla}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={accionColor(r.accion)}>
                        {r.accion}
                      </Badge>
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {r.registro_id?.slice(0, 8)}...
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(r)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del cambio</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Tabla:</span> <span className="font-mono">{selected.tabla}</span></div>
                <div><span className="text-muted-foreground">Acción:</span> <Badge className={accionColor(selected.accion)}>{selected.accion}</Badge></div>
                <div><span className="text-muted-foreground">Usuario:</span> {selected.usuario_nombre}</div>
                <div><span className="text-muted-foreground">Fecha:</span> {format(new Date(selected.created_at), "dd/MM/yyyy HH:mm:ss")}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Registro ID:</span> <span className="font-mono text-xs">{selected.registro_id}</span></div>
              </div>

              {selected.datos_anteriores && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-red-600 dark:text-red-400">Datos anteriores</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(selected.datos_anteriores, null, 2)}
                  </pre>
                </div>
              )}

              {selected.datos_nuevos && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400">Datos nuevos</h4>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto max-h-64">
                    {JSON.stringify(selected.datos_nuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
