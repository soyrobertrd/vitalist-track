import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Biohazard,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TestTube,
  MapPin,
  Calendar,
  Filter,
  UserCheck,
  Building2,
  Clock,
  ShieldCheck,
  XCircle
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export interface CasoBroteSospechoso {
  id: string;
  paciente_nombre: string;
  edad_sexo: string;
  enfermedad_sospechada: string;
  cie10: string;
  fecha_inicio_sintomas: string;
  fecha_captacion: string;
  comunidad_sector: string;
  estado_investigacion: "en_investigacion" | "muestra_en_laboratorio" | "confirmado" | "descartado";
  muestra_tomada: string;
  aislamiento: "domiciliario" | "hospitalario_sala" | "aislamiento_estricto";
  contactos_rastreados: number;
}

const CASOS_SOSPECHOSOS_INICIALES: CasoBroteSospechoso[] = [
  {
    id: "BROTE-2026-01",
    paciente_nombre: "Yolanda Santana Báez",
    edad_sexo: "34a / F",
    enfermedad_sospechada: "Dengue con Signos de Alarma",
    cie10: "A97.1",
    fecha_inicio_sintomas: "2026-10-26",
    fecha_captacion: "2026-10-28",
    comunidad_sector: "Los Alcarrizos, Santo Domingo",
    estado_investigacion: "muestra_en_laboratorio",
    muestra_tomada: "Suero (Antígeno NS1 + IgM)",
    aislamiento: "hospitalario_sala",
    contactos_rastreados: 4,
  },
  {
    id: "BROTE-2026-02",
    paciente_nombre: "José Manuel Ventura",
    edad_sexo: "41a / M",
    enfermedad_sospechada: "Cólera (Diarrea acuosa profusa)",
    cie10: "A00.9",
    fecha_inicio_sintomas: "2026-10-28",
    fecha_captacion: "2026-10-29",
    comunidad_sector: "La Ciénaga, D.N.",
    estado_investigacion: "muestra_en_laboratorio",
    muestra_tomada: "Hisopado rectal Cary-Blair",
    aislamiento: "aislamiento_estricto",
    contactos_rastreados: 6,
  },
  {
    id: "BROTE-2026-03",
    paciente_nombre: "Franklin Javier Ozuna",
    edad_sexo: "28a / M",
    enfermedad_sospechada: "Leptospirosis (Mialgias + Ictericia)",
    cie10: "A27.9",
    fecha_inicio_sintomas: "2026-10-23",
    fecha_captacion: "2026-10-27",
    comunidad_sector: "Villa Mella, Santo Domingo Norte",
    estado_investigacion: "confirmado",
    muestra_tomada: "Serología MAT positivo 1:800",
    aislamiento: "hospitalario_sala",
    contactos_rastreados: 3,
  },
  {
    id: "BROTE-2026-04",
    paciente_nombre: "María Altagracia Solano",
    edad_sexo: "52a / F",
    enfermedad_sospechada: "COVID-19 / IRAG",
    cie10: "U07.1",
    fecha_inicio_sintomas: "2026-10-24",
    fecha_captacion: "2026-10-26",
    comunidad_sector: "Ensanche La Fe, D.N.",
    estado_investigacion: "descartado",
    muestra_tomada: "PCR Multiplex negativo para SARS-CoV-2",
    aislamiento: "domiciliario",
    contactos_rastreados: 2,
  },
];

export default function ReporteSospechosos() {
  const [casos, setCasos] = useState<CasoBroteSospechoso[]>(CASOS_SOSPECHOSOS_INICIALES);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [modalOpen, setModalOpen] = useState(false);

  // Formulario nuevo caso
  const [nombre, setNombre] = useState("");
  const [edadSexo, setEdadSexo] = useState("30a / M");
  const [patologia, setPatologia] = useState("Dengue con Signos de Alarma");
  const [cie10, setCie10] = useState("A97.1");
  const [sector, setSector] = useState("");
  const [muestra, setMuestra] = useState("Muestra de Sangre / Suero");
  const [aislamiento, setAislamiento] = useState<CasoBroteSospechoso["aislamiento"]>("hospitalario_sala");
  const [contactos, setContactos] = useState("3");

  const handleCrearCaso = () => {
    if (!nombre.trim() || !sector.trim()) {
      toast.error("Complete el nombre del paciente y la comunidad/sector.");
      return;
    }

    const nuevo: CasoBroteSospechoso = {
      id: `BROTE-2026-${(casos.length + 1).toString().padStart(2, "0")}`,
      paciente_nombre: nombre,
      edad_sexo: edadSexo,
      enfermedad_sospechada: patologia,
      cie10,
      fecha_inicio_sintomas: format(new Date(), "yyyy-MM-dd"),
      fecha_captacion: format(new Date(), "yyyy-MM-dd"),
      comunidad_sector: sector,
      estado_investigacion: "muestra_en_laboratorio",
      muestra_tomada: muestra,
      aislamiento,
      contactos_rastreados: parseInt(contactos) || 0,
    };

    setCasos([nuevo, ...casos]);
    toast.success(`Caso de brote registrado: ${nuevo.id}`, {
      description: `Notificado para investigación epidemiológica de campo en ${sector}.`,
    });

    setModalOpen(false);
    setNombre("");
    setSector("");
  };

  const handleCambiarEstado = (id: string, nuevoEstado: CasoBroteSospechoso["estado_investigacion"]) => {
    setCasos(
      casos.map((c) => (c.id === id ? { ...c, estado_investigacion: nuevoEstado } : c))
    );
    toast.info(`Caso ${id} actualizado a: ${nuevoEstado.replace("_", " ").toUpperCase()}`);
  };

  const enInvestigacion = casos.filter((c) => c.estado_investigacion === "en_investigacion" || c.estado_investigacion === "muestra_en_laboratorio").length;
  const confirmados = casos.filter((c) => c.estado_investigacion === "confirmado").length;
  const descartados = casos.filter((c) => c.estado_investigacion === "descartado").length;
  const totalContactos = casos.reduce((acc, c) => acc + c.contactos_rastreados, 0);

  const casosFiltrados = casos.filter((c) => {
    const matchBusqueda =
      c.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.enfermedad_sospechada.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.comunidad_sector.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === "todos" ? true : c.estado_investigacion === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="Investigación de Brotes & Casos Sospechosos"
        subtitle="Rastreo epidemiológico de campo, trazabilidad de muestras biológicas y control de cercos sanitarios comunitarios"
        icon={Biohazard}
        badge="Vigilancia Activa de Brotes"
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Reportar Caso Sospechoso
          </Button>
        }
      />

      {/* KPIs de Casos Sospechosos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalKpiCard
          title="Casos en Investigación Activa"
          value={enInvestigacion}
          subtitle="Pendientes de confirmación por laboratorio"
          icon={Clock}
          variant="amber"
          alert={enInvestigacion > 0}
        />
        <ClinicalKpiCard
          title="Casos Confirmados por Lab"
          value={confirmados}
          subtitle="Positivos con prueba confirmatoria"
          icon={AlertTriangle}
          variant="rose"
          alert={confirmados > 0}
        />
        <ClinicalKpiCard
          title="Casos Descartados"
          value={descartados}
          subtitle="Resultados de laboratorio negativos"
          icon={CheckCircle2}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Contactos en Cerco Sanitario"
          value={totalContactos}
          subtitle="Vigilancia comunitaria activa"
          icon={UserCheck}
          variant="teal"
        />
      </div>

      {/* Tabla y Filtros */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Biohazard className="h-5 w-5 text-rose-500" />
                Censo de Investigación Epidemiológica de Campo
              </CardTitle>
              <CardDescription>
                Registro nominal de pacientes captados con sospecha de enfermedades de alta contagiosidad.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente, sector..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-40 h-9 text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Estados</SelectItem>
                  <SelectItem value="muestra_en_laboratorio">En Laboratorio</SelectItem>
                  <SelectItem value="confirmado">Confirmados</SelectItem>
                  <SelectItem value="descartado">Descartados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID Caso</TableHead>
                <TableHead>Paciente / Datos</TableHead>
                <TableHead>Patología Sospechada</TableHead>
                <TableHead>Sector / Comunidad</TableHead>
                <TableHead>Muestra / Aislamiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {casosFiltrados.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-xs">{c.id}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-xs text-foreground">{c.paciente_nombre}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{c.edad_sexo} · Inicio: {c.fecha_inicio_sintomas}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs border-rose-500/30 text-rose-700 bg-rose-500/5">
                      {c.cie10} - {c.enfermedad_sospechada}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3 text-primary" /> {c.comunidad_sector}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">({c.contactos_rastreados} contactos en cerco)</span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p className="text-foreground font-medium flex items-center gap-1">
                      <TestTube className="h-3 w-3 text-teal-600" /> {c.muestra_tomada}
                    </p>
                    <Badge variant="secondary" className="text-[10px] capitalize mt-0.5">
                      {c.aislamiento.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        c.estado_investigacion === "confirmado"
                          ? "bg-red-600 text-white"
                          : c.estado_investigacion === "descartado"
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-500 text-white"
                      }
                    >
                      {c.estado_investigacion.replace("_", " ").toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {c.estado_investigacion !== "confirmado" && c.estado_investigacion !== "descartado" && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] text-emerald-600 border-emerald-500/30"
                          onClick={() => handleCambiarEstado(c.id, "confirmado")}
                        >
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] text-muted-foreground"
                          onClick={() => handleCambiarEstado(c.id, "descartado")}
                        >
                          Descartar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Reportar Caso */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Biohazard className="h-5 w-5 text-rose-500" />
              Notificación de Caso Sospechoso de Brote
            </DialogTitle>
            <DialogDescription>
              Ficha epidemiológica inicial para cerco sanitario y toma de muestras.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Nombre Completo del Paciente *</Label>
              <Input
                placeholder="Ej: Daniel Alcántara"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Edad / Sexo</Label>
                <Input value={edadSexo} onChange={(e) => setEdadSexo(e.target.value)} className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CIE-10</Label>
                <Input value={cie10} onChange={(e) => setCie10(e.target.value)} className="h-8" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Patología Sospechada *</Label>
              <Select value={patologia} onValueChange={setPatologia}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dengue con Signos de Alarma">Dengue con Signos de Alarma</SelectItem>
                  <SelectItem value="Cólera (Sospecha clínica)">Cólera (Sospecha clínica)</SelectItem>
                  <SelectItem value="Leptospirosis">Leptospirosis</SelectItem>
                  <SelectItem value="Malaria">Malaria</SelectItem>
                  <SelectItem value="COVID-19 / IRAG">COVID-19 / IRAG</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Comunidad / Sector de Residencia *</Label>
              <Input
                placeholder="Ej: Barrio San Carlos, D.N."
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Muestra Biológica</Label>
                <Input value={muestra} onChange={(e) => setMuestra(e.target.value)} className="h-8" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contactos a Rastrear</Label>
                <Input type="number" value={contactos} onChange={(e) => setContactos(e.target.value)} className="h-8" />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCrearCaso}>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Registrar Caso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
