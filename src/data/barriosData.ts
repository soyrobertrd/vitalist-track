// Datos de barrios organizados por municipio
// Fuente: Excel Localización_1_1.xlsx

export interface Municipio {
  id: string;
  nombre: string;
  provincia: string;
  barrios: string[];
}

export const municipiosData: Municipio[] = [
  {
    id: "distrito_nacional",
    nombre: "Distrito Nacional",
    provincia: "Distrito Nacional",
    barrios: [
      "LOS PERALEJOS",
      "PALMA REAL",
      "ARROYO MANZANO",
      "ALTOS DE ARROYO HONDO",
      "LOS RIOS",
      "PUERTO ISABELA",
      "HONDURAS DEL OESTE",
      "HONDURAS DEL NORTE",
      "PASEO DE LOS INDIOS",
      "LOS CACICAZGOS",
      "RENACIMIENTO",
      "LOS RESTAURADORES",
      "SAN GERONIMO",
      "LOS JARDINES",
      "JARDIN BOTANICO",
      "NUEVO ARROYO HONDO",
      "CERROS DE ARROYO HONDO",
      "VIEJO ARROYO HONDO",
      "PARAISO",
      "JULIETA MORALES",
      "LOS PRADOS",
      "EL MILLON",
      "MIRADOR NORTE",
      "MIRADOR SUR",
      "BUENOS AIRES (INDEPENDENCIA)",
      "MIRAMAR",
      "TROPICAL METALDOM",
      "JARDINES DEL SUR",
      "ATALA",
      "BELLA VISTA",
      "ENSANCHE QUISQUEYA",
      "PIANTINI",
      "LA JULIA",
      "NUESTRA SEÑORA DE LA PAZ",
      "GENERAL ANTONIO DUVERGE",
      "30 DE MAYO",
      "CACIQUE",
      "CENTRO DE LOS HEROES",
      "MATA HAMBRE",
      "CIUDAD UNIVERSITARIA",
      "LA ESPERILLA",
      "ENSANCHE NACO",
      "CENTRO OLIMPICO",
      "ENSANCHE LA FE",
      "LA AGUSTINA",
      "CRISTO REY",
      "JARDIN ZOOLOGICO",
      "LA ZURZA",
      "VILLA AGRICOLAS",
      "VILLA JUANA",
      "MIRAFLORES",
      "SAN JUAN BOSCO",
      "GAZCUE",
      "CIUDAD NUEVA",
      "SAN CARLOS",
      "VILLA CONSUELO",
      "ENSANCHE LUPERON",
      "ENSANCHE CAPOTILLO",
      "SIMON BOLIVAR",
      "24 DE ABRIL",
      "ENSANCHE ESPAILLAT",
      "MARIA AUXILIADORA",
      "MEJORAMIENTO SOCIAL",
      "VILLA FRANCISCA",
      "CIUDAD COLONIAL",
      "DOMINGO SAVIO",
      "GUALEY",
      "LA ISABELA",
      "LA HONDONADA",
      "SAN DIEGO"
    ]
  },
  {
    id: "santo_domingo_este",
    nombre: "Santo Domingo Este",
    provincia: "Santo Domingo",
    barrios: [
      "LOS MINA",
      "VILLA DUARTE",
      "SAN ISIDRO",
      "MENDOZA",
      "LOS TRES BRAZOS",
      "INVIVIENDA",
      "LAS AMERICAS",
      "LUCERNA",
      "OZAMA",
      "ISABELITA",
      "PUERTO RICO",
      "LOS FRAILES",
      "LOS MAMEYES",
      "ALMA ROSA",
      "VILLA HERMOSA",
      "INVI CEA",
      "NUEVO DOMINGO SAVIO",
      "VISTA HERMOSA",
      "LOS MAESTROS",
      "BUENOS AIRES",
      "BRASIL",
      "BRISAS DEL ESTE",
      "VILLA ESFUERZO",
      "ENSANCHE ISABELITA",
      "CRISTO DEL MAR",
      "DOMINGO SABIO"
    ]
  },
  {
    id: "santo_domingo_oeste",
    nombre: "Santo Domingo Oeste",
    provincia: "Santo Domingo",
    barrios: [
      "HERRERA",
      "PANTOJA",
      "CIUDAD SATELITE",
      "LA CALETA",
      "LA HONDONADA",
      "VILLA AURA",
      "HATO NUEVO",
      "VILLA LIBERACION",
      "ENGOMBE",
      "VILLA MELLA",
      "GUARICANO",
      "LOS ALCARRIZOS CENTRO",
      "PALMAREJO",
      "PUEBLO NUEVO",
      "LOS PALMARES",
      "LA JAVILLA",
      "VILLA CARMEN",
      "LA CIENAGA",
      "HAINA",
      "MADRE VIEJA",
      "DUQUESA",
      "CIUDAD OCCIDENTAL",
      "KILOMETRO 9",
      "EL NACIONAL"
    ]
  },
  {
    id: "santo_domingo_norte",
    nombre: "Santo Domingo Norte",
    provincia: "Santo Domingo",
    barrios: [
      "VILLA MELLA CENTRO",
      "GUARICANO",
      "LOS FRAILES",
      "LA BOMBA",
      "SABANA PERDIDA",
      "VILLA OLYMPICA",
      "VILLA LIBERACION",
      "LA GUAYIGA",
      "LOS MAMEYES",
      "LA VICTORIA",
      "BRISAS DEL NORTE",
      "EL PLATANAL",
      "LA AURORA",
      "LOS GIRASOLES",
      "LA ISABELA",
      "VILLA PROGRESO"
    ]
  },
  {
    id: "boca_chica",
    nombre: "Boca Chica",
    provincia: "Santo Domingo",
    barrios: [
      "BOCA CHICA CENTRO",
      "ANDRES",
      "LA CALETA",
      "LAS PALMAS",
      "PLAYA SALADA",
      "SANTO DOMINGO",
      "TRES OJOS",
      "EL PUERTO",
      "LOS PESCADORES",
      "VILLA CHICAGO"
    ]
  },
  {
    id: "los_alcarrizos",
    nombre: "Los Alcarrizos",
    provincia: "Santo Domingo",
    barrios: [
      "LOS ALCARRIZOS CENTRO",
      "PALMAREJO",
      "VILLA CARMEN",
      "PUEBLO NUEVO",
      "LA JAVILLA",
      "KILOMETRO 13",
      "LOS PALMARES",
      "LA PRIMAVERA",
      "PANTOJA NORTE",
      "PANTOJA SUR",
      "EL NAZARENO",
      "VILLA LIBERACION"
    ]
  },
  {
    id: "san_luis",
    nombre: "San Luis",
    provincia: "Santo Domingo",
    barrios: [
      "SAN LUIS CENTRO",
      "LA CALETA",
      "VILLA ESMERALDA",
      "EL COROZO",
      "LOS MAESTROS",
      "LA VICTORIA",
      "VILLA MARIA",
      "BARRIO NUEVO"
    ]
  }
];

export function getBarriosPorMunicipio(municipioId: string): string[] {
  const municipio = municipiosData.find(m => m.id === municipioId);
  return municipio ? municipio.barrios : [];
}

export function getMunicipios(): { value: string; label: string }[] {
  return municipiosData.map(m => ({
    value: m.id,
    label: m.nombre
  }));
}
