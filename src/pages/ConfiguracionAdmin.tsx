import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Settings, Users, Shield, Mail, FileText, 
  BarChart, Lock, Palette, Database, Workflow, Plus, CalendarDays, Key
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DiasNoLaborablesCalendar } from "@/components/DiasNoLaborablesCalendar";
import { ModulePermissionsManager } from "@/components/ModulePermissionsManager";

const ConfiguracionAdmin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/configuracion");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchUsuarios();
    }
  }, [roleLoading, isAdmin]);

  const fetchUsuarios = async () => {
    setLoadingUsers(true);
    try {
      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles separately
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine the data
      const usuariosConRoles = profilesData?.map(profile => {
        const userRole = rolesData?.find(r => r.user_id === profile.id);
        return {
          ...profile,
          user_roles: userRole ? [{ role: userRole.role }] : []
        };
      });

      setUsuarios(usuariosConRoles || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setLoadingUsers(false);
    }
  };

  const { profile } = useUserProfile();

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(true);
    
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      let error;
      
      if (existingRole) {
        // Update existing role
        const result = await supabase
          .from("user_roles")
          .update({ role: newRole as any })
          .eq("user_id", userId);
        error = result.error;
      } else {
        // Insert new role
        const result = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role: newRole as any }]);
        error = result.error;
      }

      if (error) {
        console.error("Error updating role:", error);
        toast.error("Error al actualizar rol: " + error.message);
      } else {
        toast.success("Rol actualizado exitosamente");
        fetchUsuarios();
      }
    } catch (err) {
      console.error("Exception updating role:", err);
      toast.error("Error inesperado al actualizar rol");
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async (email: string) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error("Error al enviar el enlace de restablecimiento");
    } else {
      toast.success(`Enlace de restablecimiento enviado a ${email}`);
    }
    setLoading(false);
  };

  const handleManualPasswordChange = async () => {
    if (!selectedUserForPassword || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-update-password', {
        body: { 
          userId: selectedUserForPassword.id,
          newPassword: newPassword
        }
      });

      if (error) throw error;
      
      toast.success(`Contraseña actualizada para ${selectedUserForPassword.nombre}`);
      setChangePasswordOpen(false);
      setNewPassword("");
      setSelectedUserForPassword(null);
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error("Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    setLoading(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({ activo: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast.error("Error al cambiar el estado del usuario");
    } else {
      toast.success(`Usuario ${!currentStatus ? 'activado' : 'suspendido'} exitosamente`);
      
      // Registrar actividad
      await supabase.from("user_activity").insert({
        user_id: userId,
        accion: !currentStatus ? 'activar_usuario' : 'suspender_usuario',
        descripcion: `Usuario ${!currentStatus ? 'activado' : 'suspendido'} por administrador`,
        realizado_por: profile?.id
      });
      
      fetchUsuarios();
    }
    setLoading(false);
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const nombre = formData.get("nombre") as string;
    const apellido = formData.get("apellido") as string;
    const cedula = formData.get("cedula") as string;
    const role = formData.get("role") as string;

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
            created_by: profile?.id
          }
        }
      });

      if (authError) throw authError;

      toast.success("Usuario creado exitosamente");
      setCreateUserOpen(false);
      fetchUsuarios();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Error al crear usuario");
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
            <Badge variant="destructive" className="bg-gradient-to-r from-[hsl(var(--admin-primary))] to-[hsl(var(--admin-secondary))]">
              Administrador
            </Badge>
          </div>
          <p className="text-muted-foreground">Panel de control administrativo</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-5 lg:grid-cols-11 gap-2">
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users className="mr-2 h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="correo">
            <Mail className="mr-2 h-4 w-4" />
            Correo
          </TabsTrigger>
          <TabsTrigger value="plantillas">
            <FileText className="mr-2 h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="encuestas">
            <BarChart className="mr-2 h-4 w-4" />
            Encuestas
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <Lock className="mr-2 h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="apariencia">
            <Palette className="mr-2 h-4 w-4" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="datos">
            <Database className="mr-2 h-4 w-4" />
            Datos
          </TabsTrigger>
          <TabsTrigger value="automatizacion">
            <Workflow className="mr-2 h-4 w-4" />
            Automatización
          </TabsTrigger>
          <TabsTrigger value="calendario">
            <CalendarDays className="mr-2 h-4 w-4" />
            Días Feriados
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Configuración General</h2>
              <p className="text-muted-foreground">Ajustes básicos del sistema</p>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Nombre del CRM</Label>
                <Input placeholder="Health CRM" defaultValue="Health CRM" />
              </div>
              <div className="space-y-2">
                <Label>Zona Horaria</Label>
                <Select defaultValue="america/santo_domingo">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america/santo_domingo">América/Santo Domingo (GMT-4)</SelectItem>
                    <SelectItem value="america/new_york">América/Nueva York (GMT-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato de Fecha</Label>
                <Select defaultValue="dd/mm/yyyy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Guardar Cambios</Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Usuarios y Roles */}
        <TabsContent value="usuarios">
          <GlassCard className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Gestión de Usuarios</h2>
                <p className="text-muted-foreground">Administrar usuarios del sistema</p>
              </div>
              <Button onClick={() => setCreateUserOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Usuario
              </Button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <p>Cargando usuarios...</p>
              </div>
            ) : usuarios.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No hay usuarios registrados</p>
              </div>
            ) : (
              <div className="space-y-4">
                {usuarios.map((usuario) => (
                <div key={usuario.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg glass-bg gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{usuario.nombre} {usuario.apellido}</p>
                      <Badge variant={usuario.activo ? "default" : "destructive"} className="text-xs">
                        {usuario.activo ? "Activo" : "Suspendido"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{usuario.email}</p>
                    <p className="text-xs text-muted-foreground">{usuario.cedula}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Badge variant="outline">
                      {usuario.user_roles?.[0]?.role || "user"}
                    </Badge>
                    <Select
                      defaultValue={usuario.user_roles?.[0]?.role || "user"}
                      onValueChange={(value) => handleRoleChange(usuario.id, value)}
                      disabled={loading}
                    >
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderador</SelectItem>
                        <SelectItem value="user">Usuario</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePasswordReset(usuario.email)}
                      disabled={loading}
                      title="Enviar enlace de restablecimiento"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Link
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedUserForPassword(usuario);
                        setChangePasswordOpen(true);
                      }}
                      disabled={loading}
                      title="Cambiar contraseña manualmente"
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Cambiar Clave
                    </Button>
                    <Button 
                      variant={usuario.activo ? "destructive" : "default"}
                      size="sm"
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

          {/* Create User Dialog */}
          <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
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
                  <Label htmlFor="cedula">Cédula *</Label>
                  <Input id="cedula" name="cedula" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <Input id="password" name="password" type="password" required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol *</Label>
                  <Select name="role" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="user">Usuario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creando..." : "Crear Usuario"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Change Password Dialog */}
          <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar Contraseña Manualmente</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Cambiar contraseña para: <strong>{selectedUserForPassword?.nombre} {selectedUserForPassword?.apellido}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setChangePasswordOpen(false);
                    setNewPassword("");
                    setSelectedUserForPassword(null);
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleManualPasswordChange} disabled={loading || !newPassword}>
                    {loading ? "Actualizando..." : "Cambiar Contraseña"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Configuración de Roles y Permisos</h2>
              <p className="text-muted-foreground">Definir permisos granulares por rol y módulo</p>
            </div>
            
            <ModulePermissionsManager />
          </GlassCard>
        </TabsContent>

        {/* Correo */}
        <TabsContent value="correo">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Configuración de Correo</h2>
              <p className="text-muted-foreground">SMTP y notificaciones</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Host SMTP</Label>
                <Input placeholder="smtp.gmail.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Puerto</Label>
                  <Input placeholder="587" />
                </div>
                <div className="space-y-2">
                  <Label>Cifrado</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tls">TLS</SelectItem>
                      <SelectItem value="ssl">SSL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Usuario SMTP</Label>
                <Input type="email" placeholder="correo@ejemplo.com" />
              </div>
              <div className="space-y-2">
                <Label>Contraseña SMTP</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Remitente Predeterminado</Label>
                <Input placeholder="Sistema CRM <sistema@healthcrm.com>" />
              </div>
              <Button>Probar Conexión</Button>
              <Button variant="outline">Guardar Configuración</Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Plantillas */}
        <TabsContent value="plantillas">
          <GlassCard className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Plantillas de Correo</h2>
                <p className="text-muted-foreground">Gestionar plantillas de correo electrónico</p>
              </div>
              <Button onClick={() => navigate('/plantillas-correo')}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Plantilla
              </Button>
            </div>

            <div className="space-y-4">
              {["Bienvenida Paciente", "Recordatorio de Cita", "Encuesta de Satisfacción", "Resumen Semanal"].map((plantilla, index) => (
                <div key={index} className="p-4 border rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium">{plantilla}</p>
                    <p className="text-sm text-muted-foreground">Última modificación: Hace 2 días</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate('/plantillas-correo')}>Editar</Button>
                    <Button variant="outline" size="sm" onClick={() => navigate('/plantillas-correo')}>Vista Previa</Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Encuestas */}
        <TabsContent value="encuestas">
          <GlassCard className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Gestor de Encuestas</h2>
                <p className="text-muted-foreground">Crear y administrar encuestas</p>
              </div>
              <Button onClick={() => navigate('/encuestas')}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Encuesta
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold">Satisfacción Post-Consulta</h3>
                    <p className="text-sm text-muted-foreground">Activa • 142 respuestas</p>
                  </div>
                  <Badge variant="outline">82% satisfacción</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/encuestas')}>Editar</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/encuestas')}>Ver Resultados</Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/encuestas')}>Desactivar</Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Seguridad */}
        <TabsContent value="seguridad">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Seguridad y Privacidad</h2>
              <p className="text-muted-foreground">Configuración de seguridad del sistema</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Autenticación de Dos Factores (2FA)</Label>
                  <p className="text-sm text-muted-foreground">Requerir 2FA para todos los usuarios</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Caducidad de Contraseña</Label>
                  <p className="text-sm text-muted-foreground">Las contraseñas expiran cada 90 días</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Registro de Auditoría</Label>
                  <p className="text-sm text-muted-foreground">Registrar todas las acciones de usuarios</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Intentos de Inicio de Sesión Máximos</Label>
                <Input type="number" defaultValue="5" />
              </div>
              <Button>Guardar Configuración</Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Apariencia */}
        <TabsContent value="apariencia">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Personalización Visual</h2>
              <p className="text-muted-foreground">Configurar la apariencia del sistema</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Logo del Sistema</Label>
                <div className="flex gap-2">
                  <Input type="file" accept="image/*" />
                  <Button variant="outline">Subir</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color Principal</Label>
                <div className="flex gap-2">
                  <Input type="color" className="w-20" defaultValue="#3b82f6" />
                  <Input defaultValue="#3b82f6" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tema Predeterminado</Label>
                <Select defaultValue="standard">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="standard">Estándar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Aplicar Cambios</Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Datos */}
        <TabsContent value="datos">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Gestión de Datos</h2>
              <p className="text-muted-foreground">Backups y exportación de datos</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2">Backup Automático</h3>
                <p className="text-sm text-muted-foreground mb-4">Último backup: Hace 2 horas</p>
                <div className="flex gap-2">
                  <Button variant="outline">Crear Backup Ahora</Button>
                  <Button variant="outline">Restaurar Backup</Button>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold mb-2">Exportar Datos</h3>
                <p className="text-sm text-muted-foreground mb-4">Exportar todos los datos del sistema</p>
                <div className="flex gap-2">
                  <Button variant="outline">Exportar a Excel</Button>
                  <Button variant="outline">Exportar a JSON</Button>
                </div>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Automatización */}
        <TabsContent value="automatizacion">
          <GlassCard className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Automatizaciones</h2>
                <p className="text-muted-foreground">Reglas y flujos automatizados</p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Regla
              </Button>
            </div>

            <div className="space-y-4">
              {[
                { nombre: "Enviar encuesta post-cita", estado: true },
                { nombre: "Recordatorio 24h antes de visita", estado: true },
                { nombre: "Notificar baja satisfacción", estado: true },
                { nombre: "Resumen semanal profesionales", estado: false },
              ].map((regla, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{regla.nombre}</p>
                    <Badge variant={regla.estado ? "default" : "secondary"} className="mt-1">
                      {regla.estado ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Switch defaultChecked={regla.estado} />
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </TabsContent>

        {/* Calendario - Días Feriados */}
        <TabsContent value="calendario">
          <GlassCard className="p-6">
            <DiasNoLaborablesCalendar />
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracionAdmin;
