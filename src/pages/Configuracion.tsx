import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Upload, Lock, User, HelpCircle, Bell, Eye, Shield } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const Configuracion = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useUserProfile();
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useUserRole();
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [notificaciones, setNotificaciones] = useState({
    email: true,
    push: true,
    llamadas: true,
    visitas: true,
  });

  const [formData, setFormData] = useState({
    telefono: profile?.telefono || "",
    especialidad: profile?.especialidad || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage (we'll create the bucket in a migration)
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile
      await updateProfile({ avatar_url: publicUrl });
      toast.success("Foto de perfil actualizada");
    } catch (error: any) {
      toast.error(error.message || "Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await updateProfile(formData);
    if (error) {
      toast.error("Error al actualizar perfil");
    } else {
      toast.success("Perfil actualizado exitosamente");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success("Contraseña actualizada exitosamente");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Configuración</h1>
            {isAdmin && (
              <Badge variant="destructive" className="bg-gradient-to-r from-[hsl(var(--admin-primary))] to-[hsl(var(--admin-secondary))]">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">Administra tu perfil y preferencias</p>
        </div>
        {isAdmin && (
          <Button 
            className="ml-auto bg-gradient-to-r from-[hsl(var(--admin-primary))] to-[hsl(var(--admin-secondary))]"
            onClick={() => navigate("/configuracion-admin")}
          >
            <Shield className="mr-2 h-4 w-4" />
            Panel de Administración
          </Button>
        )}
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid grid-cols-5 gap-2">
          <TabsTrigger value="perfil">
            <User className="mr-2 h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="interfaz">
            <Eye className="mr-2 h-4 w-4" />
            Interfaz
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="mr-2 h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="seguridad">
            <Lock className="mr-2 h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="soporte">
            <HelpCircle className="mr-2 h-4 w-4" />
            Soporte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Información del Perfil</h2>
              <p className="text-muted-foreground">
                Actualiza tu información personal y foto de perfil
              </p>
            </div>
            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.nombre[0]}{profile.apellido[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center gap-2 text-sm text-primary hover:text-primary/80">
                      <Upload className="h-4 w-4" />
                      {uploading ? "Subiendo..." : "Cambiar foto"}
                    </div>
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG o GIF (max. 2MB)
                  </p>
                </div>
              </div>

              {/* Read-only fields from API */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cédula</Label>
                  <Input value={profile.cedula} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input value={profile.nombre} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Apellido</Label>
                  <Input value={profile.apellido} disabled />
                </div>
              </div>

              {/* Editable fields */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      placeholder="809-123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="especialidad">Especialidad</Label>
                    <Input
                      id="especialidad"
                      value={formData.especialidad}
                      onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                      placeholder="Ej: Cardiología"
                    />
                  </div>
                </div>
                <Button type="submit">Guardar Cambios</Button>
              </form>
            </div>
          </GlassCard>

        </TabsContent>

        <TabsContent value="interfaz">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interfaz y Productividad</h2>
              <p className="text-muted-foreground">Personaliza tu experiencia de trabajo</p>
            </div>
            <div>
              <h3 className="font-medium mb-4">Tema de la Aplicación</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === "light" ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="bg-white rounded-md p-4 mb-2 shadow-sm">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-300 rounded" />
                      <div className="h-2 bg-slate-300 rounded w-2/3" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">Claro</p>
                </button>

                <button
                  onClick={() => setTheme("dark")}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === "dark" ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="bg-slate-900 rounded-md p-4 mb-2 shadow-sm">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-700 rounded" />
                      <div className="h-2 bg-slate-700 rounded w-2/3" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">Oscuro</p>
                </button>

                <button
                  onClick={() => setTheme("standard")}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    theme === "standard" ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="rounded-md overflow-hidden mb-2 shadow-sm">
                    <div className="bg-slate-900 h-8" />
                    <div className="bg-white p-2">
                      <div className="space-y-1">
                        <div className="h-1 bg-slate-300 rounded" />
                        <div className="h-1 bg-slate-300 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-medium">Estándar</p>
                </button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="notificaciones">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Notificaciones y Alertas</h2>
              <p className="text-muted-foreground">Configura cómo y cuándo recibir notificaciones</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg glass-bg">
                <div>
                  <Label className="text-base">Notificaciones por Email</Label>
                  <p className="text-sm text-muted-foreground">Recibir alertas en tu correo electrónico</p>
                </div>
                <Switch 
                  checked={notificaciones.email}
                  onCheckedChange={(checked) => setNotificaciones({...notificaciones, email: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg glass-bg">
                <div>
                  <Label className="text-base">Notificaciones Push</Label>
                  <p className="text-sm text-muted-foreground">Alertas en tiempo real en la aplicación</p>
                </div>
                <Switch 
                  checked={notificaciones.push}
                  onCheckedChange={(checked) => setNotificaciones({...notificaciones, push: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg glass-bg">
                <div>
                  <Label className="text-base">Recordatorios de Llamadas</Label>
                  <p className="text-sm text-muted-foreground">Avisos de llamadas programadas</p>
                </div>
                <Switch 
                  checked={notificaciones.llamadas}
                  onCheckedChange={(checked) => setNotificaciones({...notificaciones, llamadas: checked})}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg glass-bg">
                <div>
                  <Label className="text-base">Recordatorios de Visitas</Label>
                  <p className="text-sm text-muted-foreground">Avisos de visitas programadas</p>
                </div>
                <Switch 
                  checked={notificaciones.visitas}
                  onCheckedChange={(checked) => setNotificaciones({...notificaciones, visitas: checked})}
                />
              </div>

              <Button>Guardar Preferencias</Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="seguridad">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Seguridad</h2>
              <p className="text-muted-foreground">
                Actualiza tu contraseña para mantener tu cuenta segura
              </p>
            </div>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Actualizando..." : "Cambiar Contraseña"}
                </Button>
              </form>
          </GlassCard>
        </TabsContent>

        <TabsContent value="soporte">
          <GlassCard className="p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Centro de Soporte</h2>
              <p className="text-muted-foreground">
                ¿Necesitas ayuda? Contacta con nuestro equipo de soporte
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Correo de Soporte</h3>
                <p className="text-sm text-muted-foreground">soporte@healthcrm.com</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Teléfono de Soporte</h3>
                <p className="text-sm text-muted-foreground">+1 (809) 555-0123</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">Horario de Atención</h3>
                <p className="text-sm text-muted-foreground">
                  Lunes a Viernes: 8:00 AM - 6:00 PM
                </p>
                <p className="text-sm text-muted-foreground">
                  Sábados: 9:00 AM - 1:00 PM
                </p>
              </div>
              <Button className="w-full">Enviar Ticket de Soporte</Button>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuracion;