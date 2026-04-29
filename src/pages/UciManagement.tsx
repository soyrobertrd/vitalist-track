import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Activity, Droplet, ClipboardList, FileDown, Plus } from "lucide-react";

interface Admision { id: string; paciente_id: string; fecha_ingreso: string; estado: string; cama_id: string | null }

export default function UciManagement() {
  const [admisiones, setAdmisiones] = useState<Admision[]>([]);
  const [adId, setAdId] = useState<string>("");
  const [tab, setTab] = useState("infusiones");

  // Infusiones
  const [infusiones, setInfusiones] = useState<any[]>([]);
  const [infForm, setInfForm] = useState({ medicamento: "", dosis: "", via: "iv", velocidad: "" });

  // Balance
  const [balances, setBalances] = useState<any[]>([]);
  const [balForm, setBalForm] = useState({ ingresos_ml: "", egresos_ml: "", tipo: "general" });

  // Kardex
  const [kardex, setKardex] = useState<any[]>([]);
  const [kForm, setKForm] = useState({ turno: "manana", actividad: "", observaciones: "" });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("admisiones")
        .select("id, paciente_id, fecha_ingreso, estado, cama_id")
        .eq("estado", "activa")
        .order("fecha_ingreso", { ascending: false });
      setAdmisiones((data as any) || []);
      if (data && data.length > 0) setAdId(data[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!adId) return;
    cargar();
  }, [adId]);

  const cargar = async () => {
    const [{ data: i }, { data: b }, { data: k }] = await Promise.all([
      supabase.from("uci_infusiones").select("*").eq("admision_id", adId).order("created_at", { ascending: false }),
      supabase.from("uci_balance_hidrico").select("*").eq("admision_id", adId).order("created_at", { ascending: false }),
      supabase.from("kardex_enfermeria").select("*").eq("admision_id", adId).order("created_at", { ascending: false }),
    ]);
    setInfusiones((i as any) || []);
    setBalances((b as any) || []);
    setKardex((k as any) || []);
  };

  const addInf = async () => {
    if (!infForm.medicamento) return;
    const { error } = await supabase.from("uci_infusiones").insert({ admision_id: adId, ...infForm });
    if (error) return toast.error(error.message);
    setInfForm({ medicamento: "", dosis: "", via: "iv", velocidad: "" });
    toast.success("Infusión registrada");
    cargar();
  };

  const addBal = async () => {
    const { error } = await supabase.from("uci_balance_hidrico").insert({
      admision_id: adId,
      ingresos_ml: parseFloat(balForm.ingresos_ml) || 0,
      egresos_ml: parseFloat(balForm.egresos_ml) || 0,
      tipo: balForm.tipo,
    });
    if (error) return toast.error(error.message);
    setBalForm({ ingresos_ml: "", egresos_ml: "", tipo: "general" });
    toast.success("Balance registrado");
    cargar();
  };

  const addKar = async () => {
    if (!kForm.actividad) return;
    const { error } = await supabase.from("kardex_enfermeria").insert({ admision_id: adId, ...kForm });
    if (error) return toast.error(error.message);
    setKForm({ turno: "manana", actividad: "", observaciones: "" });
    toast.success("Kardex registrado");
    cargar();
  };

  const exportarPDF = () => {
    const html = `
      <html><head><title>UCI - Reporte</title>
      <style>body{font-family:Arial;padding:20px}h1,h2{color:#333}table{border-collapse:collapse;width:100%;margin:10px 0}td,th{border:1px solid #ccc;padding:6px;text-align:left;font-size:12px}</style>
      </head><body>
      <h1>Reporte UCI - Admisión ${adId.slice(0, 8)}</h1>
      <p>Generado: ${new Date().toLocaleString("es-DO")}</p>
      <h2>Infusiones (${infusiones.length})</h2>
      <table><tr><th>Medicamento</th><th>Dosis</th><th>Vía</th><th>Velocidad</th><th>Fecha</th></tr>
      ${infusiones.map((i) => `<tr><td>${i.medicamento}</td><td>${i.dosis || ""}</td><td>${i.via || ""}</td><td>${i.velocidad || ""}</td><td>${new Date(i.created_at).toLocaleString("es-DO")}</td></tr>`).join("")}
      </table>
      <h2>Balance hídrico (${balances.length})</h2>
      <table><tr><th>Ingresos (ml)</th><th>Egresos (ml)</th><th>Neto</th><th>Tipo</th><th>Fecha</th></tr>
      ${balances.map((b) => `<tr><td>${b.ingresos_ml}</td><td>${b.egresos_ml}</td><td>${b.ingresos_ml - b.egresos_ml}</td><td>${b.tipo}</td><td>${new Date(b.created_at).toLocaleString("es-DO")}</td></tr>`).join("")}
      </table>
      <h2>Kardex (${kardex.length})</h2>
      <table><tr><th>Turno</th><th>Actividad</th><th>Observaciones</th><th>Fecha</th></tr>
      ${kardex.map((k) => `<tr><td>${k.turno}</td><td>${k.actividad}</td><td>${k.observaciones || ""}</td><td>${new Date(k.created_at).toLocaleString("es-DO")}</td></tr>`).join("")}
      </table>
      </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
  };

  const totalIng = balances.reduce((s, b) => s + Number(b.ingresos_ml || 0), 0);
  const totalEgr = balances.reduce((s, b) => s + Number(b.egresos_ml || 0), 0);

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="h-6 w-6" />Gestión UCI</h1>
          <p className="text-muted-foreground text-sm">Infusiones, balance hídrico y kardex de enfermería</p>
        </div>
        <Button onClick={exportarPDF} disabled={!adId}><FileDown className="h-4 w-4 mr-1" />Exportar PDF</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Admisión activa</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={adId} onValueChange={setAdId}>
            <SelectTrigger><SelectValue placeholder="Selecciona admisión" /></SelectTrigger>
            <SelectContent>
              {admisiones.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.id.slice(0, 8)} · {new Date(a.fecha_ingreso).toLocaleDateString("es-DO")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {adId && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="infusiones"><Droplet className="h-4 w-4 mr-1" />Infusiones</TabsTrigger>
            <TabsTrigger value="balance"><Activity className="h-4 w-4 mr-1" />Balance</TabsTrigger>
            <TabsTrigger value="kardex"><ClipboardList className="h-4 w-4 mr-1" />Kardex</TabsTrigger>
          </TabsList>

          <TabsContent value="infusiones" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Nueva infusión</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><Label>Medicamento</Label><Input value={infForm.medicamento} onChange={(e) => setInfForm({ ...infForm, medicamento: e.target.value })} /></div>
                <div><Label>Dosis</Label><Input value={infForm.dosis} onChange={(e) => setInfForm({ ...infForm, dosis: e.target.value })} /></div>
                <div><Label>Vía</Label>
                  <Select value={infForm.via} onValueChange={(v) => setInfForm({ ...infForm, via: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iv">IV</SelectItem>
                      <SelectItem value="im">IM</SelectItem>
                      <SelectItem value="sc">SC</SelectItem>
                      <SelectItem value="vo">VO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Velocidad</Label><Input placeholder="ml/h" value={infForm.velocidad} onChange={(e) => setInfForm({ ...infForm, velocidad: e.target.value })} /></div>
                <Button onClick={addInf} className="col-span-full md:col-auto"><Plus className="h-4 w-4 mr-1" />Agregar</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-2">
                {infusiones.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin infusiones</p>}
                {infusiones.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 rounded border p-2 text-sm">
                    <Badge variant="outline">{i.via?.toUpperCase()}</Badge>
                    <div className="flex-1">
                      <div className="font-medium">{i.medicamento}</div>
                      <div className="text-xs text-muted-foreground">{i.dosis} · {i.velocidad}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString("es-DO")}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance" className="space-y-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen balance</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Ingresos</div><div className="text-2xl font-bold text-primary">{totalIng}</div><div className="text-xs">ml</div></div>
                <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Egresos</div><div className="text-2xl font-bold text-destructive">{totalEgr}</div><div className="text-xs">ml</div></div>
                <div className="rounded border p-3"><div className="text-xs text-muted-foreground">Neto</div><div className={`text-2xl font-bold ${totalIng - totalEgr >= 0 ? "text-primary" : "text-destructive"}`}>{totalIng - totalEgr}</div><div className="text-xs">ml</div></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Nuevo registro</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div><Label>Ingresos (ml)</Label><Input type="number" value={balForm.ingresos_ml} onChange={(e) => setBalForm({ ...balForm, ingresos_ml: e.target.value })} /></div>
                <div><Label>Egresos (ml)</Label><Input type="number" value={balForm.egresos_ml} onChange={(e) => setBalForm({ ...balForm, egresos_ml: e.target.value })} /></div>
                <div><Label>Tipo</Label>
                  <Select value={balForm.tipo} onValueChange={(v) => setBalForm({ ...balForm, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="oral">Oral</SelectItem>
                      <SelectItem value="iv">IV</SelectItem>
                      <SelectItem value="orina">Orina</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addBal}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-2">
                {balances.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 rounded border p-2 text-sm">
                    <Badge variant="outline">{b.tipo}</Badge>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <span className="text-primary">+{b.ingresos_ml} ml</span>
                      <span className="text-destructive">-{b.egresos_ml} ml</span>
                      <span className="font-medium">= {b.ingresos_ml - b.egresos_ml} ml</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString("es-DO")}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kardex" className="space-y-3">
            <Card>
              <CardHeader><CardTitle className="text-base">Nuevo registro de kardex</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Turno</Label>
                    <Select value={kForm.turno} onValueChange={(v) => setKForm({ ...kForm, turno: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manana">Mañana</SelectItem>
                        <SelectItem value="tarde">Tarde</SelectItem>
                        <SelectItem value="noche">Noche</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Actividad</Label><Input value={kForm.actividad} onChange={(e) => setKForm({ ...kForm, actividad: e.target.value })} /></div>
                </div>
                <div><Label>Observaciones</Label><Textarea value={kForm.observaciones} onChange={(e) => setKForm({ ...kForm, observaciones: e.target.value })} /></div>
                <Button onClick={addKar}><Plus className="h-4 w-4 mr-1" />Agregar</Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-2">
                {kardex.map((k) => (
                  <div key={k.id} className="rounded border p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge>{k.turno}</Badge>
                      <span className="font-medium">{k.actividad}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{new Date(k.created_at).toLocaleString("es-DO")}</span>
                    </div>
                    {k.observaciones && <p className="text-xs text-muted-foreground mt-1">{k.observaciones}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
