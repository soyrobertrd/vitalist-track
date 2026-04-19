import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, DollarSign, Receipt, Trash2, CreditCard } from "lucide-react";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useLocale } from "@/hooks/useLocale";
import { resolveCurrency, formatCurrency } from "@/lib/currency";
import { localeFromCountry } from "@/lib/dateFormat";

interface Factura {
  id: string;
  numero_factura: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  monto_total: number;
  monto_pagado: number;
  monto_seguro: number;
  estado: string;
  metodo_pago: string | null;
  aseguradora: string | null;
  numero_autorizacion: string | null;
  descripcion: string | null;
  notas: string | null;
}

interface Pago {
  id: string;
  factura_id: string;
  monto: number;
  fecha_pago: string;
  metodo: string;
  referencia: string | null;
  notas: string | null;
}

const estadoColor: Record<string, string> = {
  pendiente: "bg-yellow-500/10 text-yellow-700 border-yellow-500/30",
  pagada: "bg-green-500/10 text-green-700 border-green-500/30",
  parcial: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  anulada: "bg-gray-500/10 text-gray-700 border-gray-500/30",
  en_seguro: "bg-purple-500/10 text-purple-700 border-purple-500/30",
};

export const CobrosPaciente = ({ pacienteId }: { pacienteId: string }) => {
  const { currentWorkspace } = useWorkspace();
  const { countryCode } = useLocale();
  const currency = resolveCurrency(currentWorkspace, countryCode);
  const locale = localeFromCountry(countryCode);
  const fmt = (n: number | string) => formatCurrency(n, currency, locale);

  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pagos, setPagos] = useState<Record<string, Pago[]>>({});
  const [loading, setLoading] = useState(true);
  const [openFactura, setOpenFactura] = useState(false);
  const [openPago, setOpenPago] = useState<string | null>(null);
  const [paciente, setPaciente] = useState<{
    nombre: string;
    apellido: string;
    numero_principal: string | null;
    contacto_px: string | null;
    contacto_cuidador: string | null;
  } | null>(null);

  const [nuevaFactura, setNuevaFactura] = useState({
    monto_total: "",
    fecha_vencimiento: "",
    descripcion: "",
    estado: "pendiente",
    aseguradora: "",
    numero_autorizacion: "",
    notas: "",
  });

  const [nuevoPago, setNuevoPago] = useState({
    monto: "",
    metodo: "efectivo",
    referencia: "",
    notas: "",
  });

  const cargar = async () => {
    setLoading(true);
    const { data: facs } = await supabase
      .from("facturas")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("fecha_emision", { ascending: false });
    setFacturas((facs as Factura[]) || []);

    if (facs && facs.length > 0) {
      const { data: pgs } = await supabase
        .from("pagos")
        .select("*")
        .in("factura_id", facs.map((f: any) => f.id))
        .order("fecha_pago", { ascending: false });
      const grouped: Record<string, Pago[]> = {};
      (pgs || []).forEach((p: any) => {
        if (!grouped[p.factura_id]) grouped[p.factura_id] = [];
        grouped[p.factura_id].push(p);
      });
      setPagos(grouped);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargar();
    supabase
      .from("pacientes")
      .select("nombre, apellido, numero_principal, contacto_px, contacto_cuidador")
      .eq("id", pacienteId)
      .maybeSingle()
      .then(({ data }) => setPaciente(data as any));
  }, [pacienteId]);

  const crearFactura = async () => {
    if (!nuevaFactura.monto_total || parseFloat(nuevaFactura.monto_total) <= 0) {
      toast({ title: "Monto inválido", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("facturas").insert({
      paciente_id: pacienteId,
      monto_total: parseFloat(nuevaFactura.monto_total),
      fecha_vencimiento: nuevaFactura.fecha_vencimiento || null,
      descripcion: nuevaFactura.descripcion || null,
      estado: nuevaFactura.estado,
      aseguradora: nuevaFactura.aseguradora || null,
      numero_autorizacion: nuevaFactura.numero_autorizacion || null,
      notas: nuevaFactura.notas || null,
    } as any);
    if (error) {
      toast({ title: "Error al crear factura", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Factura creada" });
    setOpenFactura(false);
    setNuevaFactura({ monto_total: "", fecha_vencimiento: "", descripcion: "", estado: "pendiente", aseguradora: "", numero_autorizacion: "", notas: "" });
    cargar();
  };

  const registrarPago = async (facturaId: string) => {
    if (!nuevoPago.monto || parseFloat(nuevoPago.monto) <= 0) {
      toast({ title: "Monto inválido", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("pagos").insert({
      factura_id: facturaId,
      monto: parseFloat(nuevoPago.monto),
      metodo: nuevoPago.metodo,
      referencia: nuevoPago.referencia || null,
      notas: nuevoPago.notas || null,
    } as any);
    if (error) {
      toast({ title: "Error al registrar pago", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pago registrado" });
    setOpenPago(null);
    setNuevoPago({ monto: "", metodo: "efectivo", referencia: "", notas: "" });
    cargar();
  };

  const anularFactura = async (id: string) => {
    if (!confirm("¿Anular esta factura?")) return;
    await supabase.from("facturas").update({ estado: "anulada" } as any).eq("id", id);
    toast({ title: "Factura anulada" });
    cargar();
  };

  const totalFacturado = facturas.reduce((s, f) => s + Number(f.monto_total), 0);
  const totalPagado = facturas.reduce((s, f) => s + Number(f.monto_pagado), 0);
  const totalPendiente = totalFacturado - totalPagado;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Receipt className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Total facturado</p>
                <p className="text-xl font-bold">RD${totalFacturado.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Total pagado</p>
                <p className="text-xl font-bold">RD${totalPagado.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-xs text-muted-foreground">Pendiente</p>
                <p className="text-xl font-bold">RD${totalPendiente.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Facturas</CardTitle>
          <Dialog open={openFactura} onOpenChange={setOpenFactura}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nueva factura</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nueva factura</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Monto total *</Label>
                  <Input type="number" step="0.01" value={nuevaFactura.monto_total} onChange={e => setNuevaFactura({ ...nuevaFactura, monto_total: e.target.value })} />
                </div>
                <div>
                  <Label>Fecha vencimiento</Label>
                  <Input type="date" value={nuevaFactura.fecha_vencimiento} onChange={e => setNuevaFactura({ ...nuevaFactura, fecha_vencimiento: e.target.value })} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={nuevaFactura.estado} onValueChange={v => setNuevaFactura({ ...nuevaFactura, estado: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="en_seguro">En seguro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {nuevaFactura.estado === "en_seguro" && (
                  <>
                    <div>
                      <Label>Aseguradora</Label>
                      <Input value={nuevaFactura.aseguradora} onChange={e => setNuevaFactura({ ...nuevaFactura, aseguradora: e.target.value })} />
                    </div>
                    <div>
                      <Label>N° autorización</Label>
                      <Input value={nuevaFactura.numero_autorizacion} onChange={e => setNuevaFactura({ ...nuevaFactura, numero_autorizacion: e.target.value })} />
                    </div>
                  </>
                )}
                <div>
                  <Label>Descripción</Label>
                  <Input value={nuevaFactura.descripcion} onChange={e => setNuevaFactura({ ...nuevaFactura, descripcion: e.target.value })} />
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea value={nuevaFactura.notas} onChange={e => setNuevaFactura({ ...nuevaFactura, notas: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenFactura(false)}>Cancelar</Button>
                <Button onClick={crearFactura}>Crear</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : facturas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay facturas registradas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagado</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map(f => {
                  const saldo = Number(f.monto_total) - Number(f.monto_pagado);
                  return (
                    <>
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.numero_factura}</TableCell>
                        <TableCell>{f.fecha_emision}</TableCell>
                        <TableCell>RD${Number(f.monto_total).toFixed(2)}</TableCell>
                        <TableCell>RD${Number(f.monto_pagado).toFixed(2)}</TableCell>
                        <TableCell>RD${saldo.toFixed(2)}</TableCell>
                        <TableCell><Badge variant="outline" className={estadoColor[f.estado]}>{f.estado}</Badge></TableCell>
                        <TableCell className="text-right space-x-1">
                          {f.estado !== "pagada" && f.estado !== "anulada" && (
                            <Dialog open={openPago === f.id} onOpenChange={(o) => setOpenPago(o ? f.id : null)}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><DollarSign className="h-3 w-3" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Registrar pago - {f.numero_factura}</DialogTitle></DialogHeader>
                                <div className="space-y-3">
                                  <div>
                                    <Label>Monto * (saldo: RD${saldo.toFixed(2)})</Label>
                                    <Input type="number" step="0.01" value={nuevoPago.monto} onChange={e => setNuevoPago({ ...nuevoPago, monto: e.target.value })} />
                                  </div>
                                  <div>
                                    <Label>Método</Label>
                                    <Select value={nuevoPago.metodo} onValueChange={v => setNuevoPago({ ...nuevoPago, metodo: v })}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="efectivo">Efectivo</SelectItem>
                                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                                        <SelectItem value="transferencia">Transferencia</SelectItem>
                                        <SelectItem value="cheque">Cheque</SelectItem>
                                        <SelectItem value="seguro">Seguro</SelectItem>
                                        <SelectItem value="otro">Otro</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Referencia</Label>
                                    <Input value={nuevoPago.referencia} onChange={e => setNuevoPago({ ...nuevoPago, referencia: e.target.value })} />
                                  </div>
                                  <div>
                                    <Label>Notas</Label>
                                    <Textarea value={nuevoPago.notas} onChange={e => setNuevoPago({ ...nuevoPago, notas: e.target.value })} />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setOpenPago(null)}>Cancelar</Button>
                                  <Button onClick={() => registrarPago(f.id)}>Registrar</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          {f.estado === "pendiente" && paciente && (
                            <WhatsAppButton
                              size="sm"
                              variant="outline"
                              categoria="cobro_pendiente"
                              telefono={paciente.numero_principal || paciente.contacto_px}
                              telefonoCuidador={paciente.contacto_cuidador}
                              pacienteId={pacienteId}
                              citaId={f.id}
                              tipoCita="factura"
                              variables={{
                                paciente_nombre: paciente.nombre,
                                numero_factura: f.numero_factura,
                                monto: Number(f.monto_total - f.monto_pagado).toFixed(2),
                                fecha_vencimiento: f.fecha_vencimiento ?? "—",
                              }}
                            />
                          )}
                          {f.estado !== "anulada" && (
                            <Button size="sm" variant="ghost" onClick={() => anularFactura(f.id)}><Trash2 className="h-3 w-3" /></Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {pagos[f.id]?.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-muted/30 text-xs">
                            <div className="space-y-1 py-1">
                              <p className="font-medium">Pagos:</p>
                              {pagos[f.id].map(p => (
                                <div key={p.id} className="flex justify-between">
                                  <span>{p.fecha_pago} • {p.metodo} {p.referencia && `(${p.referencia})`}</span>
                                  <span className="font-medium">RD${Number(p.monto).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
