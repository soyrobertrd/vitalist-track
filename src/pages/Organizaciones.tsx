import { useEffect, useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, MapPin, Users, Plus, Trash2, Pencil, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useSucursales, type Sucursal } from "@/hooks/useSucursales";

interface Member {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  email?: string;
  nombre?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  estado: string;
  expires_at: string;
  created_at: string;
}

export default function Organizaciones() {
  const { workspaces, currentWorkspace, switchWorkspace, refresh } = useWorkspace();
  const { sucursales, refetch: refetchSucursales, loading: loadingSucursales } = useSucursales();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Workspace dialog
  const [wsDialogOpen, setWsDialogOpen] = useState(false);
  const [wsForm, setWsForm] = useState({ nombre: "", slug: "" });

  // Sucursal dialog
  const [sucDialogOpen, setSucDialogOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [sucForm, setSucForm] = useState({
    nombre: "", codigo: "", direccion: "", telefono: "", email: "", ciudad: "", es_principal: false,
  });

  // Invite member dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);

  const isOwnerOrAdmin = currentWorkspace?.role === "owner" || currentWorkspace?.role === "admin";

  useEffect(() => {
    if (currentWorkspace) {
      loadMembers();
      loadInvitations();
    }
  }, [currentWorkspace]);

  const loadInvitations = async () => {
    if (!currentWorkspace) return;
    const { data } = await supabase
      .from("workspace_invitations" as any)
      .select("id, email, role, estado, expires_at, created_at")
      .eq("workspace_id", currentWorkspace.id)
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false });
    setInvitations((data as unknown as Invitation[]) || []);
  };

  const loadMembers = async () => {
    if (!currentWorkspace) return;
    setLoadingMembers(true);
    const { data: memberRows } = await supabase
      .from("workspace_members")
      .select("id, user_id, role, joined_at")
      .eq("workspace_id", currentWorkspace.id);

    if (!memberRows || memberRows.length === 0) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    const ids = memberRows.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nombre, apellido, email")
      .in("id", ids);

    const merged: Member[] = memberRows.map((m) => {
      const p = profiles?.find((pr) => pr.id === m.user_id);
      return {
        id: m.id,
        user_id: m.user_id,
        role: m.role as Member["role"],
        joined_at: m.joined_at,
        email: p?.email,
        nombre: p ? `${p.nombre || ""} ${p.apellido || ""}`.trim() : undefined,
      };
    });
    setMembers(merged);
    setLoadingMembers(false);
  };

  const handleCreateWorkspace = async () => {
    if (!wsForm.nombre.trim() || !wsForm.slug.trim()) {
      toast.error("Nombre y slug son requeridos");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const slug = wsForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const { data, error } = await supabase
      .from("workspaces")
      .insert({ nombre: wsForm.nombre.trim(), slug, owner_id: user.id, plan_codigo: "free" })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    // Add owner as workspace member
    await supabase.from("workspace_members").insert({
      workspace_id: data.id, user_id: user.id, role: "owner", invited_by: user.id,
    });
    toast.success("Organización creada");
    setWsDialogOpen(false);
    setWsForm({ nombre: "", slug: "" });
    await refresh();
  };

  const handleSaveSucursal = async () => {
    if (!currentWorkspace) return;
    if (!sucForm.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }
    const payload = {
      workspace_id: currentWorkspace.id,
      nombre: sucForm.nombre.trim(),
      codigo: sucForm.codigo.trim() || null,
      direccion: sucForm.direccion.trim() || null,
      telefono: sucForm.telefono.trim() || null,
      email: sucForm.email.trim() || null,
      ciudad: sucForm.ciudad.trim() || null,
      es_principal: sucForm.es_principal,
    };
    let error;
    if (editingSucursal) {
      ({ error } = await supabase.from("sucursales" as any).update(payload).eq("id", editingSucursal.id));
    } else {
      ({ error } = await supabase.from("sucursales" as any).insert(payload));
    }
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editingSucursal ? "Sucursal actualizada" : "Sucursal creada");
    setSucDialogOpen(false);
    setEditingSucursal(null);
    setSucForm({ nombre: "", codigo: "", direccion: "", telefono: "", email: "", ciudad: "", es_principal: false });
    refetchSucursales();
  };

  const handleEditSucursal = (s: Sucursal) => {
    setEditingSucursal(s);
    setSucForm({
      nombre: s.nombre,
      codigo: s.codigo || "",
      direccion: s.direccion || "",
      telefono: s.telefono || "",
      email: s.email || "",
      ciudad: s.ciudad || "",
      es_principal: s.es_principal,
    });
    setSucDialogOpen(true);
  };

  const handleDeleteSucursal = async (id: string) => {
    if (!confirm("¿Eliminar sucursal? Los pacientes/personal asignados quedarán sin sucursal.")) return;
    const { error } = await supabase.from("sucursales" as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Sucursal eliminada");
      refetchSucursales();
    }
  };

  const handleInviteMember = async () => {
    if (!currentWorkspace || !inviteEmail.trim()) return;
    setInviting(true);
    const { data, error } = await supabase.functions.invoke("send-workspace-invitation", {
      body: {
        workspace_id: currentWorkspace.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      },
    });
    setInviting(false);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || "No se pudo enviar la invitación");
      return;
    }
    toast.success(`Invitación enviada a ${inviteEmail}`);
    setInviteOpen(false);
    setInviteEmail("");
    loadInvitations();
  };

  const handleRevokeInvitation = async (id: string) => {
    if (!confirm("¿Revocar esta invitación pendiente?")) return;
    const { error } = await supabase
      .from("workspace_invitations" as any)
      .update({ estado: "revocada" })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Invitación revocada");
      loadInvitations();
    }
  };

  const handleChangeMemberRole = async (memberId: string, newRole: Member["role"]) => {
    const { error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("id", memberId);
    if (error) toast.error(error.message);
    else {
      toast.success("Rol actualizado");
      loadMembers();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("¿Quitar este miembro de la organización?")) return;
    const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
    if (error) toast.error(error.message);
    else {
      toast.success("Miembro removido");
      loadMembers();
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Organizaciones y Sucursales
          </h1>
          <p className="text-muted-foreground text-sm">
            Administra clínicas (workspaces), sus sucursales y miembros del equipo.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={currentWorkspace?.id || ""} onValueChange={switchWorkspace}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Selecciona organización" />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.nombre} <Badge variant="outline" className="ml-2 text-[10px]">{w.role}</Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={wsDialogOpen} onOpenChange={setWsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> Nueva organización</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva organización</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nombre</Label>
                  <Input value={wsForm.nombre} onChange={(e) => setWsForm({ ...wsForm, nombre: e.target.value })} placeholder="Clínica Salud RD" />
                </div>
                <div>
                  <Label>Slug (identificador URL)</Label>
                  <Input value={wsForm.slug} onChange={(e) => setWsForm({ ...wsForm, slug: e.target.value })} placeholder="clinica-salud-rd" />
                </div>
                <Button onClick={handleCreateWorkspace} className="w-full">Crear</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!currentWorkspace ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No tienes ninguna organización. Crea la primera para empezar.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="sucursales">
          <TabsList>
            <TabsTrigger value="sucursales"><MapPin className="h-4 w-4 mr-1" /> Sucursales</TabsTrigger>
            <TabsTrigger value="miembros"><Users className="h-4 w-4 mr-1" /> Miembros</TabsTrigger>
            <TabsTrigger value="info">Información</TabsTrigger>
          </TabsList>

          {/* Sucursales */}
          <TabsContent value="sucursales" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Sucursales / Sedes</h2>
                <p className="text-sm text-muted-foreground">Cada sucursal puede tener su propio equipo, pacientes y agenda.</p>
              </div>
              {isOwnerOrAdmin && (
                <Dialog open={sucDialogOpen} onOpenChange={(o) => { setSucDialogOpen(o); if (!o) { setEditingSucursal(null); setSucForm({ nombre: "", codigo: "", direccion: "", telefono: "", email: "", ciudad: "", es_principal: false }); } }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-1" /> Nueva sucursal</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{editingSucursal ? "Editar sucursal" : "Nueva sucursal"}</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nombre *</Label>
                          <Input value={sucForm.nombre} onChange={(e) => setSucForm({ ...sucForm, nombre: e.target.value })} placeholder="Sede Central" />
                        </div>
                        <div>
                          <Label>Código</Label>
                          <Input value={sucForm.codigo} onChange={(e) => setSucForm({ ...sucForm, codigo: e.target.value })} placeholder="SC-01" />
                        </div>
                      </div>
                      <div>
                        <Label>Ciudad</Label>
                        <Input value={sucForm.ciudad} onChange={(e) => setSucForm({ ...sucForm, ciudad: e.target.value })} placeholder="Santo Domingo" />
                      </div>
                      <div>
                        <Label>Dirección</Label>
                        <Textarea value={sucForm.direccion} onChange={(e) => setSucForm({ ...sucForm, direccion: e.target.value })} className="min-h-[60px]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Teléfono</Label>
                          <Input value={sucForm.telefono} onChange={(e) => setSucForm({ ...sucForm, telefono: e.target.value })} />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input type="email" value={sucForm.email} onChange={(e) => setSucForm({ ...sucForm, email: e.target.value })} />
                        </div>
                      </div>
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={sucForm.es_principal} onChange={(e) => setSucForm({ ...sucForm, es_principal: e.target.checked })} className="h-4 w-4" />
                        Marcar como sede principal
                      </Label>
                      <Button onClick={handleSaveSucursal} className="w-full">
                        {editingSucursal ? "Guardar cambios" : "Crear sucursal"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {loadingSucursales ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : sucursales.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground">No hay sucursales aún. Crea la primera.</CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sucursales.map((s) => (
                  <Card key={s.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {s.es_principal && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                            {s.nombre}
                          </CardTitle>
                          {s.codigo && <CardDescription className="text-xs">{s.codigo}</CardDescription>}
                        </div>
                        {isOwnerOrAdmin && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => handleEditSucursal(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteSucursal(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1 text-muted-foreground">
                      {s.ciudad && <div>{s.ciudad}</div>}
                      {s.direccion && <div className="line-clamp-2">{s.direccion}</div>}
                      {s.telefono && <div>{s.telefono}</div>}
                      {s.email && <div>{s.email}</div>}
                      {!s.activo && <Badge variant="secondary">Inactiva</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Miembros */}
          <TabsContent value="miembros" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Miembros de la organización</h2>
                <p className="text-sm text-muted-foreground">Controla quién puede ver y gestionar los datos.</p>
              </div>
              {isOwnerOrAdmin && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-1" /> Agregar miembro</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Agregar miembro</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Email del usuario</Label>
                        <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="usuario@ejemplo.com" />
                        <p className="text-xs text-muted-foreground mt-1">El usuario debe estar registrado previamente.</p>
                      </div>
                      <div>
                        <Label>Rol</Label>
                        <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Miembro</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleInviteMember} className="w-full">Agregar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {loadingMembers ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <Card key={m.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <div className="font-medium">{m.nombre || "—"}</div>
                        <div className="text-sm text-muted-foreground">{m.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwnerOrAdmin && m.role !== "owner" ? (
                          <Select value={m.role} onValueChange={(v) => handleChangeMemberRole(m.id, v as Member["role"])}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="member">Miembro</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
                        )}
                        {isOwnerOrAdmin && m.role !== "owner" && (
                          <Button size="icon" variant="ghost" onClick={() => handleRemoveMember(m.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Info */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{currentWorkspace.nombre}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Slug:</span> {currentWorkspace.slug}</div>
                <div><span className="text-muted-foreground">Plan:</span> <Badge>{currentWorkspace.plan_codigo}</Badge></div>
                <div><span className="text-muted-foreground">Estado:</span> {currentWorkspace.estado}</div>
                <div><span className="text-muted-foreground">Tu rol:</span> <Badge variant="outline">{currentWorkspace.role}</Badge></div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
