export type EstadoCama = "disponible" | "ocupada" | "limpieza" | "mantenimiento" | "reservada";

export type TipoCama =
  | "Estándar / General"
  | "Quirúrgica Post-Op"
  | "UCI / Crítica"
  | "Aislamiento Infeccioso"
  | "Pediátrica"
  | "Cuna / Incubadora";

export type TipoAislamiento = "Ninguno" | "Contacto" | "Gotas" | "Aéreo" | "Protector / Neutropénico";

export interface PacienteHospitalizado {
  id: string;
  nombre: string;
  cedula_nss: string;
  edad_sexo: string;
  diagnostico_cie10: string;
  medico_tratante: string;
  especialidad: string;
  fecha_ingreso: string;
  dias_estancia: number;
  dieta: string;
  alergias?: string;
  aislamiento: TipoAislamiento;
}

export interface CamaDetalle {
  id: string;
  codigo_cama: string;
  nombre: string;
  tipo: TipoCama;
  estado: EstadoCama;
  oxigeno_central: boolean;
  ventilador_mecanico: boolean;
  monitor_multiparametrico: boolean;
  paciente?: PacienteHospitalizado;
  ultima_limpieza?: string;
  observaciones?: string;
}

export interface HabitacionHospitalaria {
  id: string;
  codigo_habitacion: string;
  nombre: string;
  tipo_habitacion: "Individual / Privada" | "Semiprivada (2 camas)" | "Múltiple (4 camas)" | "Box UCI" | "Aislamiento Presión Negativa";
  ala_sector: string;
  camas: CamaDetalle[];
}

export interface PisoHospitalario {
  id: string;
  numero_piso: number;
  nombre: string;
  descripcion_servicio: string;
  jefe_enfermeria: string;
  habitaciones: HabitacionHospitalaria[];
}

export const MOCK_PISOS_DATA: PisoHospitalario[] = [
  {
    id: "piso-1",
    numero_piso: 1,
    nombre: "Piso 1 — Urgencias, Triaje & Observación",
    descripcion_servicio: "Atención continua 24/7 y observación de corta estancia (<24h)",
    jefe_enfermeria: "Lic. Carmen Vásquez",
    habitaciones: [
      {
        id: "hab-101",
        codigo_habitacion: "OBS-101",
        nombre: "Observación Adultos Sector A",
        tipo_habitacion: "Múltiple (4 camas)",
        ala_sector: "Ala Oeste - Urgencias",
        camas: [
          {
            id: "cam-101-a",
            codigo_cama: "C-101-A",
            nombre: "Cama 101-A",
            tipo: "Estándar / General",
            estado: "ocupada",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: true,
            paciente: {
              id: "pac-01",
              nombre: "José Manuel Tavárez",
              cedula_nss: "001-1928471-2",
              edad_sexo: "58a / M",
              diagnostico_cie10: "Dolor torácico atípico en estudio / HTA grado II",
              medico_tratante: "Dr. Félix Montalvo",
              especialidad: "Cardiología",
              fecha_ingreso: "2026-10-29",
              dias_estancia: 1,
              dieta: "Hiposódica estricta",
              aislamiento: "Ninguno",
            },
          },
          {
            id: "cam-101-b",
            codigo_cama: "C-101-B",
            nombre: "Cama 101-B",
            tipo: "Estándar / General",
            estado: "disponible",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: false,
          },
          {
            id: "cam-101-c",
            codigo_cama: "C-101-C",
            nombre: "Cama 101-C",
            tipo: "Estándar / General",
            estado: "limpieza",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: true,
            observaciones: "Requiere desinfección tras egreso de paciente febril",
          },
        ],
      },
      {
        id: "hab-102",
        codigo_habitacion: "BOX-TRAUMA",
        nombre: "Box de Reanimación & Trauma Shock",
        tipo_habitacion: "Box UCI",
        ala_sector: "Entrada Ambulancias Urgencias",
        camas: [
          {
            id: "cam-102-a",
            codigo_cama: "BOX-SHOCK-1",
            nombre: "Camilla Shock 1 (Críticos)",
            tipo: "UCI / Crítica",
            estado: "disponible",
            oxigeno_central: true,
            ventilador_mecanico: true,
            monitor_multiparametrico: true,
          },
        ],
      },
    ],
  },
  {
    id: "piso-2",
    numero_piso: 2,
    nombre: "Piso 2 — Medicina Interna & Cuidados Clínicos",
    descripcion_servicio: "Hospitalización general de adultos, nefrología y endocrinología",
    jefe_enfermeria: "Lic. Ramón Méndez",
    habitaciones: [
      {
        id: "hab-201",
        codigo_habitacion: "HAB-201",
        nombre: "Habitación 201 — Suite Privada",
        tipo_habitacion: "Individual / Privada",
        ala_sector: "Ala Norte",
        camas: [
          {
            id: "cam-201-a",
            codigo_cama: "C-201",
            nombre: "Cama 201",
            tipo: "Estándar / General",
            estado: "ocupada",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: true,
            paciente: {
              id: "pac-02",
              nombre: "Doña Altagracia Rosario",
              cedula_nss: "047-0019284-3",
              edad_sexo: "72a / F",
              diagnostico_cie10: "Neumonía adquirida en la comunidad / DM tipo 2",
              medico_tratante: "Dr. Ramón Peña",
              especialidad: "Medicina Interna",
              fecha_ingreso: "2026-10-26",
              dias_estancia: 4,
              dieta: "Diabética blanda fraccionada",
              alergias: "Penicilina (Anafilaxia)",
              aislamiento: "Gotas",
            },
          },
        ],
      },
      {
        id: "hab-202",
        codigo_habitacion: "HAB-202",
        nombre: "Habitación 202 — Semiprivada",
        tipo_habitacion: "Semiprivada (2 camas)",
        ala_sector: "Ala Norte",
        camas: [
          {
            id: "cam-202-a",
            codigo_cama: "C-202-A",
            nombre: "Cama 202-A (Ventana)",
            tipo: "Estándar / General",
            estado: "ocupada",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: false,
            paciente: {
              id: "pac-03",
              nombre: "Juan Carlos Henríquez",
              cedula_nss: "001-0928371-9",
              edad_sexo: "45a / M",
              diagnostico_cie10: "Gastroenteritis aguda severa con deshidratación grado II",
              medico_tratante: "Dra. Sofía Rivas",
              especialidad: "Gastroenterología",
              fecha_ingreso: "2026-10-28",
              dias_estancia: 2,
              dieta: "Líquidos claros y sales de rehidratación",
              aislamiento: "Contacto",
            },
          },
          {
            id: "cam-202-b",
            codigo_cama: "C-202-B",
            nombre: "Cama 202-B (Pasillo)",
            tipo: "Estándar / General",
            estado: "disponible",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: false,
          },
        ],
      },
      {
        id: "hab-203",
        codigo_habitacion: "AISL-203",
        nombre: "Aislamiento 203 — Presión Negativa HEPA",
        tipo_habitacion: "Aislamiento Presión Negativa",
        ala_sector: "Ala Sur - Aislamiento",
        camas: [
          {
            id: "cam-203-a",
            codigo_cama: "C-203-AISL",
            nombre: "Cama 203 (Infecciosos)",
            tipo: "Aislamiento Infeccioso",
            estado: "ocupada",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: true,
            paciente: {
              id: "pac-04",
              nombre: "Carlos Miguel Soriano",
              cedula_nss: "023-0091823-1",
              edad_sexo: "38a / M",
              diagnostico_cie10: "Sospecha Tuberculosis Pulmonar Bacilífera (A15.0)",
              medico_tratante: "Dr. Héctor Balcácer",
              especialidad: "Infectología",
              fecha_ingreso: "2026-10-27",
              dias_estancia: 3,
              dieta: "Hiperproteica balanceada",
              aislamiento: "Aéreo",
            },
          },
        ],
      },
    ],
  },
  {
    id: "piso-3",
    numero_piso: 3,
    nombre: "Piso 3 — Cirugía General, Bloque Quirúrgico & Traumatología",
    descripcion_servicio: "Recuperación post-quirúrgica, cuidados post-anestesia y ortopedia",
    jefe_enfermeria: "Lic. Sandra Tejada",
    habitaciones: [
      {
        id: "hab-301",
        codigo_habitacion: "URPA-301",
        nombre: "URPA Central Post-Quirúrgico",
        tipo_habitacion: "Múltiple (4 camas)",
        ala_sector: "Anexo a Quirófano",
        camas: [
          {
            id: "cam-301-a",
            codigo_cama: "URPA-01",
            nombre: "Camilla URPA 1",
            tipo: "Quirúrgica Post-Op",
            estado: "ocupada",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: true,
            paciente: {
              id: "pac-05",
              nombre: "Mariana Almonte C.",
              cedula_nss: "402-1827361-0",
              edad_sexo: "31a / F",
              diagnostico_cie10: "Post-Apendicectomía Laparoscópica / Aldrete 9",
              medico_tratante: "Dr. Pedro Castillo",
              especialidad: "Cirugía General",
              fecha_ingreso: "2026-10-30",
              dias_estancia: 1,
              dieta: "Nada por boca (NPO) primeras 6h",
              aislamiento: "Ninguno",
            },
          },
          {
            id: "cam-301-b",
            codigo_cama: "URPA-02",
            nombre: "Camilla URPA 2",
            tipo: "Quirúrgica Post-Op",
            estado: "disponible",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: false,
          },
        ],
      },
      {
        id: "hab-302",
        codigo_habitacion: "HAB-302",
        nombre: "Habitación 302 — Traumatología",
        tipo_habitacion: "Individual / Privada",
        ala_sector: "Ala Oeste",
        camas: [
          {
            id: "cam-302-a",
            codigo_cama: "C-302",
            nombre: "Cama 302 (Tracción Ortopédica)",
            tipo: "Quirúrgica Post-Op",
            estado: "mantenimiento",
            oxigeno_central: true,
            ventilador_mecanico: false,
            monitor_multiparametrico: false,
            observaciones: "Revisión técnica de motor de cama articulada",
          },
        ],
      },
    ],
  },
  {
    id: "piso-5",
    numero_piso: 5,
    nombre: "Piso 5 — Unidad de Cuidados Intensivos (UCI)",
    descripcion_servicio: "Soporte vital avanzado, ventilación mecánica y monitorización invasiva",
    jefe_enfermeria: "Lic. Katherine Peña (UCI)",
    habitaciones: [
      {
        id: "hab-501",
        codigo_habitacion: "BOX-UCI-01",
        nombre: "Box UCI 01 — Polivalente",
        tipo_habitacion: "Box UCI",
        ala_sector: "UCI Central",
        camas: [
          {
            id: "cam-501-a",
            codigo_cama: "C-UCI-01",
            nombre: "Cama UCI 01",
            tipo: "UCI / Crítica",
            estado: "ocupada",
            oxigeno_central: true,
            ventilador_mecanico: true,
            monitor_multiparametrico: true,
            paciente: {
              id: "pac-06",
              nombre: "José Tavárez Grullón",
              cedula_nss: "001-0812934-1",
              edad_sexo: "66a / M",
              diagnostico_cie10: "Shock Cardiogénico post-IAM anterior extenso / SOFA 8",
              medico_tratante: "Dr. Félix Montalvo",
              especialidad: "Cardiología / UCI",
              fecha_ingreso: "2026-10-27",
              dias_estancia: 3,
              dieta: "Nutrición enteral continua por sonda nasoyeyunal",
              aislamiento: "Contacto",
            },
          },
        ],
      },
      {
        id: "hab-502",
        codigo_habitacion: "BOX-UCI-02",
        nombre: "Box UCI 02 — Neurocríticos",
        tipo_habitacion: "Box UCI",
        ala_sector: "UCI Central",
        camas: [
          {
            id: "cam-502-a",
            codigo_cama: "C-UCI-02",
            nombre: "Cama UCI 02",
            tipo: "UCI / Crítica",
            estado: "disponible",
            oxigeno_central: true,
            ventilador_mecanico: true,
            monitor_multiparametrico: true,
          },
        ],
      },
    ],
  },
];
