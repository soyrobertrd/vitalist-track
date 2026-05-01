import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingBag, Star, CalendarCheck, Plus, Search } from "lucide-react";
import { formatCurrency, resolveCurrency } from "@/lib/currency";

interface Props { verticalTipo: string; }

export default function VerticalMarketplaceTab({ verticalTipo }: Props) {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const cur = resolveCurrency(currentWorkspace);
  const [busqueda, setBusqueda] = useState("");

  const { data: servicios = [] } = useQuery({
    queryKey: ["marketplace_servicios", wsId, verticalTipo],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_servicios")
        .select("*")
        .eq("workspace_id", wsId!)
        .eq("vertical_tipo", verticalTipo)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["marketplace_bookings", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data } = await supabase
        .from("marketplace_bookings")
        .select("*, marketplace_servicios(nombre)")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const filtrados = servicios.filter((s: any) =>
    s.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const estadoColor: Record<string, string> = {
    pendiente: "bg-yellow-100 text-yellow-800",
    confirmado: "bg-green-100 text-green-800",
    cancelado: "bg-red-100 text-red-800",
    completado: "bg-blue-100 text-blue-800",
  };

  return (
    <Tabs defaultValue="catalogo" className="space-y-4">
      <TabsList>
        <TabsTrigger value="catalogo"><ShoppingBag className="h-4 w-4 mr-1" /> Catálogo</TabsTrigger>
        <TabsTrigger value="reviews"><Star className="h-4 w-4 mr-1" /> Reviews</TabsTrigger>
        <TabsTrigger value="bookings"><CalendarCheck className="h-4 w-4 mr-1" /> Reservas</TabsTrigger>
      </TabsList>

      <TabsContent value="catalogo" className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar servicio..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="pl-9" />
          </div>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Servicio</Button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {filtrados.map((s: any) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{s.descripcion || "Sin descripción"}</p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{formatCurrency(s.precio || 0, cur)}</span>
                  <Badge variant="outline">{s.duracion_minutos} min</Badge>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  {Number(s.rating_promedio || 0).toFixed(1)} ({s.total_reviews} reviews)
                </div>
                <Badge className={s.activo ? "bg-green-100 text-green-800" : "bg-muted"}>{s.activo ? "Activo" : "Inactivo"}</Badge>
              </CardContent>
            </Card>
          ))}
          {filtrados.length === 0 && <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">No hay servicios en el catálogo</p>}
        </div>
      </TabsContent>

      <TabsContent value="reviews">
        <Card><CardContent className="py-8 text-center text-muted-foreground">Reviews de pacientes — próximamente con moderación y verificación</CardContent></Card>
      </TabsContent>

      <TabsContent value="bookings" className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Servicio</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell>{b.paciente_nombre}</TableCell>
                <TableCell>{(b as any).marketplace_servicios?.nombre || "—"}</TableCell>
                <TableCell>{b.fecha_deseada}</TableCell>
                <TableCell><Badge className={estadoColor[b.estado] || ""}>{b.estado}</Badge></TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sin reservas</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
