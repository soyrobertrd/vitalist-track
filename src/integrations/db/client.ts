/**
 * Cliente de datos de la app.
 *  - VITE_DATA_BACKEND=api → API propia sobre Turso (/api/v1)
 *  - cualquier otro valor  → modo mockup: datos en el navegador
 */
import { clienteMemoria } from "./memoria";
import { clienteRemoto } from "./remoto";

export const USA_API = import.meta.env?.VITE_DATA_BACKEND === "api";
export const db = (USA_API ? clienteRemoto : clienteMemoria) as unknown as typeof clienteMemoria;
