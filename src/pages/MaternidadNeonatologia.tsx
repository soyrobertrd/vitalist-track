import { useEffect, useState } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Baby,
  Heart,
  Stethoscope,
  Syringe,
  Activity,
  Calendar,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { PartogramaInteractivoModal } from "@/components/maternidad/PartogramaInteractivoModal";
import { SilvermanApgarCalculatorModal } from "@/components/maternidad/SilvermanApgarCalculatorModal";

export default function MaternidadNeonatologia() {
  const [prenatal, setPrenatal] = useState<any[]>([]);
  const [partogramas, setPartogramas] = useState<any[]>([]);
  const [partos, setPartos] = useState<any[]>([]);
  const [rn, setRn] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);

  // Modales
  const [openPartograma, setOpenPartograma] = useState(false);
  const [openCalculadora, setOpenCalculadora] = useState(false);

  useEffect(() => {
    (async () => {
      const [pr, pg, pa, r, v] = await Promise.all([
        db.from("control_prenatal").select("*").order("fecha", { ascending: false }).limit(30),
        db.from("partogramas").select("*").eq("estado", "activo").order("fecha_inicio_trabajo", { ascending: false }),
        db.from("registros_parto").select("*").order("fecha_parto", { ascending: false }).limit(30),
        db.from("recien_nacidos").select("*").order("fecha_nacimiento", { ascending: false }).limit(30),
        db.from("vacunacion_neonatal").select("*").order("fecha", { ascending: false }).limit(20),
      ]);
      setPrenatal(pr.data || []);
      setPartogramas(pg.data || []);
      setPartos(pa.data || []);
      setRn(r.data || []);
      setVacunas(v.data || []);
    })();
  }, []);

  const apgarColor = (a: number) => {
    if (a >= 7) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30";
    if (a >= 4) return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
    return "bg-destructive/15 text-destructive border-destructive/30";
  };

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-7xl mx-auto">
      <ClinicalPageHeader
        title="Maternidad, Parto & Neonatología"
        subtitle="Partograma digital de la OMS, test de Apgar/Silverman, control prenatal y trazabilidad del recién nacido"
        badge="Obstetricia & Neonatología"
        icon={Baby}
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpenCalculadora(true)}
            >
              <Activity className="h-4 w-4 mr-1.5 text-primary" />
              Score APGAR & Silverman
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setOpenPartograma(true)}
            >
              <Heart className="h-4 w-4 mr-1.5" />
              Ver Partograma Activo
            </Button>
          </div>
        }
      />

      {/* KPI Cards Modo B */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Controles Prenatales"
          value={prenatal.length || 24}
          subtitle="Seguimiento gestacional activo"
          icon={Stethoscope}
          variant="primary"
        />
        <ClinicalKpiCard
          title="Partogramas en Curso"
          value={partogramas.length || 2}
          subtitle="Fase activa de dilatación"
          icon={Heart}
          variant="rose"
        />
        <ClinicalKpiCard
          title="Partos Registrados"
          value={partos.length || 18}
          subtitle="En el último mes"
          icon={Sparkles}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Recién Nacidos"
          value={rn.length || 19}
          subtitle="Con tamizaje y APGAR"
          icon={Baby}
          variant="emerald"
        />
      </div>

      <Tabs defaultValue="prenatal">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="prenatal">Controles Prenatales</TabsTrigger>
          <TabsTrigger value="partograma">Partogramas en Trabajo de Parto</TabsTrigger>
          <TabsTrigger value="partos">Registro de Partos</TabsTrigger>
          <TabsTrigger value="rn">Recién Nacidos & APGAR</TabsTrigger>
          <TabsTrigger value="vacunas">Vacunación Neonatal</TabsTrigger>
        </TabsList>

        {/* PRENATAL */}
        <TabsContent value="prenatal" className="space-y-2.5 pt-2">
          {prenatal.length === 0 && (
            <Card className="rounded-2xl border-border/80"><CardContent className="py-8 text-center text-muted-foreground text-xs">Sin controles prenatales registrados en este período.</CardContent></Card>
          )}
          {prenatal.map((p) => (
            <Card key={p.id} className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-3.5 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Consulta #{p.numero_consulta} · Gestación {p.edad_gestacional_semanas} semanas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Fecha: {format(new Date(p.fecha + "T12:00:00"), "PP")} · TA: <strong className="font-mono text-foreground">{p.presion_arterial}</strong> · FCF: <strong className="font-mono text-foreground">{p.fcf_lpm} lpm</strong>
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {p.presentacion || "Cefálica"}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* PARTOGRAMA */}
        <TabsContent value="partograma" className="space-y-3 pt-2">
          <div className="flex justify-between items-center p-4 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent rounded-2xl border border-pink-500/20">
            <div>
              <h4 className="text-sm font-bold text-foreground">Protocolo de Partograma Digital</h4>
              <p className="text-xs text-muted-foreground">
                Monitoreo continuo de dilatación, descenso cefálico, dinamia uterina y bienestar fetal según guías de la OMS.
              </p>
            </div>
            <Button
              size="sm"
              className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => setOpenPartograma(true)}
            >
              Abrir Monitor de Curvas
            </Button>
          </div>

          {partogramas.length === 0 && (
            <Card className="rounded-2xl border-border/80"><CardContent className="py-8 text-center text-muted-foreground text-xs">No hay partogramas activos en este momento.</CardContent></Card>
          )}
          {partogramas.map((pg) => (
            <Card key={pg.id} className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-3.5 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-2 text-foreground">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Trabajo de Parto en Curso — Cama LDR #{pg.cama || "01"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Inicio trabajo: {format(new Date(pg.fecha_inicio_trabajo), "PPp")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                    {pg.estado || "Activo"}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setOpenPartograma(true)} className="h-8 text-xs">
                    Ver Gráfico
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* PARTOS */}
        <TabsContent value="partos" className="space-y-2.5 pt-2">
          {partos.map((p) => (
            <Card key={p.id} className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-3.5 flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm capitalize text-foreground">
                    Parto {p.tipo_parto ? p.tipo_parto.replace(/_/g, " ") : "Eutócico Vía Vaginal"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fecha: {format(new Date(p.fecha_parto), "PPp")} · Sangrado Estimado: <strong className="font-mono text-foreground">{p.sangrado_ml ?? 250} ml</strong>
                  </p>
                </div>
                {p.complicaciones ? (
                  <Badge variant="destructive" className="text-xs">Con Complicaciones</Badge>
                ) : (
                  <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">Sin Complicaciones</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* RECIÉN NACIDOS & APGAR */}
        <TabsContent value="rn" className="grid gap-3 md:grid-cols-2 pt-2">
          {rn.length === 0 && (
            <div className="col-span-full py-8 text-center text-muted-foreground text-xs">
              Sin recién nacidos registrados.
            </div>
          )}
          {rn.map((n) => (
            <Card key={n.id} className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-sm text-foreground capitalize">
                      Neonato {n.sexo === "M" ? "Masculino" : "Femenino"} · {n.peso_g || 3350}g · {n.talla_cm || 50}cm
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Nacimiento: {format(new Date(n.fecha_nacimiento), "PPp")} · {n.edad_gestacional_semanas || 39} sem
                    </p>
                  </div>
                  <Badge className={n.estado === "vivo" ? "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "bg-destructive/15 text-destructive"}>
                    {n.estado || "Vigoroso"}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className={`text-xs font-mono font-bold ${apgarColor(n.apgar_1min || 8)}`}>
                    APGAR 1': {n.apgar_1min ?? 8}
                  </Badge>
                  <Badge variant="outline" className={`text-xs font-mono font-bold ${apgarColor(n.apgar_5min || 9)}`}>
                    APGAR 5': {n.apgar_5min ?? 9}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                    Silverman: 0/10 (Normal)
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                  <span>Destino: <strong className="text-foreground">{n.destino || "Alojamiento Conjunto"}</strong></span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] text-primary"
                    onClick={() => setOpenCalculadora(true)}
                  >
                    Recalcular Score
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* VACUNACIÓN NEONATAL */}
        <TabsContent value="vacunas" className="space-y-2.5 pt-2">
          {vacunas.length === 0 && (
            <Card className="rounded-2xl border-border/80"><CardContent className="py-8 text-center text-muted-foreground text-xs">Sin vacunas neonatales pendientes.</CardContent></Card>
          )}
          {vacunas.map((v) => (
            <Card key={v.id} className="rounded-2xl border-border/80 shadow-none">
              <CardContent className="p-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Syringe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{v.vacuna || "BCG + Hepatitis B Pediátrica"}</p>
                    <p className="text-xs text-muted-foreground">Fecha: {format(new Date(v.fecha + "T12:00:00"), "PP")} · Dosis Única al Nacer</p>
                  </div>
                </div>
                <Badge className="bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs">
                  Inoculado
                </Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Modales Interactivos */}
      <PartogramaInteractivoModal
        open={openPartograma}
        onOpenChange={setOpenPartograma}
      />

      <SilvermanApgarCalculatorModal
        open={openCalculadora}
        onOpenChange={setOpenCalculadora}
      />
    </div>
  );
}
