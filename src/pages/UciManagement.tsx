import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Activity,
  Droplet,
  ClipboardList,
  FileDown,
  Plus,
  AlertTriangle,
  HeartPulse,
  Syringe,
  CheckCircle2,
  BedDouble,
  ShieldAlert,
  Clock,
  Printer
} from "lucide-react";
import { escapeDeep } from "@/lib/escape-html";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

interface PacienteUci {
  id: string;
  nombre: string;
  cama: string;
  diagnostico: string;
  diasUci: number;
  pam: number;
  sofaScore: number;
}

const PACIENTES_UCI_MOCK: PacienteUci[] = [
  {
    id: "ADM-UCI-01",
    nombre: "José Tavárez Grullón",
    cama: "Cama UCI-01 (Shock/Aislado)",
    diagnostico: "Shock Cardiogénico post-IAM anterior extenso",
    diasUci: 2,
    pam: 68,
    sofaScore: 8,
  },
  {
    id: "ADM-UCI-02",
    nombre: "Mercedes Almonte Cruz",
    cama: "Cama UCI-03",
    diagnostico: "Sepsis de origen abdominal / Peritonitis post-qx",
    diasUci: 4,
    pam: 74,
    sofaScore: 6,
  },
  {
    id: "ADM-UCI-03",
    nombre: "Ramón Arturo Henríquez",
    cama: "Cama UCI-04",
    diagnostico: "SDRA Severo / Ventilación mecánica protectora",
    diasUci: 6,
    pam: 72,
    sofaScore: 9,
  },
];

export default function UciManagement() {
  const [pacientesUci, setPacientesUci] = useState<PacienteUci[]>(PACIENTES_UCI_MOCK);
  const [pacienteId, setPacienteId] = useState<string>(PACIENTES_UCI_MOCK[0].id);
  const [tab, setTab] = useState("infusiones");

  // Infusiones
  const [infusiones, setInfusiones] = useState<any[]>([
    {
      id: "inf-1",
      medicamento: "Norepinefrina (8mg en 100ml Dextrosa 5%)",
      dosis: "0.15 mcg/kg/min",
      via: "Catéter Venoso Central (Lumen Distal)",
      velocidad: "8.5 ml/h",
      estado: "activa",
    },
    {
      id: "inf-2",
      medicamento: "Fentanilo (1000mcg en 100ml SSN 0.9%)",
      dosis: "100 mcg/h",
      via: "Catéter Venoso Central (Lumen Medial)",
      velocidad: "10.0 ml/h",
      estado: "activa",
    },
    {
      id: "inf-3",
      medicamento: "Midazolam (100mg en 100ml SSN 0.9%)",
      dosis: "5 mg/h",
      via: "Catéter Venoso Central (Lumen Medial)",
      velocidad: "5.0 ml/h",
      estado: "activa",
    },
  ]);
  const [infForm, setInfForm] = useState({ medicamento: "", dosis: "", via: "CVC Lumen Medial", velocidad: "" });

  // Balance
  const [balances, setBalances] = useState<any[]>([
    { id: "b-1", hora: "08:00 - 14:00", ingresos_ml: 1250, egresos_ml: 800, tipo: "Turno Mañana (Diuresis 650ml + SNG 150ml)" },
    { id: "b-2", hora: "14:00 - 20:00", ingresos_ml: 950, egresos_ml: 720, tipo: "Turno Tarde (Diuresis 600ml + Drenaje 120ml)" },
  ]);
  const [balForm, setBalForm] = useState({ ingresos_ml: "", egresos_ml: "", tipo: "" });

  // Kardex
  const [kardex, setKardex] = useState<any[]>([
    {
      id: "k-1",
      turno: "noche",
      actividad: "Aspiración de secreciones por TOT + Higiene bucal con Clorhexidina al 0.12%",
      observaciones: "Secreciones bronquiales mucosas escasas. Presión de neumotaponamiento verificada en 25 cmH2O.",
      enfermera: "Lic. Ana Reyes",
    },
    {
      id: "k-2",
      turno: "tarde",
      actividad: "Cambio postural a decúbito lateral derecho + Lubricación de piel",
      observaciones: "Piel íntegra en zonas de apoyo. Escala Braden 12/23 (Alto riesgo).",
      enfermera: "Lic. Marcos Duval",
    },
  ]);
  const [kForm, setKForm] = useState({ turno: "manana", actividad: "", observaciones: "" });

  const pacienteActivo = useMemo(() => {
    return pacientesUci.find((p) => p.id === pacienteId) || pacientesUci[0];
  }, [pacientesUci, pacienteId]);

  const addInf = () => {
    if (!infForm.medicamento || !infForm.velocidad) {
      toast.error("Complete el fármaco y la velocidad de infusión.");
      return;
    }
    const nueva = {
      id: `inf-${Date.now()}`,
      medicamento: infForm.medicamento,
      dosis: infForm.dosis || "Regulada por bomba",
      via: infForm.via,
      velocidad: `${infForm.velocidad} ml/h`,
      estado: "activa",
    };
    setInfusiones([nueva, ...infusiones]);
    setInfForm({ medicamento: "", dosis: "", via: "CVC Lumen Medial", velocidad: "" });
    toast.success("Bomba de infusión registrada");
  };

  const addBal = () => {
    if (!balForm.ingresos_ml || !balForm.egresos_ml) {
      toast.error("Ingrese los volúmenes de ingresos y egresos.");
      return;
    }
    const nuevo = {
      id: `b-${Date.now()}`,
      hora: new Date().toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" }),
      ingresos_ml: parseFloat(balForm.ingresos_ml) || 0,
      egresos_ml: parseFloat(balForm.egresos_ml) || 0,
      tipo: balForm.tipo || "Control horario",
    };
    setBalances([nuevo, ...balances]);
    setBalForm({ ingresos_ml: "", egresos_ml: "", tipo: "" });
    toast.success("Balance hídrico registrado");
  };

  const addKar = () => {
    if (!kForm.actividad) {
      toast.error("Especifique la actividad de enfermería.");
      return;
    }
    const nuevo = {
      id: `k-${Date.now()}`,
      turno: kForm.turno,
      actividad: kForm.actividad,
      observaciones: kForm.observaciones || "Sin novedades adicionales",
      enfermera: "Enfermería de Guardia UCI",
    };
    setKardex([nuevo, ...kardex]);
    setKForm({ turno: "manana", actividad: "", observaciones: "" });
    toast.success("Registro de Kardex guardado");
  };

  const totalIng = balances.reduce((s, b) => s + Number(b.ingresos_ml || 0), 0);
  const totalEgr = balances.reduce((s, b) => s + Number(b.egresos_ml || 0), 0);
  const balanceNeto = totalIng - totalEgr;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Cuidados Intensivos & Terapia Crítica (UCI)"
        subtitle="Monitoreo hemodinámico, bombas de infusión continua, balance hídrico acumulado y kardex de enfermería"
        icon={Activity}
        badge="Unidad de Cuidados Críticos / Nivel III"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">Paciente en Cama:</span>
            <Select value={pacienteId} onValueChange={setPacienteId}>
              <SelectTrigger className="w-64 h-9 text-xs rounded-xl border-border/80 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pacientesUci.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.cama}: {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Banner del Paciente Crítico Seleccionado */}
      <div className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
        <div>
          <span className="font-bold text-sm text-foreground mr-2">{pacienteActivo.nombre}</span>
          <Badge variant="outline" className="text-[11px] font-mono mr-2 border-rose-500/40 text-rose-700 dark:text-rose-400">
            {pacienteActivo.cama}
          </Badge>
          <span className="text-muted-foreground">Dx: {pacienteActivo.diagnostico}</span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span>Estancia: <strong>{pacienteActivo.diasUci} días</strong></span>
          <span>PAM: <strong className="text-foreground">{pacienteActivo.pam} mmHg</strong></span>
          <span>SOFA Score: <strong className="text-rose-600 font-bold">{pacienteActivo.sofaScore} pts</strong></span>
        </div>
      </div>

      {/* KPIs de UCI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Balance Hídrico Acumulado"
          value={`${balanceNeto > 0 ? "+" : ""}${balanceNeto} ml`}
          subtitle={`Ing: ${totalIng} ml | Egr: ${totalEgr} ml`}
          icon={Droplet}
          variant={balanceNeto > 1500 ? "amber" : "teal"}
          alert={balanceNeto > 2000}
        />
        <ClinicalKpiCard
          title="Bombas de Infusión Activas"
          value={infusiones.filter((i) => i.estado === "activa").length}
          subtitle="Vasoactivos y sedoanalgesia continua"
          icon={Syringe}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Presión Arterial Media (PAM)"
          value={`${pacienteActivo.pam} mmHg`}
          subtitle="Meta clínica &gt; 65 mmHg en shock"
          icon={HeartPulse}
          variant={pacienteActivo.pam < 65 ? "rose" : "emerald"}
          alert={pacienteActivo.pam < 65}
        />
        <ClinicalKpiCard
          title="Score de Disfunción (SOFA)"
          value={`${pacienteActivo.sofaScore} / 24`}
          subtitle="Mortalidad estimada &lt; 20%"
          icon={ShieldAlert}
          variant="amber"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="infusiones" className="text-xs sm:text-sm">
            <Syringe className="h-4 w-4 mr-1.5" />
            Bombas de Infusión ({infusiones.length})
          </TabsTrigger>
          <TabsTrigger value="balance" className="text-xs sm:text-sm">
            <Droplet className="h-4 w-4 mr-1.5" />
            Balance Hídrico ({balanceNeto > 0 ? `+${balanceNeto}` : balanceNeto} ml)
          </TabsTrigger>
          <TabsTrigger value="kardex" className="text-xs sm:text-sm">
            <ClipboardList className="h-4 w-4 mr-1.5" />
            Kardex de Cuidados Críticos ({kardex.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Infusiones y Bombas */}
        <TabsContent value="infusiones" className="space-y-4">
          <Card className="rounded-2xl border-border/80">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Syringe className="h-5 w-5 text-purple-600" />
                Bombas de Infusión Continua Programadas
              </CardTitle>
              <CardDescription>
                Titulaciones de drogas vasoactivas, inotrópicos, sedación profunda y analgesia parenteral.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-muted/20 p-3 rounded-xl border border-border/60 text-xs">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px]">Medicamento & Dilución *</Label>
                  <Input
                    placeholder="Ej: Norepinefrina 8mg en 100ml Dextrosa 5%"
                    value={infForm.medicamento}
                    onChange={(e) => setInfForm({ ...infForm, medicamento: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Dosis Titulada</Label>
                  <Input
                    placeholder="Ej: 0.10 mcg/kg/min"
                    value={infForm.dosis}
                    onChange={(e) => setInfForm({ ...infForm, dosis: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Velocidad Bomba (ml/h) *</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      placeholder="ml/h"
                      value={infForm.velocidad}
                      onChange={(e) => setInfForm({ ...infForm, velocidad: e.target.value })}
                      className="h-8 text-xs font-mono"
                    />
                    <Button size="sm" onClick={addInf} className="h-8 px-3">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border/60">
                {infusiones.map((inf) => (
                  <div key={inf.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{inf.medicamento}</span>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                          Infusión Activa
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Vía: <strong className="text-foreground">{inf.via}</strong> · Dosis: <span className="font-mono">{inf.dosis}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-bold font-mono text-primary">{inf.velocidad}</span>
                        <p className="text-[10px] text-muted-foreground">Bomba #3 (Peristáltica)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Balance Hídrico Horario */}
        <TabsContent value="balance" className="space-y-4">
          <Card className="rounded-2xl border-border/80">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplet className="h-5 w-5 text-teal-600" />
                Control de Balance Hídrico Acumulado (24 Horas)
              </CardTitle>
              <CardDescription>
                Cómputo estricto de aportes parenterales/enterales versus diuresis horaria, drenajes y sangrado.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-muted/20 p-3 rounded-xl border border-border/60 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px]">Ingresos (ml) *</Label>
                  <Input
                    type="number"
                    placeholder="Sueros, nutrición, infusiones"
                    value={balForm.ingresos_ml}
                    onChange={(e) => setBalForm({ ...balForm, ingresos_ml: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Egresos (ml) *</Label>
                  <Input
                    type="number"
                    placeholder="Diuresis, sondas, vómitos"
                    value={balForm.egresos_ml}
                    onChange={(e) => setBalForm({ ...balForm, egresos_ml: e.target.value })}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px]">Detalle / Turno</Label>
                  <div className="flex gap-1">
                    <Input
                      placeholder="Ej: Diuresis 400ml + SNG 50ml"
                      value={balForm.tipo}
                      onChange={(e) => setBalForm({ ...balForm, tipo: e.target.value })}
                      className="h-8 text-xs"
                    />
                    <Button size="sm" onClick={addBal} className="h-8 px-3">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período / Hora</TableHead>
                    <TableHead>Ingresos (ml)</TableHead>
                    <TableHead>Egresos (ml)</TableHead>
                    <TableHead>Balance Neto Parcial</TableHead>
                    <TableHead>Detalle de Pérdidas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((b) => {
                    const netoParcial = b.ingresos_ml - b.egresos_ml;
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-semibold text-xs">{b.hora}</TableCell>
                        <TableCell className="font-mono text-xs text-blue-600">+{b.ingresos_ml} ml</TableCell>
                        <TableCell className="font-mono text-xs text-rose-600">-{b.egresos_ml} ml</TableCell>
                        <TableCell className="font-mono font-bold text-xs">
                          {netoParcial > 0 ? `+${netoParcial}` : netoParcial} ml
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{b.tipo}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Kardex de Cuidados Críticos */}
        <TabsContent value="kardex" className="space-y-4">
          <Card className="rounded-2xl border-border/80">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-amber-600" />
                Bitácora de Kardex de Enfermería en Paciente Crítico
              </CardTitle>
              <CardDescription>
                Registro horario de intervenciones de soporte vital, prevención de infecciones asociadas a catéter y NAV.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-muted/20 p-3 rounded-xl border border-border/60 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px]">Turno</Label>
                  <Select value={kForm.turno} onValueChange={(v) => setKForm({ ...kForm, turno: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manana">Turno Mañana (07h - 15h)</SelectItem>
                      <SelectItem value="tarde">Turno Tarde (15h - 23h)</SelectItem>
                      <SelectItem value="noche">Turno Noche (23h - 07h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-[11px]">Actividad / Intervención *</Label>
                  <Input
                    placeholder="Ej: Cambio de apósito de vía central con clorhexidina"
                    value={kForm.actividad}
                    onChange={(e) => setKForm({ ...kForm, actividad: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Acción</Label>
                  <Button size="sm" onClick={addKar} className="h-8 w-full">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Registrar Kardex
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {kardex.map((k) => (
                  <div key={k.id} className="p-3 rounded-xl border border-border/70 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-[10px]">
                          Turno {k.turno}
                        </Badge>
                        <span className="font-semibold text-foreground">{k.actividad}</span>
                      </div>
                      <span className="text-muted-foreground text-[11px] font-mono">{k.enfermera}</span>
                    </div>
                    {k.observaciones && (
                      <p className="text-muted-foreground pt-0.5">{k.observaciones}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
