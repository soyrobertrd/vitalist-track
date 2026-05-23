import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  es: {
    common: {
      app_name: "Health App",
      loading: "Cargando...",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      create: "Crear",
      search: "Buscar",
      back: "Volver",
      next: "Siguiente",
      previous: "Anterior",
      yes: "Sí",
      no: "No",
      close: "Cerrar",
      confirm: "Confirmar",
      error: "Error",
      success: "Éxito",
      welcome: "Bienvenido",
      language: "Idioma",
      logout: "Cerrar sesión",
      profile: "Perfil",
      settings: "Configuración",
    },
    nav: {
      dashboard: "Tablero",
      patients: "Pacientes",
      calendar: "Calendario",
      visits: "Visitas",
      calls: "Llamadas",
      staff: "Personal",
      billing: "Facturación",
      reports: "Reportes",
      telehealth: "Teleconsulta",
    },
  },
  en: {
    common: {
      app_name: "Health App",
      loading: "Loading...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      create: "Create",
      search: "Search",
      back: "Back",
      next: "Next",
      previous: "Previous",
      yes: "Yes",
      no: "No",
      close: "Close",
      confirm: "Confirm",
      error: "Error",
      success: "Success",
      welcome: "Welcome",
      language: "Language",
      logout: "Sign out",
      profile: "Profile",
      settings: "Settings",
    },
    nav: {
      dashboard: "Dashboard",
      patients: "Patients",
      calendar: "Calendar",
      visits: "Visits",
      calls: "Calls",
      staff: "Staff",
      billing: "Billing",
      reports: "Reports",
      telehealth: "Telehealth",
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    supportedLngs: ["es", "en"],
    defaultNS: "common",
    ns: ["common", "nav"],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

// Sync <html lang>
i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") document.documentElement.lang = lng;
});

export default i18n;
