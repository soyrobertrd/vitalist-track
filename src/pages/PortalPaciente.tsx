import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays, Pill, AlertTriangle, Shield, User, Clock,
  CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PortalData {
  valid: boolean;
  error?: string;
  paciente?: { nombre: string; fecha_nacimiento: string; sexo: string };
  citas?: Array<{ fecha: string; tipo: string; estado: string; profesional: string }>;
  recetas?: Array<{ medicamento: string; dosis: string; frecuencia: string; inicio: string; fin: string; estado: string }>;
  alergias?: Array<{ sustancia: string; tipo: string; severidad: string; reaccion: string }>;
  seguros?: Array<{ aseguradora: string; plan: string; numero_afiliado: string; activo: boolean }>;
}

export default function PortalPaciente() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PortalData | null>(null);

  useEffect(() => {
    if (!token) {
      setData({ valid: false, error: "No se proporcionó un token de acceso" });
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      const { data: result, error } = await supabase.rpc("portal_paciente_datos", { _token: token });
      if (error) {
        setData({ valid: false, error: error.message });
      } else {
        setData(result as unknown as PortalData);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Acceso no válido</h2>
            <p className="text-muted-foreground">{data?.error || "Token inválido o expirado"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pac = data.paciente!;
  const citasFuturas = (data.citas || []).filter(c => new Date(c.fecha) >= new Date());
  const citasPasadas = (data.citas || []).filter(c => new Date(c.fecha) < new Date());

  const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
      pendiente: "bg-warning/20 text-warning",
      realizada: "bg-success/20 text-success",
      cancelada: "bg-destructive/20 text-destructive",
      activa: "bg-success/20 text-success",
      completada: "bg-muted text-muted-foreground",
    };
    return map[estado] || "bg-muted text-muted-foreground";
  };

  const severidadColor = (sev: string) => {
    const map: Record<string, string> = {
      leve: "text-success", moderada: "text-warning",
      severa: "text-destructive", anafilaxia: "text-destructive font-bold"
    };
    return map[sev] || "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <User className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">{pac.nombre}</h1>
              <p className="opacity-80">
                {pac.sexo === "M" ? "Masculino" : pac.sexo === "F" ? "Femenino" : pac.sexo}
                {pac.fecha_nacimiento && ` · Nac. ${format(new Date(pac.fecha_nacimiento + "T12:00:00"), "dd/MM/yyyy")}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 -mt-4">
        <Tabs defaultValue="citas">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="citas" className="gap-1"><CalendarDays className="h-4 w-4" /> Citas</TabsTrigger>
            <TabsTrigger value="recetas" className="gap-1"><Pill className="h-4 w-4" /> Recetas</TabsTrigger>
            <TabsTrigger value="alergias" className="gap-1"><AlertTriangle className="h-4 w-4" /> Alergias</TabsTrigger>
            <TabsTrigger value="seguros" className="gap-1"><Shield className="h-4 w-4" /> Seguros</TabsTrigger>
          </TabsList>

          {/* CITAS */}
          <TabsContent value="citas" className="space-y-4">
            {citasFuturas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Próximas citas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {citasFuturas.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {format(new Date(c.fecha), "EEEE d MMM yyyy, HH:mm", { locale: es })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {c.tipo} · Dr(a). {c.profesional}
                        </p>
                      </div>
                      <Badge className={estadoBadge(c.estado)}>{c.estado}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {citasPasadas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Historial de citas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {citasPasadas.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
                          <span>{format(new Date(c.fecha), "dd/MM/yyyy HH:mm")} · {c.tipo}</span>
                          <Badge variant="outline" className={estadoBadge(c.estado)}>{c.estado}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {citasFuturas.length === 0 && citasPasadas.length === 0 && (
              <Alert><AlertDescription>No hay citas registradas.</AlertDescription></Alert>
            )}
          </TabsContent>

          {/* RECETAS */}
          <TabsContent value="recetas" className="space-y-4">
            {(data.recetas || []).length > 0 ? (
              <Card>
                <CardHeader><CardTitle className="text-lg">Recetas médicas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(data.recetas || []).map((r, i) => (
                    <div key={i} className="p-3 rounded-lg border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.medicamento}</span>
                        <Badge className={estadoBadge(r.estado)}>{r.estado}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {r.dosis} · {r.frecuencia}
                      </p>
                      {r.inicio && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(r.inicio + "T12:00:00"), "dd/MM/yyyy")}
                          {r.fin && ` → ${format(new Date(r.fin + "T12:00:00"), "dd/MM/yyyy")}`}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Alert><AlertDescription>No hay recetas registradas.</AlertDescription></Alert>
            )}
          </TabsContent>

          {/* ALERGIAS */}
          <TabsContent value="alergias" className="space-y-4">
            {(data.alergias || []).length > 0 ? (
              <Card>
                <CardHeader><CardTitle className="text-lg">Alergias conocidas</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(data.alergias || []).map((a, i) => (
                    <div key={i} className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${severidadColor(a.severidad)}`} />
                        <span className="font-medium">{a.sustancia}</span>
                        <Badge variant="outline">{a.tipo}</Badge>
                      </div>
                      {a.reaccion && <p className="text-sm text-muted-foreground mt-1">Reacción: {a.reaccion}</p>}
                      <p className={`text-xs mt-1 ${severidadColor(a.severidad)}`}>Severidad: {a.severidad}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Alert><AlertDescription>No hay alergias registradas.</AlertDescription></Alert>
            )}
          </TabsContent>

          {/* SEGUROS */}
          <TabsContent value="seguros" className="space-y-4">
            {(data.seguros || []).length > 0 ? (
              <Card>
                <CardHeader><CardTitle className="text-lg">Seguros médicos activos</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {(data.seguros || []).map((s, i) => (
                    <div key={i} className="p-3 rounded-lg border flex items-center justify-between">
                      <div>
                        <span className="font-medium">{s.aseguradora}</span>
                        {s.plan && <span className="text-muted-foreground"> · {s.plan}</span>}
                        {s.numero_afiliado && <p className="text-sm text-muted-foreground">Nro: {s.numero_afiliado}</p>}
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Alert><AlertDescription>No hay seguros activos registrados.</AlertDescription></Alert>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground py-4">
          Portal del paciente · Acceso seguro con token temporal
        </div>
      </div>
    </div>
  );
}
