import React, { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id: userId, role: newRole });
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
        ) : usuarios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay otros usuarios registrados en este centro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card/50 gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">
                      {usuario.nombre} {usuario.apellido}
                    </p>
                    <Badge
                      variant={usuario.activo ? "default" : "destructive"}
                      className="text-[10px]"
                    >
                      {usuario.activo ? "Activo" : "Suspendido"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {usuario.workspace_role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    defaultValue={usuario.user_roles?.[0]?.role || "user"}
                    onValueChange={(val) => handleRoleChange(usuario.id, val)}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
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

                  <Button
                    variant={usuario.activo ? "outline" : "default"}
                    size="sm"
                    className="h-8 text-xs shadow-none"
                    onClick={() => handleToggleUserStatus(usuario.id, usuario.activo)}
                    disabled={loading}
                  >
                    {usuario.activo ? "Suspender" : "Activar"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
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
