import React, { useState, useMemo } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DataTable, ColumnDef, FilterChipConfig } from "@/components/common/DataTable";

interface AdminUsuariosTabProps {
  currentWorkspace: any;
  usuarios: any[];
  loadingUsers: boolean;
  onRefreshUsuarios: () => void;
  profileId?: string;
}

export function AdminUsuariosTab({
  currentWorkspace,
  usuarios,
  loadingUsers,
  onRefreshUsuarios,
  profileId,
}: AdminUsuariosTabProps) {
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      const { error } = existing
        ? await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId)
        : await supabase.from("user_roles").insert([{ user_id: userId, role: newRole as any }]);
      if (error) throw error;
      toast.success("Rol actualizado");
      onRefreshUsuarios();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar rol");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ activo: !currentStatus })
        .eq("id", userId);
      if (error) throw error;
      toast.success(`Usuario ${!currentStatus ? "activado" : "suspendido"} exitosamente`);
      onRefreshUsuarios();
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar estado");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const nombre = form.get("nombre") as string;
    const apellido = form.get("apellido") as string;
    const cedula = form.get("cedula") as string;
    const role = form.get("role") as string;

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            apellido,
            cedula,
            role,
            created_by_admin: true,
            created_by: profileId,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user && currentWorkspace?.id) {
        await supabase.from("workspace_members").insert({
          workspace_id: currentWorkspace.id,
          user_id: authData.user.id,
          role: role === "admin" ? "admin" : "member",
        });
      }

      toast.success("Usuario creado e invitado a la organización");
      setCreateUserOpen(false);
      onRefreshUsuarios();
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      toast.error(err.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6 space-y-6 shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Equipo de la Organización</h3>
            <p className="text-xs text-muted-foreground">
              Usuarios vinculados a {currentWorkspace?.nombre || "este centro"}
            </p>
          </div>
          <Button onClick={() => setCreateUserOpen(true)} size="sm" className="shadow-none">
            <Plus className="mr-2 h-4 w-4" />
            Crear Usuario
          </Button>
        </div>

        {loadingUsers ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground animate-pulse">Cargando equipo...</p>
          </div>
        ) : (
          <DataTable
            data={usuarios}
            columns={[
              {
                key: "nombre",
                header: "Usuario",
                sortable: true,
                render: (u) => (
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs uppercase shrink-0">
                      {(u.nombre?.[0] || "") + (u.apellido?.[0] || "")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {u.nombre} {u.apellido}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "workspace_role",
                header: "Rol Organización",
                sortable: true,
                render: (u) => (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {u.workspace_role || "member"}
                  </Badge>
                ),
              },
              {
                key: "rol_clinico",
                header: "Rol Clínico",
                render: (u) => (
                  <Select
                    defaultValue={u.user_roles?.[0]?.role || "user"}
                    onValueChange={(val) => handleRoleChange(u.id, val)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="coordinador">Coordinador</SelectItem>
                      <SelectItem value="medico">Médico</SelectItem>
                      <SelectItem value="enfermera">Enfermera</SelectItem>
                      <SelectItem value="recepcion">Recepción</SelectItem>
                    </SelectContent>
                  </Select>
                ),
              },
              {
                key: "activo",
                header: "Estado",
                sortable: true,
                render: (u) => (
                  <Badge
                    variant={u.activo ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {u.activo ? "Activo" : "Suspendido"}
                  </Badge>
                ),
              },
            ]}
            searchPlaceholder="Buscar por nombre o correo..."
            filterChips={[
              {
                key: "activo",
                label: "Estado",
                options: [
                  { label: "Activos", value: "true" },
                  { label: "Suspendidos", value: "false" },
                ],
              },
            ]}
            pageSize={10}
            emptyMessage="No se encontraron miembros de equipo en este centro."
            actions={(u) => (
              <Button
                variant={u.activo ? "outline" : "default"}
                size="sm"
                className="h-7 text-xs shadow-none"
                onClick={() => handleToggleUserStatus(u.id, u.activo)}
                disabled={loading}
              >
                {u.activo ? "Suspender" : "Activar"}
              </Button>
            )}
          />
        )}
      </GlassCard>

      {/* Diálogo Crear Usuario */}
      <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar / Crear Usuario al Centro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" name="nombre" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input id="apellido" name="apellido" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cedula">Cédula / Documento *</Label>
              <Input id="cedula" name="cedula" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña Temporal *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol Institucional *</Label>
              <Select name="role" defaultValue="medico" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="medico">Médico</SelectItem>
                  <SelectItem value="enfermera">Enfermera</SelectItem>
                  <SelectItem value="recepcion">Recepción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full shadow-none" disabled={loading}>
              {loading ? "Creando..." : "Crear e Integrar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
