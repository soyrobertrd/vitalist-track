import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "./useDebounce";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DEMO_MODE, DEMO_PACIENTES, DEMO_DOCTORES, DEMO_CITAS } from "@/lib/mock-live-seed";

export interface SearchResult {
  id: string;
  type: 'accion' | 'seccion' | 'paciente' | 'profesional' | 'visita' | 'llamada';
  title: string;
  subtitle: string;
  url: string;
  metadata?: string;
}

const ACCIONES_SISTEMA: SearchResult[] = [
  { id: "act-nueva-cita", type: "accion", title: "Programar Nueva Cita", subtitle: "Agendar consulta ambulatoria o domiciliaria", url: "/app/citas?action=nueva" },
  { id: "act-nuevo-paciente", type: "accion", title: "Registrar Nuevo Paciente", subtitle: "Crear ficha clínica y expediente digital", url: "/pacientes?action=nuevo" },
  { id: "act-agenda", type: "accion", title: "Ver Agenda del Día", subtitle: "Consultas, visitas y estado de asistencia", url: "/app/citas" },
  { id: "act-planes", type: "accion", title: "Planes & Suscripción", subtitle: "Ver cuotas, límites y mejorar plan", url: "/app/planes" },
  { id: "act-admin", type: "accion", title: "Administración del Centro", subtitle: "Configuración general, roles y seguridad", url: "/app/admin" },
];

const SECCIONES_SISTEMA: SearchResult[] = [
  { id: "sec-dashboard", type: "seccion", title: "Dashboard General", subtitle: "KPIs, gráficos y forecast de ingresos", url: "/app" },
  { id: "sec-citas", type: "seccion", title: "Agenda & Citas", subtitle: "Gestión de citas ambulatorias y domiciliarias", url: "/app/citas" },
  { id: "sec-pacientes", type: "seccion", title: "Directorio de Pacientes", subtitle: "Listado completo con búsqueda y filtros", url: "/pacientes" },
  { id: "sec-dental", type: "seccion", title: "Odontología / DentalCare Pro", subtitle: "Planes dentales, ortodoncia, sillones y laboratorio", url: "/dental-care" },
  { id: "sec-aesthetic", type: "seccion", title: "Medicina Estética / Aesthetic Pro", subtitle: "Cabinas láser, paquetes, fotos y membresías", url: "/aesthetic-pro" },
  { id: "sec-vision", type: "seccion", title: "Óptica / VisionCare Pro", subtitle: "Recetas oftálmicas, monturas, lentes y garantías", url: "/vision-care" },
  { id: "sec-recovery", type: "seccion", title: "Recovery Care", subtitle: "Post-quirúrgico, habitaciones y concierge", url: "/recovery-care" },
  { id: "sec-psico", type: "seccion", title: "Psicología & Psiquiatría", subtitle: "Sesiones terapéuticas, escalas y notas ultra privadas", url: "/psicologia-pro" },
  { id: "sec-verticales", type: "seccion", title: "Verticales Médicas Habilitadas", subtitle: "Especialidades clínicas del centro de salud", url: "/app/admin/verticales" },
];

export function useGlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const debouncedQuery = useDebounce(query, 200);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const searchResults: SearchResult[] = [];
    const qLower = searchQuery.toLowerCase().trim();

    // 1. Filtrar Acciones y Secciones del sistema
    const accionesCoincidentes = ACCIONES_SISTEMA.filter(
      (a) => a.title.toLowerCase().includes(qLower) || a.subtitle.toLowerCase().includes(qLower)
    );
    searchResults.push(...accionesCoincidentes);

    const seccionesCoincidentes = SECCIONES_SISTEMA.filter(
      (s) => s.title.toLowerCase().includes(qLower) || s.subtitle.toLowerCase().includes(qLower)
    );
    searchResults.push(...seccionesCoincidentes);

    try {
      // 2. Búsqueda en Supabase con fallback inteligente a datos canónicos
      const [pacientesRes, profesionalesRes, visitasRes, llamadasRes] = await Promise.all([
        supabase
          .from("pacientes")
          .select("id, nombre, apellido, cedula, contacto_px, barrio, zona")
          .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%,cedula.ilike.%${searchQuery}%,contacto_px.ilike.%${searchQuery}%`)
          .eq("status_px", "activo")
          .limit(8),

        supabase
          .from("personal_salud")
          .select("id, nombre, apellido, especialidad, contacto")
          .or(`nombre.ilike.%${searchQuery}%,apellido.ilike.%${searchQuery}%,cedula.ilike.%${searchQuery}%`)
          .eq("activo", true)
          .limit(5),

        supabase
          .from("control_visitas")
          .select(`
            id, 
            fecha_hora_visita, 
            tipo_visita, 
            estado,
            motivo_visita,
            pacientes!inner(id, nombre, apellido, cedula)
          `)
          .or(`pacientes.nombre.ilike.%${searchQuery}%,pacientes.apellido.ilike.%${searchQuery}%,pacientes.cedula.ilike.%${searchQuery}%`)
          .in("estado", ["pendiente", "realizada"])
          .order("fecha_hora_visita", { ascending: false })
          .limit(5),

        supabase
          .from("registro_llamadas")
          .select(`
            id, 
            fecha_agendada, 
            estado,
            motivo,
            pacientes!inner(id, nombre, apellido, cedula)
          `)
          .or(`pacientes.nombre.ilike.%${searchQuery}%,pacientes.apellido.ilike.%${searchQuery}%,pacientes.cedula.ilike.%${searchQuery}%`)
          .in("estado", ["agendada", "pendiente", "realizada"])
          .order("fecha_agendada", { ascending: false })
          .limit(5),
      ]);

      let pacientesEncontrados = 0;
      if (pacientesRes.data && pacientesRes.data.length > 0) {
        pacientesRes.data.forEach((p) => {
          pacientesEncontrados++;
          searchResults.push({
            id: p.id,
            type: 'paciente',
            title: `${p.nombre} ${p.apellido}`,
            subtitle: `Cédula: ${p.cedula} · Tel: ${p.contacto_px || 'Sin contacto'}`,
            url: `/pacientes?id=${p.id}`,
            metadata: p.barrio || p.zona || undefined,
          });
        });
      }

      // Si Supabase no tiene pacientes coincidentes o está en modo local, buscar en DEMO_PACIENTES
      if (DEMO_MODE && pacientesEncontrados === 0) {
        const demoPx = DEMO_PACIENTES.filter((p) =>
          `${p.nombre} ${p.apellido}`.toLowerCase().includes(qLower) ||
          p.cedula.includes(qLower) ||
          (p.contacto_px && p.contacto_px.includes(qLower))
        ).slice(0, 6);

        demoPx.forEach((p) => {
          searchResults.push({
            id: p.id,
            type: 'paciente',
            title: `${p.nombre} ${p.apellido}`,
            subtitle: `Cédula: ${p.cedula} · Tel: ${p.contacto_px}`,
            url: `/pacientes?id=${p.id}`,
            metadata: p.clinica_origen || p.barrio || p.zona,
          });
        });
      }

      let profEncontrados = 0;
      if (profesionalesRes.data && profesionalesRes.data.length > 0) {
        profesionalesRes.data.forEach((p) => {
          profEncontrados++;
          searchResults.push({
            id: p.id,
            type: 'profesional',
            title: `Dr(a). ${p.nombre} ${p.apellido}`,
            subtitle: p.especialidad || 'Especialista',
            url: `/personal?id=${p.id}`,
            metadata: p.contacto || undefined,
          });
        });
      }

      if (DEMO_MODE && profEncontrados === 0) {
        const demoDocs = DEMO_DOCTORES.filter((d) =>
          `${d.nombre} ${d.apellido}`.toLowerCase().includes(qLower) ||
          d.especialidad.toLowerCase().includes(qLower)
        ).slice(0, 4);

        demoDocs.forEach((d) => {
          searchResults.push({
            id: d.id,
            type: 'profesional',
            title: `Dr(a). ${d.nombre} ${d.apellido}`,
            subtitle: `${d.especialidad} · Exeq: ${d.exequatur}`,
            url: `/personal?id=${d.id}`,
            metadata: d.telefono,
          });
        });
      }

      // Process visitas
      if (visitasRes.data && visitasRes.data.length > 0) {
        visitasRes.data.forEach((v: any) => {
          const paciente = v.pacientes;
          const fecha = v.fecha_hora_visita 
            ? format(new Date(v.fecha_hora_visita), "dd MMM yyyy, HH:mm", { locale: es })
            : 'Sin fecha';
          searchResults.push({
            id: v.id,
            type: 'visita',
            title: `Cita: ${paciente.nombre} ${paciente.apellido}`,
            subtitle: `${fecha} - ${v.tipo_visita === 'domicilio' ? 'Domicilio' : 'Ambulatoria'}`,
            url: `/app/citas?id=${v.id}`,
            metadata: v.estado,
          });
        });
      } else if (DEMO_MODE) {
        const demoCitasMatches = DEMO_CITAS.filter((c) =>
          c.pacientes && `${c.pacientes.nombre} ${c.pacientes.apellido}`.toLowerCase().includes(qLower)
        ).slice(0, 4);

        demoCitasMatches.forEach((c) => {
          const fecha = format(new Date(c.fecha_hora_visita), "dd MMM yyyy, HH:mm", { locale: es });
          searchResults.push({
            id: c.id,
            type: 'visita',
            title: `Cita: ${c.pacientes?.nombre} ${c.pacientes?.apellido}`,
            subtitle: `${fecha} · ${c.tipo_visita === 'domicilio' ? 'Domiciliaria' : 'Ambulatoria'}`,
            url: `/app/citas?id=${c.id}`,
            metadata: c.estado,
          });
        });
      }

      // Process llamadas
      if (llamadasRes.data) {
        llamadasRes.data.forEach((l: any) => {
          const paciente = l.pacientes;
          const fecha = l.fecha_agendada 
            ? format(new Date(l.fecha_agendada), "dd MMM yyyy, HH:mm", { locale: es })
            : 'Sin fecha';
          searchResults.push({
            id: l.id,
            type: 'llamada',
            title: `Llamada: ${paciente.nombre} ${paciente.apellido}`,
            subtitle: fecha,
            url: `/llamadas?id=${l.id}`,
            metadata: l.estado,
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error("Error searching:", error);
      // Fallback a demo data si falla la consulta
      const demoPx = (DEMO_MODE ? DEMO_PACIENTES : []).filter((p) =>
        `${p.nombre} ${p.apellido}`.toLowerCase().includes(qLower) ||
        p.cedula.includes(qLower)
      ).slice(0, 6);

      demoPx.forEach((p) => {
        searchResults.push({
          id: p.id,
          type: 'paciente',
          title: `${p.nombre} ${p.apellido}`,
          subtitle: `Cédula: ${p.cedula} · Tel: ${p.contacto_px}`,
          url: `/pacientes?id=${p.id}`,
          metadata: p.clinica_origen || p.barrio || p.zona,
        });
      });

      setResults(searchResults);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Auto-search when debounced query changes
  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    isOpen,
    setIsOpen,
    search,
    clearSearch,
  };
}
