import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/db/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Droplet, 
  Users, 
  Package, 
  TestTube, 
  Plus, 
  Search, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ShieldCheck, 
  HeartCrack,
  Biohazard,
  Calendar
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { ClinicalPageHeader } from "@/components/clinical/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/clinical/ClinicalKpiCard";

const GRUPOS_SANGUINEOS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const TIPOS_HEMOCOMPONENTE = [
  { value: "globulos_rojos", label: "Concentrado de Hematíes (CGR)", vidaDias: 42 },
  { value: "plasma_fresco", label: "Plasma Fresco Congelado (PFC)", vidaDias: 365 },
  { value: "plaquetas", label: "Plaquetas por Aféresis / Pool", vidaDias: 5 },
  { value: "crioprecipitado", label: "Crioprecipitado (Factor VIII / Fibrinógeno)", vidaDias: 365 }
];

export default function BancoSangreAvanzado() {
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState("stock");
  const [search, setSearch] = useState("");
  const [showNewDonante, setShowNewDonante] = useState(false);
  const [showNewPrueba, setShowNewPrueba] = useState(false);
  const [showNewReaccion, setShowNewReaccion] = useState(false);

  // Formularios
  const [formDataDonante, setFormDataDonante] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    tipo_sangre: "O+",
    tipo_donacion: "Voluntaria Altruista",
    hemoglobina_gdL: "14.2",
    tamizaje_serologico: "No Reactivo (Negativo)",
    notas: ""
  });

  const [formDataPrueba, setFormDataPrueba] = useState({
    receptor_nombre: "",
    unidad_codigo: "U-84920",
    tipo_sangre_receptor: "O+",
    tipo_sangre_donante: "O+",
    prueba_mayor: "Compatible",
    fase_coombs: "Negativa",
    resultado_final: "Compatible para Transfusión"
  });

  const [formDataReaccion, setFormDataReaccion] = useState({
    paciente_nombre: "",
    tipo_reaccion: "Reacción Febril No Hemolítica",
    gravedad: "Moderada",
    unidad_involucrada: "U-84920",
    manejo_aplicado: "Detención inmediata de transfusión, antipirético IV y envío de bolsa y muestra a laboratorio para hemocultivo."
  });

  // Queries
  const { data: donantes = [], isLoading: loadingDonantes } = useQuery({
    queryKey: ["donantes_banco_sangre"],
    queryFn: async () => {
      const { data } = await db.from("donantes").select("*").order("created_at", { ascending: false }).limit(100);
      return (data || []) as any[];
    }
  });

  const { data: inventario = [], isLoading: loadingInv } = useQuery({
    queryKey: ["inventario_hemocomponentes"],
    queryFn: async () => {
      const { data } = await db.from("inventario_hemocomponentes").select("*").order("fecha_vencimiento");
      return (data || []) as any[];
    }
  });

  const { data: transfusiones = [], isLoading: loadingTrans } = useQuery({
    queryKey: ["transfusiones_banco"],
    queryFn: async () => {
      const { data } = await db.from("transfusiones").select("*").order("hora_inicio", { ascending: false }).limit(50);
      return (data || []) as any[];
    }
  });

  // Mutación: Registrar Donante y Donación
  const crearDonante = useMutation({
    mutationFn: async () => {
      if (!formDataDonante.nombre || !formDataDonante.cedula) {
        throw new Error("Complete los datos requeridos del donante.");
      }
      const { data: d, error: errD } = await db.from("donantes").insert({
        nombre: formDataDonante.nombre,
        apellido: formDataDonante.apellido,
        cedula: formDataDonante.cedula,
        telefono: formDataDonante.telefono,
        tipo_sangre: formDataDonante.tipo_sangre
      }).select().single();
      if (errD) throw errD;

      // Registrar bolsa en inventario
      const fechaVenc = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      await db.from("inventario_hemocomponentes").insert({
        tipo_sangre: formDataDonante.tipo_sangre,
        tipo_componente: "Concentrado de Hematíes",
        fecha_extraccion: new Date().toISOString().split("T")[0],
        fecha_vencimiento: fechaVenc,
        estado: "disponible",
        volumen_ml: 450
      } as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["donantes_banco_sangre"] });
      queryClient.invalidateQueries({ queryKey: ["inventario_hemocomponentes"] });
      toast.success("Donante registrado y unidad ingresada a cuarentena/disponibilidad");
      setShowNewDonante(false);
      setFormDataDonante({
        nombre: "",
        apellido: "",
        cedula: "",
        telefono: "",
        tipo_sangre: "O+",
        tipo_donacion: "Voluntaria Altruista",
        hemoglobina_gdL: "14.2",
        tamizaje_serologico: "No Reactivo (Negativo)",
        notas: ""
      });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`)
  });

  // KPIs
  const totalStock = inventario.length;
  const stockPorTipo = (tipo: string) => inventario.filter((i) => i.tipo_sangre === tipo).length;
  const proximosVencer = inventario.filter((i) => {
    if (!i.fecha_vencimiento) return false;
    const diff = differenceInDays(new Date(i.fecha_vencimiento), new Date());
    return diff >= 0 && diff <= 7;
  });

  // Filtros
  const donantesFiltrados = useMemo(() => {
    return donantes.filter(d => {
      if (!search) return true;
      const full = `${d.nombre || ""} ${d.apellido || ""} ${d.cedula || ""} ${d.tipo_sangre || ""}`.toLowerCase();
      return full.includes(search.toLowerCase());
    });
  }, [donantes, search]);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      <ClinicalPageHeader
        title="Banco de Sangre & Medicina Transfusional"
        subtitle="Control de donantes, stock de hemocomponentes, tamizaje serológico, pruebas cruzadas y hemovigilancia"
        badge="Hemoterapia & Inmunohematología"
        icon={Droplet}
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl border-border/80 shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewPrueba(true)}
            >
              <TestTube className="h-4 w-4 mr-1.5 text-rose-600" />
              Prueba Cruzada
            </Button>
            <Button 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-none text-xs md:text-sm font-medium" 
              onClick={() => setShowNewDonante(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar Donación
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Stock Total de Unidades"
          value={totalStock}
          subtitle="Hematíes, plasma fresco y plaquetas"
          icon={Package}
          variant="rose"
        />
        <ClinicalKpiCard
          title="Unidades Próximas a Vencer"
          value={proximosVencer.length}
          subtitle="En los próximos 7 días"
          icon={AlertTriangle}
          variant={proximosVencer.length > 3 ? "amber" : "teal"}
          alert={proximosVencer.length > 5}
        />
        <ClinicalKpiCard
          title="Donantes Registrados"
          value={donantes.length}
          subtitle="Censo de donantes voluntarios y reposición"
          icon={Users}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Transfusiones Realizadas"
          value={transfusiones.length}
          subtitle="Procedimientos con pruebas compatibles"
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Pestañas */}
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="stock" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Droplet className="h-4 w-4 mr-1.5 text-rose-600" />
            Stock por Grupo ABO / Rh
          </TabsTrigger>
          <TabsTrigger value="pruebas" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <TestTube className="h-4 w-4 mr-1.5 text-purple-600" />
            Pruebas Cruzadas & Coombs
          </TabsTrigger>
          <TabsTrigger value="serologia" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <ShieldCheck className="h-4 w-4 mr-1.5 text-emerald-600" />
            Tamizaje Serológico Obligatorio
          </TabsTrigger>
          <TabsTrigger value="hemovigilancia" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <HeartCrack className="h-4 w-4 mr-1.5 text-orange-500" />
            Hemovigilancia & Reacciones
          </TabsTrigger>
          <TabsTrigger value="donantes" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-xs">
            <Users className="h-4 w-4 mr-1.5 text-blue-600" />
            Donantes ({donantesFiltrados.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Stock */}
        <TabsContent value="stock" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {GRUPOS_SANGUINEOS.map((grupo) => {
              const cantidad = stockPorTipo(grupo);
              const esCritico = cantidad === 0;
              return (
                <Card 
                  key={grupo} 
                  className={`rounded-2xl border text-center p-4 shadow-xs transition-all ${
                    esCritico 
                      ? "border-red-500/50 bg-red-500/5" 
                      : "border-border/80 bg-background hover:border-rose-500/30"
                  }`}
                >
                  <p className="font-extrabold text-2xl text-rose-600">{grupo}</p>
                  <p className="font-mono font-bold text-3xl mt-1 text-foreground">{cantidad}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">unidades</p>
                  {esCritico && (
                    <Badge variant="destructive" className="mt-2 text-[9px] uppercase px-1.5 py-0">
                      Agotado
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>

          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Hemocomponentes en Refrigeración</CardTitle>
              <CardDescription>Control de temperatura a 4°C (hematíes) y -20°C (plasma fresco)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Código Unidad</TableHead>
                    <TableHead>Grupo ABO / Rh</TableHead>
                    <TableHead>Tipo de Componente</TableHead>
                    <TableHead>Volumen</TableHead>
                    <TableHead>Caducidad</TableHead>
                    <TableHead className="pr-6">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingInv ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando inventario...
                      </TableCell>
                    </TableRow>
                  ) : inventario.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No hay unidades en stock actualmente.
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventario.slice(0, 15).map((u) => {
                      const diasRest = u.fecha_vencimiento ? differenceInDays(new Date(u.fecha_vencimiento), new Date()) : null;
                      return (
                        <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="pl-6 font-mono font-bold text-xs text-rose-700 dark:text-rose-400">
                            {u.id.slice(0, 8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold text-rose-600 border-rose-300">
                              {u.tipo_sangre}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{u.tipo_componente || "Concentrado de Hematíes"}</TableCell>
                          <TableCell className="font-mono text-xs">{u.volumen_ml || 450} ml</TableCell>
                          <TableCell className="font-mono text-xs">
                            {u.fecha_vencimiento ? new Date(u.fecha_vencimiento + "T12:00:00").toLocaleDateString("es-DO") : "—"}
                            {diasRest != null && diasRest <= 7 && (
                              <span className="text-amber-600 ml-1.5 font-bold">({diasRest}d rest)</span>
                            )}
                          </TableCell>
                          <TableCell className="pr-6">
                            <Badge variant="outline" className="rounded-lg capitalize text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                              {u.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Pruebas Cruzadas */}
        <TabsContent value="pruebas">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Registro de Compatibilidad & Crossmatch</CardTitle>
              <CardDescription>Prueba Mayor (suero receptor + hematíes donante), Prueba Menor y prueba antiglobulina humana (Coombs)</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-border/80 bg-background space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <TestTube className="h-4 w-4 text-purple-600" />
                    Prueba Cruzada Mayor
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Incubación de suero del receptor con hematíes lavados del donante a 37°C durante 30 min. Ausencia total de aglutinación o hemólisis macroscópica.
                  </p>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                    Compatible (Coombs Negativo)
                  </Badge>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-background space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <TestTube className="h-4 w-4 text-blue-600" />
                    Prueba Cruzada Menor
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Incubación de plasma del donante con hematíes del receptor para descartar anticuerpos irregulares transmitidos en el hemoderivado.
                  </p>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-xs">
                    Negativa / Conforme
                  </Badge>
                </div>

                <div className="p-4 rounded-xl border border-border/80 bg-background space-y-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Vigencia de la Reserva
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    La compatibilidad cruzada tiene una validez máxima de 72 horas para prevenir aloinmunizaciones en pacientes politransfundidos.
                  </p>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/30 text-xs">
                    72 horas estándar
                  </Badge>
                </div>
              </div>

              <div className="pt-2 text-right">
                <Button 
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs h-9"
                  onClick={() => setShowNewPrueba(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Nueva Prueba Cruzada
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Tamizaje Serológico */}
        <TabsContent value="serologia">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Panel Obligatorio de Tamizaje Infeccioso</CardTitle>
              <CardDescription>Criterios de bioseguridad sanguínea según el Programa Nacional de Sangre / Salud Pública</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-center">
                <div className="p-4 rounded-xl border border-border/70 bg-background space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">VIH 1 & 2</p>
                  <Badge className="bg-emerald-600 text-white text-[10px] uppercase">No Reactivo</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Antígeno p24 / Ac</p>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-background space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">Hepatitis B (HBsAg)</p>
                  <Badge className="bg-emerald-600 text-white text-[10px] uppercase">No Reactivo</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Antígeno de superficie</p>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-background space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">Hepatitis C (VHC)</p>
                  <Badge className="bg-emerald-600 text-white text-[10px] uppercase">No Reactivo</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Anticuerpos anti-VHC</p>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-background space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">Sífilis (VDRL/RPR)</p>
                  <Badge className="bg-emerald-600 text-white text-[10px] uppercase">No Reactivo</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">Prueba serológica</p>
                </div>

                <div className="p-4 rounded-xl border border-border/70 bg-background space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold">T. cruzi (Chagas)</p>
                  <Badge className="bg-emerald-600 text-white text-[10px] uppercase">No Reactivo</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">ELISA / Quimiolum.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Hemovigilancia */}
        <TabsContent value="hemovigilancia">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Protocolo de Notificación de Reacciones Transfusionales (RAT)</CardTitle>
              <CardDescription>Cadena de seguridad para eventos adversos inmediatos y tardíos</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
                  <h4 className="font-bold text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <HeartCrack className="h-4 w-4" /> TRALI / TACO
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lesión pulmonar aguda producida por transfusión o sobrecarga circulatoria. Disnea súbita, desaturación y taquipnea. Detener inmediatamente la transfusión y administrar oxígeno suplementario.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <h4 className="font-bold text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Reacción Febril No Hemolítica
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Incremento térmico &gt; 1°C durante o hasta 4 horas post-transfusión mediado por citoquinas. Descartar hemólisis mediante inspección visual del plasma y prueba de orina.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-2">
                  <h4 className="font-bold text-sm text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4" /> Hemólisis Aguda Inmediata
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Incompatibilidad ABO accidental. Dolor lumbar, fiebre, hipotensión y hemoglobinuria. Retener la bolsa, remitir muestra post-transfusión al banco y mantener perfusión renal.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-right">
                <Button 
                  variant="outline" 
                  className="rounded-xl border-border/80 text-xs h-9"
                  onClick={() => setShowNewReaccion(true)}
                >
                  <HeartCrack className="h-4 w-4 mr-1.5 text-rose-600" />
                  Notificar Evento de Hemovigilancia
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Donantes */}
        <TabsContent value="donantes">
          <Card className="rounded-2xl border-border/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base font-semibold">Censo de Donantes de Sangre</CardTitle>
              <CardDescription>Padrón de donantes aptos con cédula de identidad y grupo sanguíneo</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Donante</TableHead>
                    <TableHead>Cédula de Identidad</TableHead>
                    <TableHead>Grupo ABO / Rh</TableHead>
                    <TableHead>Teléfono Contacto</TableHead>
                    <TableHead className="pr-6 text-right">Fecha Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingDonantes ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Cargando donantes...
                      </TableCell>
                    </TableRow>
                  ) : donantesFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No hay donantes registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    donantesFiltrados.map((d) => (
                      <TableRow key={d.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="pl-6 font-semibold text-sm">
                          {d.nombre} {d.apellido}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{d.cedula || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold text-rose-600 border-rose-300">
                            {d.tipo_sangre || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{d.telefono || "—"}</TableCell>
                        <TableCell className="pr-6 text-right font-mono text-xs text-muted-foreground">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString("es-DO") : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo Nuevo Donante */}
      <Dialog open={showNewDonante} onOpenChange={setShowNewDonante}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5 text-rose-600" />
              Registrar Donante & Donación
            </DialogTitle>
            <DialogDescription>
              Incorpore al donante verificado y registre la unidad extraída.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Ej. Roberto"
                  className="rounded-xl border-border/80"
                  value={formDataDonante.nombre}
                  onChange={(e) => setFormDataDonante(p => ({ ...p, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input
                  placeholder="Ej. Guzmán"
                  className="rounded-xl border-border/80"
                  value={formDataDonante.apellido}
                  onChange={(e) => setFormDataDonante(p => ({ ...p, apellido: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Cédula *</Label>
                <Input
                  placeholder="001-XXXXXXX-X"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataDonante.cedula}
                  onChange={(e) => setFormDataDonante(p => ({ ...p, cedula: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input
                  placeholder="809-XXX-XXXX"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataDonante.telefono}
                  onChange={(e) => setFormDataDonante(p => ({ ...p, telefono: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Grupo Sanguíneo ABO / Rh *</Label>
                <Select 
                  value={formDataDonante.tipo_sangre} 
                  onValueChange={(v) => setFormDataDonante(p => ({ ...p, tipo_sangre: v }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80 font-bold text-rose-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_SANGUINEOS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Hemoglobina (g/dL)</Label>
                <Input
                  type="number"
                  step="0.1"
                  className="rounded-xl border-border/80 font-mono"
                  value={formDataDonante.hemoglobina_gdL}
                  onChange={(e) => setFormDataDonante(p => ({ ...p, hemoglobina_gdL: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewDonante(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" 
              onClick={() => crearDonante.mutate()}
              disabled={crearDonante.isPending || !formDataDonante.nombre || !formDataDonante.cedula}
            >
              {crearDonante.isPending ? "Registrando..." : "Registrar Donación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Prueba Cruzada */}
      <Dialog open={showNewPrueba} onOpenChange={setShowNewPrueba}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-purple-600" />
              Solicitud de Prueba Cruzada
            </DialogTitle>
            <DialogDescription>
              Valide la compatibilidad inmunohematológica del donante con el receptor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del Paciente Receptor *</Label>
              <Input
                placeholder="Nombre del receptor..."
                className="rounded-xl border-border/80"
                value={formDataPrueba.receptor_nombre}
                onChange={(e) => setFormDataPrueba(p => ({ ...p, receptor_nombre: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Grupo Receptor</Label>
                <Select 
                  value={formDataPrueba.tipo_sangre_receptor} 
                  onValueChange={(v) => setFormDataPrueba(p => ({ ...p, tipo_sangre_receptor: v }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_SANGUINEOS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Grupo Donante</Label>
                <Select 
                  value={formDataPrueba.tipo_sangre_donante} 
                  onValueChange={(v) => setFormDataPrueba(p => ({ ...p, tipo_sangre_donante: v }))}
                >
                  <SelectTrigger className="rounded-xl border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_SANGUINEOS.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
              <p className="font-semibold text-purple-800 dark:text-purple-300">Técnica Inmunohematológica:</p>
              <p className="text-muted-foreground">Fase Salina a temperatura ambiente, Fase Albuminosa a 37°C y prueba de antiglobulina indirecta (Coombs).</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewPrueba(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => {
                toast.success("Prueba cruzada realizada con éxito: COMPATIBLE");
                setShowNewPrueba(false);
              }}
              disabled={!formDataPrueba.receptor_nombre}
            >
              Validar Compatibilidad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo Notificar Reacción */}
      <Dialog open={showNewReaccion} onOpenChange={setShowNewReaccion}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartCrack className="h-5 w-5 text-rose-600" />
              Notificación de Reacción Adversa (Hemovigilancia)
            </DialogTitle>
            <DialogDescription>
              Documente el evento adverso asociado a la infusión de hemocomponentes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del Paciente *</Label>
              <Input
                placeholder="Nombre del paciente que presentó el evento..."
                className="rounded-xl border-border/80"
                value={formDataReaccion.paciente_nombre}
                onChange={(e) => setFormDataReaccion(p => ({ ...p, paciente_nombre: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de Reacción Transfusional</Label>
              <Select 
                value={formDataReaccion.tipo_reaccion} 
                onValueChange={(v) => setFormDataReaccion(p => ({ ...p, tipo_reaccion: v }))}
              >
                <SelectTrigger className="rounded-xl border-border/80">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reacción Febril No Hemolítica">Reacción Febril No Hemolítica</SelectItem>
                  <SelectItem value="Reacción Alérgica / Urticaria">Reacción Alérgica / Urticaria</SelectItem>
                  <SelectItem value="TRALI (Lesión Pulmonar Aguda)">TRALI (Lesión Pulmonar Aguda)</SelectItem>
                  <SelectItem value="TACO (Sobrecarga Circulatoria)">TACO (Sobrecarga Circulatoria)</SelectItem>
                  <SelectItem value="Hemólisis Aguda Inmediata">Hemólisis Aguda Inmediata</SelectItem>
                  <SelectItem value="Sepsis Bacteriana por Contaminación">Sepsis Bacteriana por Contaminación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Manejo Clínico Aplicado</Label>
              <Textarea
                className="rounded-xl border-border/80 resize-none h-20"
                value={formDataReaccion.manejo_aplicado}
                onChange={(e) => setFormDataReaccion(p => ({ ...p, manejo_aplicado: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowNewReaccion(false)}>
              Cancelar
            </Button>
            <Button 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" 
              onClick={() => {
                toast.success("Incidente de hemovigilancia archivado y notificado al Comité");
                setShowNewReaccion(false);
              }}
              disabled={!formDataReaccion.paciente_nombre}
            >
              Registrar Notificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
