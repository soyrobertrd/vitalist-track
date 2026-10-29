import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  PawPrint,
  Syringe,
  Stethoscope,
  Bed,
  Scissors,
  Calculator,
  Plus,
  QrCode,
  Activity,
  Heart,
  AlertTriangle,
} from "lucide-react";
import { ClinicalPageHeader } from "@/components/common/ClinicalPageHeader";
import { ClinicalKpiCard } from "@/components/common/ClinicalKpiCard";
import { toast } from "sonner";
import {
  Mascota,
  RegistroVacunaDesparasitacion,
  ConsultaVeterinaria,
  HospitalizacionCirugia,
  GroomingServicio,
} from "@/components/vet/vet-types";
import {
  MOCK_MASCOTAS,
  MOCK_VACUNAS,
  MOCK_CONSULTAS,
  MOCK_HOSPITALIZACION,
  MOCK_GROOMING,
} from "@/components/vet/vet-mock-data";
import { MascotasTab } from "@/components/vet/MascotasTab";
import { VacunasDesparasitacionTab } from "@/components/vet/VacunasDesparasitacionTab";
import { ConsultaClinicaVetTab } from "@/components/vet/ConsultaClinicaVetTab";
import { HospitalizacionCirugiaTab } from "@/components/vet/HospitalizacionCirugiaTab";
import { GroomingPeluqueriaTab } from "@/components/vet/GroomingPeluqueriaTab";
import { CalculadoraDosisVetTab } from "@/components/vet/CalculadoraDosisVetTab";
import { CarnetDigitalModal } from "@/components/vet/CarnetDigitalModal";
import { NuevaMascotaModal } from "@/components/vet/NuevaMascotaModal";
import { NuevaVacunaVetModal } from "@/components/vet/NuevaVacunaVetModal";
import { NuevaConsultaVetModal } from "@/components/vet/NuevaConsultaVetModal";
import { NuevoIngresoHospModal } from "@/components/vet/NuevoIngresoHospModal";
import { NuevoGroomingModal } from "@/components/vet/NuevoGroomingModal";
import { isBefore, addDays } from "date-fns";

export default function VetCarePro() {
  const { currentWorkspace } = useWorkspace();
  const wsId = currentWorkspace?.id;
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "mascotas";

  // Estados clínicos veterinarios
  const [mascotas, setMascotas] = useState<Mascota[]>(MOCK_MASCOTAS);
  const [vacunas, setVacunas] = useState<RegistroVacunaDesparasitacion[]>(MOCK_VACUNAS);
  const [consultas, setConsultas] = useState<ConsultaVeterinaria[]>(MOCK_CONSULTAS);
  const [hospitalizacion, setHospitalizacion] = useState<HospitalizacionCirugia[]>(MOCK_HOSPITALIZACION);
  const [grooming, setGrooming] = useState<GroomingServicio[]>(MOCK_GROOMING);

  // Estados de modales
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<Mascota | null>(null);
  const [modalCarnetOpen, setModalCarnetOpen] = useState(false);
  const [modalMascotaOpen, setModalMascotaOpen] = useState(false);
  const [modalVacunaOpen, setModalVacunaOpen] = useState(false);
  const [modalConsultaOpen, setModalConsultaOpen] = useState(false);
  const [modalHospOpen, setModalHospOpen] = useState(false);
  const [modalGroomingOpen, setModalGroomingOpen] = useState(false);

  // Cargar datos de Supabase si existen, combinando con el seed canónico
  const cargar = useCallback(async () => {
    if (!wsId) return;
    try {
      const [mRes, vRes] = await Promise.all([
        (supabase.from("vet_mascotas" as any) as any)
          .select("id, paciente_id, especie, raza, sexo, fecha_nacimiento, peso_kg, esterilizado, tutor_nombre, tutor_telefono, pacientes(nombre)")
          .eq("workspace_id", wsId)
          .order("created_at", { ascending: false }),
        (supabase.from("vet_vacunas" as any) as any)
          .select("id, vacuna, fecha_aplicada, proxima_dosis, pacientes(nombre)")
          .eq("workspace_id", wsId)
          .order("proxima_dosis", { ascending: true, nullsFirst: false }),
      ]);

      if (mRes.data && mRes.data.length > 0) {
        const mapeadas: Mascota[] = mRes.data.map((item: any) => ({
          id: item.id,
          paciente_id: item.paciente_id,
          nombre: item.pacientes?.nombre || "Mascota",
          especie: item.especie,
          raza: item.raza || "Mestizo",
          sexo: item.sexo || "macho",
          fecha_nacimiento: item.fecha_nacimiento || "2022-01-01",
          peso_kg: item.peso_kg || 0,
          esterilizado: Boolean(item.esterilizado),
          tutor_nombre: item.tutor_nombre,
          tutor_telefono: item.tutor_telefono || "",
        }));
        setMascotas([...mapeadas, ...MOCK_MASCOTAS.filter(mock => !mapeadas.some(m => m.id === mock.id))]);
      }

      if (vRes.data && vRes.data.length > 0) {
        const mapeadasVac: RegistroVacunaDesparasitacion[] = vRes.data.map((item: any) => ({
          id: item.id,
          paciente_id: item.paciente_id || "px-db",
          mascota_nombre: item.pacientes?.nombre || "Mascota",
          tipo: "vacuna",
          producto: item.vacuna,
          fecha_aplicada: item.fecha_aplicada,
          proxima_dosis: item.proxima_dosis || "",
          veterinario: "Médico Veterinario",
        }));
        setVacunas([...mapeadasVac, ...MOCK_VACUNAS]);
      }
    } catch {
      // Fallback a los datos mock activos
    }
  }, [wsId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Handlers para guardar nuevos registros
  const handleGuardarMascota = (nueva: Mascota) => {
    setMascotas([nueva, ...mascotas]);
  };

  const handleGuardarVacuna = (nueva: RegistroVacunaDesparasitacion) => {
    setVacunas([nueva, ...vacunas]);
  };

  const handleGuardarConsulta = (nueva: ConsultaVeterinaria) => {
    setConsultas([nueva, ...consultas]);
  };

  const handleGuardarIngreso = (nuevo: HospitalizacionCirugia) => {
    setHospitalizacion([nuevo, ...hospitalizacion]);
  };

  const handleGuardarGrooming = (nuevo: GroomingServicio) => {
    setGrooming([nuevo, ...grooming]);
  };

  // Cálculo de indicadores
  const hoy = new Date();
  const vacunasVencidas = vacunas.filter(v => {
    if (!v.proxima_dosis) return false;
    return isBefore(new Date(v.proxima_dosis + "T12:00:00"), hoy);
  }).length;

  const vacunasAlDia = vacunas.length - vacunasVencidas;
  const hospitalizadosActivos = hospitalizacion.filter(h => h.estado !== "alta").length;

  return (
    <div className="space-y-6">
      <ClinicalPageHeader
        title="VetCare Pro — Sistema Clínico Veterinario"
        subtitle="Expediente clínico integral de mascotas, inmunizaciones, quirófano, hospitalización y posología"
        icon={PawPrint}
        variant="emerald"
        badge="Centro Hospitalario Veterinario"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border/80 gap-1.5 text-xs shadow-none"
              onClick={() => {
                setMascotaSeleccionada(null);
                setModalVacunaOpen(true);
              }}
            >
              <Syringe className="h-3.5 w-3.5 text-blue-600" /> Registrar Vacuna
            </Button>
            <Button
              size="sm"
              className="rounded-xl gap-1.5 text-xs shadow-none"
              onClick={() => setModalMascotaOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" /> Nueva Mascota
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ClinicalKpiCard
          title="Mascotas Pacientes"
          value={mascotas.length}
          subtitle="Caninos, felinos y exóticos"
          icon={PawPrint}
          variant="emerald"
        />
        <ClinicalKpiCard
          title="Inmunizaciones al Día"
          value={vacunasAlDia}
          subtitle={`${vacunasVencidas} dosis vencidas`}
          icon={Syringe}
          variant={vacunasVencidas > 0 ? "rose" : "blue"}
          alert={vacunasVencidas > 0}
        />
        <ClinicalKpiCard
          title="Consultas Clínicas"
          value={consultas.length}
          subtitle="Con constantes fisiológicas"
          icon={Stethoscope}
          variant="purple"
        />
        <ClinicalKpiCard
          title="Hospitalizados & Quirófano"
          value={hospitalizadosActivos}
          subtitle="Monitoreo activo en boxes"
          icon={Bed}
          variant="blue"
        />
      </div>

      {/* Navegación Modular por Pestañas */}
      <Tabs
        value={tab}
        onValueChange={t => setParams({ tab: t }, { replace: true })}
        className="space-y-4"
      >
        <TabsList className="w-full flex-wrap justify-start gap-1 p-1.5 bg-muted/40 rounded-2xl border border-border/70 h-auto">
          <TabsTrigger value="mascotas" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <PawPrint className="h-4 w-4 text-emerald-600" />
            Mascotas ({mascotas.length})
          </TabsTrigger>
          <TabsTrigger value="vacunas" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <Syringe className="h-4 w-4 text-blue-600" />
            Vacunas & Desparasitación ({vacunas.length})
          </TabsTrigger>
          <TabsTrigger value="consultas" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <Stethoscope className="h-4 w-4 text-purple-600" />
            Consultas Clínicas ({consultas.length})
          </TabsTrigger>
          <TabsTrigger value="hospitalizacion" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <Bed className="h-4 w-4 text-amber-600" />
            Cirugía & Hospitalización ({hospitalizacion.length})
          </TabsTrigger>
          <TabsTrigger value="grooming" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <Scissors className="h-4 w-4 text-rose-500" />
            Estética & Grooming ({grooming.length})
          </TabsTrigger>
          <TabsTrigger value="calculadora" className="rounded-xl text-xs font-semibold px-3.5 py-2 gap-1.5">
            <Calculator className="h-4 w-4 text-teal-600" />
            Calculadora Dosis Ponderal
          </TabsTrigger>
        </TabsList>

        {/* 1. Directorio de Mascotas */}
        <TabsContent value="mascotas" className="space-y-4">
          <MascotasTab
            mascotas={mascotas}
            onNuevaMascota={() => setModalMascotaOpen(true)}
            onVerCarnet={m => {
              setMascotaSeleccionada(m);
              setModalCarnetOpen(true);
            }}
            onNuevaConsulta={m => {
              setMascotaSeleccionada(m);
              setModalConsultaOpen(true);
            }}
            onNuevaVacuna={m => {
              setMascotaSeleccionada(m);
              setModalVacunaOpen(true);
            }}
          />
        </TabsContent>

        {/* 2. Carnet de Vacunas y Desparasitación */}
        <TabsContent value="vacunas" className="space-y-4">
          <VacunasDesparasitacionTab
            registros={vacunas}
            onNuevoRegistro={() => {
              setMascotaSeleccionada(null);
              setModalVacunaOpen(true);
            }}
          />
        </TabsContent>

        {/* 3. Consultas Clínicas Veterinarias */}
        <TabsContent value="consultas" className="space-y-4">
          <ConsultaClinicaVetTab
            consultas={consultas}
            onNuevaConsulta={() => {
              setMascotaSeleccionada(null);
              setModalConsultaOpen(true);
            }}
          />
        </TabsContent>

        {/* 4. Cirugías & Hospitalización */}
        <TabsContent value="hospitalizacion" className="space-y-4">
          <HospitalizacionCirugiaTab
            casos={hospitalizacion}
            onNuevoIngreso={() => setModalHospOpen(true)}
          />
        </TabsContent>

        {/* 5. Estética & Grooming */}
        <TabsContent value="grooming" className="space-y-4">
          <GroomingPeluqueriaTab
            servicios={grooming}
            onNuevoServicio={() => setModalGroomingOpen(true)}
          />
        </TabsContent>

        {/* 6. Calculadora de Dosis */}
        <TabsContent value="calculadora" className="space-y-4">
          <CalculadoraDosisVetTab mascotas={mascotas} />
        </TabsContent>
      </Tabs>

      {/* Modales Especializados */}
      <CarnetDigitalModal
        mascota={mascotaSeleccionada}
        vacunas={vacunas}
        open={modalCarnetOpen}
        onOpenChange={setModalCarnetOpen}
      />

      <NuevaMascotaModal
        open={modalMascotaOpen}
        onOpenChange={setModalMascotaOpen}
        onGuardar={handleGuardarMascota}
      />

      <NuevaVacunaVetModal
        open={modalVacunaOpen}
        onOpenChange={setModalVacunaOpen}
        mascotas={mascotas}
        mascotaPreseleccionada={mascotaSeleccionada}
        onGuardar={handleGuardarVacuna}
      />

      <NuevaConsultaVetModal
        open={modalConsultaOpen}
        onOpenChange={setModalConsultaOpen}
        mascotas={mascotas}
        mascotaPreseleccionada={mascotaSeleccionada}
        onGuardar={handleGuardarConsulta}
      />

      <NuevoIngresoHospModal
        open={modalHospOpen}
        onOpenChange={setModalHospOpen}
        mascotas={mascotas}
        onGuardar={handleGuardarIngreso}
      />

      <NuevoGroomingModal
        open={modalGroomingOpen}
        onOpenChange={setModalGroomingOpen}
        mascotas={mascotas}
        onGuardar={handleGuardarGrooming}
      />
    </div>
  );
}
