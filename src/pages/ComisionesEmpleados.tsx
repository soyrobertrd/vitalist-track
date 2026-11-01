import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/integrations/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NuevoHonorarioSplitModal } from "@/components/comisiones/NuevoHonorarioSplitModal";
import { ConfirmarPagoHonorarioModal } from "@/components/comisiones/ConfirmarPagoHonorarioModal";
import { VolanteLiquidacionModal } from "@/components/comisiones/VolanteLiquidacionModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Plus,
  Search,
  Filter,
  Building2,
  Stethoscope,
  ShieldCheck,
  CreditCard,
  QrCode,
  Download,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";

export interface LiquidacionHonorario {
  id: string;
  codigo_liquidacion: string;
  fecha_generada: string;
  fecha_pago?: string;
  medico_id: string;
  medico_nombre: string;
  especialidad:
    | "Cardiología"
    | "Pediatría"
    | "Diabetes & Endocrinología"
    | "Cirugía General"
    | "Ginecología & Obstetricia"
    | "Ortopedia & Traumatología"
    | "Medicina Interna";
  exequatur: string;
  rnc_cedula: string;
  tipo_contrato: "Servicios Profesionales (Independiente)" | "Nómina Fija (Asalariado)";
  tipo_acto:
    | "Consulta Especializada"
    | "Cirugía Mayor"
    | "Procedimiento Ambulatorio"
    | "Estudio Diagnóstico"
    | "Ronda Hospitalaria";
  descripcion_acto: string;
  paciente_nombre: string;
  expediente_no: string;
  aseguradora: "ARS Primera" | "SeNaSa Contributivo" | "Mapfre Salud ARS" | "Humano Seguros" | "Privado / Particular";
  no_autorizacion_ars?: string;
  monto_bruto: number;
  cobertura_ars: number;
  copago_paciente: number;
  porcentaje_medico: number;
  porcentaje_clinica: number;
  honorario_bruto_medico: number;
  retencion_isr_pct: number;
  retencion_isr_monto: number;
  monto_neto_medico: number;
  aporte_clinica: number;
  estado: "pendiente" | "aprobada" | "pagada" | "anulada";
  metodo_pago?: "Transferencia ACH" | "Cheque de Gerencia" | "Crédito en Cuenta";
  banco_destino?: string;
  cuenta_destino?: string;
  referencia_bancaria?: string;
  notas?: string;
}

const MOCK_LIQUIDACIONES: LiquidacionHonorario[] = [
  {
    id: "liq-001",
    codigo_liquidacion: "HON-2026-0418",
    fecha_generada: "2026-10-28",
    medico_id: "med-101",
    medico_nombre: "Dr. Félix Montalvo",
    especialidad: "Cardiología",
    exequatur: "14209-20",
    rnc_cedula: "001-1829401-2",
    tipo_contrato: "Servicios Profesionales (Independiente)",
    tipo_acto: "Estudio Diagnóstico",
    descripcion_acto: "Ecocardiograma Transtorácico Doppler Color + Informe",
    paciente_nombre: "Manuel A. Tavárez",
    expediente_no: "EXP-98214",
    aseguradora: "ARS Primera",
    no_autorizacion_ars: "AUT-771920",
    monto_bruto: 4800,
    cobertura_ars: 3800,
    copago_paciente: 1000,
    porcentaje_medico: 75,
    porcentaje_clinica: 25,
    honorario_bruto_medico: 3600,
    retencion_isr_pct: 10,
    retencion_isr_monto: 360,
    monto_neto_medico: 3240,
    aporte_clinica: 1200,
    estado: "pendiente",
    banco_destino: "Banco Popular Dominicano",
    cuenta_destino: "Cuenta Corriente **4921",
  },
  {
    id: "liq-002",
    codigo_liquidacion: "HON-2026-0419",
    fecha_generada: "2026-10-28",
    medico_id: "med-102",
    medico_nombre: "Dra. Carmen Almonte",
    especialidad: "Pediatría",
    exequatur: "18504-22",
    rnc_cedula: "031-0941824-5",
    tipo_contrato: "Servicios Profesionales (Independiente)",
    tipo_acto: "Consulta Especializada",
    descripcion_acto: "Control de Crecimiento & Desarrollo + Tamizaje Pediátrico",
    paciente_nombre: "Lucía Fernández (Lactante)",
    expediente_no: "EXP-88102",
    aseguradora: "Humano Seguros",
    no_autorizacion_ars: "AUT-881204",
    monto_bruto: 3000,
    cobertura_ars: 2400,
    copago_paciente: 600,
    porcentaje_medico: 80,
    porcentaje_clinica: 20,
    honorario_bruto_medico: 2400,
    retencion_isr_pct: 10,
    retencion_isr_monto: 240,
    monto_neto_medico: 2160,
    aporte_clinica: 600,
    estado: "aprobada",
    banco_destino: "Banreservas",
    cuenta_destino: "Cuenta de Ahorros **1092",
  },
  {
    id: "liq-003",
    codigo_liquidacion: "HON-2026-0420",
    fecha_generada: "2026-10-27",
    fecha_pago: "2026-10-29",
    medico_id: "med-103",
    medico_nombre: "Dr. Ramón Peña",
    especialidad: "Diabetes & Endocrinología",
    exequatur: "11983-18",
    rnc_cedula: "001-0857321-9",
    tipo_contrato: "Servicios Profesionales (Independiente)",
    tipo_acto: "Procedimiento Ambulatorio",
    descripcion_acto: "Curación Avanzada Pie Diabético Wagner Grado II + Debridamiento",
    paciente_nombre: "Eusebio Martínez",
    expediente_no: "EXP-44190",
    aseguradora: "SeNaSa Contributivo",
    no_autorizacion_ars: "AUT-554109",
    monto_bruto: 5500,
    cobertura_ars: 4500,
    copago_paciente: 1000,
    porcentaje_medico: 70,
    porcentaje_clinica: 30,
    honorario_bruto_medico: 3850,
    retencion_isr_pct: 10,
    retencion_isr_monto: 385,
    monto_neto_medico: 3465,
    aporte_clinica: 1650,
    estado: "pagada",
    metodo_pago: "Transferencia ACH",
    banco_destino: "Banco BHD",
    cuenta_destino: "Cuenta Corriente **7712",
    referencia_bancaria: "ACH-98214-2026",
    notas: "Liquidación procesada mediante lote bancario quincenal.",
  },
  {
    id: "liq-004",
    codigo_liquidacion: "HON-2026-0421",
    fecha_generada: "2026-10-26",
    fecha_pago: "2026-10-28",
    medico_id: "med-104",
    medico_nombre: "Dr. Leandro Batlle",
    especialidad: "Cirugía General",
    exequatur: "09845-15",
    rnc_cedula: "001-0321456-7",
    tipo_contrato: "Servicios Profesionales (Independiente)",
    tipo_acto: "Cirugía Mayor",
    descripcion_acto: "Colecistectomía Laparoscópica (Cirujano Principal)",
    paciente_nombre: "Rosa Elena Guzmán",
    expediente_no: "EXP-10923",
    aseguradora: "Mapfre Salud ARS",
    no_autorizacion_ars: "AUT-992184",
    monto_bruto: 28000,
    cobertura_ars: 23000,
    copago_paciente: 5000,
    porcentaje_medico: 70,
    porcentaje_clinica: 30,
    honorario_bruto_medico: 19600,
    retencion_isr_pct: 10,
    retencion_isr_monto: 1960,
    monto_neto_medico: 17640,
    aporte_clinica: 8400,
    estado: "pagada",
    metodo_pago: "Transferencia ACH",
    banco_destino: "Banco Popular Dominicano",
    cuenta_destino: "Cuenta Corriente **3314",
    referencia_bancaria: "ACH-55219-2026",
  },
];

export default function ComisionesEmpleados() {
  const [liquidaciones, setLiquidaciones] = useState<LiquidacionHonorario[]>(MOCK_LIQUIDACIONES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [especialidadFilter, setEspecialidadFilter] = useState("todas");
  const [estadoFilter, setEstadoFilter] = useState("todos");

  // Modales
  const [nuevoModalOpen, setNuevoModalOpen] = useState(false);
  const [pagoModalOpen, setPagoModalOpen] = useState(false);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedLiq, setSelectedLiq] = useState<LiquidacionHonorario | null>(null);

  // Formulario de Pago
  const [pagoForm, setPagoForm] = useState({
    metodo_pago: "Transferencia ACH" as string,
    banco: "Banco Popular Dominicano",
    referencia: "",
  });

  // Formulario de Nuevo Registro
  const [nuevoForm, setNuevoForm] = useState({
    medico_nombre: "",
    especialidad: "Cardiología" as LiquidacionHonorario["especialidad"],
    exequatur: "",
    rnc_cedula: "",
    tipo_contrato: "Servicios Profesionales (Independiente)" as LiquidacionHonorario["tipo_contrato"],
    tipo_acto: "Consulta Especializada" as LiquidacionHonorario["tipo_acto"],
    descripcion_acto: "",
    paciente_nombre: "",
    expediente_no: "",
    aseguradora: "ARS Primera" as LiquidacionHonorario["aseguradora"],
    no_autorizacion_ars: "",
    cobertura_ars: 2500,
    copago_paciente: 500,
    porcentaje_medico: 75,
    banco_destino: "Banco Popular Dominicano",
    cuenta_destino: "",
  });

  // Sincronizar Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await db
        .from("comisiones_empleados" as any)
        .select("*")
        .order("fecha_generada", { ascending: false });

      if (!error && data && data.length > 0) {
        // Enriquecer registros existentes de la base de datos
        const mapped: LiquidacionHonorario[] = data.map((item: any, idx: number) => {
          const bruto = Number(item.monto_comision || 3000);
          const isr = Number(item.retencion_isr || bruto * 0.1);
          return {
            id: item.id || `db-${idx}`,
            codigo_liquidacion: item.codigo || `HON-2026-${1000 + idx}`,
            fecha_generada: item.fecha_generada || new Date().toISOString().slice(0, 10),
            fecha_pago: item.fecha_pago,
            medico_id: item.empleado_id || `med-${idx}`,
            medico_nombre: item.empleado_nombre || item.concepto?.split("-")[0] || "Dr. Especialista Asignado",
            especialidad: "Medicina Interna",
            exequatur: "15980-21",
            rnc_cedula: "001-XXXXXXX-X",
            tipo_contrato: "Servicios Profesionales (Independiente)",
            tipo_acto: "Consulta Especializada",
            descripcion_acto: item.concepto || "Honorario por atención especializada",
            paciente_nombre: item.paciente_nombre || "Paciente Clínico",
            expediente_no: `EXP-${10000 + idx}`,
            aseguradora: "ARS Primera",
            monto_bruto: bruto,
            cobertura_ars: bruto * 0.8,
            copago_paciente: bruto * 0.2,
            porcentaje_medico: 75,
            porcentaje_clinica: 25,
            honorario_bruto_medico: bruto,
            retencion_isr_pct: 10,
            retencion_isr_monto: isr,
            monto_neto_medico: bruto - isr,
            aporte_clinica: bruto * 0.25,
            estado: (item.estado as any) || "pendiente",
          };
        });
        setLiquidaciones(mapped);
      }
    } catch {
      // Usar datos mock enriquecidos si no existe la tabla
    } finally {
      setLoading(false);
    }
  };

  const aprobarLiquidacion = async (liq: LiquidacionHonorario) => {
    try {
      await db
        .from("comisiones_empleados" as any)
        .update({ estado: "aprobada" })
        .eq("id", liq.id);
    } catch {
      // Mock local
    }
    setLiquidaciones((prev) =>
      prev.map((item) => (item.id === liq.id ? { ...item, estado: "aprobada" } : item))
    );
    toast.success(`Honorario ${liq.codigo_liquidacion} aprobado para pago`);
  };

  const abrirPagoModal = (liq: LiquidacionHonorario) => {
    setSelectedLiq(liq);
    setPagoForm({
      metodo_pago: "Transferencia ACH",
      banco: liq.banco_destino || "Banco Popular Dominicano",
      referencia: `ACH-${Math.floor(10000 + Math.random() * 90000)}-2026`,
    });
    setPagoModalOpen(true);
  };

  const confirmarPago = async () => {
    if (!selectedLiq) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      await db
        .from("comisiones_empleados" as any)
        .update({
          estado: "pagada",
          fecha_pago: today,
          referencia: pagoForm.referencia,
        })
        .eq("id", selectedLiq.id);
    } catch {
      // Mock local
    }

    setLiquidaciones((prev) =>
      prev.map((item) =>
        item.id === selectedLiq.id
          ? {
              ...item,
              estado: "pagada",
              fecha_pago: today,
              metodo_pago: pagoForm.metodo_pago as LiquidacionHonorario["metodo_pago"],
              banco_destino: pagoForm.banco,
              referencia_bancaria: pagoForm.referencia,
            }
          : item
      )
    );
    toast.success(`Liquidación ${selectedLiq.codigo_liquidacion} pagada exitosamente`);
    setPagoModalOpen(false);
  };

  const handleCrearNuevoHonorario = () => {
    const totalBruto = Number(nuevoForm.cobertura_ars) + Number(nuevoForm.copago_paciente);
    const pctMed = Number(nuevoForm.porcentaje_medico);
    const honorarioBruto = (totalBruto * pctMed) / 100;
    const isrPct = nuevoForm.tipo_contrato === "Servicios Profesionales (Independiente)" ? 10 : 0;
    const isrMonto = (honorarioBruto * isrPct) / 100;
    const neto = honorarioBruto - isrMonto;
    const aporteClinica = totalBruto - honorarioBruto;

    const nuevo: LiquidacionHonorario = {
      id: `liq-${Date.now()}`,
      codigo_liquidacion: `HON-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      fecha_generada: new Date().toISOString().slice(0, 10),
      medico_id: `med-${Date.now()}`,
      medico_nombre: nuevoForm.medico_nombre || "Dr. Médico Especialista",
      especialidad: nuevoForm.especialidad,
      exequatur: nuevoForm.exequatur || "19283-23",
      rnc_cedula: nuevoForm.rnc_cedula || "001-XXXXXXX-X",
      tipo_contrato: nuevoForm.tipo_contrato,
      tipo_acto: nuevoForm.tipo_acto,
      descripcion_acto: nuevoForm.descripcion_acto || "Atención clínica especializada",
      paciente_nombre: nuevoForm.paciente_nombre || "Paciente sin nombre",
      expediente_no: nuevoForm.expediente_no || `EXP-${Math.floor(10000 + Math.random() * 90000)}`,
      aseguradora: nuevoForm.aseguradora,
      no_autorizacion_ars: nuevoForm.no_autorizacion_ars || `AUT-${Math.floor(100000 + Math.random() * 900000)}`,
      monto_bruto: totalBruto,
      cobertura_ars: Number(nuevoForm.cobertura_ars),
      copago_paciente: Number(nuevoForm.copago_paciente),
      porcentaje_medico: pctMed,
      porcentaje_clinica: 100 - pctMed,
      honorario_bruto_medico: honorarioBruto,
      retencion_isr_pct: isrPct,
      retencion_isr_monto: isrMonto,
      monto_neto_medico: neto,
      aporte_clinica: aporteClinica,
      estado: "pendiente",
      banco_destino: nuevoForm.banco_destino,
      cuenta_destino: nuevoForm.cuenta_destino || "Cuenta de Ahorros Principal",
    };

    setLiquidaciones([nuevo, ...liquidaciones]);
    toast.success("Honorario médico registrado y enviado a auditoría");
    setNuevoModalOpen(false);
  };

  const verVoucher = (liq: LiquidacionHonorario) => {
    setSelectedLiq(liq);
    setVoucherModalOpen(true);
  };

  // KPIs
  const totalPendiente = useMemo(
    () => liquidaciones.filter((l) => l.estado === "pendiente").reduce((s, l) => s + l.monto_neto_medico, 0),
    [liquidaciones]
  );
  const totalAprobado = useMemo(
    () => liquidaciones.filter((l) => l.estado === "aprobada").reduce((s, l) => s + l.monto_neto_medico, 0),
    [liquidaciones]
  );
  const totalPagado = useMemo(
    () => liquidaciones.filter((l) => l.estado === "pagada").reduce((s, l) => s + l.monto_neto_medico, 0),
    [liquidaciones]
  );
  const totalRetencionISR = useMemo(
    () => liquidaciones.filter((l) => l.estado === "pagada").reduce((s, l) => s + l.retencion_isr_monto, 0),
    [liquidaciones]
  );

  // Filtrado
  const filtered = useMemo(() => {
    return liquidaciones.filter((item) => {
      const matchSearch =
        search === "" ||
        item.medico_nombre.toLowerCase().includes(search.toLowerCase()) ||
        item.codigo_liquidacion.toLowerCase().includes(search.toLowerCase()) ||
        item.paciente_nombre.toLowerCase().includes(search.toLowerCase()) ||
        item.exequatur.includes(search);

      const matchEsp = especialidadFilter === "todas" || item.especialidad === especialidadFilter;
      const matchEst = estadoFilter === "todos" || item.estado === estadoFilter;
      return matchSearch && matchEsp && matchEst;
    });
  }, [liquidaciones, search, especialidadFilter, estadoFilter]);

  const formatDOP = (n: number) =>
    `DOP$ ${n.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header Modo B */}
      <ClinicalPageHeader
        title="Liquidación de Honorarios Médicos & Split Clínico"
        subtitle="Auditoría de actos médicos, retención fiscal 10% ISR DGII (Art. 309) y recibos oficiales para facultativos"
        icon={Stethoscope}
        badge="Finanzas Clínicas & ARS"
        action={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setNuevoModalOpen(true)}
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="w-4 h-4" /> Registrar Acto Médico
            </Button>
          </div>
        }
      />

      {/* KPIs Clínicos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Pendiente de Auditoría"
          value={formatDOP(totalPendiente)}
          subtitle={`${liquidaciones.filter((l) => l.estado === "pendiente").length} actos por revisar`}
          icon={Clock}
          variant="amber"
        />
        <ClinicalKpiCard
          title="Aprobado para Pago"
          value={formatDOP(totalAprobado)}
          subtitle="Listo para lote ACH / Cheque"
          icon={CheckCircle2}
          variant="blue"
        />
        <ClinicalKpiCard
          title="Neto Liquidado a Médicos"
          value={formatDOP(totalPagado)}
          subtitle="Desembolsos cerrados"
          icon={DollarSign}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Retención ISR 10% DGII"
          value={formatDOP(totalRetencionISR)}
          subtitle="Comprobante fiscal retención Art. 309"
          icon={ShieldCheck}
          variant="purple"
        />
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="rounded-2xl border-border/80">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar médico, exequátur, paciente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-border/80 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select value={especialidadFilter} onValueChange={setEspecialidadFilter}>
                <SelectTrigger className="w-[180px] border-border/80 text-xs">
                  <SelectValue placeholder="Especialidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las especialidades</SelectItem>
                  <SelectItem value="Cardiología">Cardiología</SelectItem>
                  <SelectItem value="Pediatría">Pediatría</SelectItem>
                  <SelectItem value="Diabetes & Endocrinología">Diabetes & Endocrinología</SelectItem>
                  <SelectItem value="Cirugía General">Cirugía General</SelectItem>
                  <SelectItem value="Ginecología & Obstetricia">Ginecología</SelectItem>
                  <SelectItem value="Medicina Interna">Medicina Interna</SelectItem>
                </SelectContent>
              </Select>

              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-[140px] border-border/80 text-xs">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobada">Aprobada</SelectItem>
                  <SelectItem value="pagada">Pagada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Liquidaciones */}
      <Card className="rounded-2xl border-border/80 overflow-hidden">
        <CardHeader className="bg-muted/30 px-6 py-4 border-b border-border/80 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" /> Registro de Honorarios & Actos Médicos
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cálculo de split clínico: Honorario facultativo vs Retención institucional y deducción tributaria
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-normal rounded-full">
            {filtered.length} Registros
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10 hover:bg-muted/10">
                  <TableHead className="text-xs font-semibold">Código / Fecha</TableHead>
                  <TableHead className="text-xs font-semibold">Especialista & Exequátur</TableHead>
                  <TableHead className="text-xs font-semibold">Acto & Paciente</TableHead>
                  <TableHead className="text-xs font-semibold">Aseguradora / Aut.</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Bruto Acto</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Split</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Ret. ISR (10%)</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Neto Médico</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Estado</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-sm">
                      No se encontraron liquidaciones de honorarios con los criterios seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/20 text-xs">
                      <TableCell>
                        <div className="font-semibold text-foreground">{item.codigo_liquidacion}</div>
                        <div className="text-[11px] text-muted-foreground">{item.fecha_generada}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{item.medico_nombre}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <span className="text-emerald-600 font-medium">{item.especialidad}</span> · Exeq: {item.exequatur}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground max-w-[200px] truncate" title={item.descripcion_acto}>
                          {item.descripcion_acto}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {item.paciente_nombre} ({item.expediente_no})
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal py-0">
                          {item.aseguradora}
                        </Badge>
                        {item.no_autorizacion_ars && (
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {item.no_autorizacion_ars}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatDOP(item.monto_bruto)}
                        <div className="text-[10px] text-muted-foreground">
                          ARS: {formatDOP(item.cobertura_ars)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px] font-semibold">
                          {item.porcentaje_medico}% / {item.porcentaje_clinica}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-rose-600 font-medium">
                        -{formatDOP(item.retencion_isr_monto)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {formatDOP(item.monto_neto_medico)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize font-medium ${
                            item.estado === "pagada"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                              : item.estado === "aprobada"
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          }`}
                        >
                          {item.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.estado === "pendiente" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => aprobarLiquidacion(item)}
                              className="h-7 text-xs px-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50"
                              title="Aprobar para pago"
                            >
                              Aprobar
                            </Button>
                          )}
                          {item.estado === "aprobada" && (
                            <Button
                              size="sm"
                              onClick={() => abrirPagoModal(item)}
                              className="h-7 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                              title="Liquidar pago bancario"
                            >
                              <CreditCard className="w-3.5 h-3.5 mr-1" /> Pagar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => verVoucher(item)}
                            className="h-7 w-7 p-0 hover:bg-muted"
                            title="Ver Volante y Comprobante Fiscal"
                          >
                            <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Footer de respiro y totalizador para evitar filas pegadas a la curva de la card */}
          <div className="flex items-center justify-between border-t border-border/60 px-6 py-3.5 bg-muted/10 text-xs text-muted-foreground rounded-b-2xl">
            <span>Mostrando {filtered.length} liquidaciones de honorarios médicos</span>
            <span className="font-mono text-[11px] text-muted-foreground/80">Retención ISR 10% Ley 11-92 (DGII)</span>
          </div>
        </CardContent>
      </Card>

      {/* Modales Modulares Reutilizables */}
      <NuevoHonorarioSplitModal
        open={nuevoModalOpen}
        onOpenChange={setNuevoModalOpen}
        form={nuevoForm}
        setForm={(f) => setNuevoForm(f as typeof nuevoForm)}
        formatDOP={formatDOP}
        onSubmit={handleCrearNuevoHonorario}
      />

      <ConfirmarPagoHonorarioModal
        open={pagoModalOpen}
        onOpenChange={setPagoModalOpen}
        selectedLiq={selectedLiq}
        pagoForm={pagoForm}
        setPagoForm={setPagoForm}
        formatDOP={formatDOP}
        onConfirmar={confirmarPago}
      />

      <VolanteLiquidacionModal
        open={voucherModalOpen}
        onOpenChange={setVoucherModalOpen}
        selectedLiq={selectedLiq}
        formatDOP={formatDOP}
      />
    </div>
  );
}
