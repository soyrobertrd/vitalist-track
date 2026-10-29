/**
 * Sistema de Outbox Pattern para almacenamiento y sincronización offline en el Modo Brigada / Visitas de Campo.
 * Almacena acciones asistenciales en localStorage cuando no hay señal y las despacha automáticamente al reconectar.
 */

export interface AccionOffline {
  id: string;
  tipo: "check_in" | "signos_vitales" | "firma_digital" | "check_out" | "nota_evolucion";
  visitaId: string;
  pacienteNombre: string;
  payload: Record<string, any>;
  timestamp: string;
  sincronizado: boolean;
  intentos: number;
}

const STORAGE_KEY = "vitalist_offline_outbox_queue";

export class OfflineOutbox {
  private static getQueue(): AccionOffline[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error leyendo cola offline de localStorage", e);
      return [];
    }
  }

  private static saveQueue(queue: AccionOffline[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Error guardando cola offline de localStorage", e);
    }
  }

  /**
   * Encola una acción clínica realizada en campo sin conexión
   */
  public static encolarAccion(
    tipo: AccionOffline["tipo"],
    visitaId: string,
    pacienteNombre: string,
    payload: Record<string, any>
  ): AccionOffline {
    const nuevaAccion: AccionOffline = {
      id: "offline-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      tipo,
      visitaId,
      pacienteNombre,
      payload,
      timestamp: new Date().toISOString(),
      sincronizado: false,
      intentos: 0,
    };

    const cola = this.getQueue();
    cola.push(nuevaAccion);
    this.saveQueue(cola);
    return nuevaAccion;
  }

  /**
   * Obtiene la lista de acciones pendientes de sincronización
   */
  public static obtenerPendientes(): AccionOffline[] {
    return this.getQueue().filter(a => !a.sincronizado);
  }

  /**
   * Obtiene el conteo de acciones pendientes
   */
  public static obtenerConteoPendientes(): number {
    return this.obtenerPendientes().length;
  }

  /**
   * Marca una acción como exitosamente sincronizada
   */
  public static marcarSincronizada(id: string) {
    const cola = this.getQueue();
    const filtrada = cola.filter(a => a.id !== id);
    this.saveQueue(filtrada);
  }

  /**
   * Simula o ejecuta el despacho de las acciones acumuladas hacia el servidor
   */
  public static async despacharCola(): Promise<{ exitosas: number; fallidas: number }> {
    const pendientes = this.obtenerPendientes();
    if (pendientes.length === 0) return { exitosas: 0, fallidas: 0 };

    let exitosas = 0;
    let fallidas = 0;

    for (const accion of pendientes) {
      try {
        // En producción aquí se invoca el endpoint o Supabase RPC correspondiente.
        // Simulamos latencia de red segura
        await new Promise(res => setTimeout(res, 200));
        this.marcarSincronizada(accion.id);
        exitosas++;
      } catch (err) {
        accion.intentos += 1;
        fallidas++;
      }
    }

    return { exitosas, fallidas };
  }
}
