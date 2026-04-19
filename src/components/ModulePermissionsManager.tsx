import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Eye, Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModulePermission {
  id: string;
  module_name: string;
  role: "admin" | "coordinador" | "medico" | "enfermera" | "recepcion";
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  pacientes: "Pacientes",
  llamadas: "Llamadas",
  visitas: "Visitas",
  calendario: "Calendario",
  recepcion: "Recepción",
  personal: "Personal",
  atencion_paciente: "Atención al Paciente",
  reportes: "Reportes",
  encuestas: "Encuestas",
  automatizaciones: "Automatizaciones",
  plantillas_correo: "Plantillas de Correo",
  configuracion: "Configuración",
  configuracion_admin: "Config. Administrador",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  coordinador: "Coordinador",
  medico: "Médico",
  enfermera: "Enfermera",
  recepcion: "Recepción",
};

const ROLES = ["admin", "coordinador", "medico", "enfermera", "recepcion"];

export const ModulePermissionsManager = () => {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changes, setChanges] = useState<Record<string, { can_view?: boolean; can_create?: boolean; can_edit?: boolean; can_delete?: boolean }>>({});

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("module_permissions")
        .select("*")
        .order("role")
        .order("module_name");

      if (error) throw error;
      setPermissions((data || []) as ModulePermission[]);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Error al cargar permisos");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (
    permissionId: string,
    field: "can_view" | "can_create" | "can_edit" | "can_delete",
    value: boolean
  ) => {
    setChanges((prev) => ({
      ...prev,
      [permissionId]: {
        ...prev[permissionId],
        [field]: value,
      },
    }));

    setPermissions((prev) =>
      prev.map((p) =>
        p.id === permissionId ? { ...p, [field]: value } : p
      )
    );
  };

  const saveChanges = async () => {
    if (Object.keys(changes).length === 0) {
      toast.info("No hay cambios para guardar");
      return;
    }

    setSaving(true);
    try {
      for (const [id, change] of Object.entries(changes)) {
        const { error } = await supabase
          .from("module_permissions")
          .update(change)
          .eq("id", id);

        if (error) throw error;
      }

      toast.success("Permisos actualizados correctamente");
      setChanges({});
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Error al guardar permisos");
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsForRole = (role: string) => {
    return permissions.filter((p) => p.role === role);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando permisos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Permisos por Módulo</h3>
          <p className="text-sm text-muted-foreground">
            Configura qué puede hacer cada rol en cada módulo
          </p>
        </div>
        <Button
          onClick={saveChanges}
          disabled={saving || Object.keys(changes).length === 0}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Cambios
          {Object.keys(changes).length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {Object.keys(changes).length}
            </Badge>
          )}
        </Button>
      </div>

      <Tabs defaultValue="admin" className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          {ROLES.map((role) => (
            <TabsTrigger key={role} value={role}>
              {ROLE_LABELS[role]}
            </TabsTrigger>
          ))}
        </TabsList>

        {ROLES.map((role) => (
          <TabsContent key={role} value={role} className="mt-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Módulo</th>
                    <th className="text-center p-3 font-medium w-24">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </div>
                    </th>
                    <th className="text-center p-3 font-medium w-24">
                      <div className="flex items-center justify-center gap-1">
                        <Plus className="h-4 w-4" />
                        <span className="hidden sm:inline">Crear</span>
                      </div>
                    </th>
                    <th className="text-center p-3 font-medium w-24">
                      <div className="flex items-center justify-center gap-1">
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Editar</span>
                      </div>
                    </th>
                    <th className="text-center p-3 font-medium w-24">
                      <div className="flex items-center justify-center gap-1">
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getPermissionsForRole(role).map((permission, index) => (
                    <tr
                      key={permission.id}
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                    >
                      <td className="p-3">
                        <Label className="font-medium">
                          {MODULE_LABELS[permission.module_name] || permission.module_name}
                        </Label>
                      </td>
                      <td className="text-center p-3">
                        <Switch
                          checked={permission.can_view}
                          onCheckedChange={(value) =>
                            handlePermissionChange(permission.id, "can_view", value)
                          }
                          disabled={role === "admin"}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Switch
                          checked={permission.can_create}
                          onCheckedChange={(value) =>
                            handlePermissionChange(permission.id, "can_create", value)
                          }
                          disabled={role === "admin"}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Switch
                          checked={permission.can_edit}
                          onCheckedChange={(value) =>
                            handlePermissionChange(permission.id, "can_edit", value)
                          }
                          disabled={role === "admin"}
                        />
                      </td>
                      <td className="text-center p-3">
                        <Switch
                          checked={permission.can_delete}
                          onCheckedChange={(value) =>
                            handlePermissionChange(permission.id, "can_delete", value)
                          }
                          disabled={role === "admin"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {role === "admin" && (
              <p className="text-sm text-muted-foreground mt-2 italic">
                Los permisos de administrador no pueden ser modificados.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
