import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";

export interface ModulePermission {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export const useModulePermissions = () => {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const { data: { user } } = await db.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await db.rpc('get_user_module_permissions', {
          _user_id: user.id
        });

        if (error) {
          console.error("Error fetching permissions:", error);
        } else {
          setPermissions(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const hasPermission = (moduleName: string, permission: 'view' | 'create' | 'edit' | 'delete') => {
    const modulePerms = permissions.find(p => p.module_name === moduleName);
    if (!modulePerms) return false;
    
    switch (permission) {
      case 'view': return modulePerms.can_view;
      case 'create': return modulePerms.can_create;
      case 'edit': return modulePerms.can_edit;
      case 'delete': return modulePerms.can_delete;
      default: return false;
    }
  };

  const canView = (moduleName: string) => hasPermission(moduleName, 'view');
  const canCreate = (moduleName: string) => hasPermission(moduleName, 'create');
  const canEdit = (moduleName: string) => hasPermission(moduleName, 'edit');
  const canDelete = (moduleName: string) => hasPermission(moduleName, 'delete');

  return { 
    permissions, 
    loading, 
    hasPermission, 
    canView, 
    canCreate, 
    canEdit, 
    canDelete 
  };
};
