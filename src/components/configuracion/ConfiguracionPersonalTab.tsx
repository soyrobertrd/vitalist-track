import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Briefcase } from "lucide-react";

interface ProfileData {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  cedula: string;
  rol: string;
  especialidad?: string | null;
  telefono?: string | null;
  avatar_url?: string | null;
}

interface ConfiguracionPersonalTabProps {
  profile: ProfileData;
  uploading: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formData: { telefono: string; especialidad: string };
  setFormData: React.Dispatch<React.SetStateAction<{ telefono: string; especialidad: string }>>;
  onSubmit: (e: React.FormEvent) => void;
}

export function ConfiguracionPersonalTab({
  profile,
  uploading,
  onAvatarUpload,
  formData,
  setFormData,
  onSubmit,
}: ConfiguracionPersonalTabProps) {
  return (
    <GlassCard className="p-6 space-y-6 shadow-none">
      <div>
        <h2 className="text-2xl font-bold mb-2">Información Personal y Profesional</h2>
        <p className="text-muted-foreground">Datos identificativos y laborales básicos</p>
      </div>
      <div className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {profile.nombre[0]}
              {profile.apellido[0]}
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
              onChange={onAvatarUpload}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG o GIF (max. 2MB)</p>
          </div>
        </div>

        <Separator />

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Nombre Completo</Label>
            <p className="text-lg font-medium">
              {profile.nombre} {profile.apellido}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Cargo</Label>
            <p className="text-lg font-medium">{profile.especialidad || "No especificado"}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Cédula</Label>
            <p className="text-lg font-medium">{profile.cedula}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Rol en el Sistema</Label>
            <div>
              <Badge variant="outline">{profile.rol}</Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Información de contacto */}
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Información de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email Corporativo</Label>
              <p className="text-lg font-medium">
                <a
                  href={`mailto:${profile.email}`}
                  className="no-underline text-foreground hover:text-primary"
                >
                  {profile.email}
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="809-123-4567"
              />
            </div>
          </div>
        </div>

        {/* Información profesional editable */}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="especialidad">Especialidad / Área</Label>
            <Input
              id="especialidad"
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
              placeholder="Ej: Cardiología, Odontología, Medicina Estética"
            />
          </div>
          <Button type="submit">Guardar Cambios</Button>
        </form>
      </div>
    </GlassCard>
  );
}
