export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      acceso_fichas_log: {
        Row: {
          accion: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          paciente_id: string
          recurso: string
          user_agent: string | null
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          accion?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          paciente_id: string
          recurso: string
          user_agent?: string | null
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          paciente_id?: string
          recurso?: string
          user_agent?: string | null
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      admisiones: {
        Row: {
          ala_id: string | null
          cama_id: string | null
          created_at: string
          created_by: string | null
          diagnostico_ingreso: string | null
          estado: string
          fecha_alta: string | null
          fecha_ingreso: string
          id: string
          medico_responsable_id: string | null
          motivo_ingreso: string
          notas_alta: string | null
          paciente_id: string
          sucursal_id: string | null
          tipo: string
          tipo_alta: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          ala_id?: string | null
          cama_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico_ingreso?: string | null
          estado?: string
          fecha_alta?: string | null
          fecha_ingreso?: string
          id?: string
          medico_responsable_id?: string | null
          motivo_ingreso: string
          notas_alta?: string | null
          paciente_id: string
          sucursal_id?: string | null
          tipo?: string
          tipo_alta?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          ala_id?: string | null
          cama_id?: string | null
          created_at?: string
          created_by?: string | null
          diagnostico_ingreso?: string | null
          estado?: string
          fecha_alta?: string | null
          fecha_ingreso?: string
          id?: string
          medico_responsable_id?: string | null
          motivo_ingreso?: string
          notas_alta?: string | null
          paciente_id?: string
          sucursal_id?: string | null
          tipo?: string
          tipo_alta?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admisiones_ala_id_fkey"
            columns: ["ala_id"]
            isOneToOne: false
            referencedRelation: "alas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admisiones_cama_id_fkey"
            columns: ["cama_id"]
            isOneToOne: false
            referencedRelation: "camas"
            referencedColumns: ["id"]
          },
        ]
      }
      afiliaciones_profesional: {
        Row: {
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          notas: string | null
          profesional_id: string
          tipo: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          profesional_id: string
          tipo?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          profesional_id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      alas: {
        Row: {
          activo: boolean
          codigo: string | null
          created_at: string
          id: string
          nombre: string
          piso_id: string
          tipo: string | null
        }
        Insert: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nombre: string
          piso_id: string
          tipo?: string | null
        }
        Update: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nombre?: string
          piso_id?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alas_piso_id_fkey"
            columns: ["piso_id"]
            isOneToOne: false
            referencedRelation: "pisos"
            referencedColumns: ["id"]
          },
        ]
      }
      alergias_paciente: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notas: string | null
          paciente_id: string
          reaccion: string | null
          severidad: string
          sustancia: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          reaccion?: string | null
          severidad?: string
          sustancia: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          reaccion?: string | null
          severidad?: string
          sustancia?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alergias_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_notificaciones: {
        Row: {
          alerta_id: string | null
          canal: string
          created_at: string
          cuerpo: string | null
          destinatario_user_id: string
          id: string
          leido: boolean
          notificado_email: boolean
          severidad: string | null
          titulo: string
          workspace_id: string | null
        }
        Insert: {
          alerta_id?: string | null
          canal?: string
          created_at?: string
          cuerpo?: string | null
          destinatario_user_id: string
          id?: string
          leido?: boolean
          notificado_email?: boolean
          severidad?: string | null
          titulo: string
          workspace_id?: string | null
        }
        Update: {
          alerta_id?: string | null
          canal?: string
          created_at?: string
          cuerpo?: string | null
          destinatario_user_id?: string
          id?: string
          leido?: boolean
          notificado_email?: boolean
          severidad?: string | null
          titulo?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_notificaciones_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "auditoria_alertas"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_ruteo: {
        Row: {
          activo: boolean
          canal_email: boolean
          canal_inapp: boolean
          created_at: string
          id: string
          roles: string[]
          severidad: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          canal_email?: boolean
          canal_inapp?: boolean
          created_at?: string
          id?: string
          roles?: string[]
          severidad: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          canal_email?: boolean
          canal_inapp?: boolean
          created_at?: string
          id?: string
          roles?: string[]
          severidad?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_ruteo_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      antecedentes_medicos: {
        Row: {
          activo: boolean
          ano: number | null
          condicion: string
          created_at: string
          created_by: string | null
          id: string
          notas: string | null
          paciente_id: string
          parentesco: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          ano?: number | null
          condicion: string
          created_at?: string
          created_by?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          parentesco?: string | null
          tipo?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          ano?: number | null
          condicion?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          parentesco?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "antecedentes_medicos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      aseguradoras: {
        Row: {
          activa: boolean
          codigo: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          rnc: string | null
          telefono: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activa?: boolean
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          rnc?: string | null
          telefono?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activa?: boolean
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          rnc?: string | null
          telefono?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aseguradoras_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      asientos_contables: {
        Row: {
          aprobado_por: string | null
          creado_por: string | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["estado_asiento"]
          fecha: string
          id: string
          notas: string | null
          numero: string | null
          referencia: string | null
          total_debe: number | null
          total_haber: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          aprobado_por?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_asiento"]
          fecha?: string
          id?: string
          notas?: string | null
          numero?: string | null
          referencia?: string | null
          total_debe?: number | null
          total_haber?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          aprobado_por?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_asiento"]
          fecha?: string
          id?: string
          notas?: string | null
          numero?: string | null
          referencia?: string | null
          total_debe?: number | null
          total_haber?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asientos_contables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      atencion_paciente: {
        Row: {
          archivos: Json | null
          created_at: string | null
          descripcion: string
          estado: string | null
          fecha_programada: string | null
          fecha_realizada: string | null
          id: string
          notas: string | null
          paciente_id: string | null
          periodicidad: string | null
          profesional_id: string | null
          proxima_fecha: string | null
          tipo: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          archivos?: Json | null
          created_at?: string | null
          descripcion: string
          estado?: string | null
          fecha_programada?: string | null
          fecha_realizada?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string | null
          periodicidad?: string | null
          profesional_id?: string | null
          proxima_fecha?: string | null
          tipo: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          archivos?: Json | null
          created_at?: string | null
          descripcion?: string
          estado?: string | null
          fecha_programada?: string | null
          fecha_realizada?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string | null
          periodicidad?: string | null
          profesional_id?: string | null
          proxima_fecha?: string | null
          tipo?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atencion_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atencion_paciente_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atencion_paciente_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_alertas: {
        Row: {
          categoria: string | null
          created_at: string
          descripcion: string
          id: string
          metadata: Json
          notas_resolucion: string | null
          resuelto: boolean
          resuelto_at: string | null
          resuelto_por: string | null
          severidad: string
          tipo: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          descripcion: string
          id?: string
          metadata?: Json
          notas_resolucion?: string | null
          resuelto?: boolean
          resuelto_at?: string | null
          resuelto_por?: string | null
          severidad?: string
          tipo: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          descripcion?: string
          id?: string
          metadata?: Json
          notas_resolucion?: string | null
          resuelto?: boolean
          resuelto_at?: string | null
          resuelto_por?: string | null
          severidad?: string
          tipo?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      auditoria_cambios: {
        Row: {
          accion: string
          created_at: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          id: string
          registro_id: string | null
          tabla: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          registro_id?: string | null
          tabla: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          id?: string
          registro_id?: string | null
          tabla?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      auditoria_config: {
        Row: {
          created_at: string
          detectar_cambios_criticos: boolean
          hora_nocturna_fin: number
          hora_nocturna_inicio: number
          id: string
          umbral_acceso_masivo: number
          umbral_cambios_criticos: number
          umbral_descargas: number
          umbral_fuera_horario: number
          updated_at: string
          ventana_horas_acceso_masivo: number
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          detectar_cambios_criticos?: boolean
          hora_nocturna_fin?: number
          hora_nocturna_inicio?: number
          id?: string
          umbral_acceso_masivo?: number
          umbral_cambios_criticos?: number
          umbral_descargas?: number
          umbral_fuera_horario?: number
          updated_at?: string
          ventana_horas_acceso_masivo?: number
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          detectar_cambios_criticos?: boolean
          hora_nocturna_fin?: number
          hora_nocturna_inicio?: number
          id?: string
          umbral_acceso_masivo?: number
          umbral_cambios_criticos?: number
          umbral_descargas?: number
          umbral_fuera_horario?: number
          updated_at?: string
          ventana_horas_acceso_masivo?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_config_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_exportes: {
        Row: {
          created_at: string
          exportado_por: string
          filtros: Json
          hash_sha256: string
          id: string
          rango_fin: string | null
          rango_inicio: string | null
          tipo: string
          total_registros: number
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          exportado_por: string
          filtros?: Json
          hash_sha256: string
          id?: string
          rango_fin?: string | null
          rango_inicio?: string | null
          tipo: string
          total_registros?: number
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          exportado_por?: string
          filtros?: Json
          hash_sha256?: string
          id?: string
          rango_fin?: string | null
          rango_inicio?: string | null
          tipo?: string
          total_registros?: number
          workspace_id?: string | null
        }
        Relationships: []
      }
      auditoria_resumenes: {
        Row: {
          acciones_sospechosas: Json
          alertas_por_severidad: Json
          created_at: string
          fecha_fin: string
          fecha_inicio: string
          generado_por: string | null
          id: string
          periodo: string
          total_alertas: number
          total_eventos: number
          workspace_id: string | null
        }
        Insert: {
          acciones_sospechosas?: Json
          alertas_por_severidad?: Json
          created_at?: string
          fecha_fin: string
          fecha_inicio: string
          generado_por?: string | null
          id?: string
          periodo: string
          total_alertas?: number
          total_eventos?: number
          workspace_id?: string | null
        }
        Update: {
          acciones_sospechosas?: Json
          alertas_por_severidad?: Json
          created_at?: string
          fecha_fin?: string
          fecha_inicio?: string
          generado_por?: string | null
          id?: string
          periodo?: string
          total_alertas?: number
          total_eventos?: number
          workspace_id?: string | null
        }
        Relationships: []
      }
      auditoria_unificaciones: {
        Row: {
          created_at: string
          datos_unificados: Json
          id: string
          paciente_principal_id: string
          pacientes_eliminados_ids: string[]
          realizado_por: string | null
        }
        Insert: {
          created_at?: string
          datos_unificados?: Json
          id?: string
          paciente_principal_id: string
          pacientes_eliminados_ids: string[]
          realizado_por?: string | null
        }
        Update: {
          created_at?: string
          datos_unificados?: Json
          id?: string
          paciente_principal_id?: string
          pacientes_eliminados_ids?: string[]
          realizado_por?: string | null
        }
        Relationships: []
      }
      ausencias_profesionales: {
        Row: {
          aprobado: boolean | null
          aprobado_por: string | null
          created_at: string | null
          descripcion: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          profesional_id: string
          tipo: string
          updated_at: string | null
        }
        Insert: {
          aprobado?: boolean | null
          aprobado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          profesional_id: string
          tipo: string
          updated_at?: string | null
        }
        Update: {
          aprobado?: boolean | null
          aprobado_por?: string | null
          created_at?: string | null
          descripcion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          profesional_id?: string
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ausencias_profesionales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      automatizaciones: {
        Row: {
          accion: string
          activo: boolean | null
          condiciones: Json | null
          created_at: string | null
          descripcion: string | null
          destinatarios: string[] | null
          encuesta_id: string | null
          id: string
          nombre: string
          parametros: Json | null
          plantilla_correo_id: string | null
          recordatorios_config: Json | null
          tiempo_ejecucion: string | null
          trigger_evento: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          accion: string
          activo?: boolean | null
          condiciones?: Json | null
          created_at?: string | null
          descripcion?: string | null
          destinatarios?: string[] | null
          encuesta_id?: string | null
          id?: string
          nombre: string
          parametros?: Json | null
          plantilla_correo_id?: string | null
          recordatorios_config?: Json | null
          tiempo_ejecucion?: string | null
          trigger_evento: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          accion?: string
          activo?: boolean | null
          condiciones?: Json | null
          created_at?: string | null
          descripcion?: string | null
          destinatarios?: string[] | null
          encuesta_id?: string | null
          id?: string
          nombre?: string
          parametros?: Json | null
          plantilla_correo_id?: string | null
          recordatorios_config?: Json | null
          tiempo_ejecucion?: string | null
          trigger_evento?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automatizaciones_plantilla_correo_id_fkey"
            columns: ["plantilla_correo_id"]
            isOneToOne: false
            referencedRelation: "plantillas_correo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automatizaciones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      autorizaciones_medicas: {
        Row: {
          aseguradora_id: string
          codigo_procedimiento: string | null
          created_at: string
          diagnostico_cie10: string | null
          estado: Database["public"]["Enums"]["estado_autorizacion"]
          factura_id: string | null
          fecha_respuesta: string | null
          fecha_solicitud: string
          fecha_vencimiento: string | null
          id: string
          medico_solicitante: string | null
          monto_autorizado: number | null
          monto_solicitado: number | null
          motivo_rechazo: string | null
          notas: string | null
          numero_autorizacion: string | null
          paciente_id: string
          plan_seguro_id: string | null
          procedimiento: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          aseguradora_id: string
          codigo_procedimiento?: string | null
          created_at?: string
          diagnostico_cie10?: string | null
          estado?: Database["public"]["Enums"]["estado_autorizacion"]
          factura_id?: string | null
          fecha_respuesta?: string | null
          fecha_solicitud?: string
          fecha_vencimiento?: string | null
          id?: string
          medico_solicitante?: string | null
          monto_autorizado?: number | null
          monto_solicitado?: number | null
          motivo_rechazo?: string | null
          notas?: string | null
          numero_autorizacion?: string | null
          paciente_id: string
          plan_seguro_id?: string | null
          procedimiento: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          aseguradora_id?: string
          codigo_procedimiento?: string | null
          created_at?: string
          diagnostico_cie10?: string | null
          estado?: Database["public"]["Enums"]["estado_autorizacion"]
          factura_id?: string | null
          fecha_respuesta?: string | null
          fecha_solicitud?: string
          fecha_vencimiento?: string | null
          id?: string
          medico_solicitante?: string | null
          monto_autorizado?: number | null
          monto_solicitado?: number | null
          motivo_rechazo?: string | null
          notas?: string | null
          numero_autorizacion?: string | null
          paciente_id?: string
          plan_seguro_id?: string | null
          procedimiento?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autorizaciones_medicas_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizaciones_medicas_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizaciones_medicas_medico_solicitante_fkey"
            columns: ["medico_solicitante"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizaciones_medicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizaciones_medicas_plan_seguro_id_fkey"
            columns: ["plan_seguro_id"]
            isOneToOne: false
            referencedRelation: "planes_seguro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizaciones_medicas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      camas: {
        Row: {
          ala_id: string | null
          consultorio_id: string | null
          created_at: string
          estado: string
          id: string
          identificador: string
          notas: string | null
          sucursal_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          ala_id?: string | null
          consultorio_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          identificador: string
          notas?: string | null
          sucursal_id: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          ala_id?: string | null
          consultorio_id?: string | null
          created_at?: string
          estado?: string
          id?: string
          identificador?: string
          notas?: string | null
          sucursal_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "camas_ala_id_fkey"
            columns: ["ala_id"]
            isOneToOne: false
            referencedRelation: "alas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camas_consultorio_id_fkey"
            columns: ["consultorio_id"]
            isOneToOne: false
            referencedRelation: "consultorios"
            referencedColumns: ["id"]
          },
        ]
      }
      campanas_marketing: {
        Row: {
          conversiones: number | null
          created_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_campana"]
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          leads_generados: number | null
          nombre: string
          presupuesto: number | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          conversiones?: number | null
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_campana"]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          leads_generados?: number | null
          nombre: string
          presupuesto?: number | null
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          conversiones?: number | null
          created_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_campana"]
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          leads_generados?: number | null
          nombre?: string
          presupuesto?: number | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanas_marketing_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cie10_codigos: {
        Row: {
          activo: boolean
          capitulo: string | null
          categoria: string | null
          codigo: string
          created_at: string
          descripcion: string
          id: string
        }
        Insert: {
          activo?: boolean
          capitulo?: string | null
          categoria?: string | null
          codigo: string
          created_at?: string
          descripcion: string
          id?: string
        }
        Update: {
          activo?: boolean
          capitulo?: string | null
          categoria?: string | null
          codigo?: string
          created_at?: string
          descripcion?: string
          id?: string
        }
        Relationships: []
      }
      cierres_caja: {
        Row: {
          cantidad_facturas: number
          cantidad_pagos: number
          cerrado_en: string | null
          cerrado_por: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_cierre"]
          fecha: string
          id: string
          notas: string | null
          sucursal_id: string | null
          total_cobrado: number
          total_devoluciones: number
          total_efectivo: number
          total_neto: number
          total_otros: number
          total_tarjeta: number
          total_transferencia: number
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          cantidad_facturas?: number
          cantidad_pagos?: number
          cerrado_en?: string | null
          cerrado_por?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cierre"]
          fecha: string
          id?: string
          notas?: string | null
          sucursal_id?: string | null
          total_cobrado?: number
          total_devoluciones?: number
          total_efectivo?: number
          total_neto?: number
          total_otros?: number
          total_tarjeta?: number
          total_transferencia?: number
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          cantidad_facturas?: number
          cantidad_pagos?: number
          cerrado_en?: string | null
          cerrado_por?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_cierre"]
          fecha?: string
          id?: string
          notas?: string | null
          sucursal_id?: string | null
          total_cobrado?: number
          total_devoluciones?: number
          total_efectivo?: number
          total_neto?: number
          total_otros?: number
          total_tarjeta?: number
          total_transferencia?: number
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cierres_caja_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierres_caja_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cirugias: {
        Row: {
          anestesiologo: string | null
          checklist_intraop: Json | null
          checklist_preop: Json | null
          complicaciones: string | null
          consentimiento_firmado: boolean | null
          costo_estimado: number | null
          costo_real: number | null
          created_at: string
          diagnostico_preop: string | null
          duracion_estimada_min: number | null
          estado: Database["public"]["Enums"]["estado_cirugia"]
          fecha_programada: string
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          instrumentista: string | null
          insumos_utilizados: Json | null
          notas_operatorias: string | null
          paciente_id: string
          prioridad: Database["public"]["Enums"]["prioridad_cirugia"]
          profesional_id: string | null
          sala_id: string | null
          sangrado_ml: number | null
          sucursal_id: string | null
          tipo_anestesia: string | null
          tipo_cirugia: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          anestesiologo?: string | null
          checklist_intraop?: Json | null
          checklist_preop?: Json | null
          complicaciones?: string | null
          consentimiento_firmado?: boolean | null
          costo_estimado?: number | null
          costo_real?: number | null
          created_at?: string
          diagnostico_preop?: string | null
          duracion_estimada_min?: number | null
          estado?: Database["public"]["Enums"]["estado_cirugia"]
          fecha_programada: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          instrumentista?: string | null
          insumos_utilizados?: Json | null
          notas_operatorias?: string | null
          paciente_id: string
          prioridad?: Database["public"]["Enums"]["prioridad_cirugia"]
          profesional_id?: string | null
          sala_id?: string | null
          sangrado_ml?: number | null
          sucursal_id?: string | null
          tipo_anestesia?: string | null
          tipo_cirugia: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          anestesiologo?: string | null
          checklist_intraop?: Json | null
          checklist_preop?: Json | null
          complicaciones?: string | null
          consentimiento_firmado?: boolean | null
          costo_estimado?: number | null
          costo_real?: number | null
          created_at?: string
          diagnostico_preop?: string | null
          duracion_estimada_min?: number | null
          estado?: Database["public"]["Enums"]["estado_cirugia"]
          fecha_programada?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          instrumentista?: string | null
          insumos_utilizados?: Json | null
          notas_operatorias?: string | null
          paciente_id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_cirugia"]
          profesional_id?: string | null
          sala_id?: string | null
          sangrado_ml?: number | null
          sucursal_id?: string | null
          tipo_anestesia?: string | null
          tipo_cirugia?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cirugias_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cirugias_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cirugias_sala_id_fkey"
            columns: ["sala_id"]
            isOneToOne: false
            referencedRelation: "salas_operacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cirugias_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cirugias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cita_tickets: {
        Row: {
          checkin_por: string | null
          codigo_corto: string
          created_at: string
          enviado_email: boolean | null
          enviado_whatsapp: boolean | null
          estado_checkin: string
          fecha_atencion: string | null
          fecha_llegada: string | null
          id: string
          impreso: boolean | null
          llamada_id: string | null
          notas_checkin: string | null
          paciente_id: string | null
          tipo_cita: string
          token: string
          updated_at: string
          visita_id: string | null
          workspace_id: string | null
        }
        Insert: {
          checkin_por?: string | null
          codigo_corto: string
          created_at?: string
          enviado_email?: boolean | null
          enviado_whatsapp?: boolean | null
          estado_checkin?: string
          fecha_atencion?: string | null
          fecha_llegada?: string | null
          id?: string
          impreso?: boolean | null
          llamada_id?: string | null
          notas_checkin?: string | null
          paciente_id?: string | null
          tipo_cita: string
          token?: string
          updated_at?: string
          visita_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          checkin_por?: string | null
          codigo_corto?: string
          created_at?: string
          enviado_email?: boolean | null
          enviado_whatsapp?: boolean | null
          estado_checkin?: string
          fecha_atencion?: string | null
          fecha_llegada?: string | null
          id?: string
          impreso?: boolean | null
          llamada_id?: string | null
          notas_checkin?: string | null
          paciente_id?: string | null
          tipo_cita?: string
          token?: string
          updated_at?: string
          visita_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cita_tickets_llamada_id_fkey"
            columns: ["llamada_id"]
            isOneToOne: false
            referencedRelation: "registro_llamadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_tickets_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_tickets_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cita_tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_sistema: {
        Row: {
          clave: string
          created_at: string | null
          descripcion: string | null
          id: string
          updated_at: string | null
          valor: Json
        }
        Insert: {
          clave: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          updated_at?: string | null
          valor: Json
        }
        Update: {
          clave?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          updated_at?: string | null
          valor?: Json
        }
        Relationships: []
      }
      consentimientos_paciente: {
        Row: {
          contenido_firmado: string
          created_at: string
          created_by: string | null
          fecha_aceptacion: string
          fecha_revocacion: string | null
          firmado_por: string
          id: string
          ip_address: string | null
          motivo_revocacion: string | null
          paciente_id: string
          parentesco_firmante: string | null
          revocado: boolean
          tipo: string
          updated_at: string
          user_agent: string | null
          version_documento: string
        }
        Insert: {
          contenido_firmado: string
          created_at?: string
          created_by?: string | null
          fecha_aceptacion?: string
          fecha_revocacion?: string | null
          firmado_por: string
          id?: string
          ip_address?: string | null
          motivo_revocacion?: string | null
          paciente_id: string
          parentesco_firmante?: string | null
          revocado?: boolean
          tipo?: string
          updated_at?: string
          user_agent?: string | null
          version_documento?: string
        }
        Update: {
          contenido_firmado?: string
          created_at?: string
          created_by?: string | null
          fecha_aceptacion?: string
          fecha_revocacion?: string | null
          firmado_por?: string
          id?: string
          ip_address?: string | null
          motivo_revocacion?: string | null
          paciente_id?: string
          parentesco_firmante?: string | null
          revocado?: boolean
          tipo?: string
          updated_at?: string
          user_agent?: string | null
          version_documento?: string
        }
        Relationships: [
          {
            foreignKeyName: "consentimientos_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas_especialidad: {
        Row: {
          created_at: string
          datos_json: Json
          especialidad: Database["public"]["Enums"]["especialidad_medica"]
          id: string
          paciente_id: string
          plantilla_id: string | null
          profesional_id: string
          updated_at: string
          visita_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          datos_json?: Json
          especialidad: Database["public"]["Enums"]["especialidad_medica"]
          id?: string
          paciente_id: string
          plantilla_id?: string | null
          profesional_id: string
          updated_at?: string
          visita_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          datos_json?: Json
          especialidad?: Database["public"]["Enums"]["especialidad_medica"]
          id?: string
          paciente_id?: string
          plantilla_id?: string | null
          profesional_id?: string
          updated_at?: string
          visita_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultas_especialidad_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_especialidad_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_especialidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_especialidad_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_especialidad_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_especialidad_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      consultorio_asignaciones: {
        Row: {
          activo: boolean
          consultorio_id: string
          created_at: string
          dia_semana: number | null
          fecha_especifica: string | null
          hora_fin: string
          hora_inicio: string
          id: string
          notas: string | null
          profesional_id: string
          updated_at: string
          vigente_desde: string | null
          vigente_hasta: string | null
        }
        Insert: {
          activo?: boolean
          consultorio_id: string
          created_at?: string
          dia_semana?: number | null
          fecha_especifica?: string | null
          hora_fin: string
          hora_inicio: string
          id?: string
          notas?: string | null
          profesional_id: string
          updated_at?: string
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Update: {
          activo?: boolean
          consultorio_id?: string
          created_at?: string
          dia_semana?: number | null
          fecha_especifica?: string | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          notas?: string | null
          profesional_id?: string
          updated_at?: string
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultorio_asignaciones_consultorio_id_fkey"
            columns: ["consultorio_id"]
            isOneToOne: false
            referencedRelation: "consultorios"
            referencedColumns: ["id"]
          },
        ]
      }
      consultorios: {
        Row: {
          activo: boolean
          ala_id: string | null
          capacidad: number | null
          codigo: string | null
          created_at: string
          edificio_id: string | null
          equipamiento: Json
          id: string
          nombre: string
          piso_id: string | null
          sucursal_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          ala_id?: string | null
          capacidad?: number | null
          codigo?: string | null
          created_at?: string
          edificio_id?: string | null
          equipamiento?: Json
          id?: string
          nombre: string
          piso_id?: string | null
          sucursal_id: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          ala_id?: string | null
          capacidad?: number | null
          codigo?: string | null
          created_at?: string
          edificio_id?: string | null
          equipamiento?: Json
          id?: string
          nombre?: string
          piso_id?: string | null
          sucursal_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultorios_ala_id_fkey"
            columns: ["ala_id"]
            isOneToOne: false
            referencedRelation: "alas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultorios_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edificios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultorios_piso_id_fkey"
            columns: ["piso_id"]
            isOneToOne: false
            referencedRelation: "pisos"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_landing: {
        Row: {
          created_at: string
          email: string
          empresa: string | null
          estado: string
          id: string
          ip_address: string | null
          mensaje: string
          nombre: string
          notas_internas: string | null
          pais: string | null
          plan_interes: string | null
          tamano_clinica: string | null
          telefono: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          empresa?: string | null
          estado?: string
          id?: string
          ip_address?: string | null
          mensaje: string
          nombre: string
          notas_internas?: string | null
          pais?: string | null
          plan_interes?: string | null
          tamano_clinica?: string | null
          telefono?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          empresa?: string | null
          estado?: string
          id?: string
          ip_address?: string | null
          mensaje?: string
          nombre?: string
          notas_internas?: string | null
          pais?: string | null
          plan_interes?: string | null
          tamano_clinica?: string | null
          telefono?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      control_visitas: {
        Row: {
          confirmado_por_recordatorio: boolean | null
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_visita"] | null
          fecha_confirmacion: string | null
          fecha_hora_visita: string
          id: string
          modalidad: string
          motivo_visita: string | null
          notas_visita: string | null
          paciente_id: string | null
          profesional_id: string | null
          sucursal_id: string | null
          tipo_visita: Database["public"]["Enums"]["tipo_visita"]
          updated_at: string | null
          video_enlace: string | null
          video_estado: string | null
          video_finalizado_at: string | null
          video_iniciado_at: string | null
          video_notas: string | null
          video_proveedor: string | null
          video_token: string | null
          workspace_id: string | null
        }
        Insert: {
          confirmado_por_recordatorio?: boolean | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_visita"] | null
          fecha_confirmacion?: string | null
          fecha_hora_visita: string
          id?: string
          modalidad?: string
          motivo_visita?: string | null
          notas_visita?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          sucursal_id?: string | null
          tipo_visita: Database["public"]["Enums"]["tipo_visita"]
          updated_at?: string | null
          video_enlace?: string | null
          video_estado?: string | null
          video_finalizado_at?: string | null
          video_iniciado_at?: string | null
          video_notas?: string | null
          video_proveedor?: string | null
          video_token?: string | null
          workspace_id?: string | null
        }
        Update: {
          confirmado_por_recordatorio?: boolean | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_visita"] | null
          fecha_confirmacion?: string | null
          fecha_hora_visita?: string
          id?: string
          modalidad?: string
          motivo_visita?: string | null
          notas_visita?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          sucursal_id?: string | null
          tipo_visita?: Database["public"]["Enums"]["tipo_visita"]
          updated_at?: string | null
          video_enlace?: string | null
          video_estado?: string | null
          video_finalizado_at?: string | null
          video_iniciado_at?: string | null
          video_notas?: string | null
          video_proveedor?: string | null
          video_token?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_visitas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_visitas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_visitas_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_visitas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_control_visitas_paciente"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_control_visitas_profesional"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_ejecuciones: {
        Row: {
          duracion_ms: number | null
          ejecutado_en: string
          error: string | null
          exitoso: boolean
          id: string
          job_name: string
          resultado: Json | null
        }
        Insert: {
          duracion_ms?: number | null
          ejecutado_en?: string
          error?: string | null
          exitoso?: boolean
          id?: string
          job_name: string
          resultado?: Json | null
        }
        Update: {
          duracion_ms?: number | null
          ejecutado_en?: string
          error?: string | null
          exitoso?: boolean
          id?: string
          job_name?: string
          resultado?: Json | null
        }
        Relationships: []
      }
      cuentas_contables: {
        Row: {
          acepta_movimientos: boolean | null
          activa: boolean | null
          codigo: string
          created_at: string
          cuenta_padre_id: string | null
          id: string
          naturaleza: Database["public"]["Enums"]["naturaleza_cuenta"]
          nivel: number | null
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_cuenta_contable"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acepta_movimientos?: boolean | null
          activa?: boolean | null
          codigo: string
          created_at?: string
          cuenta_padre_id?: string | null
          id?: string
          naturaleza?: Database["public"]["Enums"]["naturaleza_cuenta"]
          nivel?: number | null
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_cuenta_contable"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acepta_movimientos?: boolean | null
          activa?: boolean | null
          codigo?: string
          created_at?: string
          cuenta_padre_id?: string | null
          id?: string
          naturaleza?: Database["public"]["Enums"]["naturaleza_cuenta"]
          nivel?: number | null
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_cuenta_contable"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_contables_cuenta_padre_id_fkey"
            columns: ["cuenta_padre_id"]
            isOneToOne: false
            referencedRelation: "cuentas_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuentas_contables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      departamentos_rrhh: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          responsable_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          responsable_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          responsable_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departamentos_rrhh_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "empleados_nomina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departamentos_rrhh_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      despachos_farmacia: {
        Row: {
          created_at: string
          farmaceutico: string | null
          fecha_despacho: string
          id: string
          numero: string | null
          observaciones: string | null
          receta_id: string
        }
        Insert: {
          created_at?: string
          farmaceutico?: string | null
          fecha_despacho?: string
          id?: string
          numero?: string | null
          observaciones?: string | null
          receta_id: string
        }
        Update: {
          created_at?: string
          farmaceutico?: string | null
          fecha_despacho?: string
          id?: string
          numero?: string | null
          observaciones?: string | null
          receta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "despachos_farmacia_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas_farmacia"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_nomina: {
        Row: {
          bono: number
          comisiones: number
          created_at: string
          deducciones_afp: number
          deducciones_isr: number
          deducciones_sfs: number
          empleado_id: string
          horas_extra: number
          id: string
          neto_pagar: number
          notas: string | null
          otras_deducciones: number
          periodo_id: string
          salario_base: number
          total_bruto: number
          total_deducciones: number
          updated_at: string
        }
        Insert: {
          bono?: number
          comisiones?: number
          created_at?: string
          deducciones_afp?: number
          deducciones_isr?: number
          deducciones_sfs?: number
          empleado_id: string
          horas_extra?: number
          id?: string
          neto_pagar?: number
          notas?: string | null
          otras_deducciones?: number
          periodo_id: string
          salario_base?: number
          total_bruto?: number
          total_deducciones?: number
          updated_at?: string
        }
        Update: {
          bono?: number
          comisiones?: number
          created_at?: string
          deducciones_afp?: number
          deducciones_isr?: number
          deducciones_sfs?: number
          empleado_id?: string
          horas_extra?: number
          id?: string
          neto_pagar?: number
          notas?: string | null
          otras_deducciones?: number
          periodo_id?: string
          salario_base?: number
          total_bruto?: number
          total_deducciones?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "detalle_nomina_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados_nomina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_nomina_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "periodos_nomina"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos_auditoria: {
        Row: {
          accion: string
          cambios: Json | null
          cie10_codigo: string | null
          created_at: string
          datos_anteriores: Json | null
          datos_nuevos: Json | null
          diagnostico_id: string | null
          id: string
          motivo: string | null
          paciente_id: string
          usuario_id: string | null
        }
        Insert: {
          accion: string
          cambios?: Json | null
          cie10_codigo?: string | null
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          diagnostico_id?: string | null
          id?: string
          motivo?: string | null
          paciente_id: string
          usuario_id?: string | null
        }
        Update: {
          accion?: string
          cambios?: Json | null
          cie10_codigo?: string | null
          created_at?: string
          datos_anteriores?: Json | null
          datos_nuevos?: Json | null
          diagnostico_id?: string | null
          id?: string
          motivo?: string | null
          paciente_id?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      diagnosticos_clinicos: {
        Row: {
          certeza: string
          cie10_codigo: string
          cie10_descripcion: string | null
          created_at: string
          escala_id: string | null
          id: string
          notas: string | null
          paciente_id: string
          registrado_por: string | null
          tipo: string
          updated_at: string
          visita_id: string | null
        }
        Insert: {
          certeza?: string
          cie10_codigo: string
          cie10_descripcion?: string | null
          created_at?: string
          escala_id?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          registrado_por?: string | null
          tipo?: string
          updated_at?: string
          visita_id?: string | null
        }
        Update: {
          certeza?: string
          cie10_codigo?: string
          cie10_descripcion?: string | null
          created_at?: string
          escala_id?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          registrado_por?: string | null
          tipo?: string
          updated_at?: string
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_clinicos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos_paciente: {
        Row: {
          codigo_cie10: string | null
          created_at: string
          created_by: string | null
          descripcion: string
          diagnosticado_por: string | null
          estado: string
          evolucion_id: string | null
          fecha_diagnostico: string
          fecha_resolucion: string | null
          id: string
          notas: string | null
          paciente_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          codigo_cie10?: string | null
          created_at?: string
          created_by?: string | null
          descripcion: string
          diagnosticado_por?: string | null
          estado?: string
          evolucion_id?: string | null
          fecha_diagnostico?: string
          fecha_resolucion?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          codigo_cie10?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string
          diagnosticado_por?: string | null
          estado?: string
          evolucion_id?: string | null
          fecha_diagnostico?: string
          fecha_resolucion?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_paciente_diagnosticado_por_fkey"
            columns: ["diagnosticado_por"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_paciente_evolucion_id_fkey"
            columns: ["evolucion_id"]
            isOneToOne: false
            referencedRelation: "evoluciones_soap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diagnosticos_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      dias_no_laborables: {
        Row: {
          descripcion: string
          es_ciclico: boolean | null
          fecha: string
        }
        Insert: {
          descripcion: string
          es_ciclico?: boolean | null
          fecha: string
        }
        Update: {
          descripcion?: string
          es_ciclico?: boolean | null
          fecha?: string
        }
        Relationships: []
      }
      dietas_hospitalarias: {
        Row: {
          admision_id: string | null
          calorias_objetivo: number | null
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          notas: string | null
          paciente_id: string
          preferencias: string | null
          restricciones_alergenos: string | null
          tipo_dieta: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          admision_id?: string | null
          calorias_objetivo?: number | null
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          paciente_id: string
          preferencias?: string | null
          restricciones_alergenos?: string | null
          tipo_dieta?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          admision_id?: string | null
          calorias_objetivo?: number | null
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          paciente_id?: string
          preferencias?: string | null
          restricciones_alergenos?: string | null
          tipo_dieta?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dietas_hospitalarias_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietas_hospitalarias_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietas_hospitalarias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_clinicos: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string | null
          evolucion_id: string | null
          fecha_documento: string | null
          id: string
          mime_type: string | null
          paciente_id: string
          storage_path: string
          subido_por: string | null
          tamano_bytes: number | null
          titulo: string
          updated_at: string
          visita_id: string | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          evolucion_id?: string | null
          fecha_documento?: string | null
          id?: string
          mime_type?: string | null
          paciente_id: string
          storage_path: string
          subido_por?: string | null
          tamano_bytes?: number | null
          titulo: string
          updated_at?: string
          visita_id?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          evolucion_id?: string | null
          fecha_documento?: string | null
          id?: string
          mime_type?: string | null
          paciente_id?: string
          storage_path?: string
          subido_por?: string | null
          tamano_bytes?: number | null
          titulo?: string
          updated_at?: string
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_clinicos_evolucion_id_fkey"
            columns: ["evolucion_id"]
            isOneToOne: false
            referencedRelation: "evoluciones_soap"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_clinicos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_clinicos_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      donantes_sangre: {
        Row: {
          apellido: string | null
          cedula: string | null
          created_at: string
          elegible: boolean | null
          factor_rh: string
          id: string
          nombre: string
          notas: string | null
          paciente_id: string | null
          tipo_sangre: string
          ultima_donacion: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          apellido?: string | null
          cedula?: string | null
          created_at?: string
          elegible?: boolean | null
          factor_rh?: string
          id?: string
          nombre: string
          notas?: string | null
          paciente_id?: string | null
          tipo_sangre: string
          ultima_donacion?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          apellido?: string | null
          cedula?: string | null
          created_at?: string
          elegible?: boolean | null
          factor_rh?: string
          id?: string
          nombre?: string
          notas?: string | null
          paciente_id?: string | null
          tipo_sangre?: string
          ultima_donacion?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donantes_sangre_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donantes_sangre_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      edificios: {
        Row: {
          activo: boolean
          codigo: string | null
          created_at: string
          direccion: string | null
          id: string
          nombre: string
          sucursal_id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          nombre: string
          sucursal_id: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          direccion?: string | null
          id?: string
          nombre?: string
          sucursal_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      empleados_nomina: {
        Row: {
          activo: boolean
          apellido: string
          banco: string | null
          cargo: string | null
          cedula: string | null
          created_at: string
          cuenta_banco: string | null
          departamento: string | null
          fecha_ingreso: string | null
          fecha_salida: string | null
          id: string
          nombre: string
          salario_base: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          apellido?: string
          banco?: string | null
          cargo?: string | null
          cedula?: string | null
          created_at?: string
          cuenta_banco?: string | null
          departamento?: string | null
          fecha_ingreso?: string | null
          fecha_salida?: string | null
          id?: string
          nombre: string
          salario_base?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          apellido?: string
          banco?: string | null
          cargo?: string | null
          cedula?: string | null
          created_at?: string
          cuenta_banco?: string | null
          departamento?: string | null
          fecha_ingreso?: string | null
          fecha_salida?: string | null
          id?: string
          nombre?: string
          salario_base?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empleados_nomina_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      encuestas: {
        Row: {
          activo: boolean | null
          anonima: boolean | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          estructura: Json
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          nombre: string
          profesional_id: string | null
          servicio_asociado: string | null
          tipo: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean | null
          anonima?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          estructura?: Json
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre: string
          profesional_id?: string | null
          servicio_asociado?: string | null
          tipo: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean | null
          anonima?: boolean | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          estructura?: Json
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre?: string
          profesional_id?: string | null
          servicio_asociado?: string | null
          tipo?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encuestas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encuestas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      equipo_quirurgico: {
        Row: {
          cirugia_id: string
          created_at: string
          id: string
          notas: string | null
          profesional_id: string
          rol: Database["public"]["Enums"]["rol_quirurgico"]
        }
        Insert: {
          cirugia_id: string
          created_at?: string
          id?: string
          notas?: string | null
          profesional_id: string
          rol: Database["public"]["Enums"]["rol_quirurgico"]
        }
        Update: {
          cirugia_id?: string
          created_at?: string
          id?: string
          notas?: string | null
          profesional_id?: string
          rol?: Database["public"]["Enums"]["rol_quirurgico"]
        }
        Relationships: [
          {
            foreignKeyName: "equipo_quirurgico_cirugia_id_fkey"
            columns: ["cirugia_id"]
            isOneToOne: false
            referencedRelation: "cirugias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipo_quirurgico_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      escalas_clinicas: {
        Row: {
          admision_id: string | null
          created_at: string
          created_by: string | null
          detalles: Json
          fecha_evaluacion: string
          id: string
          interpretacion: string | null
          notas: string | null
          paciente_id: string
          profesional_id: string | null
          puntaje: number
          tipo: string
          visita_id: string | null
        }
        Insert: {
          admision_id?: string | null
          created_at?: string
          created_by?: string | null
          detalles?: Json
          fecha_evaluacion?: string
          id?: string
          interpretacion?: string | null
          notas?: string | null
          paciente_id: string
          profesional_id?: string | null
          puntaje: number
          tipo: string
          visita_id?: string | null
        }
        Update: {
          admision_id?: string | null
          created_at?: string
          created_by?: string | null
          detalles?: Json
          fecha_evaluacion?: string
          id?: string
          interpretacion?: string | null
          notas?: string | null
          paciente_id?: string
          profesional_id?: string | null
          puntaje?: number
          tipo?: string
          visita_id?: string | null
        }
        Relationships: []
      }
      escalas_enfermeria: {
        Row: {
          created_at: string
          detalles: Json
          fecha: string
          id: string
          observaciones: string | null
          paciente_id: string
          puntaje: number | null
          registrado_por: string | null
          riesgo: string | null
          tipo: string
          updated_at: string
          visita_id: string | null
        }
        Insert: {
          created_at?: string
          detalles?: Json
          fecha?: string
          id?: string
          observaciones?: string | null
          paciente_id: string
          puntaje?: number | null
          registrado_por?: string | null
          riesgo?: string | null
          tipo: string
          updated_at?: string
          visita_id?: string | null
        }
        Update: {
          created_at?: string
          detalles?: Json
          fecha?: string
          id?: string
          observaciones?: string | null
          paciente_id?: string
          puntaje?: number | null
          registrado_por?: string | null
          riesgo?: string | null
          tipo?: string
          updated_at?: string
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalas_enfermeria_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      especialidades_medicas: {
        Row: {
          activo: boolean
          categoria: string | null
          codigo: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          codigo: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      estudios_imagen: {
        Row: {
          conclusion: string | null
          contraste: boolean | null
          created_at: string
          diagnostico_presuntivo: string | null
          estado: Database["public"]["Enums"]["estado_estudio_imagen"]
          fecha_informe: string | null
          fecha_programada: string | null
          fecha_realizacion: string | null
          hallazgos: string | null
          id: string
          imagenes_urls: Json | null
          impresion_diagnostica: string | null
          indicacion_clinica: string | null
          medico_solicitante_id: string | null
          modalidad: string
          notas: string | null
          numero_orden: string | null
          paciente_id: string
          prioridad: Database["public"]["Enums"]["prioridad_estudio_imagen"]
          radiologo_id: string | null
          region_anatomica: string | null
          sala: string | null
          tecnico_responsable: string | null
          tipo_estudio: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          conclusion?: string | null
          contraste?: boolean | null
          created_at?: string
          diagnostico_presuntivo?: string | null
          estado?: Database["public"]["Enums"]["estado_estudio_imagen"]
          fecha_informe?: string | null
          fecha_programada?: string | null
          fecha_realizacion?: string | null
          hallazgos?: string | null
          id?: string
          imagenes_urls?: Json | null
          impresion_diagnostica?: string | null
          indicacion_clinica?: string | null
          medico_solicitante_id?: string | null
          modalidad?: string
          notas?: string | null
          numero_orden?: string | null
          paciente_id: string
          prioridad?: Database["public"]["Enums"]["prioridad_estudio_imagen"]
          radiologo_id?: string | null
          region_anatomica?: string | null
          sala?: string | null
          tecnico_responsable?: string | null
          tipo_estudio: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          conclusion?: string | null
          contraste?: boolean | null
          created_at?: string
          diagnostico_presuntivo?: string | null
          estado?: Database["public"]["Enums"]["estado_estudio_imagen"]
          fecha_informe?: string | null
          fecha_programada?: string | null
          fecha_realizacion?: string | null
          hallazgos?: string | null
          id?: string
          imagenes_urls?: Json | null
          impresion_diagnostica?: string | null
          indicacion_clinica?: string | null
          medico_solicitante_id?: string | null
          modalidad?: string
          notas?: string | null
          numero_orden?: string | null
          paciente_id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_estudio_imagen"]
          radiologo_id?: string | null
          region_anatomica?: string | null
          sala?: string | null
          tecnico_responsable?: string | null
          tipo_estudio?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudios_imagen_medico_solicitante_id_fkey"
            columns: ["medico_solicitante_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudios_imagen_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudios_imagen_radiologo_id_fkey"
            columns: ["radiologo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudios_imagen_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones_nutricionales: {
        Row: {
          circunferencia_brazo: number | null
          circunferencia_cintura: number | null
          created_at: string
          diagnostico_nutricional: string | null
          fecha: string
          id: string
          imc: number | null
          notas: string | null
          paciente_id: string
          peso_kg: number | null
          plan_alimenticio: string | null
          profesional_id: string | null
          restricciones: string | null
          suplementos: string | null
          talla_cm: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          circunferencia_brazo?: number | null
          circunferencia_cintura?: number | null
          created_at?: string
          diagnostico_nutricional?: string | null
          fecha?: string
          id?: string
          imc?: number | null
          notas?: string | null
          paciente_id: string
          peso_kg?: number | null
          plan_alimenticio?: string | null
          profesional_id?: string | null
          restricciones?: string | null
          suplementos?: string | null
          talla_cm?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          circunferencia_brazo?: number | null
          circunferencia_cintura?: number | null
          created_at?: string
          diagnostico_nutricional?: string | null
          fecha?: string
          id?: string
          imc?: number | null
          notas?: string | null
          paciente_id?: string
          peso_kg?: number | null
          plan_alimenticio?: string | null
          profesional_id?: string | null
          restricciones?: string | null
          suplementos?: string | null
          talla_cm?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_nutricionales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_nutricionales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_nutricionales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evoluciones_soap: {
        Row: {
          analisis: string | null
          created_at: string
          created_by: string | null
          fecha_evolucion: string
          id: string
          motivo_consulta: string | null
          objetivo: string | null
          paciente_id: string
          plan: string | null
          profesional_id: string | null
          signos_vitales: Json | null
          subjetivo: string | null
          updated_at: string
          visita_id: string | null
        }
        Insert: {
          analisis?: string | null
          created_at?: string
          created_by?: string | null
          fecha_evolucion?: string
          id?: string
          motivo_consulta?: string | null
          objetivo?: string | null
          paciente_id: string
          plan?: string | null
          profesional_id?: string | null
          signos_vitales?: Json | null
          subjetivo?: string | null
          updated_at?: string
          visita_id?: string | null
        }
        Update: {
          analisis?: string | null
          created_at?: string
          created_by?: string | null
          fecha_evolucion?: string
          id?: string
          motivo_consulta?: string | null
          objetivo?: string | null
          paciente_id?: string
          plan?: string | null
          profesional_id?: string | null
          signos_vitales?: Json | null
          subjetivo?: string | null
          updated_at?: string
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evoluciones_soap_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evoluciones_soap_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evoluciones_soap_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      excepciones_duplicados: {
        Row: {
          campo_duplicado: string
          confirmado_por: string | null
          created_at: string
          id: string
          notas: string | null
          paciente_existente_id: string
          valor_duplicado: string
        }
        Insert: {
          campo_duplicado: string
          confirmado_por?: string | null
          created_at?: string
          id?: string
          notas?: string | null
          paciente_existente_id: string
          valor_duplicado: string
        }
        Update: {
          campo_duplicado?: string
          confirmado_por?: string | null
          created_at?: string
          id?: string
          notas?: string | null
          paciente_existente_id?: string
          valor_duplicado?: string
        }
        Relationships: [
          {
            foreignKeyName: "excepciones_duplicados_paciente_existente_id_fkey"
            columns: ["paciente_existente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      expedientes_empleado: {
        Row: {
          created_at: string
          documentos_entregados: Json | null
          empleado_id: string
          evaluacion_actual: number | null
          fecha_fin_contrato: string | null
          fecha_inicio_contrato: string | null
          id: string
          notas: string | null
          puesto_id: string | null
          tipo_contrato: Database["public"]["Enums"]["tipo_contrato_rrhh"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          documentos_entregados?: Json | null
          empleado_id: string
          evaluacion_actual?: number | null
          fecha_fin_contrato?: string | null
          fecha_inicio_contrato?: string | null
          id?: string
          notas?: string | null
          puesto_id?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato_rrhh"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          documentos_entregados?: Json | null
          empleado_id?: string
          evaluacion_actual?: number | null
          fecha_fin_contrato?: string | null
          fecha_inicio_contrato?: string | null
          id?: string
          notas?: string | null
          puesto_id?: string | null
          tipo_contrato?: Database["public"]["Enums"]["tipo_contrato_rrhh"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_empleado_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados_nomina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_empleado_puesto_id_fkey"
            columns: ["puesto_id"]
            isOneToOne: false
            referencedRelation: "puestos_rrhh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_empleado_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas: {
        Row: {
          aseguradora: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: string
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          metodo_pago: string | null
          monto_pagado: number
          monto_seguro: number
          monto_total: number
          notas: string | null
          numero_autorizacion: string | null
          numero_factura: string
          paciente_id: string
          updated_at: string
          visita_id: string | null
          workspace_id: string | null
        }
        Insert: {
          aseguradora?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          metodo_pago?: string | null
          monto_pagado?: number
          monto_seguro?: number
          monto_total?: number
          notas?: string | null
          numero_autorizacion?: string | null
          numero_factura: string
          paciente_id: string
          updated_at?: string
          visita_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          aseguradora?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          metodo_pago?: string | null
          monto_pagado?: number
          monto_seguro?: number
          monto_total?: number
          notas?: string | null
          numero_autorizacion?: string | null
          numero_factura?: string
          paciente_id?: string
          updated_at?: string
          visita_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hallazgos_dentales: {
        Row: {
          cara: Database["public"]["Enums"]["cara_dental"] | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_hallazgo_dental"]
          id: string
          notas: string | null
          numero_diente: number
          odontograma_id: string
          tipo: Database["public"]["Enums"]["tipo_hallazgo_dental"]
          updated_at: string
        }
        Insert: {
          cara?: Database["public"]["Enums"]["cara_dental"] | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_hallazgo_dental"]
          id?: string
          notas?: string | null
          numero_diente: number
          odontograma_id: string
          tipo?: Database["public"]["Enums"]["tipo_hallazgo_dental"]
          updated_at?: string
        }
        Update: {
          cara?: Database["public"]["Enums"]["cara_dental"] | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_hallazgo_dental"]
          id?: string
          notas?: string | null
          numero_diente?: number
          odontograma_id?: string
          tipo?: Database["public"]["Enums"]["tipo_hallazgo_dental"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hallazgos_dentales_odontograma_id_fkey"
            columns: ["odontograma_id"]
            isOneToOne: false
            referencedRelation: "odontogramas"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_recordatorios: {
        Row: {
          canal: string
          cita_id: string
          created_at: string
          destinatarios: Json
          enviado_at: string | null
          error_mensaje: string | null
          estado: string
          id: string
          intentos: number
          max_intentos: number
          paciente_id: string | null
          plantilla_id: string | null
          profesional_id: string | null
          proximo_reintento: string | null
          tipo_cita: string
          tipo_recordatorio: string
          updated_at: string
        }
        Insert: {
          canal?: string
          cita_id: string
          created_at?: string
          destinatarios?: Json
          enviado_at?: string | null
          error_mensaje?: string | null
          estado?: string
          id?: string
          intentos?: number
          max_intentos?: number
          paciente_id?: string | null
          plantilla_id?: string | null
          profesional_id?: string | null
          proximo_reintento?: string | null
          tipo_cita: string
          tipo_recordatorio?: string
          updated_at?: string
        }
        Update: {
          canal?: string
          cita_id?: string
          created_at?: string
          destinatarios?: Json
          enviado_at?: string | null
          error_mensaje?: string | null
          estado?: string
          id?: string
          intentos?: number
          max_intentos?: number
          paciente_id?: string | null
          plantilla_id?: string | null
          profesional_id?: string | null
          proximo_reintento?: string | null
          tipo_cita?: string
          tipo_recordatorio?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_recordatorios_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_recordatorios_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_correo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_recordatorios_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      horarios_profesionales: {
        Row: {
          activo: boolean | null
          created_at: string | null
          dia_semana: number
          fecha_especifica: string | null
          hora_fin: string
          hora_inicio: string
          id: string
          notas: string | null
          profesional_id: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          dia_semana: number
          fecha_especifica?: string | null
          hora_fin: string
          hora_inicio: string
          id?: string
          notas?: string | null
          profesional_id?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          dia_semana?: number
          fecha_especifica?: string | null
          hora_fin?: string
          hora_inicio?: string
          id?: string
          notas?: string | null
          profesional_id?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "horarios_profesionales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      interacciones_crm: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha: string
          id: string
          lead_id: string
          resultado: string | null
          siguiente_accion: string | null
          siguiente_fecha: string | null
          tipo: Database["public"]["Enums"]["tipo_interaccion_crm"]
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          lead_id: string
          resultado?: string | null
          siguiente_accion?: string | null
          siguiente_fecha?: string | null
          tipo?: Database["public"]["Enums"]["tipo_interaccion_crm"]
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha?: string
          id?: string
          lead_id?: string
          resultado?: string | null
          siguiente_accion?: string | null
          siguiente_fecha?: string | null
          tipo?: Database["public"]["Enums"]["tipo_interaccion_crm"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interacciones_crm_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_crm"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_items: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          id: string
          metadata: Json
          nombre: string
          requiere_lotes: boolean
          stock_actual: number
          stock_minimo: number
          sucursal_id: string | null
          unidad_medida: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          metadata?: Json
          nombre: string
          requiere_lotes?: boolean
          stock_actual?: number
          stock_minimo?: number
          sucursal_id?: string | null
          unidad_medida?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          metadata?: Json
          nombre?: string
          requiere_lotes?: boolean
          stock_actual?: number
          stock_minimo?: number
          sucursal_id?: string | null
          unidad_medida?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      inventario_lotes: {
        Row: {
          cantidad_disponible: number
          created_at: string
          fecha_vencimiento: string | null
          id: string
          item_id: string
          notas: string | null
          numero_lote: string
          proveedor: string | null
          updated_at: string
        }
        Insert: {
          cantidad_disponible?: number
          created_at?: string
          fecha_vencimiento?: string | null
          id?: string
          item_id: string
          notas?: string | null
          numero_lote: string
          proveedor?: string | null
          updated_at?: string
        }
        Update: {
          cantidad_disponible?: number
          created_at?: string
          fecha_vencimiento?: string | null
          id?: string
          item_id?: string
          notas?: string | null
          numero_lote?: string
          proveedor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_lotes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventario_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_movimientos: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          item_id: string
          lote_id: string | null
          motivo: string | null
          notas: string | null
          paciente_id: string | null
          realizado_por: string | null
          tipo: string
          visita_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          item_id: string
          lote_id?: string | null
          motivo?: string | null
          notas?: string | null
          paciente_id?: string | null
          realizado_por?: string | null
          tipo: string
          visita_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          item_id?: string
          lote_id?: string | null
          motivo?: string | null
          notas?: string | null
          paciente_id?: string | null
          realizado_por?: string | null
          tipo?: string
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_movimientos_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventario_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_movimientos_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "inventario_lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      items_despacho: {
        Row: {
          cantidad_despachada: number
          created_at: string
          despacho_id: string
          fecha_vencimiento: string | null
          id: string
          item_receta_id: string | null
          lote: string | null
          medicamento: string
        }
        Insert: {
          cantidad_despachada?: number
          created_at?: string
          despacho_id: string
          fecha_vencimiento?: string | null
          id?: string
          item_receta_id?: string | null
          lote?: string | null
          medicamento: string
        }
        Update: {
          cantidad_despachada?: number
          created_at?: string
          despacho_id?: string
          fecha_vencimiento?: string | null
          id?: string
          item_receta_id?: string | null
          lote?: string | null
          medicamento?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_despacho_despacho_id_fkey"
            columns: ["despacho_id"]
            isOneToOne: false
            referencedRelation: "despachos_farmacia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_despacho_item_receta_id_fkey"
            columns: ["item_receta_id"]
            isOneToOne: false
            referencedRelation: "items_receta"
            referencedColumns: ["id"]
          },
        ]
      }
      items_orden_compra: {
        Row: {
          cantidad_recibida: number | null
          cantidad_solicitada: number
          created_at: string
          descripcion: string
          id: string
          item_inventario_id: string | null
          notas: string | null
          orden_id: string
          precio_unitario: number | null
          subtotal: number | null
          unidad: string | null
        }
        Insert: {
          cantidad_recibida?: number | null
          cantidad_solicitada?: number
          created_at?: string
          descripcion: string
          id?: string
          item_inventario_id?: string | null
          notas?: string | null
          orden_id: string
          precio_unitario?: number | null
          subtotal?: number | null
          unidad?: string | null
        }
        Update: {
          cantidad_recibida?: number | null
          cantidad_solicitada?: number
          created_at?: string
          descripcion?: string
          id?: string
          item_inventario_id?: string | null
          notas?: string | null
          orden_id?: string
          precio_unitario?: number | null
          subtotal?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_orden_compra_item_inventario_id_fkey"
            columns: ["item_inventario_id"]
            isOneToOne: false
            referencedRelation: "inventario_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_orden_compra_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_compra"
            referencedColumns: ["id"]
          },
        ]
      }
      items_receta: {
        Row: {
          cantidad: number
          created_at: string
          despachado: boolean
          dosis: string | null
          duracion: string | null
          frecuencia: string | null
          id: string
          medicamento: string
          notas: string | null
          presentacion: string | null
          receta_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          despachado?: boolean
          dosis?: string | null
          duracion?: string | null
          frecuencia?: string | null
          id?: string
          medicamento: string
          notas?: string | null
          presentacion?: string | null
          receta_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          despachado?: boolean
          dosis?: string | null
          duracion?: string | null
          frecuencia?: string | null
          id?: string
          medicamento?: string
          notas?: string | null
          presentacion?: string | null
          receta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_receta_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas_farmacia"
            referencedColumns: ["id"]
          },
        ]
      }
      kardex_enfermeria: {
        Row: {
          admision_id: string
          created_at: string
          cuidados: Json
          enfermera_id: string | null
          fecha: string
          id: string
          medicacion: Json
          observaciones: string | null
          paciente_id: string
          turno: string
        }
        Insert: {
          admision_id: string
          created_at?: string
          cuidados?: Json
          enfermera_id?: string | null
          fecha?: string
          id?: string
          medicacion?: Json
          observaciones?: string | null
          paciente_id: string
          turno: string
        }
        Update: {
          admision_id?: string
          created_at?: string
          cuidados?: Json
          enfermera_id?: string | null
          fecha?: string
          id?: string
          medicacion?: Json
          observaciones?: string | null
          paciente_id?: string
          turno?: string
        }
        Relationships: [
          {
            foreignKeyName: "kardex_enfermeria_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_crm: {
        Row: {
          asignado_a: string | null
          created_at: string
          email: string | null
          estado: Database["public"]["Enums"]["estado_lead"]
          id: string
          nombre: string
          notas: string | null
          numero: string | null
          origen: Database["public"]["Enums"]["origen_lead"]
          telefono: string | null
          updated_at: string
          valor_estimado: number | null
          workspace_id: string
        }
        Insert: {
          asignado_a?: string | null
          created_at?: string
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_lead"]
          id?: string
          nombre: string
          notas?: string | null
          numero?: string | null
          origen?: Database["public"]["Enums"]["origen_lead"]
          telefono?: string | null
          updated_at?: string
          valor_estimado?: number | null
          workspace_id: string
        }
        Update: {
          asignado_a?: string | null
          created_at?: string
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_lead"]
          id?: string
          nombre?: string
          notas?: string | null
          numero?: string | null
          origen?: Database["public"]["Enums"]["origen_lead"]
          telefono?: string | null
          updated_at?: string
          valor_estimado?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_crm_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lineas_asiento: {
        Row: {
          asiento_id: string
          created_at: string
          cuenta_id: string
          debe: number
          descripcion: string | null
          haber: number
          id: string
        }
        Insert: {
          asiento_id: string
          created_at?: string
          cuenta_id: string
          debe?: number
          descripcion?: string | null
          haber?: number
          id?: string
        }
        Update: {
          asiento_id?: string
          created_at?: string
          cuenta_id?: string
          debe?: number
          descripcion?: string | null
          haber?: number
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lineas_asiento_asiento_id_fkey"
            columns: ["asiento_id"]
            isOneToOne: false
            referencedRelation: "asientos_contables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineas_asiento_cuenta_id_fkey"
            columns: ["cuenta_id"]
            isOneToOne: false
            referencedRelation: "cuentas_contables"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_espera: {
        Row: {
          created_at: string
          especialidad: string | null
          estado: Database["public"]["Enums"]["estado_espera"]
          fecha_asignada: string | null
          fecha_solicitud: string
          id: string
          motivo: string | null
          notas: string | null
          paciente_id: string
          prioridad: Database["public"]["Enums"]["prioridad_espera"]
          profesional_id: string | null
          sucursal_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          especialidad?: string | null
          estado?: Database["public"]["Enums"]["estado_espera"]
          fecha_asignada?: string | null
          fecha_solicitud?: string
          id?: string
          motivo?: string | null
          notas?: string | null
          paciente_id: string
          prioridad?: Database["public"]["Enums"]["prioridad_espera"]
          profesional_id?: string | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          especialidad?: string | null
          estado?: Database["public"]["Enums"]["estado_espera"]
          fecha_asignada?: string | null
          fecha_solicitud?: string
          id?: string
          motivo?: string | null
          notas?: string | null
          paciente_id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_espera"]
          profesional_id?: string | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      medicamentos_paciente: {
        Row: {
          cantidad_disponible: number | null
          created_at: string | null
          dosis: string | null
          frecuencia: string | null
          id: string
          muestra_medica: boolean | null
          nombre_medicamento: string
          notas: string | null
          paciente_id: string
          updated_at: string | null
        }
        Insert: {
          cantidad_disponible?: number | null
          created_at?: string | null
          dosis?: string | null
          frecuencia?: string | null
          id?: string
          muestra_medica?: boolean | null
          nombre_medicamento: string
          notas?: string | null
          paciente_id: string
          updated_at?: string | null
        }
        Update: {
          cantidad_disponible?: number | null
          created_at?: string | null
          dosis?: string | null
          frecuencia?: string | null
          id?: string
          muestra_medica?: boolean | null
          nombre_medicamento?: string
          notas?: string | null
          paciente_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicamentos_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      menus_dieta: {
        Row: {
          calorias: number | null
          comida: string
          created_at: string
          descripcion: string
          dieta_id: string
          entregado: boolean | null
          fecha: string
          id: string
          notas: string | null
          preparado: boolean | null
        }
        Insert: {
          calorias?: number | null
          comida: string
          created_at?: string
          descripcion: string
          dieta_id: string
          entregado?: boolean | null
          fecha?: string
          id?: string
          notas?: string | null
          preparado?: boolean | null
        }
        Update: {
          calorias?: number | null
          comida?: string
          created_at?: string
          descripcion?: string
          dieta_id?: string
          entregado?: boolean | null
          fecha?: string
          id?: string
          notas?: string | null
          preparado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "menus_dieta_dieta_id_fkey"
            columns: ["dieta_id"]
            isOneToOne: false
            referencedRelation: "dietas_hospitalarias"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_name: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_name?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      movimientos_stock_farmacia: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          motivo: string | null
          referencia_despacho_id: string | null
          stock_id: string
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          motivo?: string | null
          referencia_despacho_id?: string | null
          stock_id: string
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          motivo?: string | null
          referencia_despacho_id?: string | null
          stock_id?: string
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_stock_farmacia_referencia_despacho_id_fkey"
            columns: ["referencia_despacho_id"]
            isOneToOne: false
            referencedRelation: "despachos_farmacia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_farmacia_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stock_farmacia"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_credito: {
        Row: {
          aprobada_por: string | null
          creada_por: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_nota_credito"]
          factura_id: string
          fecha_aprobacion: string | null
          id: string
          monto: number
          motivo: string
          notas: string | null
          numero_nota: string | null
          paciente_id: string
          sucursal_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          aprobada_por?: string | null
          creada_por?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_nota_credito"]
          factura_id: string
          fecha_aprobacion?: string | null
          id?: string
          monto: number
          motivo: string
          notas?: string | null
          numero_nota?: string | null
          paciente_id: string
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          aprobada_por?: string | null
          creada_por?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_nota_credito"]
          factura_id?: string
          fecha_aprobacion?: string | null
          id?: string
          monto?: number
          motivo?: string
          notas?: string | null
          numero_nota?: string | null
          paciente_id?: string
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_credito_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_credito_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_plan_accion: {
        Row: {
          completada: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          notas_visita: string | null
          paciente_id: string
          visita_id: string
        }
        Insert: {
          completada?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notas_visita?: string | null
          paciente_id: string
          visita_id: string
        }
        Update: {
          completada?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notas_visita?: string | null
          paciente_id?: string
          visita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_plan_accion_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_plan_accion_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: true
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      odontogramas: {
        Row: {
          created_at: string
          fecha_evaluacion: string
          id: string
          notas: string | null
          paciente_id: string
          profesional_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          fecha_evaluacion?: string
          id?: string
          notas?: string | null
          paciente_id: string
          profesional_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          fecha_evaluacion?: string
          id?: string
          notas?: string | null
          paciente_id?: string
          profesional_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "odontogramas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogramas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "odontogramas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_compra: {
        Row: {
          aprobado_por: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_orden_compra"]
          fecha_emision: string
          fecha_estimada_entrega: string | null
          fecha_recepcion: string | null
          id: string
          notas: string | null
          numero_orden: string | null
          prioridad: string | null
          proveedor_id: string | null
          solicitado_por: string | null
          total_estimado: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          aprobado_por?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_orden_compra"]
          fecha_emision?: string
          fecha_estimada_entrega?: string | null
          fecha_recepcion?: string | null
          id?: string
          notas?: string | null
          numero_orden?: string | null
          prioridad?: string | null
          proveedor_id?: string | null
          solicitado_por?: string | null
          total_estimado?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          aprobado_por?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_orden_compra"]
          fecha_emision?: string
          fecha_estimada_entrega?: string | null
          fecha_recepcion?: string | null
          id?: string
          notas?: string | null
          numero_orden?: string | null
          prioridad?: string | null
          proveedor_id?: string | null
          solicitado_por?: string | null
          total_estimado?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_compra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_compra_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_laboratorio: {
        Row: {
          created_at: string | null
          diagnostico_presuntivo: string | null
          estado: Database["public"]["Enums"]["estado_orden_lab"] | null
          fecha_recepcion_muestra: string | null
          fecha_resultado: string | null
          fecha_solicitud: string | null
          id: string
          indicaciones: string | null
          medico_solicitante_id: string | null
          notas: string | null
          numero_orden: string | null
          paciente_id: string
          prioridad: Database["public"]["Enums"]["prioridad_lab"] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          diagnostico_presuntivo?: string | null
          estado?: Database["public"]["Enums"]["estado_orden_lab"] | null
          fecha_recepcion_muestra?: string | null
          fecha_resultado?: string | null
          fecha_solicitud?: string | null
          id?: string
          indicaciones?: string | null
          medico_solicitante_id?: string | null
          notas?: string | null
          numero_orden?: string | null
          paciente_id: string
          prioridad?: Database["public"]["Enums"]["prioridad_lab"] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          diagnostico_presuntivo?: string | null
          estado?: Database["public"]["Enums"]["estado_orden_lab"] | null
          fecha_recepcion_muestra?: string | null
          fecha_resultado?: string | null
          fecha_solicitud?: string | null
          id?: string
          indicaciones?: string | null
          medico_solicitante_id?: string | null
          notas?: string | null
          numero_orden?: string | null
          paciente_id?: string
          prioridad?: Database["public"]["Enums"]["prioridad_lab"] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_laboratorio_medico_solicitante_id_fkey"
            columns: ["medico_solicitante_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_laboratorio_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_laboratorio_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          anonimizado: boolean
          anonimizado_at: string | null
          apellido: string
          barrio: string | null
          cedula: string | null
          contacto_cuidador: string | null
          contacto_px: string | null
          created_at: string | null
          dias_no_visita: number[] | null
          direccion_domicilio: string | null
          email_cuidador: string | null
          email_px: string | null
          es_sospechoso: boolean | null
          fecha_nacimiento: string | null
          foto_url: string | null
          grado_dificultad:
            | Database["public"]["Enums"]["grado_dificultad"]
            | null
          historia_medica_basica: string | null
          id: string
          latitud: number | null
          longitud: number | null
          motivo_inactividad: string | null
          nacionalidad: string
          nombre: string
          nombre_cuidador: string | null
          notificaciones_activas: boolean | null
          numero_documento: string | null
          numero_principal: string | null
          parentesco_cuidador: string | null
          profesional_asignado_id: string | null
          sexo: string | null
          status_px: Database["public"]["Enums"]["status_paciente"] | null
          sucursal_id: string | null
          tipo_atencion: string | null
          tipo_documento: string
          updated_at: string | null
          whatsapp_cuidador: boolean | null
          whatsapp_px: boolean | null
          workspace_id: string | null
          zona: Database["public"]["Enums"]["zona_distrito"] | null
        }
        Insert: {
          anonimizado?: boolean
          anonimizado_at?: string | null
          apellido: string
          barrio?: string | null
          cedula?: string | null
          contacto_cuidador?: string | null
          contacto_px?: string | null
          created_at?: string | null
          dias_no_visita?: number[] | null
          direccion_domicilio?: string | null
          email_cuidador?: string | null
          email_px?: string | null
          es_sospechoso?: boolean | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          grado_dificultad?:
            | Database["public"]["Enums"]["grado_dificultad"]
            | null
          historia_medica_basica?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          motivo_inactividad?: string | null
          nacionalidad?: string
          nombre: string
          nombre_cuidador?: string | null
          notificaciones_activas?: boolean | null
          numero_documento?: string | null
          numero_principal?: string | null
          parentesco_cuidador?: string | null
          profesional_asignado_id?: string | null
          sexo?: string | null
          status_px?: Database["public"]["Enums"]["status_paciente"] | null
          sucursal_id?: string | null
          tipo_atencion?: string | null
          tipo_documento?: string
          updated_at?: string | null
          whatsapp_cuidador?: boolean | null
          whatsapp_px?: boolean | null
          workspace_id?: string | null
          zona?: Database["public"]["Enums"]["zona_distrito"] | null
        }
        Update: {
          anonimizado?: boolean
          anonimizado_at?: string | null
          apellido?: string
          barrio?: string | null
          cedula?: string | null
          contacto_cuidador?: string | null
          contacto_px?: string | null
          created_at?: string | null
          dias_no_visita?: number[] | null
          direccion_domicilio?: string | null
          email_cuidador?: string | null
          email_px?: string | null
          es_sospechoso?: boolean | null
          fecha_nacimiento?: string | null
          foto_url?: string | null
          grado_dificultad?:
            | Database["public"]["Enums"]["grado_dificultad"]
            | null
          historia_medica_basica?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          motivo_inactividad?: string | null
          nacionalidad?: string
          nombre?: string
          nombre_cuidador?: string | null
          notificaciones_activas?: boolean | null
          numero_documento?: string | null
          numero_principal?: string | null
          parentesco_cuidador?: string | null
          profesional_asignado_id?: string | null
          sexo?: string | null
          status_px?: Database["public"]["Enums"]["status_paciente"] | null
          sucursal_id?: string | null
          tipo_atencion?: string | null
          tipo_documento?: string
          updated_at?: string | null
          whatsapp_cuidador?: boolean | null
          whatsapp_px?: boolean | null
          workspace_id?: string | null
          zona?: Database["public"]["Enums"]["zona_distrito"] | null
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_profesional_asignado_id_fkey"
            columns: ["profesional_asignado_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos: {
        Row: {
          created_at: string
          created_by: string | null
          factura_id: string
          fecha_pago: string
          id: string
          metodo: string
          monto: number
          notas: string | null
          referencia: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          factura_id: string
          fecha_pago?: string
          id?: string
          metodo?: string
          monto: number
          notas?: string | null
          referencia?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          factura_id?: string
          fecha_pago?: string
          id?: string
          metodo?: string
          monto?: number
          notas?: string | null
          referencia?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagos_workspace: {
        Row: {
          created_at: string
          estado: string
          fecha_pago: string | null
          id: string
          metadata: Json
          metodo: string | null
          moneda: string
          monto: number
          proveedor: string
          proveedor_invoice_id: string | null
          proveedor_payment_id: string | null
          recibo_url: string | null
          subscripcion_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_pago?: string | null
          id?: string
          metadata?: Json
          metodo?: string | null
          moneda?: string
          monto: number
          proveedor: string
          proveedor_invoice_id?: string | null
          proveedor_payment_id?: string | null
          recibo_url?: string | null
          subscripcion_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_pago?: string | null
          id?: string
          metadata?: Json
          metodo?: string | null
          moneda?: string
          monto?: number
          proveedor?: string
          proveedor_invoice_id?: string | null
          proveedor_payment_id?: string | null
          recibo_url?: string | null
          subscripcion_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_workspace_subscripcion_id_fkey"
            columns: ["subscripcion_id"]
            isOneToOne: false
            referencedRelation: "subscripciones_workspace"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_workspace_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      paneles_laboratorio: {
        Row: {
          activo: boolean | null
          codigo: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          pruebas_incluidas: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          pruebas_incluidas?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          pruebas_incluidas?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paneles_laboratorio_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pantallas_turno: {
        Row: {
          activa: boolean | null
          created_at: string
          id: string
          nombre: string
          servicios: string[] | null
          sucursal_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activa?: boolean | null
          created_at?: string
          id?: string
          nombre: string
          servicios?: string[] | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activa?: boolean | null
          created_at?: string
          id?: string
          nombre?: string
          servicios?: string[] | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pantallas_turno_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pantallas_turno_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_seguimiento: {
        Row: {
          contador_llamadas_no_contestadas: number | null
          created_at: string | null
          fecha_proxima_llamada_prog: string | null
          fecha_proxima_visita_prog: string | null
          id: string
          paciente_id: string | null
          periodo_llamada_ciclico: number | null
          periodo_visita_ciclico: number | null
          updated_at: string | null
        }
        Insert: {
          contador_llamadas_no_contestadas?: number | null
          created_at?: string | null
          fecha_proxima_llamada_prog?: string | null
          fecha_proxima_visita_prog?: string | null
          id?: string
          paciente_id?: string | null
          periodo_llamada_ciclico?: number | null
          periodo_visita_ciclico?: number | null
          updated_at?: string | null
        }
        Update: {
          contador_llamadas_no_contestadas?: number | null
          created_at?: string | null
          fecha_proxima_llamada_prog?: string | null
          fecha_proxima_visita_prog?: string | null
          id?: string
          paciente_id?: string | null
          periodo_llamada_ciclico?: number | null
          periodo_visita_ciclico?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parametros_seguimiento_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: true
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pase_turno: {
        Row: {
          admision_id: string
          alertas: string | null
          created_at: string
          entregado_por: string | null
          fecha: string
          id: string
          paciente_id: string
          pendientes: string | null
          recibido_por: string | null
          resumen: string
          turno_entrante: string
          turno_saliente: string
        }
        Insert: {
          admision_id: string
          alertas?: string | null
          created_at?: string
          entregado_por?: string | null
          fecha?: string
          id?: string
          paciente_id: string
          pendientes?: string | null
          recibido_por?: string | null
          resumen: string
          turno_entrante: string
          turno_saliente: string
        }
        Update: {
          admision_id?: string
          alertas?: string | null
          created_at?: string
          entregado_por?: string | null
          fecha?: string
          id?: string
          paciente_id?: string
          pendientes?: string | null
          recibido_por?: string | null
          resumen?: string
          turno_entrante?: string
          turno_saliente?: string
        }
        Relationships: [
          {
            foreignKeyName: "pase_turno_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos_nomina: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_periodo_nomina"]
          fecha_fin: string
          fecha_inicio: string
          id: string
          nombre: string
          notas: string | null
          numero: string | null
          total_bruto: number
          total_deducciones: number
          total_neto: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_periodo_nomina"]
          fecha_fin: string
          fecha_inicio: string
          id?: string
          nombre?: string
          notas?: string | null
          numero?: string | null
          total_bruto?: number
          total_deducciones?: number
          total_neto?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_periodo_nomina"]
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          nombre?: string
          notas?: string | null
          numero?: string | null
          total_bruto?: number
          total_deducciones?: number
          total_neto?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "periodos_nomina_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      permisos: {
        Row: {
          created_at: string | null
          id: string
          permiso_borrar: boolean | null
          permiso_crear: boolean | null
          permiso_editar: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permiso_borrar?: boolean | null
          permiso_crear?: boolean | null
          permiso_editar?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permiso_borrar?: boolean | null
          permiso_crear?: boolean | null
          permiso_editar?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permisos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_salud: {
        Row: {
          activo: boolean | null
          apellido: string
          barrio: string | null
          cedula: string
          contacto: string | null
          created_at: string | null
          direccion: string | null
          email_contacto: string | null
          especialidad: string | null
          id: string
          nombre: string
          notificaciones_activas: boolean | null
          sucursal_id: string | null
          updated_at: string | null
          user_id: string | null
          workspace_id: string | null
          zona: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          barrio?: string | null
          cedula: string
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          email_contacto?: string | null
          especialidad?: string | null
          id?: string
          nombre: string
          notificaciones_activas?: boolean | null
          sucursal_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
          zona?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          barrio?: string | null
          cedula?: string
          contacto?: string | null
          created_at?: string | null
          direccion?: string | null
          email_contacto?: string | null
          especialidad?: string | null
          id?: string
          nombre?: string
          notificaciones_activas?: boolean | null
          sucursal_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
          zona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_salud_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_salud_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pisos: {
        Row: {
          activo: boolean
          created_at: string
          edificio_id: string
          id: string
          nombre: string | null
          numero: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          edificio_id: string
          id?: string
          nombre?: string | null
          numero: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          edificio_id?: string
          id?: string
          nombre?: string | null
          numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "pisos_edificio_id_fkey"
            columns: ["edificio_id"]
            isOneToOne: false
            referencedRelation: "edificios"
            referencedColumns: ["id"]
          },
        ]
      }
      planes: {
        Row: {
          activo: boolean
          caracteristicas: Json
          codigo: string
          created_at: string
          descripcion: string | null
          id: string
          limite_pacientes: number | null
          limite_profesionales: number | null
          limite_usuarios: number | null
          nombre: string
          orden: number
          precio_mensual_dop: number | null
          precio_mensual_usd: number | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          caracteristicas?: Json
          codigo: string
          created_at?: string
          descripcion?: string | null
          id?: string
          limite_pacientes?: number | null
          limite_profesionales?: number | null
          limite_usuarios?: number | null
          nombre: string
          orden?: number
          precio_mensual_dop?: number | null
          precio_mensual_usd?: number | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          caracteristicas?: Json
          codigo?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          limite_pacientes?: number | null
          limite_profesionales?: number | null
          limite_usuarios?: number | null
          nombre?: string
          orden?: number
          precio_mensual_dop?: number | null
          precio_mensual_usd?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      planes_rehabilitacion: {
        Row: {
          created_at: string
          diagnostico: string | null
          duracion_semanas: number | null
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          notas: string | null
          numero: string | null
          objetivos: string | null
          paciente_id: string
          profesional_id: string | null
          sesiones_por_semana: number | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          diagnostico?: string | null
          duracion_semanas?: number | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          numero?: string | null
          objetivos?: string | null
          paciente_id: string
          profesional_id?: string | null
          sesiones_por_semana?: number | null
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          diagnostico?: string | null
          duracion_semanas?: number | null
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          numero?: string | null
          objetivos?: string | null
          paciente_id?: string
          profesional_id?: string | null
          sesiones_por_semana?: number | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_rehabilitacion_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_rehabilitacion_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_rehabilitacion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_seguro: {
        Row: {
          activo: boolean
          aseguradora_id: string
          cobertura_porcentaje: number | null
          codigo: string | null
          copago: number | null
          created_at: string
          deducible: number | null
          id: string
          nombre: string
          notas: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          aseguradora_id: string
          cobertura_porcentaje?: number | null
          codigo?: string | null
          copago?: number | null
          created_at?: string
          deducible?: number | null
          id?: string
          nombre: string
          notas?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          aseguradora_id?: string
          cobertura_porcentaje?: number | null
          codigo?: string | null
          copago?: number | null
          created_at?: string
          deducible?: number | null
          id?: string
          nombre?: string
          notas?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_seguro_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_seguro_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_correo: {
        Row: {
          activo: boolean | null
          asunto: string
          categoria: string | null
          contenido_html: string
          created_at: string | null
          created_by: string | null
          id: string
          nombre: string
          tipo: string
          updated_at: string | null
          variables: Json | null
          version: number | null
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean | null
          asunto: string
          categoria?: string | null
          contenido_html: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          nombre: string
          tipo: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean | null
          asunto?: string
          categoria?: string | null
          contenido_html?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          nombre?: string
          tipo?: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_correo_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_especialidad: {
        Row: {
          activo: boolean
          campos_json: Json
          created_at: string
          created_by: string | null
          descripcion: string | null
          especialidad: Database["public"]["Enums"]["especialidad_medica"]
          id: string
          nombre: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          campos_json?: Json
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          especialidad: Database["public"]["Enums"]["especialidad_medica"]
          id?: string
          nombre: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          campos_json?: Json
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          especialidad?: Database["public"]["Enums"]["especialidad_medica"]
          id?: string
          nombre?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_especialidad_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_whatsapp: {
        Row: {
          activo: boolean
          categoria: string
          contenido: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          destinatario_default: string
          id: string
          nombre: string
          updated_at: string
          variables: Json | null
          version: number
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          categoria?: string
          contenido: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          destinatario_default?: string
          id?: string
          nombre: string
          updated_at?: string
          variables?: Json | null
          version?: number
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          categoria?: string
          contenido?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          destinatario_default?: string
          id?: string
          nombre?: string
          updated_at?: string
          variables?: Json | null
          version?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_whatsapp_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      politicas_retencion: {
        Row: {
          activo: boolean
          anonimizar_inactivos_meses: number
          created_at: string
          id: string
          notas: string | null
          notificar_antes_dias: number
          retencion_anos: number
          ultima_revision: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          anonimizar_inactivos_meses?: number
          created_at?: string
          id?: string
          notas?: string | null
          notificar_antes_dias?: number
          retencion_anos?: number
          ultima_revision?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          anonimizar_inactivos_meses?: number
          created_at?: string
          id?: string
          notas?: string | null
          notificar_antes_dias?: number
          retencion_anos?: number
          ultima_revision?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      portal_paciente_tokens: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          paciente_id: string
          token: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          paciente_id: string
          token?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          paciente_id?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_paciente_tokens_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_paciente_tokens_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos_dentales: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_presupuesto_dental"]
          id: string
          notas: string | null
          numero: string | null
          paciente_id: string
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_presupuesto_dental"]
          id?: string
          notas?: string | null
          numero?: string | null
          paciente_id: string
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_presupuesto_dental"]
          id?: string
          notas?: string | null
          numero?: string | null
          paciente_id?: string
          total?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_dentales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_dentales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profesional_especialidades: {
        Row: {
          created_at: string
          es_principal: boolean
          especialidad_id: string
          id: string
          numero_exequatur: string | null
          profesional_id: string
        }
        Insert: {
          created_at?: string
          es_principal?: boolean
          especialidad_id: string
          id?: string
          numero_exequatur?: string | null
          profesional_id: string
        }
        Update: {
          created_at?: string
          es_principal?: boolean
          especialidad_id?: string
          id?: string
          numero_exequatur?: string | null
          profesional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesional_especialidades_especialidad_id_fkey"
            columns: ["especialidad_id"]
            isOneToOne: false
            referencedRelation: "especialidades_medicas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean | null
          apellido: string
          approved: boolean | null
          avatar_url: string | null
          cedula: string
          country_code: string | null
          created_at: string | null
          created_by: string | null
          email: string
          especialidad: string | null
          foto_url: string | null
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          approved?: boolean | null
          avatar_url?: string | null
          cedula: string
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          especialidad?: string | null
          foto_url?: string | null
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          approved?: boolean | null
          avatar_url?: string | null
          cedula?: string
          country_code?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          especialidad?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      proveedores: {
        Row: {
          activo: boolean | null
          contacto_nombre: string | null
          created_at: string
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          notas: string | null
          rnc: string | null
          telefono: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          contacto_nombre?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          notas?: string | null
          rnc?: string | null
          telefono?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          contacto_nombre?: string | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          rnc?: string | null
          telefono?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pruebas_laboratorio: {
        Row: {
          anormal: boolean | null
          categoria: string | null
          created_at: string | null
          critico: boolean | null
          estado: Database["public"]["Enums"]["estado_orden_lab"] | null
          fecha_resultado: string | null
          id: string
          nombre_prueba: string
          notas: string | null
          orden_id: string
          rango_referencia_texto: string | null
          realizado_por: string | null
          resultado: string | null
          unidad: string | null
          updated_at: string | null
          valor_referencia_max: number | null
          valor_referencia_min: number | null
        }
        Insert: {
          anormal?: boolean | null
          categoria?: string | null
          created_at?: string | null
          critico?: boolean | null
          estado?: Database["public"]["Enums"]["estado_orden_lab"] | null
          fecha_resultado?: string | null
          id?: string
          nombre_prueba: string
          notas?: string | null
          orden_id: string
          rango_referencia_texto?: string | null
          realizado_por?: string | null
          resultado?: string | null
          unidad?: string | null
          updated_at?: string | null
          valor_referencia_max?: number | null
          valor_referencia_min?: number | null
        }
        Update: {
          anormal?: boolean | null
          categoria?: string | null
          created_at?: string | null
          critico?: boolean | null
          estado?: Database["public"]["Enums"]["estado_orden_lab"] | null
          fecha_resultado?: string | null
          id?: string
          nombre_prueba?: string
          notas?: string | null
          orden_id?: string
          rango_referencia_texto?: string | null
          realizado_por?: string | null
          resultado?: string | null
          unidad?: string | null
          updated_at?: string | null
          valor_referencia_max?: number | null
          valor_referencia_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_laboratorio_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pruebas_laboratorio_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      public_appointment_tokens: {
        Row: {
          activo: boolean
          api_key: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          nombre: string
          permisos: Json
          sucursal_id: string | null
          total_llamadas: number
          ultimo_uso: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          api_key?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          nombre: string
          permisos?: Json
          sucursal_id?: string | null
          total_llamadas?: number
          ultimo_uso?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean
          api_key?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          nombre?: string
          permisos?: Json
          sucursal_id?: string | null
          total_llamadas?: number
          ultimo_uso?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      puestos_rrhh: {
        Row: {
          activo: boolean
          created_at: string
          departamento_id: string | null
          descripcion: string | null
          id: string
          nivel: string | null
          nombre: string
          salario_max: number | null
          salario_min: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          departamento_id?: string | null
          descripcion?: string | null
          id?: string
          nivel?: string | null
          nombre: string
          salario_max?: number | null
          salario_min?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          departamento_id?: string | null
          descripcion?: string | null
          id?: string
          nivel?: string | null
          nombre?: string
          salario_max?: number | null
          salario_min?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "puestos_rrhh_departamento_id_fkey"
            columns: ["departamento_id"]
            isOneToOne: false
            referencedRelation: "departamentos_rrhh"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puestos_rrhh_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          activo: boolean
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activo?: boolean
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activo?: boolean
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      recetas: {
        Row: {
          created_at: string
          diagnostico_texto: string | null
          estado: Database["public"]["Enums"]["estado_receta"]
          fecha_emision: string
          id: string
          indicaciones_generales: string | null
          paciente_id: string
          profesional_id: string
          sucursal_id: string | null
          updated_at: string
          vigencia_dias: number
          visita_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          diagnostico_texto?: string | null
          estado?: Database["public"]["Enums"]["estado_receta"]
          fecha_emision?: string
          id?: string
          indicaciones_generales?: string | null
          paciente_id: string
          profesional_id: string
          sucursal_id?: string | null
          updated_at?: string
          vigencia_dias?: number
          visita_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          diagnostico_texto?: string | null
          estado?: Database["public"]["Enums"]["estado_receta"]
          fecha_emision?: string
          id?: string
          indicaciones_generales?: string | null
          paciente_id?: string
          profesional_id?: string
          sucursal_id?: string | null
          updated_at?: string
          vigencia_dias?: number
          visita_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recetas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recetas_farmacia: {
        Row: {
          created_at: string
          diagnostico: string | null
          estado: string
          fecha_emision: string
          id: string
          notas: string | null
          numero: string | null
          paciente_id: string
          prescriptor_id: string | null
          sucursal_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          diagnostico?: string | null
          estado?: string
          fecha_emision?: string
          id?: string
          notas?: string | null
          numero?: string | null
          paciente_id: string
          prescriptor_id?: string | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          diagnostico?: string | null
          estado?: string
          fecha_emision?: string
          id?: string
          notas?: string | null
          numero?: string | null
          paciente_id?: string
          prescriptor_id?: string | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recetas_farmacia_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_farmacia_prescriptor_id_fkey"
            columns: ["prescriptor_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_farmacia_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_farmacia_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recetas_items: {
        Row: {
          cantidad: string | null
          created_at: string
          dosis: string | null
          duracion: string | null
          frecuencia: string | null
          id: string
          indicaciones: string | null
          medicamento: string
          orden: number
          presentacion: string | null
          receta_id: string
          via_administracion: string | null
        }
        Insert: {
          cantidad?: string | null
          created_at?: string
          dosis?: string | null
          duracion?: string | null
          frecuencia?: string | null
          id?: string
          indicaciones?: string | null
          medicamento: string
          orden?: number
          presentacion?: string | null
          receta_id: string
          via_administracion?: string | null
        }
        Update: {
          cantidad?: string | null
          created_at?: string
          dosis?: string | null
          duracion?: string | null
          frecuencia?: string | null
          id?: string
          indicaciones?: string | null
          medicamento?: string
          orden?: number
          presentacion?: string | null
          receta_id?: string
          via_administracion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recetas_items_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamaciones_ars: {
        Row: {
          aseguradora_id: string
          cantidad_casos: number
          created_at: string
          enviado_por: string | null
          estado: Database["public"]["Enums"]["estado_reclamacion"]
          fecha_envio: string | null
          fecha_respuesta: string | null
          id: string
          monto_aprobado: number | null
          monto_rechazado: number | null
          monto_reclamado: number
          motivo_rechazo: string | null
          notas: string | null
          numero_lote: string | null
          numero_reclamacion: string | null
          periodo_desde: string | null
          periodo_hasta: string | null
          sucursal_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          aseguradora_id: string
          cantidad_casos?: number
          created_at?: string
          enviado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_reclamacion"]
          fecha_envio?: string | null
          fecha_respuesta?: string | null
          id?: string
          monto_aprobado?: number | null
          monto_rechazado?: number | null
          monto_reclamado?: number
          motivo_rechazo?: string | null
          notas?: string | null
          numero_lote?: string | null
          numero_reclamacion?: string | null
          periodo_desde?: string | null
          periodo_hasta?: string | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          aseguradora_id?: string
          cantidad_casos?: number
          created_at?: string
          enviado_por?: string | null
          estado?: Database["public"]["Enums"]["estado_reclamacion"]
          fecha_envio?: string | null
          fecha_respuesta?: string | null
          id?: string
          monto_aprobado?: number | null
          monto_rechazado?: number | null
          monto_reclamado?: number
          motivo_rechazo?: string | null
          notas?: string | null
          numero_lote?: string | null
          numero_reclamacion?: string | null
          periodo_desde?: string | null
          periodo_hasta?: string | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclamaciones_ars_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamaciones_ars_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamaciones_ars_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reclamaciones_detalle: {
        Row: {
          autorizacion_id: string | null
          created_at: string
          estado: string | null
          factura_id: string | null
          id: string
          monto_aprobado: number | null
          monto_facturado: number
          monto_reclamado: number
          motivo_glosa: string | null
          paciente_id: string | null
          procedimiento: string | null
          reclamacion_id: string
        }
        Insert: {
          autorizacion_id?: string | null
          created_at?: string
          estado?: string | null
          factura_id?: string | null
          id?: string
          monto_aprobado?: number | null
          monto_facturado?: number
          monto_reclamado?: number
          motivo_glosa?: string | null
          paciente_id?: string | null
          procedimiento?: string | null
          reclamacion_id: string
        }
        Update: {
          autorizacion_id?: string | null
          created_at?: string
          estado?: string | null
          factura_id?: string | null
          id?: string
          monto_aprobado?: number | null
          monto_facturado?: number
          monto_reclamado?: number
          motivo_glosa?: string | null
          paciente_id?: string | null
          procedimiento?: string | null
          reclamacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reclamaciones_detalle_autorizacion_id_fkey"
            columns: ["autorizacion_id"]
            isOneToOne: false
            referencedRelation: "autorizaciones_medicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamaciones_detalle_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamaciones_detalle_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reclamaciones_detalle_reclamacion_id_fkey"
            columns: ["reclamacion_id"]
            isOneToOne: false
            referencedRelation: "reclamaciones_ars"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_llamadas: {
        Row: {
          archivos_adjuntos: Json | null
          comentarios_resultados: string | null
          confirmado_por_recordatorio: boolean | null
          created_at: string | null
          duracion_estimada: number | null
          duracion_minutos: number | null
          estado: Database["public"]["Enums"]["estado_llamada"] | null
          fecha_agendada: string | null
          fecha_confirmacion: string | null
          fecha_hora_realizada: string | null
          id: string
          llamada_origen_id: string | null
          motivo: string | null
          notas_adicionales: string | null
          paciente_id: string | null
          profesional_id: string | null
          reagendada: boolean | null
          recordatorio_enviado: boolean | null
          requiere_seguimiento: boolean | null
          resultado_seguimiento:
            | Database["public"]["Enums"]["resultado_seguimiento"]
            | null
          sucursal_id: string | null
          workspace_id: string | null
        }
        Insert: {
          archivos_adjuntos?: Json | null
          comentarios_resultados?: string | null
          confirmado_por_recordatorio?: boolean | null
          created_at?: string | null
          duracion_estimada?: number | null
          duracion_minutos?: number | null
          estado?: Database["public"]["Enums"]["estado_llamada"] | null
          fecha_agendada?: string | null
          fecha_confirmacion?: string | null
          fecha_hora_realizada?: string | null
          id?: string
          llamada_origen_id?: string | null
          motivo?: string | null
          notas_adicionales?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          reagendada?: boolean | null
          recordatorio_enviado?: boolean | null
          requiere_seguimiento?: boolean | null
          resultado_seguimiento?:
            | Database["public"]["Enums"]["resultado_seguimiento"]
            | null
          sucursal_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          archivos_adjuntos?: Json | null
          comentarios_resultados?: string | null
          confirmado_por_recordatorio?: boolean | null
          created_at?: string | null
          duracion_estimada?: number | null
          duracion_minutos?: number | null
          estado?: Database["public"]["Enums"]["estado_llamada"] | null
          fecha_agendada?: string | null
          fecha_confirmacion?: string | null
          fecha_hora_realizada?: string | null
          id?: string
          llamada_origen_id?: string | null
          motivo?: string | null
          notas_adicionales?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          reagendada?: boolean | null
          recordatorio_enviado?: boolean | null
          requiere_seguimiento?: boolean | null
          resultado_seguimiento?:
            | Database["public"]["Enums"]["resultado_seguimiento"]
            | null
          sucursal_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_registro_llamadas_paciente"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_registro_llamadas_profesional"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_llamadas_llamada_origen_id_fkey"
            columns: ["llamada_origen_id"]
            isOneToOne: false
            referencedRelation: "registro_llamadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_llamadas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_llamadas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_llamadas_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registro_llamadas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_bi_guardados: {
        Row: {
          compartido: boolean
          configuracion: Json
          creado_por: string
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          compartido?: boolean
          configuracion?: Json
          creado_por: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          compartido?: boolean
          configuracion?: Json
          creado_por?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_bi_guardados_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_envios_log: {
        Row: {
          archivo_url: string | null
          created_at: string
          destinatarios: Json
          error_mensaje: string | null
          estado: string
          id: string
          metadata: Json
          reporte_id: string
        }
        Insert: {
          archivo_url?: string | null
          created_at?: string
          destinatarios?: Json
          error_mensaje?: string | null
          estado?: string
          id?: string
          metadata?: Json
          reporte_id: string
        }
        Update: {
          archivo_url?: string | null
          created_at?: string
          destinatarios?: Json
          error_mensaje?: string | null
          estado?: string
          id?: string
          metadata?: Json
          reporte_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_envios_log_reporte_id_fkey"
            columns: ["reporte_id"]
            isOneToOne: false
            referencedRelation: "reportes_programados"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_programados: {
        Row: {
          activo: boolean
          created_at: string
          created_by: string | null
          destinatarios: Json
          dia_envio: number | null
          filtros: Json
          formato: string
          frecuencia: string
          hora_envio: string
          id: string
          nombre: string
          proximo_envio: string | null
          tipo_reporte: string
          ultimo_envio: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          destinatarios?: Json
          dia_envio?: number | null
          filtros?: Json
          formato?: string
          frecuencia?: string
          hora_envio?: string
          id?: string
          nombre: string
          proximo_envio?: string | null
          tipo_reporte: string
          ultimo_envio?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          created_by?: string | null
          destinatarios?: Json
          dia_envio?: number | null
          filtros?: Json
          formato?: string
          frecuencia?: string
          hora_envio?: string
          id?: string
          nombre?: string
          proximo_envio?: string | null
          tipo_reporte?: string
          ultimo_envio?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      respuestas_encuestas: {
        Row: {
          completada: boolean | null
          created_at: string | null
          encuesta_id: string | null
          id: string
          paciente_id: string | null
          puntuacion_general: number | null
          respuestas: Json
          token: string | null
          token_expira_at: string | null
          token_usado: boolean | null
          updated_at: string | null
        }
        Insert: {
          completada?: boolean | null
          created_at?: string | null
          encuesta_id?: string | null
          id?: string
          paciente_id?: string | null
          puntuacion_general?: number | null
          respuestas?: Json
          token?: string | null
          token_expira_at?: string | null
          token_usado?: boolean | null
          updated_at?: string | null
        }
        Update: {
          completada?: boolean | null
          created_at?: string | null
          encuesta_id?: string | null
          id?: string
          paciente_id?: string | null
          puntuacion_general?: number | null
          respuestas?: Json
          token?: string | null
          token_expira_at?: string | null
          token_usado?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_encuestas_encuesta_id_fkey"
            columns: ["encuesta_id"]
            isOneToOne: false
            referencedRelation: "encuestas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_encuestas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      salas_operacion: {
        Row: {
          activa: boolean
          capacidad: number | null
          created_at: string
          equipamiento: Json | null
          id: string
          nombre: string
          notas: string | null
          sucursal_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activa?: boolean
          capacidad?: number | null
          created_at?: string
          equipamiento?: Json | null
          id?: string
          nombre: string
          notas?: string | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activa?: boolean
          capacidad?: number | null
          created_at?: string
          equipamiento?: Json | null
          id?: string
          nombre?: string
          notas?: string | null
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salas_operacion_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salas_operacion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      seguros_paciente: {
        Row: {
          activo: boolean
          aseguradora: string
          created_at: string
          created_by: string | null
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          id: string
          notas: string | null
          numero_afiliado: string | null
          numero_poliza: string | null
          paciente_id: string
          parentesco_titular: string | null
          plan: string | null
          titular: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          aseguradora: string
          created_at?: string
          created_by?: string | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          numero_afiliado?: string | null
          numero_poliza?: string | null
          paciente_id: string
          parentesco_titular?: string | null
          plan?: string | null
          titular?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          aseguradora?: string
          created_at?: string
          created_by?: string | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          numero_afiliado?: string | null
          numero_poliza?: string | null
          paciente_id?: string
          parentesco_titular?: string | null
          plan?: string | null
          titular?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguros_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_rehabilitacion: {
        Row: {
          asistio: boolean | null
          created_at: string
          dolor_antes: number | null
          dolor_despues: number | null
          duracion_minutos: number | null
          ejercicios: Json | null
          fecha: string
          id: string
          notas: string | null
          numero_sesion: number
          plan_id: string
          progreso_pct: number | null
        }
        Insert: {
          asistio?: boolean | null
          created_at?: string
          dolor_antes?: number | null
          dolor_despues?: number | null
          duracion_minutos?: number | null
          ejercicios?: Json | null
          fecha?: string
          id?: string
          notas?: string | null
          numero_sesion?: number
          plan_id: string
          progreso_pct?: number | null
        }
        Update: {
          asistio?: boolean | null
          created_at?: string
          dolor_antes?: number | null
          dolor_despues?: number | null
          duracion_minutos?: number | null
          ejercicios?: Json | null
          fecha?: string
          id?: string
          notas?: string | null
          numero_sesion?: number
          plan_id?: string
          progreso_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_rehabilitacion_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_rehabilitacion"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_transfusion: {
        Row: {
          cantidad: number | null
          componente_solicitado: string
          created_at: string
          estado: string
          id: string
          medico_solicitante_id: string | null
          notas: string | null
          numero: string | null
          paciente_id: string
          prueba_compatibilidad: boolean | null
          tipo_sangre_paciente: string | null
          unidad_sangre_id: string | null
          updated_at: string
          urgencia: string
          workspace_id: string
        }
        Insert: {
          cantidad?: number | null
          componente_solicitado?: string
          created_at?: string
          estado?: string
          id?: string
          medico_solicitante_id?: string | null
          notas?: string | null
          numero?: string | null
          paciente_id: string
          prueba_compatibilidad?: boolean | null
          tipo_sangre_paciente?: string | null
          unidad_sangre_id?: string | null
          updated_at?: string
          urgencia?: string
          workspace_id: string
        }
        Update: {
          cantidad?: number | null
          componente_solicitado?: string
          created_at?: string
          estado?: string
          id?: string
          medico_solicitante_id?: string | null
          notas?: string | null
          numero?: string | null
          paciente_id?: string
          prueba_compatibilidad?: boolean | null
          tipo_sangre_paciente?: string | null
          unidad_sangre_id?: string | null
          updated_at?: string
          urgencia?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_transfusion_medico_solicitante_id_fkey"
            columns: ["medico_solicitante_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_transfusion_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_transfusion_unidad_sangre_id_fkey"
            columns: ["unidad_sangre_id"]
            isOneToOne: false
            referencedRelation: "unidades_sangre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitudes_transfusion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_farmacia: {
        Row: {
          cantidad: number
          created_at: string
          fecha_vencimiento: string | null
          id: string
          lote: string | null
          medicamento: string
          precio_unitario: number | null
          presentacion: string | null
          stock_minimo: number
          sucursal_id: string | null
          ubicacion: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          cantidad?: number
          created_at?: string
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          medicamento: string
          precio_unitario?: number | null
          presentacion?: string | null
          stock_minimo?: number
          sucursal_id?: string | null
          ubicacion?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          medicamento?: string
          precio_unitario?: number | null
          presentacion?: string | null
          stock_minimo?: number
          sucursal_id?: string | null
          ubicacion?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_farmacia_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_farmacia_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscripciones: {
        Row: {
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          metadata: Json | null
          moneda: string | null
          monto: number | null
          plan_codigo: string
          proveedor: string
          proveedor_subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          metadata?: Json | null
          moneda?: string | null
          monto?: number | null
          plan_codigo: string
          proveedor?: string
          proveedor_subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          metadata?: Json | null
          moneda?: string | null
          monto?: number | null
          plan_codigo?: string
          proveedor?: string
          proveedor_subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscripciones_plan_codigo_fkey"
            columns: ["plan_codigo"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "subscripciones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      subscripciones_workspace: {
        Row: {
          cancelar_al_finalizar: boolean
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          metadata: Json
          periodo_actual_fin: string | null
          periodo_actual_inicio: string | null
          plan_codigo: string
          proveedor: string
          proveedor_customer_id: string | null
          proveedor_subscription_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cancelar_al_finalizar?: boolean
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          metadata?: Json
          periodo_actual_fin?: string | null
          periodo_actual_inicio?: string | null
          plan_codigo: string
          proveedor?: string
          proveedor_customer_id?: string | null
          proveedor_subscription_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cancelar_al_finalizar?: boolean
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          metadata?: Json
          periodo_actual_fin?: string | null
          periodo_actual_inicio?: string | null
          plan_codigo?: string
          proveedor?: string
          proveedor_customer_id?: string | null
          proveedor_subscription_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscripciones_workspace_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sucursales: {
        Row: {
          activo: boolean
          ciudad: string | null
          codigo: string | null
          configuracion: Json
          created_at: string
          direccion: string | null
          email: string | null
          es_principal: boolean
          id: string
          latitud: number | null
          longitud: number | null
          nombre: string
          pais: string | null
          telefono: string | null
          updated_at: string
          workspace_id: string
          zona: string | null
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          codigo?: string | null
          configuracion?: Json
          created_at?: string
          direccion?: string | null
          email?: string | null
          es_principal?: boolean
          id?: string
          latitud?: number | null
          longitud?: number | null
          nombre: string
          pais?: string | null
          telefono?: string | null
          updated_at?: string
          workspace_id: string
          zona?: string | null
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          codigo?: string | null
          configuracion?: Json
          created_at?: string
          direccion?: string | null
          email?: string | null
          es_principal?: boolean
          id?: string
          latitud?: number | null
          longitud?: number | null
          nombre?: string
          pais?: string | null
          telefono?: string | null
          updated_at?: string
          workspace_id?: string
          zona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sucursales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifarios_ars: {
        Row: {
          activo: boolean
          aseguradora_id: string
          cobertura_porcentaje: number | null
          codigo_procedimiento: string
          created_at: string
          descripcion: string
          id: string
          plan_seguro_id: string | null
          precio_convenio: number | null
          precio_lista: number
          requiere_autorizacion: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          aseguradora_id: string
          cobertura_porcentaje?: number | null
          codigo_procedimiento: string
          created_at?: string
          descripcion: string
          id?: string
          plan_seguro_id?: string | null
          precio_convenio?: number | null
          precio_lista?: number
          requiere_autorizacion?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          aseguradora_id?: string
          cobertura_porcentaje?: number | null
          codigo_procedimiento?: string
          created_at?: string
          descripcion?: string
          id?: string
          plan_seguro_id?: string | null
          precio_convenio?: number | null
          precio_lista?: number
          requiere_autorizacion?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarifarios_ars_aseguradora_id_fkey"
            columns: ["aseguradora_id"]
            isOneToOne: false
            referencedRelation: "aseguradoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarifarios_ars_plan_seguro_id_fkey"
            columns: ["plan_seguro_id"]
            isOneToOne: false
            referencedRelation: "planes_seguro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarifarios_ars_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tratamientos_dentales: {
        Row: {
          costo_estimado: number
          created_at: string
          estado: Database["public"]["Enums"]["estado_tratamiento_dental"]
          fecha_realizado: string | null
          hallazgo_id: string
          id: string
          notas: string | null
          presupuesto_id: string | null
          procedimiento: string
          updated_at: string
        }
        Insert: {
          costo_estimado?: number
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_tratamiento_dental"]
          fecha_realizado?: string | null
          hallazgo_id: string
          id?: string
          notas?: string | null
          presupuesto_id?: string | null
          procedimiento: string
          updated_at?: string
        }
        Update: {
          costo_estimado?: number
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_tratamiento_dental"]
          fecha_realizado?: string | null
          hallazgo_id?: string
          id?: string
          notas?: string | null
          presupuesto_id?: string | null
          procedimiento?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tratamientos_dentales_hallazgo_id_fkey"
            columns: ["hallazgo_id"]
            isOneToOne: false
            referencedRelation: "hallazgos_dentales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamientos_dentales_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos_dentales"
            referencedColumns: ["id"]
          },
        ]
      }
      triaje_eventos: {
        Row: {
          admision_id: string | null
          alergias_relevantes: string | null
          color: string
          created_at: string
          derivado_a: string | null
          discriminador: string | null
          enfermera_id: string | null
          fecha_triaje: string
          flujograma: string | null
          id: string
          motivo_consulta: string
          nivel: number
          notas: string | null
          paciente_id: string
          signos_vitales: Json
          sucursal_id: string | null
          tiempo_objetivo_min: number | null
          workspace_id: string | null
        }
        Insert: {
          admision_id?: string | null
          alergias_relevantes?: string | null
          color: string
          created_at?: string
          derivado_a?: string | null
          discriminador?: string | null
          enfermera_id?: string | null
          fecha_triaje?: string
          flujograma?: string | null
          id?: string
          motivo_consulta: string
          nivel: number
          notas?: string | null
          paciente_id: string
          signos_vitales?: Json
          sucursal_id?: string | null
          tiempo_objetivo_min?: number | null
          workspace_id?: string | null
        }
        Update: {
          admision_id?: string | null
          alergias_relevantes?: string | null
          color?: string
          created_at?: string
          derivado_a?: string | null
          discriminador?: string | null
          enfermera_id?: string | null
          fecha_triaje?: string
          flujograma?: string | null
          id?: string
          motivo_consulta?: string
          nivel?: number
          notas?: string | null
          paciente_id?: string
          signos_vitales?: Json
          sucursal_id?: string | null
          tiempo_objetivo_min?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "triaje_eventos_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
        ]
      }
      turnos_cola: {
        Row: {
          consultorio: string | null
          created_at: string
          estado: string
          hora_atencion: string | null
          hora_fin: string | null
          hora_llamado: string | null
          hora_llegada: string
          id: string
          notas: string | null
          numero: string
          paciente_id: string | null
          prioridad: string
          profesional_id: string | null
          servicio: string
          sucursal_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          consultorio?: string | null
          created_at?: string
          estado?: string
          hora_atencion?: string | null
          hora_fin?: string | null
          hora_llamado?: string | null
          hora_llegada?: string
          id?: string
          notas?: string | null
          numero: string
          paciente_id?: string | null
          prioridad?: string
          profesional_id?: string | null
          servicio?: string
          sucursal_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          consultorio?: string | null
          created_at?: string
          estado?: string
          hora_atencion?: string | null
          hora_fin?: string | null
          hora_llamado?: string | null
          hora_llegada?: string
          id?: string
          notas?: string | null
          numero?: string
          paciente_id?: string | null
          prioridad?: string
          profesional_id?: string | null
          servicio?: string
          sucursal_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turnos_cola_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_cola_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_cola_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turnos_cola_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      uci_balance_hidrico: {
        Row: {
          admision_id: string
          balance_ml: number | null
          created_at: string
          egresos_detalle: Json
          egresos_ml: number
          fecha: string
          id: string
          ingresos_detalle: Json
          ingresos_ml: number
          notas: string | null
          paciente_id: string
          registrado_por: string | null
        }
        Insert: {
          admision_id: string
          balance_ml?: number | null
          created_at?: string
          egresos_detalle?: Json
          egresos_ml?: number
          fecha?: string
          id?: string
          ingresos_detalle?: Json
          ingresos_ml?: number
          notas?: string | null
          paciente_id: string
          registrado_por?: string | null
        }
        Update: {
          admision_id?: string
          balance_ml?: number | null
          created_at?: string
          egresos_detalle?: Json
          egresos_ml?: number
          fecha?: string
          id?: string
          ingresos_detalle?: Json
          ingresos_ml?: number
          notas?: string | null
          paciente_id?: string
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uci_balance_hidrico_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
        ]
      }
      uci_infusiones: {
        Row: {
          admision_id: string
          created_at: string
          created_by: string | null
          dosis: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          medicamento: string
          notas: string | null
          paciente_id: string
          velocidad: string | null
          via: string | null
        }
        Insert: {
          admision_id: string
          created_at?: string
          created_by?: string | null
          dosis?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          medicamento: string
          notas?: string | null
          paciente_id: string
          velocidad?: string | null
          via?: string | null
        }
        Update: {
          admision_id?: string
          created_at?: string
          created_by?: string | null
          dosis?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          medicamento?: string
          notas?: string | null
          paciente_id?: string
          velocidad?: string | null
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uci_infusiones_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
        ]
      }
      uci_notas: {
        Row: {
          admision_id: string
          apache_ii_score: number | null
          created_at: string
          estado_cardiovascular: string | null
          estado_neurologico: string | null
          estado_renal: string | null
          estado_respiratorio: string | null
          fecha: string
          glasgow: number | null
          hemodinamia: Json
          id: string
          notas: string | null
          paciente_id: string
          profesional_id: string | null
          sofa_score: number | null
          ventilacion: Json
        }
        Insert: {
          admision_id: string
          apache_ii_score?: number | null
          created_at?: string
          estado_cardiovascular?: string | null
          estado_neurologico?: string | null
          estado_renal?: string | null
          estado_respiratorio?: string | null
          fecha?: string
          glasgow?: number | null
          hemodinamia?: Json
          id?: string
          notas?: string | null
          paciente_id: string
          profesional_id?: string | null
          sofa_score?: number | null
          ventilacion?: Json
        }
        Update: {
          admision_id?: string
          apache_ii_score?: number | null
          created_at?: string
          estado_cardiovascular?: string | null
          estado_neurologico?: string | null
          estado_renal?: string | null
          estado_respiratorio?: string | null
          fecha?: string
          glasgow?: number | null
          hemodinamia?: Json
          id?: string
          notas?: string | null
          paciente_id?: string
          profesional_id?: string | null
          sofa_score?: number | null
          ventilacion?: Json
        }
        Relationships: [
          {
            foreignKeyName: "uci_notas_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_sangre: {
        Row: {
          componente: string
          created_at: string
          donante_id: string | null
          estado: string
          factor_rh: string
          fecha_extraccion: string
          fecha_vencimiento: string | null
          id: string
          lote: string | null
          notas: string | null
          temperatura_almacenamiento: string | null
          tipo_sangre: string
          updated_at: string
          volumen_ml: number | null
          workspace_id: string
        }
        Insert: {
          componente?: string
          created_at?: string
          donante_id?: string | null
          estado?: string
          factor_rh?: string
          fecha_extraccion?: string
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          notas?: string | null
          temperatura_almacenamiento?: string | null
          tipo_sangre: string
          updated_at?: string
          volumen_ml?: number | null
          workspace_id: string
        }
        Update: {
          componente?: string
          created_at?: string
          donante_id?: string | null
          estado?: string
          factor_rh?: string
          fecha_extraccion?: string
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          notas?: string | null
          temperatura_almacenamiento?: string | null
          tipo_sangre?: string
          updated_at?: string
          volumen_ml?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidades_sangre_donante_id_fkey"
            columns: ["donante_id"]
            isOneToOne: false
            referencedRelation: "donantes_sangre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_sangre_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          accion: string
          created_at: string | null
          descripcion: string | null
          id: string
          realizado_por: string | null
          user_id: string | null
        }
        Insert: {
          accion: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          realizado_por?: string | null
          user_id?: string | null
        }
        Update: {
          accion?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          realizado_por?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          sidebar_collapsed: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vacaciones_permisos: {
        Row: {
          aprobado_por: string | null
          created_at: string
          dias: number
          empleado_id: string
          estado: Database["public"]["Enums"]["estado_permiso_rrhh"]
          fecha_fin: string
          fecha_inicio: string
          id: string
          notas: string | null
          numero: string | null
          tipo: Database["public"]["Enums"]["tipo_permiso_rrhh"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          aprobado_por?: string | null
          created_at?: string
          dias?: number
          empleado_id: string
          estado?: Database["public"]["Enums"]["estado_permiso_rrhh"]
          fecha_fin: string
          fecha_inicio: string
          id?: string
          notas?: string | null
          numero?: string | null
          tipo?: Database["public"]["Enums"]["tipo_permiso_rrhh"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          aprobado_por?: string | null
          created_at?: string
          dias?: number
          empleado_id?: string
          estado?: Database["public"]["Enums"]["estado_permiso_rrhh"]
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          notas?: string | null
          numero?: string | null
          tipo?: Database["public"]["Enums"]["tipo_permiso_rrhh"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacaciones_permisos_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados_nomina"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacaciones_permisos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      visitas_profesionales: {
        Row: {
          created_at: string | null
          id: string
          profesional_id: string | null
          visita_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profesional_id?: string | null
          visita_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profesional_id?: string | null
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitas_profesionales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitas_profesionales_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          estado: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_member_role"]
          token: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          estado?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_member_role"]
          token?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          estado?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_member_role"]
          token?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["workspace_member_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_member_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_member_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          configuracion: Json
          country_code: string | null
          created_at: string
          currency_code: string | null
          direccion: string | null
          email_contacto: string | null
          estado: string
          id: string
          instrucciones_cita: string | null
          logo_url: string | null
          nombre: string
          owner_id: string
          plan_codigo: string
          sitio_web: string | null
          slug: string
          telefono: string | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          configuracion?: Json
          country_code?: string | null
          created_at?: string
          currency_code?: string | null
          direccion?: string | null
          email_contacto?: string | null
          estado?: string
          id?: string
          instrucciones_cita?: string | null
          logo_url?: string | null
          nombre: string
          owner_id: string
          plan_codigo?: string
          sitio_web?: string | null
          slug: string
          telefono?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          configuracion?: Json
          country_code?: string | null
          created_at?: string
          currency_code?: string | null
          direccion?: string | null
          email_contacto?: string | null
          estado?: string
          id?: string
          instrucciones_cita?: string | null
          logo_url?: string | null
          nombre?: string
          owner_id?: string
          plan_codigo?: string
          sitio_web?: string | null
          slug?: string
          telefono?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_plan_codigo_fkey"
            columns: ["plan_codigo"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["codigo"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_workspace_invitation: { Args: { _token: string }; Returns: Json }
      anonimizar_paciente_seguro: {
        Args: { _motivo?: string; _paciente_id: string }
        Returns: Json
      }
      aplicar_politica_retencion: {
        Args: { _dry_run?: boolean; _workspace_id?: string }
        Returns: Json
      }
      calcular_cierre_caja: {
        Args: { _fecha: string; _sucursal_id?: string; _workspace_id: string }
        Returns: Json
      }
      calcular_indicadores_llamadas: {
        Args: {
          fecha_fin?: string
          fecha_inicio?: string
          profesional_uuid?: string
        }
        Returns: {
          duracion_promedio: number
          llamadas_canceladas: number
          llamadas_contactadas: number
          llamadas_pendientes: number
          llamadas_realizadas: number
          requieren_seguimiento: number
          tasa_contacto: number
          total_llamadas: number
        }[]
      }
      detectar_accesos_sospechosos: {
        Args: { _workspace_id?: string }
        Returns: number
      }
      estadisticas_salud_sistema: { Args: never; Returns: Json }
      generar_codigo_ticket: { Args: never; Returns: string }
      generar_resumen_auditoria: {
        Args: { _periodo?: string; _workspace_id?: string }
        Returns: string
      }
      get_invitation_details: { Args: { _token: string }; Returns: Json }
      get_user_module_permissions: {
        Args: { _user_id: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          module_name: string
        }[]
      }
      get_user_workspaces: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["workspace_member_role"]
          workspace_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_coordinador: { Args: { _user_id: string }; Returns: boolean }
      is_member_of_sucursal: {
        Args: { _sucursal_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff_clinico_de_paciente: {
        Args: { _paciente_id: string; _user_id: string }
        Returns: boolean
      }
      is_staff_clinico_de_profesional: {
        Args: { _profesional_id: string; _user_id: string }
        Returns: boolean
      }
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      limite_centros_profesional: {
        Args: { _user_id: string }
        Returns: number
      }
      listar_pacientes_para_anonimizar: {
        Args: { _workspace_id: string }
        Returns: {
          meses_inactivo: number
          motivo: string
          nombre_completo: string
          paciente_id: string
          ultima_actividad: string
        }[]
      }
      listar_recordatorios_pendientes: {
        Args: { _horas?: number }
        Returns: {
          cita_id: string
          fecha: string
          paciente_id: string
          paciente_nombre: string
          paciente_telefono: string
          tipo: string
          workspace_id: string
        }[]
      }
      portal_paciente_datos: { Args: { _token: string }; Returns: Json }
      registrar_acceso_ficha: {
        Args: {
          _accion?: string
          _metadata?: Json
          _paciente_id: string
          _recurso: string
        }
        Returns: string
      }
      registrar_cron_ejecucion: {
        Args: {
          _duracion_ms?: number
          _error?: string
          _exitoso: boolean
          _job: string
          _resultado?: Json
        }
        Returns: string
      }
      set_motivo_cambio: { Args: { _motivo: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "coordinador" | "medico" | "enfermera" | "recepcion"
      cara_dental:
        | "oclusal"
        | "mesial"
        | "distal"
        | "vestibular"
        | "lingual"
        | "palatina"
        | "incisal"
      especialidad_medica:
        | "medicina_general"
        | "pediatria"
        | "ginecologia"
        | "cardiologia"
        | "dermatologia"
        | "odontologia"
        | "psicologia"
        | "laboratorio"
        | "imagenes"
        | "emergencias"
        | "otro"
      estado_asiento: "borrador" | "aprobado" | "anulado"
      estado_autorizacion:
        | "solicitada"
        | "en_revision"
        | "aprobada"
        | "rechazada"
        | "vencida"
        | "cancelada"
      estado_campana: "borrador" | "activa" | "pausada" | "finalizada"
      estado_cierre: "abierto" | "cerrado"
      estado_cirugia:
        | "programada"
        | "en_curso"
        | "completada"
        | "cancelada"
        | "suspendida"
      estado_espera: "esperando" | "asignada" | "cancelada" | "expirada"
      estado_estudio_imagen:
        | "solicitado"
        | "programado"
        | "en_proceso"
        | "completado"
        | "cancelado"
      estado_hallazgo_dental: "activo" | "tratado" | "observacion"
      estado_lead:
        | "nuevo"
        | "contactado"
        | "calificado"
        | "propuesta"
        | "ganado"
        | "perdido"
      estado_llamada:
        | "agendada"
        | "realizada"
        | "pospuesta"
        | "cancelada"
        | "pendiente"
        | "reagendada"
        | "no_contesta"
      estado_nota_credito: "pendiente" | "aprobada" | "rechazada" | "aplicada"
      estado_orden_compra:
        | "borrador"
        | "enviada"
        | "parcial"
        | "recibida"
        | "cancelada"
      estado_orden_lab:
        | "pendiente"
        | "en_proceso"
        | "parcial"
        | "completada"
        | "cancelada"
      estado_periodo_nomina:
        | "borrador"
        | "calculado"
        | "aprobado"
        | "pagado"
        | "anulado"
      estado_permiso_rrhh: "solicitado" | "aprobado" | "rechazado" | "cancelado"
      estado_presupuesto_dental:
        | "borrador"
        | "presentado"
        | "aceptado"
        | "rechazado"
      estado_receta: "activa" | "dispensada" | "vencida" | "cancelada"
      estado_reclamacion:
        | "borrador"
        | "enviada"
        | "en_revision"
        | "pagada"
        | "rechazada"
        | "parcial"
        | "anulada"
      estado_tratamiento_dental:
        | "pendiente"
        | "en_proceso"
        | "completado"
        | "cancelado"
      estado_visita:
        | "pendiente"
        | "realizada"
        | "cancelada"
        | "postpuesta"
        | "no_realizada"
      grado_dificultad: "bajo" | "medio" | "alto"
      naturaleza_cuenta: "deudora" | "acreedora"
      origen_lead: "web" | "referido" | "redes" | "publicidad" | "otro"
      prioridad_cirugia: "electiva" | "urgente" | "emergencia"
      prioridad_espera: "normal" | "alta" | "urgente"
      prioridad_estudio_imagen: "rutina" | "urgente" | "stat"
      prioridad_lab: "rutina" | "urgente" | "stat"
      resultado_seguimiento:
        | "contactado"
        | "no_contestada"
        | "mensaje_dejado"
        | "llamada_fallida"
        | "requiere_seguimiento"
        | "visita_agendada"
        | "paciente_decline"
        | "no_disponible"
      rol_quirurgico:
        | "cirujano_principal"
        | "asistente"
        | "anestesiologo"
        | "instrumentista"
        | "circulante"
      status_paciente:
        | "activo"
        | "inactivo"
        | "fallecido"
        | "renuncio"
        | "cambio_ars"
      tipo_contrato_rrhh: "indefinido" | "temporal" | "pasantia" | "servicios"
      tipo_cuenta_contable:
        | "activo"
        | "pasivo"
        | "capital"
        | "ingreso"
        | "gasto"
        | "costo"
      tipo_hallazgo_dental:
        | "caries"
        | "fractura"
        | "ausente"
        | "corona"
        | "endodoncia"
        | "implante"
        | "sellante"
        | "obturacion"
        | "protesis"
        | "movilidad"
        | "sano"
      tipo_interaccion_crm:
        | "llamada"
        | "email"
        | "reunion"
        | "whatsapp"
        | "nota"
      tipo_permiso_rrhh:
        | "vacaciones"
        | "licencia_medica"
        | "permiso_personal"
        | "maternidad"
        | "paternidad"
        | "duelo"
        | "sin_goce"
      tipo_visita: "ambulatorio" | "domicilio"
      user_role:
        | "admin"
        | "admin_centro"
        | "medico"
        | "enfermera"
        | "coordinador"
        | "recepcion"
      workspace_member_role: "owner" | "admin" | "member"
      zona_distrito:
        | "santo_domingo_oeste"
        | "santo_domingo_este"
        | "santo_domingo_norte"
        | "distrito_nacional"
        | "San Luis"
        | "Los Alcarrizos"
        | "Boca Chica"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "coordinador", "medico", "enfermera", "recepcion"],
      cara_dental: [
        "oclusal",
        "mesial",
        "distal",
        "vestibular",
        "lingual",
        "palatina",
        "incisal",
      ],
      especialidad_medica: [
        "medicina_general",
        "pediatria",
        "ginecologia",
        "cardiologia",
        "dermatologia",
        "odontologia",
        "psicologia",
        "laboratorio",
        "imagenes",
        "emergencias",
        "otro",
      ],
      estado_asiento: ["borrador", "aprobado", "anulado"],
      estado_autorizacion: [
        "solicitada",
        "en_revision",
        "aprobada",
        "rechazada",
        "vencida",
        "cancelada",
      ],
      estado_campana: ["borrador", "activa", "pausada", "finalizada"],
      estado_cierre: ["abierto", "cerrado"],
      estado_cirugia: [
        "programada",
        "en_curso",
        "completada",
        "cancelada",
        "suspendida",
      ],
      estado_espera: ["esperando", "asignada", "cancelada", "expirada"],
      estado_estudio_imagen: [
        "solicitado",
        "programado",
        "en_proceso",
        "completado",
        "cancelado",
      ],
      estado_hallazgo_dental: ["activo", "tratado", "observacion"],
      estado_lead: [
        "nuevo",
        "contactado",
        "calificado",
        "propuesta",
        "ganado",
        "perdido",
      ],
      estado_llamada: [
        "agendada",
        "realizada",
        "pospuesta",
        "cancelada",
        "pendiente",
        "reagendada",
        "no_contesta",
      ],
      estado_nota_credito: ["pendiente", "aprobada", "rechazada", "aplicada"],
      estado_orden_compra: [
        "borrador",
        "enviada",
        "parcial",
        "recibida",
        "cancelada",
      ],
      estado_orden_lab: [
        "pendiente",
        "en_proceso",
        "parcial",
        "completada",
        "cancelada",
      ],
      estado_periodo_nomina: [
        "borrador",
        "calculado",
        "aprobado",
        "pagado",
        "anulado",
      ],
      estado_permiso_rrhh: ["solicitado", "aprobado", "rechazado", "cancelado"],
      estado_presupuesto_dental: [
        "borrador",
        "presentado",
        "aceptado",
        "rechazado",
      ],
      estado_receta: ["activa", "dispensada", "vencida", "cancelada"],
      estado_reclamacion: [
        "borrador",
        "enviada",
        "en_revision",
        "pagada",
        "rechazada",
        "parcial",
        "anulada",
      ],
      estado_tratamiento_dental: [
        "pendiente",
        "en_proceso",
        "completado",
        "cancelado",
      ],
      estado_visita: [
        "pendiente",
        "realizada",
        "cancelada",
        "postpuesta",
        "no_realizada",
      ],
      grado_dificultad: ["bajo", "medio", "alto"],
      naturaleza_cuenta: ["deudora", "acreedora"],
      origen_lead: ["web", "referido", "redes", "publicidad", "otro"],
      prioridad_cirugia: ["electiva", "urgente", "emergencia"],
      prioridad_espera: ["normal", "alta", "urgente"],
      prioridad_estudio_imagen: ["rutina", "urgente", "stat"],
      prioridad_lab: ["rutina", "urgente", "stat"],
      resultado_seguimiento: [
        "contactado",
        "no_contestada",
        "mensaje_dejado",
        "llamada_fallida",
        "requiere_seguimiento",
        "visita_agendada",
        "paciente_decline",
        "no_disponible",
      ],
      rol_quirurgico: [
        "cirujano_principal",
        "asistente",
        "anestesiologo",
        "instrumentista",
        "circulante",
      ],
      status_paciente: [
        "activo",
        "inactivo",
        "fallecido",
        "renuncio",
        "cambio_ars",
      ],
      tipo_contrato_rrhh: ["indefinido", "temporal", "pasantia", "servicios"],
      tipo_cuenta_contable: [
        "activo",
        "pasivo",
        "capital",
        "ingreso",
        "gasto",
        "costo",
      ],
      tipo_hallazgo_dental: [
        "caries",
        "fractura",
        "ausente",
        "corona",
        "endodoncia",
        "implante",
        "sellante",
        "obturacion",
        "protesis",
        "movilidad",
        "sano",
      ],
      tipo_interaccion_crm: ["llamada", "email", "reunion", "whatsapp", "nota"],
      tipo_permiso_rrhh: [
        "vacaciones",
        "licencia_medica",
        "permiso_personal",
        "maternidad",
        "paternidad",
        "duelo",
        "sin_goce",
      ],
      tipo_visita: ["ambulatorio", "domicilio"],
      user_role: [
        "admin",
        "admin_centro",
        "medico",
        "enfermera",
        "coordinador",
        "recepcion",
      ],
      workspace_member_role: ["owner", "admin", "member"],
      zona_distrito: [
        "santo_domingo_oeste",
        "santo_domingo_este",
        "santo_domingo_norte",
        "distrito_nacional",
        "San Luis",
        "Los Alcarrizos",
        "Boca Chica",
      ],
    },
  },
} as const
