import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Stethoscope,
  Search,
  BookOpen,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  Activity,
  HeartPulse,
  Pill,
  Syringe,
  Building2,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export interface DiagnosticoCIE10 {
  codigo: string;
  descripcion: string;
  capitulo: string;
  categoria: string;
  vigilancia_sinave: boolean;
  grupo_morbimortalidad?: string;
  notas_exclusion?: string;
  cie11_equivalente?: string;
}

export interface ProcedimientoCPT {
  codigo: string;
  descripcion: string;
  categoria: "Consulta / Evaluación" | "Quirúrgico" | "Imagenología" | "Laboratorio" | "Terapéutica";
  tiempo_estimado_min: number;
  tarifa_referencia_dop: number;
  requiere_quirofano: boolean;
  complejidad: "Baja" | "Media" | "Alta";
}

export interface PrestacionSISALRIL {
  codigo_simo: string;
  cpt_asociado: string;
  descripcion: string;
  subgrupo: string;
  cobertura_pdss_pct: number;
  requiere_preautorizacion: boolean;
  ars_cobertura_universal: boolean;
}

const MOCK_CIE10: DiagnosticoCIE10[] = [
  {
    codigo: "I10",
    descripcion: "Hipertensión esencial (primaria)",
    capitulo: "IX - Enfermedades del sistema circulatorio",
    categoria: "Hipertensión arterial",
    vigilancia_sinave: false,
    grupo_morbimortalidad: "Enfermedades Crónicas no Transmisibles",
    notas_exclusion: "Excluye: hipertensión con compromiso coronario (I11.-)",
    cie11_equivalente: "BA00",
  },
  {
    codigo: "E11.9",
    descripcion: "Diabetes mellitus tipo 2 sin mención de complicación",
    capitulo: "IV - Enfermedades endocrinas, nutricionales y metabólicas",
    categoria: "Diabetes mellitus",
    vigilancia_sinave: false,
    grupo_morbimortalidad: "Enfermedades Crónicas no Transmisibles",
    notas_exclusion: "Excluye: diabetes gestacional (O24.4), diabetes tipo 1 (E10.-)",
    cie11_equivalente: "5A11",
  },
  {
    codigo: "A90",
    descripcion: "Fiebre del dengue [dengue clásico]",
    capitulo: "I - Ciertas enfermedades infecciosas y parasitarias",
    categoria: "Fiebres virales transmitidas por artrópodos",
    vigilancia_sinave: true,
    grupo_morbimortalidad: "Enfermedades Transmisibles Vectoriales",
    notas_exclusion: "Excluye: fiebre del dengue hemorrágico (A91)",
    cie11_equivalente: "1D20",
  },
  {
    codigo: "A91",
    descripcion: "Fiebre del dengue hemorrágico / Dengue Grave",
    capitulo: "I - Ciertas enfermedades infecciosas y parasitarias",
    categoria: "Fiebres virales transmitidas por artrópodos",
    vigilancia_sinave: true,
    grupo_morbimortalidad: "Urgencias Epidemiológicas DIGEPI",
    notas_exclusion: "Notificación inmediata obligatoria dentro de 24h",
    cie11_equivalente: "1D21",
  },
  {
    codigo: "J45.9",
    descripcion: "Asma, no especificada",
    capitulo: "X - Enfermedades del sistema respiratorio",
    categoria: "Enfermedades crónicas de las vías respiratorias inferiores",
    vigilancia_sinave: false,
    grupo_morbimortalidad: "Afecciones Respiratorias Crónicas",
    cie11_equivalente: "CA23",
  },
  {
    codigo: "K80.2",
    descripcion: "Cálculo de la vesícula biliar sin colecistitis (Colelitiasis)",
    capitulo: "XI - Enfermedades del sistema digestivo",
    categoria: "Trastornos de la vesícula biliar y de las vías biliares",
    vigilancia_sinave: false,
    grupo_morbimortalidad: "Patología Quirúrgica Abdominal",
    cie11_equivalente: "DC11.0",
  },
  {
    codigo: "O80.0",
    descripcion: "Parto único espontáneo, presentación cefálica de vértice",
    capitulo: "XV - Embarazo, parto y puerperio",
    categoria: "Parto único espontáneo",
    vigilancia_sinave: false,
    grupo_morbimortalidad: "Salud Materno-Neonatal",
    cie11_equivalente: "JA00",
  },
  {
    codigo: "B20",
    descripcion: "Enfermedad por VIH, resultante en enfermedades infecciosas y parasitarias",
    capitulo: "I - Ciertas enfermedades infecciosas y parasitarias",
    categoria: "Enfermedad por virus de la inmunodeficiencia humana",
    vigilancia_sinave: true,
    grupo_morbimortalidad: "Vigilancia Especial SNS/DIGEPI",
    cie11_equivalente: "1C60",
  },
];

const MOCK_CPT: ProcedimientoCPT[] = [
  {
    codigo: "99213",
    descripcion: "Consulta médica de seguimiento en consultorio o ambulatoria (complejidad baja-media)",
    categoria: "Consulta / Evaluación",
    tiempo_estimado_min: 20,
    tarifa_referencia_dop: 2500,
    requiere_quirofano: false,
    complejidad: "Baja",
  },
  {
    codigo: "99214",
    descripcion: "Consulta médica especializada de complejidad alta (revisión integral y ajuste farmacológico)",
    categoria: "Consulta / Evaluación",
    tiempo_estimado_min: 35,
    tarifa_referencia_dop: 3800,
    requiere_quirofano: false,
    complejidad: "Media",
  },
  {
    codigo: "47562",
    descripcion: "Colecistectomía laparoscópica quirúrgica (extirpación de vesícula biliar por laparoscopía)",
    categoria: "Quirúrgico",
    tiempo_estimado_min: 75,
    tarifa_referencia_dop: 28000,
    requiere_quirofano: true,
    complejidad: "Alta",
  },
  {
    codigo: "93306",
    descripcion: "Ecocardiografía transtorácica completa en tiempo real con Doppler color y flujo espectral",
    categoria: "Imagenología",
    tiempo_estimado_min: 30,
    tarifa_referencia_dop: 4800,
    requiere_quirofano: false,
    complejidad: "Media",
  },
  {
    codigo: "80053",
    descripcion: "Panel Metabólico Integral (14 pruebas: glucosa, electrolitos, función renal y hepática)",
    categoria: "Laboratorio",
    tiempo_estimado_min: 15,
    tarifa_referencia_dop: 1650,
    requiere_quirofano: false,
    complejidad: "Baja",
  },
  {
    codigo: "71045",
    descripcion: "Radiografía de tórax póstero-anterior (PA) de una sola proyección",
    categoria: "Imagenología",
    tiempo_estimado_min: 10,
    tarifa_referencia_dop: 950,
    requiere_quirofano: false,
    complejidad: "Baja",
  },
  {
    codigo: "44970",
    descripcion: "Apendicectomía laparoscópica por abdomen agudo",
    categoria: "Quirúrgico",
    tiempo_estimado_min: 60,
    tarifa_referencia_dop: 24500,
    requiere_quirofano: true,
    complejidad: "Alta",
  },
];

const MOCK_SIMO: PrestacionSISALRIL[] = [
  {
    codigo_simo: "SIMO-01.01.01",
    cpt_asociado: "99214",
    descripcion: "Consulta Médica Especializada Ambulatoria en Red Prestadora",
    subgrupo: "Consultas Médicas Especializadas",
    cobertura_pdss_pct: 80,
    requiere_preautorizacion: false,
    ars_cobertura_universal: true,
  },
  {
    codigo_simo: "SIMO-04.02.18",
    cpt_asociado: "47562",
    descripcion: "Colecistectomía por Vía Laparoscópica en Bloque Quirúrgico",
    subgrupo: "Cirugía del Aparato Digestivo y Vías Biliares",
    cobertura_pdss_pct: 85,
    requiere_preautorizacion: true,
    ars_cobertura_universal: true,
  },
  {
    codigo_simo: "SIMO-03.01.04",
    cpt_asociado: "93306",
    descripcion: "Ecocardiografía Doppler Transtorácica en Adultos y Niños",
    subgrupo: "Estudios Cardiovasculares Especiales",
    cobertura_pdss_pct: 80,
    requiere_preautorizacion: true,
    ars_cobertura_universal: true,
  },
  {
    codigo_simo: "SIMO-02.01.22",
    cpt_asociado: "80053",
    descripcion: "Perfil Bioquímico Sanguíneo Ampliado Automatizado",
    subgrupo: "Pruebas de Laboratorio Clínico de Rutina",
    cobertura_pdss_pct: 85,
    requiere_preautorizacion: false,
    ars_cobertura_universal: true,
  },
  {
    codigo_simo: "SIMO-03.04.01",
    cpt_asociado: "71045",
    descripcion: "Radiología Convencional de Tórax Óseo y Pleuropulmonar",
    subgrupo: "Diagnóstico por Imágenes Radiológicas",
    cobertura_pdss_pct: 85,
    requiere_preautorizacion: false,
    ars_cobertura_universal: true,
  },
];

export default function CatalogosClinicos() {
  const [tab, setTab] = useState<"cie10" | "cpt" | "simo">("cie10");
  const [qCie, setQCie] = useState("");
  const [qCpt, setQCpt] = useState("");
  const [qSimo, setQSimo] = useState("");
  const [capituloFilter, setCapituloFilter] = useState("todos");
  const [categoriaCptFilter, setCategoriaCptFilter] = useState("todas");
  const [sinaveOnly, setSinaveOnly] = useState(false);

  // Modal de Detalle
  const [selectedCie, setSelectedCie] = useState<DiagnosticoCIE10 | null>(null);
  const [selectedCpt, setSelectedCpt] = useState<ProcedimientoCPT | null>(null);

  // Datos
  const [cieList, setCieList] = useState<DiagnosticoCIE10[]>(MOCK_CIE10);
  const [cptList, setCptList] = useState<ProcedimientoCPT[]>(MOCK_CPT);
  const [simoList, setSimoList] = useState<PrestacionSISALRIL[]>(MOCK_SIMO);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: a }, { data: b }] = await Promise.all([
          (db as any)
            .from("catalogo_cie10")
            .select("*")
            .eq("activo", true)
            .order("codigo")
            .limit(500),
          (db as any)
            .from("catalogo_cpt")
            .select("*")
            .eq("activo", true)
            .order("codigo")
            .limit(500),
        ]);
        if (a && a.length > 0) {
          setCieList(
            a.map((item: any) => ({
              codigo: item.codigo,
              descripcion: item.descripcion,
              capitulo: item.capitulo || "General",
              categoria: item.categoria || "Clínico",
              vigilancia_sinave: Boolean(item.vigilancia_sinave || item.notificacion_obligatoria),
              grupo_morbimortalidad: item.grupo_morbimortalidad,
              notas_exclusion: item.notas_exclusion,
              cie11_equivalente: item.cie11_equivalente,
            }))
          );
        }
        if (b && b.length > 0) {
          setCptList(
            b.map((item: any) => ({
              codigo: item.codigo,
              descripcion: item.descripcion,
              categoria: item.categoria || "Quirúrgico",
              tiempo_estimado_min: Number(item.duracion_min || 30),
              tarifa_referencia_dop: Number(item.tarifa_referencia || 2500),
              requiere_quirofano: Boolean(item.requiere_quirofano),
              complejidad: item.complejidad || "Media",
            }))
          );
        }
      } catch {
        // Mock fallback
      }
    })();
  }, []);

  const copiarCodigo = (cod: string) => {
    navigator.clipboard.writeText(cod);
    toast.success(`Código ${cod} copiado al portapapeles`);
  };

  // Filtrado CIE-10
  const filteredCie = useMemo(() => {
    return cieList.filter((x) => {
      const matchText =
        !qCie ||
        x.codigo.toLowerCase().includes(qCie.toLowerCase()) ||
        x.descripcion.toLowerCase().includes(qCie.toLowerCase()) ||
        x.categoria.toLowerCase().includes(qCie.toLowerCase());
      const matchCap = capituloFilter === "todos" || x.capitulo.startsWith(capituloFilter);
      const matchSinave = !sinaveOnly || x.vigilancia_sinave;
      return matchText && matchCap && matchSinave;
    });
  }, [cieList, qCie, capituloFilter, sinaveOnly]);

  // Filtrado CPT
  const filteredCpt = useMemo(() => {
    return cptList.filter((x) => {
      const matchText =
        !qCpt ||
        x.codigo.toLowerCase().includes(qCpt.toLowerCase()) ||
        x.descripcion.toLowerCase().includes(qCpt.toLowerCase());
      const matchCat = categoriaCptFilter === "todas" || x.categoria === categoriaCptFilter;
      return matchText && matchCat;
    });
  }, [cptList, qCpt, categoriaCptFilter]);

  // Filtrado SIMO
  const filteredSimo = useMemo(() => {
    return simoList.filter((x) => {
      return (
        !qSimo ||
        x.codigo_simo.toLowerCase().includes(qSimo.toLowerCase()) ||
        x.cpt_asociado.toLowerCase().includes(qSimo.toLowerCase()) ||
        x.descripcion.toLowerCase().includes(qSimo.toLowerCase()) ||
        x.subgrupo.toLowerCase().includes(qSimo.toLowerCase())
      );
    });
  }, [simoList, qSimo]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Catálogos Clínicos & Codificación Médica"
        subtitle="Estandarización diagnóstica CIE-10 (OMS), procedimientos CPT y nomenclador SISALRIL / SIMO para autorizaciones ARS"
        icon={BookOpen}
        badge="Estándar Internacional & RD"
      />

      {/* KPIs Clínicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Diagnósticos CIE-10"
          value={cieList.length}
          subtitle="Clasificación Internacional OMS"
          icon={FileText}
          variant="teal"
        />
        <ClinicalKpiCard
          title="Procedimientos CPT"
          value={cptList.length}
          subtitle="Nomenclador de intervenciones & actos"
          icon={Stethoscope}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Catálogo SIMO / SISALRIL"
          value={simoList.length}
          subtitle="Prestaciones del PDSS para ARS"
          icon={Building2}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Alertas SINAVE DIGEPI"
          value={cieList.filter((c) => c.vigilancia_sinave).length}
          subtitle="Patologías de notificación obligatoria"
          icon={ShieldAlert}
          variant="rose"
        />
      </div>

      {/* Pestañas Principales */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="space-y-4">
        <TabsList className="bg-muted/40 p-1.5 rounded-2xl border border-border/70 flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="cie10" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <FileText className="h-4 w-4 text-teal-600" />
            CIE-10 (Diagnósticos OMS)
          </TabsTrigger>
          <TabsTrigger value="cpt" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            CPT (Procedimientos & Cirugías)
          </TabsTrigger>
          <TabsTrigger value="simo" className="rounded-xl px-4 py-2 text-xs font-semibold gap-1.5">
            <Building2 className="h-4 w-4 text-purple-600" />
            SISALRIL / SIMO (Prestaciones ARS RD)
          </TabsTrigger>
        </TabsList>

        {/* TAB: CIE-10 */}
        <TabsContent value="cie10" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar diagnóstico por código (ej. I10) o nombre..."
                  value={qCie}
                  onChange={(e) => setQCie(e.target.value)}
                  className="pl-9 rounded-xl border-border/80 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <Select value={capituloFilter} onValueChange={setCapituloFilter}>
                  <SelectTrigger className="w-[220px] rounded-xl border-border/80 text-xs">
                    <SelectValue placeholder="Capítulo OMS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los Capítulos</SelectItem>
                    <SelectItem value="I -">I - Enfermedades Infecciosas</SelectItem>
                    <SelectItem value="IV -">IV - Endocrinas & Diabetes</SelectItem>
                    <SelectItem value="IX -">IX - Aparato Circulatorio</SelectItem>
                    <SelectItem value="X -">X - Sistema Respiratorio</SelectItem>
                    <SelectItem value="XI -">XI - Sistema Digestivo</SelectItem>
                    <SelectItem value="XV -">XV - Embarazo & Parto</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={sinaveOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSinaveOnly(!sinaveOnly)}
                  className={`rounded-xl text-xs gap-1.5 ${
                    sinaveOnly ? "bg-rose-600 hover:bg-rose-700 text-white" : "border-border/80 text-rose-600"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Solo SINAVE Obligatorio
                </Button>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 px-6 py-3.5 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-teal-600" /> Diagnósticos Clasificados
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredCie.length} Resultados
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="text-xs font-semibold w-[110px]">Código</TableHead>
                      <TableHead className="text-xs font-semibold">Descripción del Diagnóstico</TableHead>
                      <TableHead className="text-xs font-semibold">Categoría / Grupo</TableHead>
                      <TableHead className="text-xs font-semibold">Capítulo OMS</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Vigilancia SINAVE</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCie.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                          No se encontraron diagnósticos que coincidan con la búsqueda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCie.map((x) => (
                        <TableRow key={x.codigo} className="hover:bg-muted/20 text-xs">
                          <TableCell className="font-mono">
                            <Badge
                              variant="outline"
                              onClick={() => copiarCodigo(x.codigo)}
                              className="cursor-pointer hover:bg-muted font-bold text-teal-700 dark:text-teal-400 border-teal-500/30"
                              title="Copiar código"
                            >
                              {x.codigo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-foreground">{x.descripcion}</span>
                            {x.cie11_equivalente && (
                              <span className="block text-[10px] text-muted-foreground font-mono">
                                Equiv. CIE-11: {x.cie11_equivalente}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{x.categoria}</TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] truncate" title={x.capitulo}>
                            {x.capitulo}
                          </TableCell>
                          <TableCell className="text-center">
                            {x.vigilancia_sinave ? (
                              <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px] font-semibold">
                                <ShieldAlert className="w-2.5 h-2.5 mr-1" /> Ficha EPI-1
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">No obligatoria</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCie(x)}
                              className="h-7 text-xs rounded-lg hover:bg-muted"
                            >
                              Ver Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CPT */}
        <TabsContent value="cpt" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar procedimiento CPT (ej. 47562 o Colecistectomía)..."
                  value={qCpt}
                  onChange={(e) => setQCpt(e.target.value)}
                  className="pl-9 rounded-xl border-border/80 text-xs"
                />
              </div>

              <Select value={categoriaCptFilter} onValueChange={setCategoriaCptFilter}>
                <SelectTrigger className="w-[200px] rounded-xl border-border/80 text-xs">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las Categorías</SelectItem>
                  <SelectItem value="Consulta / Evaluación">Consulta / Evaluación</SelectItem>
                  <SelectItem value="Quirúrgico">Quirúrgico</SelectItem>
                  <SelectItem value="Imagenología">Imagenología</SelectItem>
                  <SelectItem value="Laboratorio">Laboratorio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 px-6 py-3.5 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-600" /> Procedimientos & Aranceles CPT
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredCpt.length} Procedimientos
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="text-xs font-semibold w-[100px]">Código CPT</TableHead>
                      <TableHead className="text-xs font-semibold">Descripción del Acto Médico</TableHead>
                      <TableHead className="text-xs font-semibold">Categoría</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Complejidad</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Quirófano</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Tarifa Ref. (DOP$)</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCpt.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                          No se encontraron procedimientos CPT.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCpt.map((x) => (
                        <TableRow key={x.codigo} className="hover:bg-muted/20 text-xs">
                          <TableCell className="font-mono">
                            <Badge
                              variant="outline"
                              onClick={() => copiarCodigo(x.codigo)}
                              className="cursor-pointer hover:bg-muted font-bold text-blue-700 dark:text-blue-400 border-blue-500/30"
                              title="Copiar código"
                            >
                              {x.codigo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{x.descripcion}</TableCell>
                          <TableCell className="text-muted-foreground">{x.categoria}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-[10px]">
                              {x.complejidad}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {x.requiere_quirofano ? (
                              <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 text-[10px]">
                                Quirófano
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Ambulatorio</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            DOP$ {x.tarifa_referencia_dop.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCpt(x)}
                              className="h-7 text-xs rounded-lg hover:bg-muted"
                            >
                              Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SIMO / SISALRIL */}
        <TabsContent value="simo" className="space-y-4 mt-0">
          <Card className="rounded-2xl border-border/80 shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código SIMO o prestación de aseguradora..."
                  value={qSimo}
                  onChange={(e) => setQSimo(e.target.value)}
                  className="pl-9 rounded-xl border-border/80 text-xs"
                />
              </div>
              <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700 border-purple-500/30">
                Plan de Servicios de Salud (PDSS)
              </Badge>
            </div>
          </Card>

          <Card className="rounded-2xl border-border/80 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/20 px-6 py-3.5 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" /> Nomenclador Dominicano SISALRIL (SIMO)
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {filteredSimo.length} Prestaciones
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableHead className="text-xs font-semibold w-[140px]">Código SIMO</TableHead>
                      <TableHead className="text-xs font-semibold w-[90px]">CPT Homólogo</TableHead>
                      <TableHead className="text-xs font-semibold">Descripción de Prestación SISALRIL</TableHead>
                      <TableHead className="text-xs font-semibold">Subgrupo PDSS</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Cobertura Base</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Pre-Autorización</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSimo.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                          No se encontraron prestaciones SIMO.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSimo.map((x) => (
                        <TableRow key={x.codigo_simo} className="hover:bg-muted/20 text-xs">
                          <TableCell className="font-mono">
                            <Badge
                              variant="outline"
                              onClick={() => copiarCodigo(x.codigo_simo)}
                              className="cursor-pointer hover:bg-muted font-bold text-purple-700 dark:text-purple-400 border-purple-500/30"
                              title="Copiar código SIMO"
                            >
                              {x.codigo_simo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">{x.cpt_asociado}</TableCell>
                          <TableCell className="font-medium text-foreground">{x.descripcion}</TableCell>
                          <TableCell className="text-muted-foreground">{x.subgrupo}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              {x.cobertura_pdss_pct}% PDSS
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {x.requiere_preautorizacion ? (
                              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]">
                                Requiere Pre-Aut
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                                Directa
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Detalle CIE-10 */}
      <Dialog open={!!selectedCie} onOpenChange={() => setSelectedCie(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-teal-600" /> Detalle Diagnóstico CIE-10
            </DialogTitle>
            <DialogDescription>
              Ficha clínica y epidemiológica estandarizada de la Organización Mundial de la Salud.
            </DialogDescription>
          </DialogHeader>

          {selectedCie && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border/80">
                <div className="font-mono text-lg font-bold text-teal-700 dark:text-teal-400">
                  {selectedCie.codigo}
                </div>
                <div className="font-semibold text-foreground text-sm mt-0.5">{selectedCie.descripcion}</div>
              </div>

              <div className="space-y-1.5 text-neutral-600 dark:text-neutral-300">
                <div>
                  <span className="font-semibold text-foreground">Capítulo OMS:</span> {selectedCie.capitulo}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Categoría:</span> {selectedCie.categoria}
                </div>
                {selectedCie.cie11_equivalente && (
                  <div>
                    <span className="font-semibold text-foreground">Equivalencia CIE-11:</span>{" "}
                    <span className="font-mono">{selectedCie.cie11_equivalente}</span>
                  </div>
                )}
                {selectedCie.notas_exclusion && (
                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-700 dark:text-amber-400 mt-2">
                    <span className="font-semibold">Notas de Exclusión:</span> {selectedCie.notas_exclusion}
                  </div>
                )}
                {selectedCie.vigilancia_sinave && (
                  <div className="p-2 bg-rose-500/10 rounded-lg border border-rose-500/20 text-rose-700 dark:text-rose-400 mt-2 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold">Notificación Epidemiológica Obligatoria (DIGEPI):</span>
                      <p className="text-[11px] mt-0.5">
                        Debe completarse la Ficha de Investigación Epidemiológica EPI-1 en el Sistema Nacional de
                        Vigilancia Epidemiológica (SINAVE).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Detalle CPT */}
      <Dialog open={!!selectedCpt} onOpenChange={() => setSelectedCpt(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="w-5 h-5 text-blue-600" /> Detalle Procedimiento CPT
            </DialogTitle>
            <DialogDescription>
              Ficha del procedimiento médico-quirúrgico y parámetros operativos.
            </DialogDescription>
          </DialogHeader>

          {selectedCpt && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border/80">
                <div className="font-mono text-lg font-bold text-blue-700 dark:text-blue-400">
                  CPT {selectedCpt.codigo}
                </div>
                <div className="font-semibold text-foreground text-sm mt-0.5">{selectedCpt.descripcion}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-neutral-600 dark:text-neutral-300">
                <div>
                  <span className="font-semibold text-foreground">Categoría:</span> {selectedCpt.categoria}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Complejidad:</span> {selectedCpt.complejidad}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Tiempo Estimado:</span> {selectedCpt.tiempo_estimado_min} minutos
                </div>
                <div>
                  <span className="font-semibold text-foreground">Ámbito:</span>{" "}
                  {selectedCpt.requiere_quirofano ? "Bloque Quirúrgico" : "Consulta Externa / Box"}
                </div>
                <div className="col-span-2 pt-1 border-t border-border/80 flex justify-between items-center">
                  <span className="font-semibold text-foreground">Tarifa Base Referencia:</span>
                  <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400 text-sm">
                    DOP$ {selectedCpt.tarifa_referencia_dop.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
