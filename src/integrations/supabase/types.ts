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
      acciones_correctivas: {
        Row: {
          created_at: string
          descripcion: string
          estado: string
          evento_id: string | null
          evidencia: string | null
          fecha_completado: string | null
          fecha_limite: string | null
          id: string
          no_conformidad_id: string | null
          responsable_id: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: string
          evento_id?: string | null
          evidencia?: string | null
          fecha_completado?: string | null
          fecha_limite?: string | null
          id?: string
          no_conformidad_id?: string | null
          responsable_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: string
          evento_id?: string | null
          evidencia?: string | null
          fecha_completado?: string | null
          fecha_limite?: string | null
          id?: string
          no_conformidad_id?: string | null
          responsable_id?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acciones_correctivas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos_adversos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acciones_correctivas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      acuerdos_pareja: {
        Row: {
          caso_id: string
          created_at: string
          created_by: string | null
          cumplido: boolean | null
          descripcion: string | null
          fecha: string
          fecha_revision: string | null
          id: string
          responsable: string | null
          titulo: string
          workspace_id: string
        }
        Insert: {
          caso_id: string
          created_at?: string
          created_by?: string | null
          cumplido?: boolean | null
          descripcion?: string | null
          fecha?: string
          fecha_revision?: string | null
          id?: string
          responsable?: string | null
          titulo: string
          workspace_id: string
        }
        Update: {
          caso_id?: string
          created_at?: string
          created_by?: string | null
          cumplido?: boolean | null
          descripcion?: string | null
          fecha?: string
          fecha_revision?: string | null
          id?: string
          responsable?: string | null
          titulo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acuerdos_pareja_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos_pareja"
            referencedColumns: ["id"]
          },
        ]
      }
      administracion_medicamentos: {
        Row: {
          admision_id: string | null
          created_at: string | null
          dosis: string | null
          enfermera_id: string | null
          estado: string | null
          hora_administrada: string | null
          hora_programada: string | null
          id: string
          medicamento: string
          motivo_omision: string | null
          observaciones: string | null
          paciente_id: string
          via: string | null
        }
        Insert: {
          admision_id?: string | null
          created_at?: string | null
          dosis?: string | null
          enfermera_id?: string | null
          estado?: string | null
          hora_administrada?: string | null
          hora_programada?: string | null
          id?: string
          medicamento: string
          motivo_omision?: string | null
          observaciones?: string | null
          paciente_id: string
          via?: string | null
        }
        Update: {
          admision_id?: string | null
          created_at?: string | null
          dosis?: string | null
          enfermera_id?: string | null
          estado?: string | null
          hora_administrada?: string | null
          hora_programada?: string | null
          id?: string
          medicamento?: string
          motivo_omision?: string | null
          observaciones?: string | null
          paciente_id?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "administracion_medicamentos_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administracion_medicamentos_enfermera_id_fkey"
            columns: ["enfermera_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "administracion_medicamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
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
          vertical: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
      agenda_ia_predicciones: {
        Row: {
          accion_sugerida: string | null
          cita_id: string | null
          created_at: string
          estado: string
          factores: Json | null
          id: string
          paciente_id: string | null
          probabilidad: number
          tipo_prediccion: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          accion_sugerida?: string | null
          cita_id?: string | null
          created_at?: string
          estado?: string
          factores?: Json | null
          id?: string
          paciente_id?: string | null
          probabilidad?: number
          tipo_prediccion?: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          accion_sugerida?: string | null
          cita_id?: string | null
          created_at?: string
          estado?: string
          factores?: Json | null
          id?: string
          paciente_id?: string | null
          probabilidad?: number
          tipo_prediccion?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_ia_predicciones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_ia_sugerencias: {
        Row: {
          aplicada_at: string | null
          aplicada_por: string | null
          created_at: string
          datos: Json | null
          descripcion: string
          estado: string
          id: string
          prioridad: string
          tipo_sugerencia: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          aplicada_at?: string | null
          aplicada_por?: string | null
          created_at?: string
          datos?: Json | null
          descripcion: string
          estado?: string
          id?: string
          prioridad?: string
          tipo_sugerencia?: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          aplicada_at?: string | null
          aplicada_por?: string | null
          created_at?: string
          datos?: Json | null
          descripcion?: string
          estado?: string
          id?: string
          prioridad?: string
          tipo_sugerencia?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_ia_sugerencias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_servicios_recovery: {
        Row: {
          created_at: string
          estado: string
          fecha_hora: string
          id: string
          notas: string | null
          paciente_recovery_id: string
          personal_id: string | null
          servicio_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_hora: string
          id?: string
          notas?: string | null
          paciente_recovery_id: string
          personal_id?: string | null
          servicio_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_hora?: string
          id?: string
          notas?: string | null
          paciente_recovery_id?: string
          personal_id?: string | null
          servicio_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_servicios_recovery_paciente_recovery_id_fkey"
            columns: ["paciente_recovery_id"]
            isOneToOne: false
            referencedRelation: "pacientes_recovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_servicios_recovery_personal_id_fkey"
            columns: ["personal_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_servicios_recovery_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_recovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_servicios_recovery_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      alertas_clinicas: {
        Row: {
          asignado_a: string | null
          atendida_at: string | null
          atendida_por: string | null
          created_at: string
          datos: Json | null
          descripcion: string | null
          estado: string
          id: string
          modulo_origen: string | null
          paciente_id: string | null
          reconocida_at: string | null
          reconocida_por: string | null
          recurso_origen_id: string | null
          severidad: string
          tipo: string
          titulo: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          asignado_a?: string | null
          atendida_at?: string | null
          atendida_por?: string | null
          created_at?: string
          datos?: Json | null
          descripcion?: string | null
          estado?: string
          id?: string
          modulo_origen?: string | null
          paciente_id?: string | null
          reconocida_at?: string | null
          reconocida_por?: string | null
          recurso_origen_id?: string | null
          severidad?: string
          tipo: string
          titulo: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          asignado_a?: string | null
          atendida_at?: string | null
          atendida_por?: string | null
          created_at?: string
          datos?: Json | null
          descripcion?: string | null
          estado?: string
          id?: string
          modulo_origen?: string | null
          paciente_id?: string | null
          reconocida_at?: string | null
          reconocida_por?: string | null
          recurso_origen_id?: string | null
          severidad?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_clinicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_clinicas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_clinicas_acciones: {
        Row: {
          accion: string
          alerta_id: string
          created_at: string
          id: string
          notas: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          accion: string
          alerta_id: string
          created_at?: string
          id?: string
          notas?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          accion?: string
          alerta_id?: string
          created_at?: string
          id?: string
          notas?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_clinicas_acciones_alerta_id_fkey"
            columns: ["alerta_id"]
            isOneToOne: false
            referencedRelation: "alertas_clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_clinicas_acciones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_emergencia_recovery: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: string
          paciente_id: string | null
          reportado_por: string | null
          reserva_id: string | null
          resolucion: string | null
          resuelta: boolean | null
          resuelta_at: string | null
          severidad: string | null
          tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          paciente_id?: string | null
          reportado_por?: string | null
          reserva_id?: string | null
          resolucion?: string | null
          resuelta?: boolean | null
          resuelta_at?: string | null
          severidad?: string | null
          tipo: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: string
          paciente_id?: string | null
          reportado_por?: string | null
          reserva_id?: string | null
          resolucion?: string | null
          resuelta?: boolean | null
          resuelta_at?: string | null
          severidad?: string | null
          tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_emergencia_recovery_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_emergencia_recovery_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_recovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_emergencia_recovery_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      alertas_laboratorio: {
        Row: {
          created_at: string | null
          descripcion: string
          id: string
          notificado_a: string | null
          notificado_at: string | null
          orden_id: string | null
          paciente_id: string | null
          resuelto: boolean | null
          severidad: string | null
          tipo: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          id?: string
          notificado_a?: string | null
          notificado_at?: string | null
          orden_id?: string | null
          paciente_id?: string | null
          resuelto?: boolean | null
          severidad?: string | null
          tipo?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          id?: string
          notificado_a?: string | null
          notificado_at?: string | null
          orden_id?: string | null
          paciente_id?: string | null
          resuelto?: boolean | null
          severidad?: string | null
          tipo?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_laboratorio_notificado_a_fkey"
            columns: ["notificado_a"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_laboratorio_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_laboratorio_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_laboratorio_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      altas_hospitalarias: {
        Row: {
          actividad_fisica: string | null
          created_at: string
          created_by: string | null
          cuidados_domicilio: string | null
          diagnostico_principal: string | null
          diagnosticos_secundarios: string[] | null
          dieta_recomendada: string | null
          documento_pdf_url: string | null
          estado: string
          fecha_alta: string
          firma_medico_url: string | null
          firma_paciente_url: string | null
          hospitalizacion_id: string | null
          id: string
          indicaciones_paciente: string | null
          medicamentos_alta: Json | null
          medico_alta_id: string | null
          notas_adicionales: string | null
          paciente_id: string
          procedimientos_realizados: string | null
          proxima_cita_especialidad: string | null
          proxima_cita_fecha: string | null
          resumen_clinico: string | null
          signos_alarma: string | null
          tipo_alta: string
          updated_at: string
          vertical: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id: string
        }
        Insert: {
          actividad_fisica?: string | null
          created_at?: string
          created_by?: string | null
          cuidados_domicilio?: string | null
          diagnostico_principal?: string | null
          diagnosticos_secundarios?: string[] | null
          dieta_recomendada?: string | null
          documento_pdf_url?: string | null
          estado?: string
          fecha_alta?: string
          firma_medico_url?: string | null
          firma_paciente_url?: string | null
          hospitalizacion_id?: string | null
          id?: string
          indicaciones_paciente?: string | null
          medicamentos_alta?: Json | null
          medico_alta_id?: string | null
          notas_adicionales?: string | null
          paciente_id: string
          procedimientos_realizados?: string | null
          proxima_cita_especialidad?: string | null
          proxima_cita_fecha?: string | null
          resumen_clinico?: string | null
          signos_alarma?: string | null
          tipo_alta?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id: string
        }
        Update: {
          actividad_fisica?: string | null
          created_at?: string
          created_by?: string | null
          cuidados_domicilio?: string | null
          diagnostico_principal?: string | null
          diagnosticos_secundarios?: string[] | null
          dieta_recomendada?: string | null
          documento_pdf_url?: string | null
          estado?: string
          fecha_alta?: string
          firma_medico_url?: string | null
          firma_paciente_url?: string | null
          hospitalizacion_id?: string | null
          id?: string
          indicaciones_paciente?: string | null
          medicamentos_alta?: Json | null
          medico_alta_id?: string | null
          notas_adicionales?: string | null
          paciente_id?: string
          procedimientos_realizados?: string | null
          proxima_cita_especialidad?: string | null
          proxima_cita_fecha?: string | null
          resumen_clinico?: string | null
          signos_alarma?: string | null
          tipo_alta?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "altas_hospitalarias_medico_alta_id_fkey"
            columns: ["medico_alta_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "altas_hospitalarias_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "altas_hospitalarias_workspace_id_fkey"
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
      api_keys_externas: {
        Row: {
          activa: boolean | null
          created_at: string
          created_by: string | null
          id: string
          key_hash: string
          key_prefix: string
          nombre: string
          permisos: Json | null
          rate_limit_por_minuto: number | null
          total_requests: number | null
          ultimo_uso: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activa?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          nombre: string
          permisos?: Json | null
          rate_limit_por_minuto?: number | null
          total_requests?: number | null
          ultimo_uso?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activa?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          nombre?: string
          permisos?: Json | null
          rate_limit_por_minuto?: number | null
          total_requests?: number | null
          ultimo_uso?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_externas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ar_aging_snapshots: {
        Row: {
          created_at: string | null
          detalle: Json | null
          fecha_corte: string
          id: string
          rango_0_30: number | null
          rango_31_60: number | null
          rango_61_90: number | null
          rango_90_plus: number | null
          total: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          detalle?: Json | null
          fecha_corte: string
          id?: string
          rango_0_30?: number | null
          rango_31_60?: number | null
          rango_61_90?: number | null
          rango_90_plus?: number | null
          total?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          detalle?: Json | null
          fecha_corte?: string
          id?: string
          rango_0_30?: number | null
          rango_31_60?: number | null
          rango_61_90?: number | null
          rango_90_plus?: number | null
          total?: number | null
          workspace_id?: string
        }
        Relationships: []
      }
      areas_seguridad: {
        Row: {
          activa: boolean | null
          cantidad_camaras: number | null
          capacidad: number | null
          created_at: string
          id: string
          nivel_acceso: string
          nombre: string
          tiene_camaras: boolean | null
          ubicacion: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activa?: boolean | null
          cantidad_camaras?: number | null
          capacidad?: number | null
          created_at?: string
          id?: string
          nivel_acceso?: string
          nombre: string
          tiene_camaras?: boolean | null
          ubicacion?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activa?: boolean | null
          cantidad_camaras?: number | null
          capacidad?: number | null
          created_at?: string
          id?: string
          nivel_acceso?: string
          nombre?: string
          tiene_camaras?: boolean | null
          ubicacion?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_seguridad_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      areas_servicio: {
        Row: {
          activo: boolean | null
          capacidad_simultanea: number | null
          codigo: string
          color: string | null
          created_at: string | null
          duracion_default_min: number | null
          id: string
          nombre: string
          requiere_ayuno: boolean | null
          requiere_preparacion: string | null
          tipo: string
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean | null
          capacidad_simultanea?: number | null
          codigo: string
          color?: string | null
          created_at?: string | null
          duracion_default_min?: number | null
          id?: string
          nombre: string
          requiere_ayuno?: boolean | null
          requiere_preparacion?: string | null
          tipo: string
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean | null
          capacidad_simultanea?: number | null
          codigo?: string
          color?: string | null
          created_at?: string | null
          duracion_default_min?: number | null
          id?: string
          nombre?: string
          requiere_ayuno?: boolean | null
          requiere_preparacion?: string | null
          tipo?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_servicio_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      asignaciones_rol_vertical: {
        Row: {
          activo: boolean
          asignado_por: string | null
          created_at: string
          id: string
          rol_vertical_id: string
          user_id: string
          vertical_tipo: string
          vigencia_fin: string | null
          vigencia_inicio: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          asignado_por?: string | null
          created_at?: string
          id?: string
          rol_vertical_id: string
          user_id: string
          vertical_tipo: string
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean
          asignado_por?: string | null
          created_at?: string
          id?: string
          rol_vertical_id?: string
          user_id?: string
          vertical_tipo?: string
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_rol_vertical_rol_vertical_id_fkey"
            columns: ["rol_vertical_id"]
            isOneToOne: false
            referencedRelation: "roles_vertical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_rol_vertical_workspace_id_fkey"
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
      auditorias_calidad: {
        Row: {
          alcance: string | null
          auditor: string | null
          created_at: string
          estado: string
          estandar: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          puntaje: number | null
          resultado_general: string | null
          tipo: string
          titulo: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          alcance?: string | null
          auditor?: string | null
          created_at?: string
          estado?: string
          estandar?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          puntaje?: number | null
          resultado_general?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          alcance?: string | null
          auditor?: string | null
          created_at?: string
          estado?: string
          estandar?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          puntaje?: number | null
          resultado_general?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditorias_calidad_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      beneficios_usuarios: {
        Row: {
          concepto: string
          created_at: string
          estado: string
          fecha_expiracion: string | null
          fecha_otorgado: string
          id: string
          monto_descuento: number | null
          nivel: string | null
          notas: string | null
          origen: string | null
          paciente_id: string
          puntos: number | null
          tipo: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          concepto: string
          created_at?: string
          estado?: string
          fecha_expiracion?: string | null
          fecha_otorgado?: string
          id?: string
          monto_descuento?: number | null
          nivel?: string | null
          notas?: string | null
          origen?: string | null
          paciente_id: string
          puntos?: number | null
          tipo?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          concepto?: string
          created_at?: string
          estado?: string
          fecha_expiracion?: string | null
          fecha_otorgado?: string
          id?: string
          monto_descuento?: number | null
          nivel?: string | null
          notas?: string | null
          origen?: string | null
          paciente_id?: string
          puntos?: number | null
          tipo?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      bitacora_accesos: {
        Row: {
          area_id: string | null
          autorizado_por: string | null
          created_at: string
          fecha_hora: string | null
          id: string
          metodo_verificacion: string | null
          motivo_visita: string | null
          numero: string
          observaciones: string | null
          persona_cedula: string | null
          persona_nombre: string
          persona_visitada: string | null
          tipo: string
          tipo_persona: string
          workspace_id: string
        }
        Insert: {
          area_id?: string | null
          autorizado_por?: string | null
          created_at?: string
          fecha_hora?: string | null
          id?: string
          metodo_verificacion?: string | null
          motivo_visita?: string | null
          numero?: string
          observaciones?: string | null
          persona_cedula?: string | null
          persona_nombre: string
          persona_visitada?: string | null
          tipo?: string
          tipo_persona?: string
          workspace_id: string
        }
        Update: {
          area_id?: string | null
          autorizado_por?: string | null
          created_at?: string
          fecha_hora?: string | null
          id?: string
          metodo_verificacion?: string | null
          motivo_visita?: string | null
          numero?: string
          observaciones?: string | null
          persona_cedula?: string | null
          persona_nombre?: string
          persona_visitada?: string | null
          tipo?: string
          tipo_persona?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_accesos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_seguridad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_accesos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinas_estetica: {
        Row: {
          activo: boolean | null
          capacidad: number | null
          created_at: string | null
          equipos: string[] | null
          estado: string | null
          id: string
          nombre: string
          tipo: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          capacidad?: number | null
          created_at?: string | null
          equipos?: string[] | null
          estado?: string | null
          id?: string
          nombre: string
          tipo?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          capacidad?: number | null
          created_at?: string | null
          equipos?: string[] | null
          estado?: string | null
          id?: string
          nombre?: string
          tipo?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabinas_estetica_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      calendario_regulatorio: {
        Row: {
          activo: boolean | null
          created_at: string
          dia_vencimiento: number | null
          entidad: string
          frecuencia: string
          id: string
          nombre: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          dia_vencimiento?: number | null
          entidad: string
          frecuencia?: string
          id?: string
          nombre: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          dia_vencimiento?: number | null
          entidad?: string
          frecuencia?: string
          id?: string
          nombre?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendario_regulatorio_workspace_id_fkey"
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
      camas_vertical: {
        Row: {
          created_at: string
          estado: string
          id: string
          nombre: string
          notas: string | null
          paciente_id: string | null
          piso: string | null
          sala: string | null
          tipo: string
          updated_at: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          nombre: string
          notas?: string | null
          paciente_id?: string | null
          piso?: string | null
          sala?: string | null
          tipo?: string
          updated_at?: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          nombre?: string
          notas?: string | null
          paciente_id?: string | null
          piso?: string | null
          sala?: string | null
          tipo?: string
          updated_at?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camas_vertical_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camas_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      campanas_comunicacion: {
        Row: {
          abiertos: number
          canal: string
          creado_por: string | null
          created_at: string
          entregados: number
          enviados: number
          errores: number
          estado: string
          id: string
          nombre: string
          plantilla_id: string | null
          programada_para: string | null
          segmentacion: Json | null
          tipo: string
          updated_at: string
          vertical_tipo: string | null
          workspace_id: string
        }
        Insert: {
          abiertos?: number
          canal?: string
          creado_por?: string | null
          created_at?: string
          entregados?: number
          enviados?: number
          errores?: number
          estado?: string
          id?: string
          nombre: string
          plantilla_id?: string | null
          programada_para?: string | null
          segmentacion?: Json | null
          tipo?: string
          updated_at?: string
          vertical_tipo?: string | null
          workspace_id: string
        }
        Update: {
          abiertos?: number
          canal?: string
          creado_por?: string | null
          created_at?: string
          entregados?: number
          enviados?: number
          errores?: number
          estado?: string
          id?: string
          nombre?: string
          plantilla_id?: string | null
          programada_para?: string | null
          segmentacion?: Json | null
          tipo?: string
          updated_at?: string
          vertical_tipo?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanas_comunicacion_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_comunicacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campanas_comunicacion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      campanas_marketing_vertical: {
        Row: {
          abiertos: number | null
          canal: string
          clics: number | null
          created_at: string | null
          destinatarios_total: number | null
          enviados: number | null
          estado: string | null
          fecha_programada: string | null
          id: string
          mensaje_plantilla: string | null
          nombre: string
          segmento_filtro: Json | null
          updated_at: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          abiertos?: number | null
          canal: string
          clics?: number | null
          created_at?: string | null
          destinatarios_total?: number | null
          enviados?: number | null
          estado?: string | null
          fecha_programada?: string | null
          id?: string
          mensaje_plantilla?: string | null
          nombre: string
          segmento_filtro?: Json | null
          updated_at?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          abiertos?: number | null
          canal?: string
          clics?: number | null
          created_at?: string | null
          destinatarios_total?: number | null
          enviados?: number | null
          estado?: string | null
          fecha_programada?: string | null
          id?: string
          mensaje_plantilla?: string | null
          nombre?: string
          segmento_filtro?: Json | null
          updated_at?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanas_marketing_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      capacitaciones_empleados: {
        Row: {
          calificacion: number | null
          certificado_url: string | null
          created_at: string | null
          curso: string
          empleado_id: string
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          horas: number | null
          id: string
          institucion: string | null
          modalidad: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          calificacion?: number | null
          certificado_url?: string | null
          created_at?: string | null
          curso: string
          empleado_id: string
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          horas?: number | null
          id?: string
          institucion?: string | null
          modalidad?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          calificacion?: number | null
          certificado_url?: string | null
          created_at?: string | null
          curso?: string
          empleado_id?: string
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          horas?: number | null
          id?: string
          institucion?: string | null
          modalidad?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      casos_adicciones: {
        Row: {
          created_at: string
          created_by: string | null
          dias_sobriedad: number | null
          fecha_ultima_recaida: string | null
          grupo_apoyo: string | null
          id: string
          notas: string | null
          paciente_id: string
          plan_recuperacion: string | null
          prueba_toxicologica: Json | null
          sponsor_contacto: string | null
          sponsor_nombre: string | null
          sponsor_telefono: string | null
          sustancia_principal: string | null
          sustancias_secundarias: string[] | null
          tiempo_consumo: string | null
          total_recaidas: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          dias_sobriedad?: number | null
          fecha_ultima_recaida?: string | null
          grupo_apoyo?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          plan_recuperacion?: string | null
          prueba_toxicologica?: Json | null
          sponsor_contacto?: string | null
          sponsor_nombre?: string | null
          sponsor_telefono?: string | null
          sustancia_principal?: string | null
          sustancias_secundarias?: string[] | null
          tiempo_consumo?: string | null
          total_recaidas?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          dias_sobriedad?: number | null
          fecha_ultima_recaida?: string | null
          grupo_apoyo?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          plan_recuperacion?: string | null
          prueba_toxicologica?: Json | null
          sponsor_contacto?: string | null
          sponsor_nombre?: string | null
          sponsor_telefono?: string | null
          sustancia_principal?: string | null
          sustancias_secundarias?: string[] | null
          tiempo_consumo?: string | null
          total_recaidas?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      casos_eap_corporativo: {
        Row: {
          anonimo_en_reportes: boolean | null
          created_at: string
          empleado_codigo: string | null
          empresa: string
          id: string
          notas: string | null
          paciente_id: string
          sesiones_cubiertas: number | null
          sesiones_usadas: number | null
          workspace_id: string
        }
        Insert: {
          anonimo_en_reportes?: boolean | null
          created_at?: string
          empleado_codigo?: string | null
          empresa: string
          id?: string
          notas?: string | null
          paciente_id: string
          sesiones_cubiertas?: number | null
          sesiones_usadas?: number | null
          workspace_id: string
        }
        Update: {
          anonimo_en_reportes?: boolean | null
          created_at?: string
          empleado_codigo?: string | null
          empresa?: string
          id?: string
          notas?: string | null
          paciente_id?: string
          sesiones_cubiertas?: number | null
          sesiones_usadas?: number | null
          workspace_id?: string
        }
        Relationships: []
      }
      casos_infantil_psico: {
        Row: {
          created_at: string
          custodia: string | null
          escuela_nombre: string | null
          hitos_desarrollo: string | null
          id: string
          notas: string | null
          paciente_id: string
          padres_separados: boolean | null
          reporte_conducta: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          custodia?: string | null
          escuela_nombre?: string | null
          hitos_desarrollo?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          padres_separados?: boolean | null
          reporte_conducta?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          custodia?: string | null
          escuela_nombre?: string | null
          hitos_desarrollo?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          padres_separados?: boolean | null
          reporte_conducta?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      casos_pareja: {
        Row: {
          acuerdos: string | null
          created_at: string
          created_by: string | null
          cronologia_conflicto: string | null
          hijos_comunes: number | null
          id: string
          motivo_consulta: string | null
          notas: string | null
          paciente_id_a: string
          paciente_id_b: string | null
          pareja_email: string | null
          pareja_nombre: string | null
          pareja_telefono: string | null
          tiempo_relacion: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acuerdos?: string | null
          created_at?: string
          created_by?: string | null
          cronologia_conflicto?: string | null
          hijos_comunes?: number | null
          id?: string
          motivo_consulta?: string | null
          notas?: string | null
          paciente_id_a: string
          paciente_id_b?: string | null
          pareja_email?: string | null
          pareja_nombre?: string | null
          pareja_telefono?: string | null
          tiempo_relacion?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acuerdos?: string | null
          created_at?: string
          created_by?: string | null
          cronologia_conflicto?: string | null
          hijos_comunes?: number | null
          id?: string
          motivo_consulta?: string | null
          notas?: string | null
          paciente_id_a?: string
          paciente_id_b?: string | null
          pareja_email?: string | null
          pareja_nombre?: string | null
          pareja_telefono?: string | null
          tiempo_relacion?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      casos_psico_infantil: {
        Row: {
          alertas_desarrollo: string | null
          conducta_observada: string | null
          created_at: string
          created_by: string | null
          custodia: string | null
          desarrollo_lenguaje: string | null
          desarrollo_psicomotor: string | null
          desarrollo_social: string | null
          escuela_contacto: string | null
          escuela_grado: string | null
          escuela_nombre: string | null
          hitos_alcanzados: string | null
          id: string
          notas: string | null
          paciente_id: string
          padres_separados: boolean | null
          rendimiento_escolar: string | null
          tutor_legal: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          alertas_desarrollo?: string | null
          conducta_observada?: string | null
          created_at?: string
          created_by?: string | null
          custodia?: string | null
          desarrollo_lenguaje?: string | null
          desarrollo_psicomotor?: string | null
          desarrollo_social?: string | null
          escuela_contacto?: string | null
          escuela_grado?: string | null
          escuela_nombre?: string | null
          hitos_alcanzados?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          padres_separados?: boolean | null
          rendimiento_escolar?: string | null
          tutor_legal?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          alertas_desarrollo?: string | null
          conducta_observada?: string | null
          created_at?: string
          created_by?: string | null
          custodia?: string | null
          desarrollo_lenguaje?: string | null
          desarrollo_psicomotor?: string | null
          desarrollo_social?: string | null
          escuela_contacto?: string | null
          escuela_grado?: string | null
          escuela_nombre?: string | null
          hitos_alcanzados?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          padres_separados?: boolean | null
          rendimiento_escolar?: string | null
          tutor_legal?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      casos_trabajo_social: {
        Row: {
          composicion_familiar: Json | null
          created_at: string
          descripcion: string | null
          estado: string
          evaluacion: string | null
          fecha_apertura: string | null
          fecha_cierre: string | null
          id: string
          ingresos_mensuales: number | null
          motivo_cierre: string | null
          nivel_socioeconomico: string | null
          numero: string
          observaciones: string | null
          paciente_id: string | null
          plan_intervencion: string | null
          prioridad: string
          tipo_caso: string
          trabajador_social_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          composicion_familiar?: Json | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          evaluacion?: string | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          ingresos_mensuales?: number | null
          motivo_cierre?: string | null
          nivel_socioeconomico?: string | null
          numero?: string
          observaciones?: string | null
          paciente_id?: string | null
          plan_intervencion?: string | null
          prioridad?: string
          tipo_caso?: string
          trabajador_social_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          composicion_familiar?: Json | null
          created_at?: string
          descripcion?: string | null
          estado?: string
          evaluacion?: string | null
          fecha_apertura?: string | null
          fecha_cierre?: string | null
          id?: string
          ingresos_mensuales?: number | null
          motivo_cierre?: string | null
          nivel_socioeconomico?: string | null
          numero?: string
          observaciones?: string | null
          paciente_id?: string | null
          plan_intervencion?: string | null
          prioridad?: string
          tipo_caso?: string
          trabajador_social_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casos_trabajo_social_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_trabajo_social_trabajador_social_id_fkey"
            columns: ["trabajador_social_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_trabajo_social_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogo_cie10: {
        Row: {
          activo: boolean | null
          capitulo: string | null
          categoria: string | null
          codigo: string
          created_at: string | null
          descripcion: string
        }
        Insert: {
          activo?: boolean | null
          capitulo?: string | null
          categoria?: string | null
          codigo: string
          created_at?: string | null
          descripcion: string
        }
        Update: {
          activo?: boolean | null
          capitulo?: string | null
          categoria?: string | null
          codigo?: string
          created_at?: string | null
          descripcion?: string
        }
        Relationships: []
      }
      catalogo_cpt: {
        Row: {
          activo: boolean | null
          categoria: string | null
          codigo: string
          created_at: string | null
          descripcion: string
          tarifa_referencia: number | null
          unidades_rvu: number | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          codigo: string
          created_at?: string | null
          descripcion: string
          tarifa_referencia?: number | null
          unidades_rvu?: number | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          codigo?: string
          created_at?: string | null
          descripcion?: string
          tarifa_referencia?: number | null
          unidades_rvu?: number | null
        }
        Relationships: []
      }
      catalogo_medicamentos: {
        Row: {
          activo: boolean | null
          codigo: string | null
          concentracion: string | null
          controlado: boolean | null
          created_at: string | null
          forma_farmaceutica: string | null
          grupo_terapeutico: string | null
          id: string
          laboratorio: string | null
          nombre_comercial: string
          principio_activo: string
          requiere_receta: boolean | null
          via_administracion: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          concentracion?: string | null
          controlado?: boolean | null
          created_at?: string | null
          forma_farmaceutica?: string | null
          grupo_terapeutico?: string | null
          id?: string
          laboratorio?: string | null
          nombre_comercial: string
          principio_activo: string
          requiere_receta?: boolean | null
          via_administracion?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          concentracion?: string | null
          controlado?: boolean | null
          created_at?: string | null
          forma_farmaceutica?: string | null
          grupo_terapeutico?: string | null
          id?: string
          laboratorio?: string | null
          nombre_comercial?: string
          principio_activo?: string
          requiere_receta?: boolean | null
          via_administracion?: string | null
        }
        Relationships: []
      }
      censo_diario: {
        Row: {
          camas_disponibles: number | null
          camas_ocupadas: number | null
          created_at: string | null
          defunciones: number | null
          egresos: number | null
          fecha: string
          id: string
          ingresos: number | null
          porcentaje_ocupacion: number | null
          servicio: string
          workspace_id: string | null
        }
        Insert: {
          camas_disponibles?: number | null
          camas_ocupadas?: number | null
          created_at?: string | null
          defunciones?: number | null
          egresos?: number | null
          fecha: string
          id?: string
          ingresos?: number | null
          porcentaje_ocupacion?: number | null
          servicio: string
          workspace_id?: string | null
        }
        Update: {
          camas_disponibles?: number | null
          camas_ocupadas?: number | null
          created_at?: string | null
          defunciones?: number | null
          egresos?: number | null
          fecha?: string
          id?: string
          ingresos?: number | null
          porcentaje_ocupacion?: number | null
          servicio?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "censo_diario_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_costo: {
        Row: {
          activo: boolean | null
          codigo: string
          created_at: string | null
          id: string
          nombre: string
          presupuesto_anual: number | null
          responsable_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          created_at?: string | null
          id?: string
          nombre: string
          presupuesto_anual?: number | null
          responsable_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          created_at?: string | null
          id?: string
          nombre?: string
          presupuesto_anual?: number | null
          responsable_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      chat_canal_miembros: {
        Row: {
          canal_id: string
          created_at: string
          id: string
          notificaciones: boolean
          rol: string
          ultima_lectura: string
          user_id: string
        }
        Insert: {
          canal_id: string
          created_at?: string
          id?: string
          notificaciones?: boolean
          rol?: string
          ultima_lectura?: string
          user_id: string
        }
        Update: {
          canal_id?: string
          created_at?: string
          id?: string
          notificaciones?: boolean
          rol?: string
          ultima_lectura?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_canal_miembros_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "chat_canales"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_canales: {
        Row: {
          created_at: string
          created_by: string | null
          descripcion: string | null
          id: string
          nombre: string
          paciente_id: string | null
          privado: boolean
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          paciente_id?: string | null
          privado?: boolean
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          paciente_id?: string | null
          privado?: boolean
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_canales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_canales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_mensajes: {
        Row: {
          archivo_url: string | null
          canal_id: string
          contenido: string
          created_at: string
          editado: boolean
          id: string
          responde_a: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          archivo_url?: string | null
          canal_id: string
          contenido: string
          created_at?: string
          editado?: boolean
          id?: string
          responde_a?: string | null
          tipo?: string
          user_id: string
        }
        Update: {
          archivo_url?: string | null
          canal_id?: string
          contenido?: string
          created_at?: string
          editado?: boolean
          id?: string
          responde_a?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_mensajes_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "chat_canales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_mensajes_responde_a_fkey"
            columns: ["responde_a"]
            isOneToOne: false
            referencedRelation: "chat_mensajes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_teleconsulta: {
        Row: {
          autor_tipo: string
          autor_user_id: string | null
          created_at: string
          id: string
          leido_at: string | null
          mensaje: string
          teleconsulta_id: string
        }
        Insert: {
          autor_tipo: string
          autor_user_id?: string | null
          created_at?: string
          id?: string
          leido_at?: string | null
          mensaje: string
          teleconsulta_id: string
        }
        Update: {
          autor_tipo?: string
          autor_user_id?: string | null
          created_at?: string
          id?: string
          leido_at?: string | null
          mensaje?: string
          teleconsulta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_teleconsulta_teleconsulta_id_fkey"
            columns: ["teleconsulta_id"]
            isOneToOne: false
            referencedRelation: "teleconsultas"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_oms: {
        Row: {
          completado: boolean | null
          created_at: string | null
          fase: string
          hora_completado: string | null
          id: string
          items: Json
          programacion_id: string | null
          responsable_id: string | null
        }
        Insert: {
          completado?: boolean | null
          created_at?: string | null
          fase: string
          hora_completado?: string | null
          id?: string
          items?: Json
          programacion_id?: string | null
          responsable_id?: string | null
        }
        Update: {
          completado?: boolean | null
          created_at?: string | null
          fase?: string
          hora_completado?: string | null
          id?: string
          items?: Json
          programacion_id?: string | null
          responsable_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_oms_programacion_id_fkey"
            columns: ["programacion_id"]
            isOneToOne: false
            referencedRelation: "programaciones_quirurgicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_oms_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclos_esterilizacion: {
        Row: {
          created_at: string
          duracion_minutos: number | null
          equipo: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          indicador_biologico: boolean | null
          indicador_quimico: boolean | null
          metodo: string
          numero: string
          observaciones: string | null
          operador_id: string | null
          presion_psi: number | null
          resultado: string
          temperatura_c: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duracion_minutos?: number | null
          equipo?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          indicador_biologico?: boolean | null
          indicador_quimico?: boolean | null
          metodo?: string
          numero?: string
          observaciones?: string | null
          operador_id?: string | null
          presion_psi?: number | null
          resultado?: string
          temperatura_c?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          duracion_minutos?: number | null
          equipo?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          indicador_biologico?: boolean | null
          indicador_quimico?: boolean | null
          metodo?: string
          numero?: string
          observaciones?: string | null
          operador_id?: string | null
          presion_psi?: number | null
          resultado?: string
          temperatura_c?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_esterilizacion_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ciclos_esterilizacion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ciclos_quimio: {
        Row: {
          bsa_m2: number | null
          created_at: string | null
          estado: string | null
          fecha_programada: string
          fecha_realizada: string | null
          id: string
          motivo_aplazamiento: string | null
          notas: string | null
          numero_ciclo: number
          oncologo_id: string | null
          paciente_id: string | null
          peso_kg: number | null
          protocolo_id: string | null
          talla_cm: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          bsa_m2?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_programada: string
          fecha_realizada?: string | null
          id?: string
          motivo_aplazamiento?: string | null
          notas?: string | null
          numero_ciclo: number
          oncologo_id?: string | null
          paciente_id?: string | null
          peso_kg?: number | null
          protocolo_id?: string | null
          talla_cm?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          bsa_m2?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_programada?: string
          fecha_realizada?: string | null
          id?: string
          motivo_aplazamiento?: string | null
          notas?: string | null
          numero_ciclo?: number
          oncologo_id?: string | null
          paciente_id?: string | null
          peso_kg?: number | null
          protocolo_id?: string | null
          talla_cm?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ciclos_quimio_oncologo_id_fkey"
            columns: ["oncologo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ciclos_quimio_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ciclos_quimio_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos_quimio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ciclos_quimio_workspace_id_fkey"
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
      citas_universales: {
        Row: {
          area_id: string | null
          cita_padre_id: string | null
          created_at: string | null
          created_by: string | null
          estado: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          metadata: Json | null
          motivo: string | null
          notas: string | null
          origen: string | null
          paciente_id: string
          prioridad: string | null
          profesional_id: string | null
          recurso_id: string | null
          sucursal_id: string | null
          updated_at: string | null
          vertical: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id: string | null
        }
        Insert: {
          area_id?: string | null
          cita_padre_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          metadata?: Json | null
          motivo?: string | null
          notas?: string | null
          origen?: string | null
          paciente_id: string
          prioridad?: string | null
          profesional_id?: string | null
          recurso_id?: string | null
          sucursal_id?: string | null
          updated_at?: string | null
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id?: string | null
        }
        Update: {
          area_id?: string | null
          cita_padre_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          metadata?: Json | null
          motivo?: string | null
          notas?: string | null
          origen?: string | null
          paciente_id?: string
          prioridad?: string | null
          profesional_id?: string | null
          recurso_id?: string | null
          sucursal_id?: string | null
          updated_at?: string | null
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citas_universales_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas_servicio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_universales_cita_padre_id_fkey"
            columns: ["cita_padre_id"]
            isOneToOne: false
            referencedRelation: "citas_universales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_universales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_universales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citas_universales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      combos_optica: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          incluye_lentes: boolean | null
          incluye_montura: boolean | null
          nombre: string
          precio_combo: number | null
          precio_regular: number | null
          tratamientos_incluidos: string[] | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          incluye_lentes?: boolean | null
          incluye_montura?: boolean | null
          nombre: string
          precio_combo?: number | null
          precio_regular?: number | null
          tratamientos_incluidos?: string[] | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          incluye_lentes?: boolean | null
          incluye_montura?: boolean | null
          nombre?: string
          precio_combo?: number | null
          precio_regular?: number | null
          tratamientos_incluidos?: string[] | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combos_optica_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comisiones_empleados: {
        Row: {
          concepto: string
          created_at: string
          empleado_id: string
          estado: string
          fecha_generada: string
          fecha_pago: string | null
          id: string
          monto_base: number
          monto_comision: number
          notas: string | null
          origen: string
          paciente_id: string | null
          porcentaje: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          concepto: string
          created_at?: string
          empleado_id: string
          estado?: string
          fecha_generada?: string
          fecha_pago?: string | null
          id?: string
          monto_base?: number
          monto_comision?: number
          notas?: string | null
          origen?: string
          paciente_id?: string | null
          porcentaje?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          concepto?: string
          created_at?: string
          empleado_id?: string
          estado?: string
          fecha_generada?: string
          fecha_pago?: string | null
          id?: string
          monto_base?: number
          monto_comision?: number
          notas?: string | null
          origen?: string
          paciente_id?: string | null
          porcentaje?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      comisiones_profesional: {
        Row: {
          activo: boolean | null
          created_at: string | null
          id: string
          monto_fijo: number | null
          porcentaje: number | null
          profesional_id: string
          tipo_procedimiento: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          monto_fijo?: number | null
          porcentaje?: number | null
          profesional_id: string
          tipo_procedimiento?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          id?: string
          monto_fijo?: number | null
          porcentaje?: number | null
          profesional_id?: string
          tipo_procedimiento?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comisiones_profesional_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comisiones_profesional_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comites_calidad: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          frecuencia_reunion: string | null
          id: string
          miembros: Json | null
          nombre: string
          presidente_id: string | null
          tipo: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          frecuencia_reunion?: string | null
          id?: string
          miembros?: Json | null
          nombre: string
          presidente_id?: string | null
          tipo: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          frecuencia_reunion?: string | null
          id?: string
          miembros?: Json | null
          nombre?: string
          presidente_id?: string | null
          tipo?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comites_calidad_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comprobantes_fiscales: {
        Row: {
          created_at: string
          enviado_at: string | null
          estado_dgii: string
          factura_id: string | null
          id: string
          itbis: number | null
          ncf: string
          respuesta_dgii: Json | null
          rnc_cliente: string | null
          tipo_ncf: string
          total: number | null
          workspace_id: string
          xml_url: string | null
        }
        Insert: {
          created_at?: string
          enviado_at?: string | null
          estado_dgii?: string
          factura_id?: string | null
          id?: string
          itbis?: number | null
          ncf: string
          respuesta_dgii?: Json | null
          rnc_cliente?: string | null
          tipo_ncf: string
          total?: number | null
          workspace_id: string
          xml_url?: string | null
        }
        Update: {
          created_at?: string
          enviado_at?: string | null
          estado_dgii?: string
          factura_id?: string | null
          id?: string
          itbis?: number | null
          ncf?: string
          respuesta_dgii?: Json | null
          rnc_cliente?: string | null
          tipo_ncf?: string
          total?: number | null
          workspace_id?: string
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_fiscales_factura_id_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comprobantes_fiscales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      comunicaciones_multicanal: {
        Row: {
          asunto: string | null
          campana_id: string | null
          canal: string
          contenido: string
          created_at: string
          destinatario_contacto: string | null
          destinatario_id: string | null
          destinatario_tipo: string
          entregado_at: string | null
          enviado_at: string | null
          enviado_por: string | null
          error_detalle: string | null
          estado: string
          id: string
          leido_at: string | null
          metadata: Json | null
          plantilla_id: string | null
          vertical_tipo: string | null
          workspace_id: string
        }
        Insert: {
          asunto?: string | null
          campana_id?: string | null
          canal?: string
          contenido: string
          created_at?: string
          destinatario_contacto?: string | null
          destinatario_id?: string | null
          destinatario_tipo?: string
          entregado_at?: string | null
          enviado_at?: string | null
          enviado_por?: string | null
          error_detalle?: string | null
          estado?: string
          id?: string
          leido_at?: string | null
          metadata?: Json | null
          plantilla_id?: string | null
          vertical_tipo?: string | null
          workspace_id: string
        }
        Update: {
          asunto?: string | null
          campana_id?: string | null
          canal?: string
          contenido?: string
          created_at?: string
          destinatario_contacto?: string | null
          destinatario_id?: string | null
          destinatario_tipo?: string
          entregado_at?: string | null
          enviado_at?: string | null
          enviado_por?: string | null
          error_detalle?: string | null
          estado?: string
          id?: string
          leido_at?: string | null
          metadata?: Json | null
          plantilla_id?: string | null
          vertical_tipo?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicaciones_multicanal_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_accesibilidad: {
        Row: {
          alto_contraste: boolean | null
          created_at: string | null
          daltonismo: string | null
          id: string
          lector_pantalla: boolean | null
          navegacion_teclado: boolean | null
          reducir_movimiento: boolean | null
          tamano_fuente: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alto_contraste?: boolean | null
          created_at?: string | null
          daltonismo?: string | null
          id?: string
          lector_pantalla?: boolean | null
          navegacion_teclado?: boolean | null
          reducir_movimiento?: boolean | null
          tamano_fuente?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alto_contraste?: boolean | null
          created_at?: string | null
          daltonismo?: string | null
          id?: string
          lector_pantalla?: boolean | null
          navegacion_teclado?: boolean | null
          reducir_movimiento?: boolean | null
          tamano_fuente?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      consentimientos_teleconsulta: {
        Row: {
          created_at: string
          firma_data: string | null
          firmado_at: string
          id: string
          ip: string | null
          paciente_id: string
          texto_version: string
          user_agent: string | null
          valido_hasta: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          firma_data?: string | null
          firmado_at?: string
          id?: string
          ip?: string | null
          paciente_id: string
          texto_version?: string
          user_agent?: string | null
          valido_hasta?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          firma_data?: string | null
          firmado_at?: string
          id?: string
          ip?: string | null
          paciente_id?: string
          texto_version?: string
          user_agent?: string | null
          valido_hasta?: string
          workspace_id?: string
        }
        Relationships: []
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
          vertical: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
      conteo_gasas_instrumental: {
        Row: {
          agregado: number | null
          coincide: boolean | null
          conteo_final: number | null
          conteo_inicial: number
          created_at: string | null
          id: string
          notas: string | null
          programacion_id: string | null
          responsable_id: string | null
          tipo: string
        }
        Insert: {
          agregado?: number | null
          coincide?: boolean | null
          conteo_final?: number | null
          conteo_inicial: number
          created_at?: string | null
          id?: string
          notas?: string | null
          programacion_id?: string | null
          responsable_id?: string | null
          tipo: string
        }
        Update: {
          agregado?: number | null
          coincide?: boolean | null
          conteo_final?: number | null
          conteo_inicial?: number
          created_at?: string | null
          id?: string
          notas?: string | null
          programacion_id?: string | null
          responsable_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "conteo_gasas_instrumental_programacion_id_fkey"
            columns: ["programacion_id"]
            isOneToOne: false
            referencedRelation: "programaciones_quirurgicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conteo_gasas_instrumental_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_eap: {
        Row: {
          activo: boolean | null
          contacto_rrhh: string | null
          created_at: string
          created_by: string | null
          email_rrhh: string | null
          empresa_nombre: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          notas: string | null
          sesiones_anuales_por_empleado: number | null
          tarifa_sesion: number | null
          telefono_rrhh: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          contacto_rrhh?: string | null
          created_at?: string
          created_by?: string | null
          email_rrhh?: string | null
          empresa_nombre: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          notas?: string | null
          sesiones_anuales_por_empleado?: number | null
          tarifa_sesion?: number | null
          telefono_rrhh?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          contacto_rrhh?: string | null
          created_at?: string
          created_by?: string | null
          email_rrhh?: string | null
          empresa_nombre?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          notas?: string | null
          sesiones_anuales_por_empleado?: number | null
          tarifa_sesion?: number | null
          telefono_rrhh?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      control_calidad_lab: {
        Row: {
          aprobado: boolean | null
          desviacion: number | null
          equipo: string
          fecha: string | null
          id: string
          nivel_control: string | null
          observaciones: string | null
          prueba: string
          tecnico_id: string | null
          valor_esperado: number | null
          valor_obtenido: number | null
          workspace_id: string | null
        }
        Insert: {
          aprobado?: boolean | null
          desviacion?: number | null
          equipo: string
          fecha?: string | null
          id?: string
          nivel_control?: string | null
          observaciones?: string | null
          prueba: string
          tecnico_id?: string | null
          valor_esperado?: number | null
          valor_obtenido?: number | null
          workspace_id?: string | null
        }
        Update: {
          aprobado?: boolean | null
          desviacion?: number | null
          equipo?: string
          fecha?: string | null
          id?: string
          nivel_control?: string | null
          observaciones?: string | null
          prueba?: string
          tecnico_id?: string | null
          valor_esperado?: number | null
          valor_obtenido?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_calidad_lab_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_calidad_lab_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      control_prenatal: {
        Row: {
          altura_uterina_cm: number | null
          created_at: string | null
          edad_gestacional_semanas: number | null
          edemas: boolean | null
          fcf_lpm: number | null
          fecha: string
          id: string
          movimientos_fetales: boolean | null
          numero_consulta: number | null
          observaciones: string | null
          obstetra_id: string | null
          paciente_id: string | null
          peso_kg: number | null
          presentacion: string | null
          presion_arterial: string | null
          workspace_id: string | null
        }
        Insert: {
          altura_uterina_cm?: number | null
          created_at?: string | null
          edad_gestacional_semanas?: number | null
          edemas?: boolean | null
          fcf_lpm?: number | null
          fecha: string
          id?: string
          movimientos_fetales?: boolean | null
          numero_consulta?: number | null
          observaciones?: string | null
          obstetra_id?: string | null
          paciente_id?: string | null
          peso_kg?: number | null
          presentacion?: string | null
          presion_arterial?: string | null
          workspace_id?: string | null
        }
        Update: {
          altura_uterina_cm?: number | null
          created_at?: string | null
          edad_gestacional_semanas?: number | null
          edemas?: boolean | null
          fcf_lpm?: number | null
          fecha?: string
          id?: string
          movimientos_fetales?: boolean | null
          numero_consulta?: number | null
          observaciones?: string | null
          obstetra_id?: string | null
          paciente_id?: string | null
          peso_kg?: number | null
          presentacion?: string | null
          presion_arterial?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "control_prenatal_obstetra_id_fkey"
            columns: ["obstetra_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_prenatal_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_prenatal_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
          vertical: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
      controles_ortodoncia: {
        Row: {
          ajustes_realizados: string | null
          cambio_ligas: boolean | null
          created_at: string
          dolor_reportado: number | null
          fecha: string
          fotos: string[] | null
          id: string
          notas: string | null
          odontologo_id: string | null
          paciente_id: string
          pagado: boolean | null
          pago_mensual: number | null
          progreso_porcentaje: number | null
          proximo_control: string | null
          tipo_arco: string | null
          workspace_id: string
        }
        Insert: {
          ajustes_realizados?: string | null
          cambio_ligas?: boolean | null
          created_at?: string
          dolor_reportado?: number | null
          fecha?: string
          fotos?: string[] | null
          id?: string
          notas?: string | null
          odontologo_id?: string | null
          paciente_id: string
          pagado?: boolean | null
          pago_mensual?: number | null
          progreso_porcentaje?: number | null
          proximo_control?: string | null
          tipo_arco?: string | null
          workspace_id: string
        }
        Update: {
          ajustes_realizados?: string | null
          cambio_ligas?: boolean | null
          created_at?: string
          dolor_reportado?: number | null
          fecha?: string
          fotos?: string[] | null
          id?: string
          notas?: string | null
          odontologo_id?: string | null
          paciente_id?: string
          pagado?: boolean | null
          pago_mensual?: number | null
          progreso_porcentaje?: number | null
          proximo_control?: string | null
          tipo_arco?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_ortodoncia_odontologo_id_fkey"
            columns: ["odontologo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_ortodoncia_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_ortodoncia_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_pediatricos: {
        Row: {
          created_at: string
          edad_meses: number | null
          fecha: string
          hitos_desarrollo: string | null
          id: string
          imc: number | null
          observaciones: string | null
          paciente_id: string
          percentil_pc: number | null
          percentil_peso: number | null
          percentil_talla: number | null
          perimetro_cefalico: number | null
          peso_kg: number | null
          profesional_id: string | null
          talla_cm: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          edad_meses?: number | null
          fecha?: string
          hitos_desarrollo?: string | null
          id?: string
          imc?: number | null
          observaciones?: string | null
          paciente_id: string
          percentil_pc?: number | null
          percentil_peso?: number | null
          percentil_talla?: number | null
          perimetro_cefalico?: number | null
          peso_kg?: number | null
          profesional_id?: string | null
          talla_cm?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          edad_meses?: number | null
          fecha?: string
          hitos_desarrollo?: string | null
          id?: string
          imc?: number | null
          observaciones?: string | null
          paciente_id?: string
          percentil_pc?: number | null
          percentil_peso?: number | null
          percentil_talla?: number | null
          perimetro_cefalico?: number | null
          peso_kg?: number | null
          profesional_id?: string | null
          talla_cm?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_pediatricos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_pediatricos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_pediatricos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      controles_prenatales: {
        Row: {
          altura_uterina: number | null
          created_at: string
          edemas: string | null
          fecha_control: string
          fpp: string | null
          frecuencia_fetal: number | null
          fum: string | null
          hallazgos: string | null
          id: string
          laboratorios: Json | null
          movimientos_fetales: boolean | null
          numero_control: number | null
          paciente_id: string
          peso: number | null
          presion_arterial: string | null
          profesional_id: string | null
          proximo_control: string | null
          semanas_gestacion: number | null
          workspace_id: string
        }
        Insert: {
          altura_uterina?: number | null
          created_at?: string
          edemas?: string | null
          fecha_control?: string
          fpp?: string | null
          frecuencia_fetal?: number | null
          fum?: string | null
          hallazgos?: string | null
          id?: string
          laboratorios?: Json | null
          movimientos_fetales?: boolean | null
          numero_control?: number | null
          paciente_id: string
          peso?: number | null
          presion_arterial?: string | null
          profesional_id?: string | null
          proximo_control?: string | null
          semanas_gestacion?: number | null
          workspace_id: string
        }
        Update: {
          altura_uterina?: number | null
          created_at?: string
          edemas?: string | null
          fecha_control?: string
          fpp?: string | null
          frecuencia_fetal?: number | null
          fum?: string | null
          hallazgos?: string | null
          id?: string
          laboratorios?: Json | null
          movimientos_fetales?: boolean | null
          numero_control?: number | null
          paciente_id?: string
          peso?: number | null
          presion_arterial?: string | null
          profesional_id?: string | null
          proximo_control?: string | null
          semanas_gestacion?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "controles_prenatales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_prenatales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "controles_prenatales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      costeo_servicios: {
        Row: {
          activo: boolean | null
          centro_costo_id: string | null
          codigo_servicio: string
          costo_directo: number | null
          costo_indirecto: number | null
          costo_total: number | null
          created_at: string | null
          id: string
          margen_bruto: number | null
          nombre_servicio: string
          precio_venta: number | null
          updated_at: string | null
          vigente_desde: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          centro_costo_id?: string | null
          codigo_servicio: string
          costo_directo?: number | null
          costo_indirecto?: number | null
          costo_total?: number | null
          created_at?: string | null
          id?: string
          margen_bruto?: number | null
          nombre_servicio: string
          precio_venta?: number | null
          updated_at?: string | null
          vigente_desde?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          centro_costo_id?: string | null
          codigo_servicio?: string
          costo_directo?: number | null
          costo_indirecto?: number | null
          costo_total?: number | null
          created_at?: string | null
          id?: string
          margen_bruto?: number | null
          nombre_servicio?: string
          precio_venta?: number | null
          updated_at?: string | null
          vigente_desde?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "costeo_servicios_centro_costo_id_fkey"
            columns: ["centro_costo_id"]
            isOneToOne: false
            referencedRelation: "centros_costo"
            referencedColumns: ["id"]
          },
        ]
      }
      credenciales_acceso: {
        Row: {
          areas_permitidas: string[] | null
          codigo_credencial: string | null
          created_at: string
          estado: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          foto_url: string | null
          id: string
          persona_cedula: string | null
          persona_nombre: string
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          areas_permitidas?: string[] | null
          codigo_credencial?: string | null
          created_at?: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          foto_url?: string | null
          id?: string
          persona_cedula?: string | null
          persona_nombre: string
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          areas_permitidas?: string[] | null
          codigo_credencial?: string | null
          created_at?: string
          estado?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          foto_url?: string | null
          id?: string
          persona_cedula?: string | null
          persona_nombre?: string
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credenciales_acceso_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      credenciales_profesionales: {
        Row: {
          archivo_url: string | null
          autoridad: string | null
          created_at: string
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          notas: string | null
          numero: string | null
          profesional_id: string
          tipo: string
          updated_at: string
          verificado: boolean
          workspace_id: string
        }
        Insert: {
          archivo_url?: string | null
          autoridad?: string | null
          created_at?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          profesional_id: string
          tipo: string
          updated_at?: string
          verificado?: boolean
          workspace_id: string
        }
        Update: {
          archivo_url?: string | null
          autoridad?: string | null
          created_at?: string
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          notas?: string | null
          numero?: string | null
          profesional_id?: string
          tipo?: string
          updated_at?: string
          verificado?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credenciales_profesionales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credenciales_profesionales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      cronologia_conflicto_pareja: {
        Row: {
          caso_id: string
          created_at: string
          created_by: string | null
          evento: string
          fecha: string
          id: string
          impacto: string | null
          notas: string | null
          workspace_id: string
        }
        Insert: {
          caso_id: string
          created_at?: string
          created_by?: string | null
          evento: string
          fecha: string
          id?: string
          impacto?: string | null
          notas?: string | null
          workspace_id: string
        }
        Update: {
          caso_id?: string
          created_at?: string
          created_by?: string | null
          evento?: string
          fecha?: string
          id?: string
          impacto?: string | null
          notas?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronologia_conflicto_pareja_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos_pareja"
            referencedColumns: ["id"]
          },
        ]
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
      cuestionarios_envios: {
        Row: {
          alerta_clinica: boolean | null
          created_at: string
          enviado_at: string | null
          expira_at: string
          id: string
          paciente_id: string
          plantilla_id: string
          puntaje_total: number | null
          respondido_at: string | null
          respuestas: Json | null
          sesion_id: string | null
          token: string
          workspace_id: string
        }
        Insert: {
          alerta_clinica?: boolean | null
          created_at?: string
          enviado_at?: string | null
          expira_at?: string
          id?: string
          paciente_id: string
          plantilla_id: string
          puntaje_total?: number | null
          respondido_at?: string | null
          respuestas?: Json | null
          sesion_id?: string | null
          token?: string
          workspace_id: string
        }
        Update: {
          alerta_clinica?: boolean | null
          created_at?: string
          enviado_at?: string | null
          expira_at?: string
          id?: string
          paciente_id?: string
          plantilla_id?: string
          puntaje_total?: number | null
          respondido_at?: string | null
          respuestas?: Json | null
          sesion_id?: string | null
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cuestionarios_envios_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "cuestionarios_plantillas"
            referencedColumns: ["id"]
          },
        ]
      }
      cuestionarios_plantillas: {
        Row: {
          activo: boolean | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          enviar_automatico: boolean | null
          horas_antes: number | null
          id: string
          nombre: string
          preguntas: Json
          tipo: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          enviar_automatico?: boolean | null
          horas_antes?: number | null
          id?: string
          nombre: string
          preguntas?: Json
          tipo?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          enviar_automatico?: boolean | null
          horas_antes?: number | null
          id?: string
          nombre?: string
          preguntas?: Json
          tipo?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      delegaciones_acceso_vertical: {
        Row: {
          activo: boolean
          created_at: string
          delegado_user_id: string
          delegante_user_id: string
          fin: string
          id: string
          inicio: string
          motivo: string | null
          permisos_delegados: Json
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          delegado_user_id: string
          delegante_user_id: string
          fin: string
          id?: string
          inicio?: string
          motivo?: string | null
          permisos_delegados?: Json
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          delegado_user_id?: string
          delegante_user_id?: string
          fin?: string
          id?: string
          inicio?: string
          motivo?: string | null
          permisos_delegados?: Json
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delegaciones_acceso_vertical_workspace_id_fkey"
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
      derivaciones_urgencias: {
        Row: {
          created_at: string | null
          destino_detalle: string | null
          diagnostico_egreso: string | null
          hora_derivacion: string | null
          id: string
          medico_id: string | null
          recomendaciones: string | null
          registro_urgencia_id: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          destino_detalle?: string | null
          diagnostico_egreso?: string | null
          hora_derivacion?: string | null
          id?: string
          medico_id?: string | null
          recomendaciones?: string | null
          registro_urgencia_id?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          destino_detalle?: string | null
          diagnostico_egreso?: string | null
          hora_derivacion?: string | null
          id?: string
          medico_id?: string | null
          recomendaciones?: string | null
          registro_urgencia_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "derivaciones_urgencias_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "derivaciones_urgencias_registro_urgencia_id_fkey"
            columns: ["registro_urgencia_id"]
            isOneToOne: false
            referencedRelation: "registros_urgencias"
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
      device_registrations: {
        Row: {
          activo: boolean
          app_version: string | null
          created_at: string
          device_id: string
          device_name: string | null
          id: string
          last_sync_at: string | null
          platform: string | null
          push_token: string | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          app_version?: string | null
          created_at?: string
          device_id: string
          device_name?: string | null
          id?: string
          last_sync_at?: string | null
          platform?: string | null
          push_token?: string | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          app_version?: string | null
          created_at?: string
          device_id?: string
          device_name?: string | null
          id?: string
          last_sync_at?: string | null
          platform?: string | null
          push_token?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_registrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      dicom_instances: {
        Row: {
          created_at: string
          id: string
          instance_number: number | null
          preview_path: string | null
          series_id: string
          size_bytes: number | null
          sop_instance_uid: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_number?: number | null
          preview_path?: string | null
          series_id: string
          size_bytes?: number | null
          sop_instance_uid: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_number?: number | null
          preview_path?: string | null
          series_id?: string
          size_bytes?: number | null
          sop_instance_uid?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "dicom_instances_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "dicom_series"
            referencedColumns: ["id"]
          },
        ]
      }
      dicom_series: {
        Row: {
          created_at: string
          description: string | null
          id: string
          modality: string | null
          num_instances: number | null
          series_instance_uid: string
          series_number: number | null
          study_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          modality?: string | null
          num_instances?: number | null
          series_instance_uid: string
          series_number?: number | null
          study_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          modality?: string | null
          num_instances?: number | null
          series_instance_uid?: string
          series_number?: number | null
          study_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dicom_series_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "dicom_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      dicom_studies: {
        Row: {
          accession_number: string | null
          created_at: string
          description: string | null
          estado: string | null
          id: string
          metadata: Json | null
          modality: string | null
          num_instances: number | null
          num_series: number | null
          paciente_id: string | null
          referring_physician: string | null
          study_date: string | null
          study_instance_uid: string
          study_time: string | null
          workspace_id: string | null
        }
        Insert: {
          accession_number?: string | null
          created_at?: string
          description?: string | null
          estado?: string | null
          id?: string
          metadata?: Json | null
          modality?: string | null
          num_instances?: number | null
          num_series?: number | null
          paciente_id?: string | null
          referring_physician?: string | null
          study_date?: string | null
          study_instance_uid: string
          study_time?: string | null
          workspace_id?: string | null
        }
        Update: {
          accession_number?: string | null
          created_at?: string
          description?: string | null
          estado?: string | null
          id?: string
          metadata?: Json | null
          modality?: string | null
          num_instances?: number | null
          num_series?: number | null
          paciente_id?: string | null
          referring_physician?: string | null
          study_date?: string | null
          study_instance_uid?: string
          study_time?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dicom_studies_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dicom_studies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      dispositivos_iot: {
        Row: {
          activo: boolean | null
          bateria_pct: number | null
          created_at: string | null
          estado_conexion: string | null
          fabricante: string | null
          id: string
          modelo: string | null
          paciente_id: string | null
          serial_number: string | null
          tipo: string
          ultima_lectura: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          bateria_pct?: number | null
          created_at?: string | null
          estado_conexion?: string | null
          fabricante?: string | null
          id?: string
          modelo?: string | null
          paciente_id?: string | null
          serial_number?: string | null
          tipo: string
          ultima_lectura?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          bateria_pct?: number | null
          created_at?: string | null
          estado_conexion?: string | null
          fabricante?: string | null
          id?: string
          modelo?: string | null
          paciente_id?: string | null
          serial_number?: string | null
          tipo?: string
          ultima_lectura?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispositivos_iot_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispositivos_iot_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_clinicos: {
        Row: {
          archivo_nombre: string | null
          archivo_url: string | null
          categoria: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          documento_padre_id: string | null
          evolucion_id: string | null
          fecha_documento: string | null
          firmado: boolean | null
          firmado_at: string | null
          firmado_por: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          paciente_id: string
          profesional_id: string | null
          storage_path: string
          subido_por: string | null
          tamano_bytes: number | null
          tipo: string | null
          titulo: string
          updated_at: string
          version: number | null
          visita_id: string | null
          workspace_id: string | null
        }
        Insert: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          documento_padre_id?: string | null
          evolucion_id?: string | null
          fecha_documento?: string | null
          firmado?: boolean | null
          firmado_at?: string | null
          firmado_por?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          paciente_id: string
          profesional_id?: string | null
          storage_path: string
          subido_por?: string | null
          tamano_bytes?: number | null
          tipo?: string | null
          titulo: string
          updated_at?: string
          version?: number | null
          visita_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          archivo_nombre?: string | null
          archivo_url?: string | null
          categoria?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          documento_padre_id?: string | null
          evolucion_id?: string | null
          fecha_documento?: string | null
          firmado?: boolean | null
          firmado_at?: string | null
          firmado_por?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          paciente_id?: string
          profesional_id?: string | null
          storage_path?: string
          subido_por?: string | null
          tamano_bytes?: number | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
          version?: number | null
          visita_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_clinicos_documento_padre_id_fkey"
            columns: ["documento_padre_id"]
            isOneToOne: false
            referencedRelation: "documentos_clinicos"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "documentos_clinicos_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_clinicos_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "control_visitas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_clinicos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_compartidos_psico: {
        Row: {
          created_at: string
          expira_at: string | null
          id: string
          mime_type: string | null
          nombre: string
          paciente_id: string
          permiso: string
          storage_path: string
          subido_por: string | null
          tamano_bytes: number | null
          teleconsulta_id: string | null
          visible_paciente: boolean | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          expira_at?: string | null
          id?: string
          mime_type?: string | null
          nombre: string
          paciente_id: string
          permiso?: string
          storage_path: string
          subido_por?: string | null
          tamano_bytes?: number | null
          teleconsulta_id?: string | null
          visible_paciente?: boolean | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          expira_at?: string | null
          id?: string
          mime_type?: string | null
          nombre?: string
          paciente_id?: string
          permiso?: string
          storage_path?: string
          subido_por?: string | null
          tamano_bytes?: number | null
          teleconsulta_id?: string | null
          visible_paciente?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_compartidos_psico_teleconsulta_id_fkey"
            columns: ["teleconsulta_id"]
            isOneToOne: false
            referencedRelation: "teleconsultas"
            referencedColumns: ["id"]
          },
        ]
      }
      donaciones_sangre: {
        Row: {
          apta_uso: boolean | null
          created_at: string | null
          donante_id: string | null
          fecha_donacion: string | null
          hemoglobina_predonacion: number | null
          id: string
          motivo_descarte: string | null
          presion_arterial: string | null
          pruebas_serologia: Json | null
          pulso: number | null
          responsable_id: string | null
          tipo_donacion: string | null
          volumen_ml: number | null
          workspace_id: string | null
        }
        Insert: {
          apta_uso?: boolean | null
          created_at?: string | null
          donante_id?: string | null
          fecha_donacion?: string | null
          hemoglobina_predonacion?: number | null
          id?: string
          motivo_descarte?: string | null
          presion_arterial?: string | null
          pruebas_serologia?: Json | null
          pulso?: number | null
          responsable_id?: string | null
          tipo_donacion?: string | null
          volumen_ml?: number | null
          workspace_id?: string | null
        }
        Update: {
          apta_uso?: boolean | null
          created_at?: string | null
          donante_id?: string | null
          fecha_donacion?: string | null
          hemoglobina_predonacion?: number | null
          id?: string
          motivo_descarte?: string | null
          presion_arterial?: string | null
          pruebas_serologia?: Json | null
          pulso?: number | null
          responsable_id?: string | null
          tipo_donacion?: string | null
          volumen_ml?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donaciones_sangre_donante_id_fkey"
            columns: ["donante_id"]
            isOneToOne: false
            referencedRelation: "donantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donaciones_sangre_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donaciones_sangre_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      donantes: {
        Row: {
          apellido: string | null
          apto: boolean | null
          cedula: string | null
          created_at: string | null
          direccion: string | null
          email: string | null
          fecha_nacimiento: string | null
          id: string
          motivo_diferimiento: string | null
          nombre: string
          sexo: string | null
          telefono: string | null
          tipo_sangre: string | null
          ultima_donacion: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          apellido?: string | null
          apto?: boolean | null
          cedula?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          motivo_diferimiento?: string | null
          nombre: string
          sexo?: string | null
          telefono?: string | null
          tipo_sangre?: string | null
          ultima_donacion?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          apellido?: string | null
          apto?: boolean | null
          cedula?: string | null
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          fecha_nacimiento?: string | null
          id?: string
          motivo_diferimiento?: string | null
          nombre?: string
          sexo?: string | null
          telefono?: string | null
          tipo_sangre?: string | null
          ultima_donacion?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donantes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      dosis_quimio: {
        Row: {
          ciclo_id: string | null
          created_at: string | null
          dosis_mg_m2: number | null
          dosis_total_mg: number | null
          duracion_infusion_min: number | null
          enfermera_id: string | null
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          medicamento: string
          notas: string | null
          via_administracion: string | null
        }
        Insert: {
          ciclo_id?: string | null
          created_at?: string | null
          dosis_mg_m2?: number | null
          dosis_total_mg?: number | null
          duracion_infusion_min?: number | null
          enfermera_id?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          medicamento: string
          notas?: string | null
          via_administracion?: string | null
        }
        Update: {
          ciclo_id?: string | null
          created_at?: string | null
          dosis_mg_m2?: number | null
          dosis_total_mg?: number | null
          duracion_infusion_min?: number | null
          enfermera_id?: string | null
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          medicamento?: string
          notas?: string | null
          via_administracion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dosis_quimio_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos_quimio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dosis_quimio_enfermera_id_fkey"
            columns: ["enfermera_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
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
      empleados_eap: {
        Row: {
          activo: boolean | null
          cargo: string | null
          codigo_anonimo: string
          contrato_id: string
          created_at: string
          created_by: string | null
          departamento: string | null
          id: string
          paciente_id: string
          sesiones_disponibles: number | null
          sesiones_usadas: number | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          cargo?: string | null
          codigo_anonimo: string
          contrato_id: string
          created_at?: string
          created_by?: string | null
          departamento?: string | null
          id?: string
          paciente_id: string
          sesiones_disponibles?: number | null
          sesiones_usadas?: number | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          cargo?: string | null
          codigo_anonimo?: string
          contrato_id?: string
          created_at?: string
          created_by?: string | null
          departamento?: string | null
          id?: string
          paciente_id?: string
          sesiones_disponibles?: number | null
          sesiones_usadas?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empleados_eap_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos_eap"
            referencedColumns: ["id"]
          },
        ]
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
      enfermedades_notificables: {
        Row: {
          activo: boolean
          categoria: string | null
          codigo: string | null
          id: string
          inmediata: boolean
          nombre: string
        }
        Insert: {
          activo?: boolean
          categoria?: string | null
          codigo?: string | null
          id?: string
          inmediata?: boolean
          nombre: string
        }
        Update: {
          activo?: boolean
          categoria?: string | null
          codigo?: string | null
          id?: string
          inmediata?: boolean
          nombre?: string
        }
        Relationships: []
      }
      enrolamientos_cronicos: {
        Row: {
          created_at: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          notas: string | null
          paciente_id: string
          programa_id: string
          ultimos_controles: Json | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          paciente_id: string
          programa_id: string
          ultimos_controles?: Json | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          notas?: string | null
          paciente_id?: string
          programa_id?: string
          ultimos_controles?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrolamientos_cronicos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolamientos_cronicos_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas_cronicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolamientos_cronicos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      envios_externos_psico: {
        Row: {
          created_at: string
          enviado_por: string | null
          estado: string
          id: string
          integracion_id: string
          payload: Json
          referencia_id: string
          respuesta: Json | null
          tipo_referencia: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          enviado_por?: string | null
          estado?: string
          id?: string
          integracion_id: string
          payload: Json
          referencia_id: string
          respuesta?: Json | null
          tipo_referencia: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          enviado_por?: string | null
          estado?: string
          id?: string
          integracion_id?: string
          payload?: Json
          referencia_id?: string
          respuesta?: Json | null
          tipo_referencia?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "envios_externos_psico_integracion_id_fkey"
            columns: ["integracion_id"]
            isOneToOne: false
            referencedRelation: "integraciones_externas_psico"
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
      equipos_hospitalarios: {
        Row: {
          costo_adquisicion: number | null
          created_at: string
          departamento: string | null
          estado: string
          fecha_adquisicion: string | null
          fecha_ultimo_mantenimiento: string | null
          garantia_hasta: string | null
          id: string
          marca: string | null
          modelo: string | null
          nombre: string
          numero_serie: string | null
          observaciones: string | null
          proveedor: string | null
          proximo_mantenimiento: string | null
          ubicacion: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          costo_adquisicion?: number | null
          created_at?: string
          departamento?: string | null
          estado?: string
          fecha_adquisicion?: string | null
          fecha_ultimo_mantenimiento?: string | null
          garantia_hasta?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre: string
          numero_serie?: string | null
          observaciones?: string | null
          proveedor?: string | null
          proximo_mantenimiento?: string | null
          ubicacion?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          costo_adquisicion?: number | null
          created_at?: string
          departamento?: string | null
          estado?: string
          fecha_adquisicion?: string | null
          fecha_ultimo_mantenimiento?: string | null
          garantia_hasta?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nombre?: string
          numero_serie?: string | null
          observaciones?: string | null
          proveedor?: string | null
          proximo_mantenimiento?: string | null
          ubicacion?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_hospitalarios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      escaneos_ocr: {
        Row: {
          confianza: number | null
          created_at: string | null
          documento_id: string
          estado: string | null
          id: string
          idioma_detectado: string | null
          metadata_extraida: Json | null
          texto_extraido: string | null
          workspace_id: string
        }
        Insert: {
          confianza?: number | null
          created_at?: string | null
          documento_id: string
          estado?: string | null
          id?: string
          idioma_detectado?: string | null
          metadata_extraida?: Json | null
          texto_extraido?: string | null
          workspace_id: string
        }
        Update: {
          confianza?: number | null
          created_at?: string | null
          documento_id?: string
          estado?: string | null
          id?: string
          idioma_detectado?: string | null
          metadata_extraida?: Json | null
          texto_extraido?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escaneos_ocr_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_clinicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escaneos_ocr_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      especialidad_categoria_module_access: {
        Row: {
          categoria: string
          modulo_key: string
        }
        Insert: {
          categoria: string
          modulo_key: string
        }
        Update: {
          categoria?: string
          modulo_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "especialidad_categoria_module_access_modulo_key_fkey"
            columns: ["modulo_key"]
            isOneToOne: false
            referencedRelation: "modulos_catalogo"
            referencedColumns: ["key"]
          },
        ]
      }
      especialidades_catalogo: {
        Row: {
          activo: boolean
          categoria: string
          created_at: string
          descripcion: string | null
          global: boolean
          id: string
          nombre: string
          requiere_colegiatura: boolean
          requiere_exequatur: boolean
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          categoria?: string
          created_at?: string
          descripcion?: string | null
          global?: boolean
          id?: string
          nombre: string
          requiere_colegiatura?: boolean
          requiere_exequatur?: boolean
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          categoria?: string
          created_at?: string
          descripcion?: string | null
          global?: boolean
          id?: string
          nombre?: string
          requiere_colegiatura?: boolean
          requiere_exequatur?: boolean
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "especialidades_catalogo_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      estudios_patologia: {
        Row: {
          created_at: string
          diagnostico_final: string | null
          diagnostico_macro: string | null
          diagnostico_micro: string | null
          estado: string
          fecha_recepcion: string | null
          fecha_resultado: string | null
          id: string
          medico_solicitante_id: string | null
          muestra: string
          numero: string
          observaciones: string | null
          paciente_id: string | null
          patologo_id: string | null
          sitio_anatomico: string | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          diagnostico_final?: string | null
          diagnostico_macro?: string | null
          diagnostico_micro?: string | null
          estado?: string
          fecha_recepcion?: string | null
          fecha_resultado?: string | null
          id?: string
          medico_solicitante_id?: string | null
          muestra?: string
          numero?: string
          observaciones?: string | null
          paciente_id?: string | null
          patologo_id?: string | null
          sitio_anatomico?: string | null
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          diagnostico_final?: string | null
          diagnostico_macro?: string | null
          diagnostico_micro?: string | null
          estado?: string
          fecha_recepcion?: string | null
          fecha_resultado?: string | null
          id?: string
          medico_solicitante_id?: string | null
          muestra?: string
          numero?: string
          observaciones?: string | null
          paciente_id?: string | null
          patologo_id?: string | null
          sitio_anatomico?: string | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "estudios_patologia_medico_solicitante_id_fkey"
            columns: ["medico_solicitante_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudios_patologia_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudios_patologia_patologo_id_fkey"
            columns: ["patologo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estudios_patologia_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluaciones_desempeno: {
        Row: {
          areas_mejora: string | null
          calificacion_global: number | null
          competencias: Json | null
          created_at: string | null
          empleado_id: string
          estado: string | null
          evaluador_id: string | null
          fecha_evaluacion: string | null
          firmada_empleado: boolean | null
          firmada_evaluador: boolean | null
          fortalezas: string | null
          id: string
          periodo: string
          plan_accion: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          areas_mejora?: string | null
          calificacion_global?: number | null
          competencias?: Json | null
          created_at?: string | null
          empleado_id: string
          estado?: string | null
          evaluador_id?: string | null
          fecha_evaluacion?: string | null
          firmada_empleado?: boolean | null
          firmada_evaluador?: boolean | null
          fortalezas?: string | null
          id?: string
          periodo: string
          plan_accion?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          areas_mejora?: string | null
          calificacion_global?: number | null
          competencias?: Json | null
          created_at?: string | null
          empleado_id?: string
          estado?: string | null
          evaluador_id?: string | null
          fecha_evaluacion?: string | null
          firmada_empleado?: boolean | null
          firmada_evaluador?: boolean | null
          fortalezas?: string | null
          id?: string
          periodo?: string
          plan_accion?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      evaluaciones_esteticas: {
        Row: {
          altura: number | null
          created_at: string
          estado: string
          evaluador_id: string | null
          fotos_antes: string[] | null
          id: string
          imc: number | null
          lead_id: string | null
          medidas: Json | null
          notas_clinicas: string | null
          numero: string
          objetivos: string | null
          paciente_id: string | null
          peso: number | null
          presupuesto: number | null
          procedimiento_recomendado: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          altura?: number | null
          created_at?: string
          estado?: string
          evaluador_id?: string | null
          fotos_antes?: string[] | null
          id?: string
          imc?: number | null
          lead_id?: string | null
          medidas?: Json | null
          notas_clinicas?: string | null
          numero?: string
          objetivos?: string | null
          paciente_id?: string | null
          peso?: number | null
          presupuesto?: number | null
          procedimiento_recomendado?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          altura?: number | null
          created_at?: string
          estado?: string
          evaluador_id?: string | null
          fotos_antes?: string[] | null
          id?: string
          imc?: number | null
          lead_id?: string | null
          medidas?: Json | null
          notas_clinicas?: string | null
          numero?: string
          objetivos?: string | null
          paciente_id?: string | null
          peso?: number | null
          presupuesto?: number | null
          procedimiento_recomendado?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluaciones_esteticas_evaluador_id_fkey"
            columns: ["evaluador_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_esteticas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads_estetica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_esteticas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluaciones_esteticas_workspace_id_fkey"
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
      evaluaciones_psicometricas: {
        Row: {
          auto_completado_paciente: boolean | null
          created_at: string
          escala: string
          fecha_aplicacion: string | null
          id: string
          notas: string | null
          paciente_id: string
          puntaje_total: number | null
          respuestas: Json | null
          severidad: string | null
          terapeuta_id: string | null
          token_paciente: string | null
          workspace_id: string
        }
        Insert: {
          auto_completado_paciente?: boolean | null
          created_at?: string
          escala: string
          fecha_aplicacion?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          puntaje_total?: number | null
          respuestas?: Json | null
          severidad?: string | null
          terapeuta_id?: string | null
          token_paciente?: string | null
          workspace_id: string
        }
        Update: {
          auto_completado_paciente?: boolean | null
          created_at?: string
          escala?: string
          fecha_aplicacion?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          puntaje_total?: number | null
          respuestas?: Json | null
          severidad?: string | null
          terapeuta_id?: string | null
          token_paciente?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      eventos_adversos: {
        Row: {
          causa_raiz: string | null
          consecuencias: string | null
          created_at: string
          departamento: string | null
          descripcion: string
          estado: string
          fecha_cierre: string | null
          fecha_evento: string
          id: string
          involucrados: Json | null
          metadata: Json | null
          notificado_familia: boolean | null
          notificado_paciente: boolean | null
          numero: string | null
          paciente_id: string | null
          reportado_por: string | null
          severidad: string
          tipo: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          causa_raiz?: string | null
          consecuencias?: string | null
          created_at?: string
          departamento?: string | null
          descripcion: string
          estado?: string
          fecha_cierre?: string | null
          fecha_evento?: string
          id?: string
          involucrados?: Json | null
          metadata?: Json | null
          notificado_familia?: boolean | null
          notificado_paciente?: boolean | null
          numero?: string | null
          paciente_id?: string | null
          reportado_por?: string | null
          severidad: string
          tipo: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          causa_raiz?: string | null
          consecuencias?: string | null
          created_at?: string
          departamento?: string | null
          descripcion?: string
          estado?: string
          fecha_cierre?: string | null
          fecha_evento?: string
          id?: string
          involucrados?: Json | null
          metadata?: Json | null
          notificado_familia?: boolean | null
          notificado_paciente?: boolean | null
          numero?: string | null
          paciente_id?: string | null
          reportado_por?: string | null
          severidad?: string
          tipo?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_adversos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_adversos_workspace_id_fkey"
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
      expedientes_dentales: {
        Row: {
          alergias_dentales: string | null
          bruxismo: boolean | null
          created_at: string
          habitos: string | null
          historial_medico: string | null
          id: string
          medicamentos: string | null
          notas: string | null
          paciente_id: string
          radiografias: string[] | null
          tratamientos_previos: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          alergias_dentales?: string | null
          bruxismo?: boolean | null
          created_at?: string
          habitos?: string | null
          historial_medico?: string | null
          id?: string
          medicamentos?: string | null
          notas?: string | null
          paciente_id: string
          radiografias?: string[] | null
          tratamientos_previos?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          alergias_dentales?: string | null
          bruxismo?: boolean | null
          created_at?: string
          habitos?: string | null
          historial_medico?: string | null
          id?: string
          medicamentos?: string | null
          notas?: string | null
          paciente_id?: string
          radiografias?: string[] | null
          tratamientos_previos?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_dentales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: true
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_dentales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      expedientes_visuales: {
        Row: {
          agudeza_od: string | null
          agudeza_oi: string | null
          antecedentes_oculares: Json | null
          created_at: string
          diabetes: boolean | null
          hipertension: boolean | null
          id: string
          notas: string | null
          paciente_id: string
          presion_intraocular_od: number | null
          presion_intraocular_oi: number | null
          tipo_lentes_actual: string | null
          ultima_revision: string | null
          updated_at: string
          usa_lentes: boolean | null
          workspace_id: string
        }
        Insert: {
          agudeza_od?: string | null
          agudeza_oi?: string | null
          antecedentes_oculares?: Json | null
          created_at?: string
          diabetes?: boolean | null
          hipertension?: boolean | null
          id?: string
          notas?: string | null
          paciente_id: string
          presion_intraocular_od?: number | null
          presion_intraocular_oi?: number | null
          tipo_lentes_actual?: string | null
          ultima_revision?: string | null
          updated_at?: string
          usa_lentes?: boolean | null
          workspace_id: string
        }
        Update: {
          agudeza_od?: string | null
          agudeza_oi?: string | null
          antecedentes_oculares?: Json | null
          created_at?: string
          diabetes?: boolean | null
          hipertension?: boolean | null
          id?: string
          notas?: string | null
          paciente_id?: string
          presion_intraocular_od?: number | null
          presion_intraocular_oi?: number | null
          tipo_lentes_actual?: string | null
          ultima_revision?: string | null
          updated_at?: string
          usa_lentes?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expedientes_visuales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: true
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expedientes_visuales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      exportaciones_historia_clinica: {
        Row: {
          created_at: string
          destinatario: string | null
          exportado_por: string
          formato: string
          hash_contenido: string | null
          id: string
          motivo: string
          paciente_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          destinatario?: string | null
          exportado_por: string
          formato?: string
          hash_contenido?: string | null
          id?: string
          motivo: string
          paciente_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          destinatario?: string | null
          exportado_por?: string
          formato?: string
          hash_contenido?: string | null
          id?: string
          motivo?: string
          paciente_id?: string
          workspace_id?: string
        }
        Relationships: []
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
          vertical: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
      facturas_electronicas_vertical: {
        Row: {
          created_at: string
          detalle: Json | null
          estado_dgii: string
          fecha_emision: string
          fecha_vencimiento: string | null
          id: string
          itbis: number
          ncf: string | null
          nombre_cliente: string | null
          numero_factura: string | null
          paciente_id: string | null
          respuesta_dgii: Json | null
          rnc_cedula_cliente: string | null
          subtotal: number
          tipo_comprobante: string
          total: number
          updated_at: string
          vertical_tipo: string
          workspace_id: string
          xml_ecf: string | null
        }
        Insert: {
          created_at?: string
          detalle?: Json | null
          estado_dgii?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          itbis?: number
          ncf?: string | null
          nombre_cliente?: string | null
          numero_factura?: string | null
          paciente_id?: string | null
          respuesta_dgii?: Json | null
          rnc_cedula_cliente?: string | null
          subtotal?: number
          tipo_comprobante?: string
          total?: number
          updated_at?: string
          vertical_tipo: string
          workspace_id: string
          xml_ecf?: string | null
        }
        Update: {
          created_at?: string
          detalle?: Json | null
          estado_dgii?: string
          fecha_emision?: string
          fecha_vencimiento?: string | null
          id?: string
          itbis?: number
          ncf?: string | null
          nombre_cliente?: string | null
          numero_factura?: string | null
          paciente_id?: string | null
          respuesta_dgii?: Json | null
          rnc_cedula_cliente?: string | null
          subtotal?: number
          tipo_comprobante?: string
          total?: number
          updated_at?: string
          vertical_tipo?: string
          workspace_id?: string
          xml_ecf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_electronicas_vertical_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facturas_electronicas_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas_psicologia: {
        Row: {
          created_at: string
          created_by: string | null
          estado: string
          fecha_emision: string
          fecha_pago: string | null
          id: string
          itbis: number
          metodo_pago: string | null
          nota: string | null
          numero: string
          paciente_id: string
          paquete_id: string | null
          sesion_id: string | null
          subtotal: number
          total: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_emision?: string
          fecha_pago?: string | null
          id?: string
          itbis?: number
          metodo_pago?: string | null
          nota?: string | null
          numero: string
          paciente_id: string
          paquete_id?: string | null
          sesion_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: string
          fecha_emision?: string
          fecha_pago?: string | null
          id?: string
          itbis?: number
          metodo_pago?: string | null
          nota?: string | null
          numero?: string
          paciente_id?: string
          paquete_id?: string | null
          sesion_id?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      fhir_export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          estado: string
          exported_resources: number | null
          filters: Json | null
          id: string
          resource_types: string[]
          result_url: string | null
          total_resources: number | null
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          estado?: string
          exported_resources?: number | null
          filters?: Json | null
          id?: string
          resource_types: string[]
          result_url?: string | null
          total_resources?: number | null
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          estado?: string
          exported_resources?: number | null
          filters?: Json | null
          id?: string
          resource_types?: string[]
          result_url?: string | null
          total_resources?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fhir_export_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fhir_import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          errors: Json | null
          estado: string
          failed_resources: number | null
          id: string
          imported_resources: number | null
          source_system: string | null
          total_resources: number | null
          workspace_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          errors?: Json | null
          estado?: string
          failed_resources?: number | null
          id?: string
          imported_resources?: number | null
          source_system?: string | null
          total_resources?: number | null
          workspace_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          errors?: Json | null
          estado?: string
          failed_resources?: number | null
          id?: string
          imported_resources?: number | null
          source_system?: string | null
          total_resources?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fhir_import_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fhir_mappings: {
        Row: {
          created_at: string
          external_system: string | null
          fhir_id: string
          fhir_resource_type: string
          id: string
          local_id: string
          local_table: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          external_system?: string | null
          fhir_id: string
          fhir_resource_type: string
          id?: string
          local_id: string
          local_table: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          external_system?: string | null
          fhir_id?: string
          fhir_resource_type?: string
          id?: string
          local_id?: string
          local_table?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fhir_mappings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      fhir_resources: {
        Row: {
          created_at: string
          created_by: string | null
          fhir_id: string
          id: string
          paciente_id: string | null
          payload: Json
          resource_type: string
          source: string | null
          updated_at: string
          version_id: number
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fhir_id: string
          id?: string
          paciente_id?: string | null
          payload: Json
          resource_type: string
          source?: string | null
          updated_at?: string
          version_id?: number
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fhir_id?: string
          id?: string
          paciente_id?: string | null
          payload?: Json
          resource_type?: string
          source?: string | null
          updated_at?: string
          version_id?: number
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fhir_resources_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fhir_resources_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      financiamiento_estetico: {
        Row: {
          balance_pendiente: number | null
          created_at: string
          estado: string
          fecha_inicio: string | null
          id: string
          monto_cuota: number | null
          monto_total: number
          notas: string | null
          numero: string
          numero_cuotas: number | null
          paciente_id: string | null
          procedimiento: string | null
          proximo_pago: string | null
          separacion: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          balance_pendiente?: number | null
          created_at?: string
          estado?: string
          fecha_inicio?: string | null
          id?: string
          monto_cuota?: number | null
          monto_total: number
          notas?: string | null
          numero?: string
          numero_cuotas?: number | null
          paciente_id?: string | null
          procedimiento?: string | null
          proximo_pago?: string | null
          separacion?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          balance_pendiente?: number | null
          created_at?: string
          estado?: string
          fecha_inicio?: string | null
          id?: string
          monto_cuota?: number | null
          monto_total?: number
          notas?: string | null
          numero?: string
          numero_cuotas?: number | null
          paciente_id?: string | null
          procedimiento?: string | null
          proximo_pago?: string | null
          separacion?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financiamiento_estetico_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financiamiento_estetico_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      firmas_digitales: {
        Row: {
          contenido_firmado: Json | null
          created_at: string
          created_by: string | null
          estado: string
          firma_imagen_url: string | null
          firmado_at: string
          firmante_cedula: string | null
          firmante_nombre: string
          firmante_rol: string | null
          firmante_user_id: string | null
          id: string
          ip_firma: string | null
          motivo_anulacion: string | null
          notas: string | null
          paciente_id: string | null
          referencia_id: string | null
          referencia_tabla: string | null
          tipo_documento: string
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          contenido_firmado?: Json | null
          created_at?: string
          created_by?: string | null
          estado?: string
          firma_imagen_url?: string | null
          firmado_at?: string
          firmante_cedula?: string | null
          firmante_nombre: string
          firmante_rol?: string | null
          firmante_user_id?: string | null
          id?: string
          ip_firma?: string | null
          motivo_anulacion?: string | null
          notas?: string | null
          paciente_id?: string | null
          referencia_id?: string | null
          referencia_tabla?: string | null
          tipo_documento: string
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          contenido_firmado?: Json | null
          created_at?: string
          created_by?: string | null
          estado?: string
          firma_imagen_url?: string | null
          firmado_at?: string
          firmante_cedula?: string | null
          firmante_nombre?: string
          firmante_rol?: string | null
          firmante_user_id?: string | null
          id?: string
          ip_firma?: string | null
          motivo_anulacion?: string | null
          notas?: string | null
          paciente_id?: string | null
          referencia_id?: string | null
          referencia_tabla?: string | null
          tipo_documento?: string
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firmas_digitales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firmas_digitales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      firmas_electronicas: {
        Row: {
          created_at: string | null
          documento_id: string
          firma_data: string | null
          firmante_id: string | null
          hash_documento: string | null
          id: string
          ip_address: string | null
          nombre_firmante: string | null
          tipo_firmante: string
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          documento_id: string
          firma_data?: string | null
          firmante_id?: string | null
          hash_documento?: string | null
          id?: string
          ip_address?: string | null
          nombre_firmante?: string | null
          tipo_firmante?: string
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          documento_id?: string
          firma_data?: string | null
          firmante_id?: string | null
          hash_documento?: string | null
          id?: string
          ip_address?: string | null
          nombre_firmante?: string | null
          tipo_firmante?: string
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firmas_electronicas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos_clinicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "firmas_electronicas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      firmas_prescripciones_psiq: {
        Row: {
          firma_base64: string
          firmado_at: string
          hash_contenido: string
          id: string
          ip: string | null
          medico_id: string
          prescripcion_id: string
          user_agent: string | null
          workspace_id: string
        }
        Insert: {
          firma_base64: string
          firmado_at?: string
          hash_contenido: string
          id?: string
          ip?: string | null
          medico_id: string
          prescripcion_id: string
          user_agent?: string | null
          workspace_id: string
        }
        Update: {
          firma_base64?: string
          firmado_at?: string
          hash_contenido?: string
          id?: string
          ip?: string | null
          medico_id?: string
          prescripcion_id?: string
          user_agent?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      forecast_ingresos: {
        Row: {
          anio: number
          categoria: string
          created_at: string | null
          created_by: string | null
          id: string
          mes: number
          monto_estimado: number
          monto_real: number | null
          notas: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          anio: number
          categoria: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          mes: number
          monto_estimado?: number
          monto_real?: number | null
          notas?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          anio?: number
          categoria?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          mes?: number
          monto_estimado?: number
          monto_real?: number | null
          notas?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      fotos_evolucion: {
        Row: {
          angulo: string | null
          consentimiento_uso: boolean | null
          created_at: string | null
          fecha_foto: string | null
          foto_url: string
          id: string
          notas: string | null
          paciente_id: string
          procedimiento: string | null
          tipo: string
          workspace_id: string
        }
        Insert: {
          angulo?: string | null
          consentimiento_uso?: boolean | null
          created_at?: string | null
          fecha_foto?: string | null
          foto_url: string
          id?: string
          notas?: string | null
          paciente_id: string
          procedimiento?: string | null
          tipo: string
          workspace_id: string
        }
        Update: {
          angulo?: string | null
          consentimiento_uso?: boolean | null
          created_at?: string | null
          fecha_foto?: string | null
          foto_url?: string
          id?: string
          notas?: string | null
          paciente_id?: string
          procedimiento?: string | null
          tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fotos_evolucion_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_evolucion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      galeria_antes_despues: {
        Row: {
          consentimiento_uso_imagen: boolean | null
          created_at: string
          fecha_foto_despues: string | null
          fecha_procedimiento: string | null
          foto_antes: string | null
          foto_despues: string | null
          foto_durante: string | null
          id: string
          notas: string | null
          paciente_id: string | null
          procedimiento: string
          publicable: boolean | null
          workspace_id: string
        }
        Insert: {
          consentimiento_uso_imagen?: boolean | null
          created_at?: string
          fecha_foto_despues?: string | null
          fecha_procedimiento?: string | null
          foto_antes?: string | null
          foto_despues?: string | null
          foto_durante?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string | null
          procedimiento: string
          publicable?: boolean | null
          workspace_id: string
        }
        Update: {
          consentimiento_uso_imagen?: boolean | null
          created_at?: string
          fecha_foto_despues?: string | null
          fecha_procedimiento?: string | null
          foto_antes?: string | null
          foto_despues?: string | null
          foto_durante?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string | null
          procedimiento?: string
          publicable?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "galeria_antes_despues_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "galeria_antes_despues_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      garantias_optica: {
        Row: {
          created_at: string | null
          duracion_meses: number | null
          estado: string | null
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          id: string
          orden_id: string | null
          paciente_id: string | null
          reclamacion_descripcion: string | null
          reclamacion_fecha: string | null
          tipo: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          duracion_meses?: number | null
          estado?: string | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string
          orden_id?: string | null
          paciente_id?: string | null
          reclamacion_descripcion?: string | null
          reclamacion_fecha?: string | null
          tipo: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          duracion_meses?: number | null
          estado?: string | null
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string
          orden_id?: string | null
          paciente_id?: string | null
          reclamacion_descripcion?: string | null
          reclamacion_fecha?: string | null
          tipo?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "garantias_optica_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garantias_optica_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      habitaciones_recovery: {
        Row: {
          activa: boolean | null
          amenidades: Json | null
          capacidad: number | null
          created_at: string
          estado: string
          id: string
          nombre: string
          notas: string | null
          piso: string | null
          tarifa_diaria: number | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activa?: boolean | null
          amenidades?: Json | null
          capacidad?: number | null
          created_at?: string
          estado?: string
          id?: string
          nombre: string
          notas?: string | null
          piso?: string | null
          tarifa_diaria?: number | null
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activa?: boolean | null
          amenidades?: Json | null
          capacidad?: number | null
          created_at?: string
          estado?: string
          id?: string
          nombre?: string
          notas?: string | null
          piso?: string | null
          tarifa_diaria?: number | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habitaciones_recovery_workspace_id_fkey"
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
      historia_compartida_vertical: {
        Row: {
          compartido_por: string | null
          created_at: string
          documentos: Json | null
          id: string
          paciente_id: string
          resumen: string | null
          vertical_destino: string
          vertical_origen: string
          workspace_id: string
        }
        Insert: {
          compartido_por?: string | null
          created_at?: string
          documentos?: Json | null
          id?: string
          paciente_id: string
          resumen?: string | null
          vertical_destino: string
          vertical_origen: string
          workspace_id: string
        }
        Update: {
          compartido_por?: string | null
          created_at?: string
          documentos?: Json | null
          id?: string
          paciente_id?: string
          resumen?: string | null
          vertical_destino?: string
          vertical_origen?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historia_compartida_vertical_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historia_compartida_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      hl7_endpoints: {
        Row: {
          activo: boolean
          configuracion: Json | null
          created_at: string
          id: string
          nombre: string
          protocolo: string | null
          tipo: string
          updated_at: string
          url: string | null
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          configuracion?: Json | null
          created_at?: string
          id?: string
          nombre: string
          protocolo?: string | null
          tipo: string
          updated_at?: string
          url?: string | null
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          configuracion?: Json | null
          created_at?: string
          id?: string
          nombre?: string
          protocolo?: string | null
          tipo?: string
          updated_at?: string
          url?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hl7_endpoints_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      hl7_messages: {
        Row: {
          control_id: string | null
          created_at: string
          direccion: string
          endpoint_id: string | null
          error_message: string | null
          estado: string
          id: string
          message_type: string
          paciente_id: string | null
          parsed_json: Json | null
          processed_at: string | null
          raw_message: string
          trigger_event: string | null
          workspace_id: string | null
        }
        Insert: {
          control_id?: string | null
          created_at?: string
          direccion: string
          endpoint_id?: string | null
          error_message?: string | null
          estado?: string
          id?: string
          message_type: string
          paciente_id?: string | null
          parsed_json?: Json | null
          processed_at?: string | null
          raw_message: string
          trigger_event?: string | null
          workspace_id?: string | null
        }
        Update: {
          control_id?: string | null
          created_at?: string
          direccion?: string
          endpoint_id?: string | null
          error_message?: string | null
          estado?: string
          id?: string
          message_type?: string
          paciente_id?: string | null
          parsed_json?: Json | null
          processed_at?: string | null
          raw_message?: string
          trigger_event?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hl7_messages_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "hl7_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hl7_messages_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hl7_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      ia_alertas_tempranas: {
        Row: {
          created_at: string | null
          datos_soporte: Json | null
          id: string
          modelo_id: string | null
          paciente_id: string | null
          probabilidad: number | null
          recomendacion: string | null
          revisada: boolean | null
          revisada_por: string | null
          severidad: string | null
          tipo_alerta: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          datos_soporte?: Json | null
          id?: string
          modelo_id?: string | null
          paciente_id?: string | null
          probabilidad?: number | null
          recomendacion?: string | null
          revisada?: boolean | null
          revisada_por?: string | null
          severidad?: string | null
          tipo_alerta: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          datos_soporte?: Json | null
          id?: string
          modelo_id?: string | null
          paciente_id?: string | null
          probabilidad?: number | null
          recomendacion?: string | null
          revisada?: boolean | null
          revisada_por?: string | null
          severidad?: string | null
          tipo_alerta?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_alertas_tempranas_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "ia_modelos_predictivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ia_alertas_tempranas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ia_alertas_tempranas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_configuracion: {
        Row: {
          consentimiento_paciente_requerido: boolean
          habilitada: boolean
          id: string
          interacciones_tiempo_real: boolean
          modelo_preferido: string | null
          notas: string | null
          resumenes_automaticos: boolean
          scribe_activo: boolean
          updated_at: string
          workspace_id: string
        }
        Insert: {
          consentimiento_paciente_requerido?: boolean
          habilitada?: boolean
          id?: string
          interacciones_tiempo_real?: boolean
          modelo_preferido?: string | null
          notas?: string | null
          resumenes_automaticos?: boolean
          scribe_activo?: boolean
          updated_at?: string
          workspace_id: string
        }
        Update: {
          consentimiento_paciente_requerido?: boolean
          habilitada?: boolean
          id?: string
          interacciones_tiempo_real?: boolean
          modelo_preferido?: string | null
          notas?: string | null
          resumenes_automaticos?: boolean
          scribe_activo?: boolean
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_configuracion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_modelos_predictivos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          parametros: Json | null
          precision_score: number | null
          tipo: string
          ultima_ejecucion: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          parametros?: Json | null
          precision_score?: number | null
          tipo: string
          ultima_ejecucion?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          parametros?: Json | null
          precision_score?: number | null
          tipo?: string
          ultima_ejecucion?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_modelos_predictivos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_solicitudes: {
        Row: {
          contexto: Json | null
          created_at: string
          error_msg: string | null
          estado: string
          id: string
          modelo: string | null
          paciente_id: string | null
          procesado_at: string | null
          prompt: string | null
          respuesta: string | null
          tipo: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          contexto?: Json | null
          created_at?: string
          error_msg?: string | null
          estado?: string
          id?: string
          modelo?: string | null
          paciente_id?: string | null
          procesado_at?: string | null
          prompt?: string | null
          respuesta?: string | null
          tipo: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          contexto?: Json | null
          created_at?: string
          error_msg?: string | null
          estado?: string
          id?: string
          modelo?: string | null
          paciente_id?: string | null
          procesado_at?: string | null
          prompt?: string | null
          respuesta?: string | null
          tipo?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ia_solicitudes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ia_solicitudes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      indicadores_calidad: {
        Row: {
          activo: boolean
          categoria: string
          codigo: string
          created_at: string
          descripcion: string | null
          estandar: string | null
          formula: string | null
          frecuencia: string | null
          id: string
          meta: number | null
          nombre: string
          umbral_alerta: number | null
          umbral_critico: number | null
          unidad: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          categoria: string
          codigo: string
          created_at?: string
          descripcion?: string | null
          estandar?: string | null
          formula?: string | null
          frecuencia?: string | null
          id?: string
          meta?: number | null
          nombre: string
          umbral_alerta?: number | null
          umbral_critico?: number | null
          unidad?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          categoria?: string
          codigo?: string
          created_at?: string
          descripcion?: string | null
          estandar?: string | null
          formula?: string | null
          frecuencia?: string | null
          id?: string
          meta?: number | null
          nombre?: string
          umbral_alerta?: number | null
          umbral_critico?: number | null
          unidad?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "indicadores_calidad_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      integraciones_externas_psico: {
        Row: {
          activo: boolean
          api_key_cifrada: string | null
          created_at: string
          endpoint: string | null
          id: string
          metadata: Json | null
          nombre: string
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          api_key_cifrada?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          metadata?: Json | null
          nombre: string
          tipo: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          api_key_cifrada?: string | null
          created_at?: string
          endpoint?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      integraciones_externas_vertical: {
        Row: {
          activo: boolean | null
          configuracion: Json | null
          created_at: string
          id: string
          nombre: string
          tipo_integracion: string
          ultimo_sync: string | null
          updated_at: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          configuracion?: Json | null
          created_at?: string
          id?: string
          nombre: string
          tipo_integracion: string
          ultimo_sync?: string | null
          updated_at?: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          configuracion?: Json | null
          created_at?: string
          id?: string
          nombre?: string
          tipo_integracion?: string
          ultimo_sync?: string | null
          updated_at?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integraciones_externas_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      interacciones_farmacologicas: {
        Row: {
          created_at: string | null
          efecto_clinico: string | null
          id: string
          mecanismo: string | null
          principio_activo_a: string
          principio_activo_b: string
          recomendacion: string | null
          referencia: string | null
          severidad: string
        }
        Insert: {
          created_at?: string | null
          efecto_clinico?: string | null
          id?: string
          mecanismo?: string | null
          principio_activo_a: string
          principio_activo_b: string
          recomendacion?: string | null
          referencia?: string | null
          severidad: string
        }
        Update: {
          created_at?: string | null
          efecto_clinico?: string | null
          id?: string
          mecanismo?: string | null
          principio_activo_a?: string
          principio_activo_b?: string
          recomendacion?: string | null
          referencia?: string | null
          severidad?: string
        }
        Relationships: []
      }
      inventario_hemocomponentes: {
        Row: {
          codigo_unidad: string
          componente: string
          created_at: string | null
          donacion_id: string | null
          estado: string | null
          fecha_extraccion: string
          fecha_vencimiento: string
          id: string
          tipo_sangre: string
          ubicacion: string | null
          updated_at: string | null
          volumen_ml: number | null
          workspace_id: string | null
        }
        Insert: {
          codigo_unidad: string
          componente: string
          created_at?: string | null
          donacion_id?: string | null
          estado?: string | null
          fecha_extraccion: string
          fecha_vencimiento: string
          id?: string
          tipo_sangre: string
          ubicacion?: string | null
          updated_at?: string | null
          volumen_ml?: number | null
          workspace_id?: string | null
        }
        Update: {
          codigo_unidad?: string
          componente?: string
          created_at?: string | null
          donacion_id?: string | null
          estado?: string | null
          fecha_extraccion?: string
          fecha_vencimiento?: string
          id?: string
          tipo_sangre?: string
          ubicacion?: string | null
          updated_at?: string | null
          volumen_ml?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventario_hemocomponentes_donacion_id_fkey"
            columns: ["donacion_id"]
            isOneToOne: false
            referencedRelation: "donaciones_sangre"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventario_hemocomponentes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      inventario_optica: {
        Row: {
          activo: boolean | null
          codigo_barras: string | null
          color: string | null
          costo: number | null
          created_at: string
          genero: string | null
          id: string
          marca: string | null
          material: string | null
          modelo: string | null
          precio_venta: number | null
          proveedor: string | null
          stock: number | null
          stock_minimo: number | null
          tamano: string | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          codigo_barras?: string | null
          color?: string | null
          costo?: number | null
          created_at?: string
          genero?: string | null
          id?: string
          marca?: string | null
          material?: string | null
          modelo?: string | null
          precio_venta?: number | null
          proveedor?: string | null
          stock?: number | null
          stock_minimo?: number | null
          tamano?: string | null
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          codigo_barras?: string | null
          color?: string | null
          costo?: number | null
          created_at?: string
          genero?: string | null
          id?: string
          marca?: string | null
          material?: string | null
          modelo?: string | null
          precio_venta?: number | null
          proveedor?: string | null
          stock?: number | null
          stock_minimo?: number | null
          tamano?: string | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_optica_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_ropa: {
        Row: {
          cantidad_disponible: number | null
          cantidad_total: number | null
          costo_unitario: number | null
          created_at: string
          descripcion: string | null
          en_baja: number | null
          en_lavado: number | null
          id: string
          proveedor: string | null
          stock_minimo: number | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cantidad_disponible?: number | null
          cantidad_total?: number | null
          costo_unitario?: number | null
          created_at?: string
          descripcion?: string | null
          en_baja?: number | null
          en_lavado?: number | null
          id?: string
          proveedor?: string | null
          stock_minimo?: number | null
          tipo: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cantidad_disponible?: number | null
          cantidad_total?: number | null
          costo_unitario?: number | null
          created_at?: string
          descripcion?: string | null
          en_baja?: number | null
          en_lavado?: number | null
          id?: string
          proveedor?: string | null
          stock_minimo?: number | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_ropa_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      inventario_vertical: {
        Row: {
          activo: boolean | null
          categoria: string | null
          created_at: string | null
          fecha_vencimiento: string | null
          id: string
          lote: string | null
          nombre: string
          precio_costo: number | null
          precio_venta: number | null
          proveedor: string | null
          sku: string | null
          stock_actual: number | null
          stock_minimo: number | null
          ubicacion: string | null
          unidad: string | null
          updated_at: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          nombre: string
          precio_costo?: number | null
          precio_venta?: number | null
          proveedor?: string | null
          sku?: string | null
          stock_actual?: number | null
          stock_minimo?: number | null
          ubicacion?: string | null
          unidad?: string | null
          updated_at?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          nombre?: string
          precio_costo?: number | null
          precio_venta?: number | null
          proveedor?: string | null
          sku?: string | null
          stock_actual?: number | null
          stock_minimo?: number | null
          ubicacion?: string | null
          unidad?: string | null
          updated_at?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventario_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      lactancia_seguimiento: {
        Row: {
          created_at: string | null
          fecha: string
          frecuencia_tomas: number | null
          id: string
          intervencion: string | null
          problemas: string | null
          recien_nacido_id: string | null
          responsable_id: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          fecha: string
          frecuencia_tomas?: number | null
          id?: string
          intervencion?: string | null
          problemas?: string | null
          recien_nacido_id?: string | null
          responsable_id?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          fecha?: string
          frecuencia_tomas?: number | null
          id?: string
          intervencion?: string | null
          problemas?: string | null
          recien_nacido_id?: string | null
          responsable_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lactancia_seguimiento_recien_nacido_id_fkey"
            columns: ["recien_nacido_id"]
            isOneToOne: false
            referencedRelation: "recien_nacidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lactancia_seguimiento_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
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
      leads_estetica: {
        Row: {
          created_at: string
          ejecutivo_id: string | null
          email: string | null
          estado: string
          fecha_proximo_contacto: string | null
          id: string
          metadata: Json | null
          motivo_perdida: string | null
          nombre: string
          notas: string | null
          numero: string
          origen: string
          presupuesto_estimado: number | null
          procedimiento_interes: string | null
          telefono: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          ejecutivo_id?: string | null
          email?: string | null
          estado?: string
          fecha_proximo_contacto?: string | null
          id?: string
          metadata?: Json | null
          motivo_perdida?: string | null
          nombre: string
          notas?: string | null
          numero?: string
          origen?: string
          presupuesto_estimado?: number | null
          procedimiento_interes?: string | null
          telefono?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          ejecutivo_id?: string | null
          email?: string | null
          estado?: string
          fecha_proximo_contacto?: string | null
          id?: string
          metadata?: Json | null
          motivo_perdida?: string | null
          nombre?: string
          notas?: string | null
          numero?: string
          origen?: string
          presupuesto_estimado?: number | null
          procedimiento_interes?: string | null
          telefono?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_estetica_ejecutivo_id_fkey"
            columns: ["ejecutivo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_estetica_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_vertical: {
        Row: {
          created_at: string | null
          email: string | null
          estado: string | null
          id: string
          nombre: string
          notas: string | null
          origen: string | null
          sucursal_id: string | null
          telefono: string | null
          updated_at: string | null
          valor_estimado: number | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nombre: string
          notas?: string | null
          origen?: string | null
          sucursal_id?: string | null
          telefono?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          origen?: string | null
          sucursal_id?: string | null
          telefono?: string | null
          updated_at?: string | null
          valor_estimado?: number | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_vertical_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales_vertical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lecturas_iot: {
        Row: {
          created_at: string | null
          dispositivo_id: string
          id: string
          metadata: Json | null
          tipo_medicion: string
          unidad: string
          valor: number
        }
        Insert: {
          created_at?: string | null
          dispositivo_id: string
          id?: string
          metadata?: Json | null
          tipo_medicion: string
          unidad: string
          valor: number
        }
        Update: {
          created_at?: string | null
          dispositivo_id?: string
          id?: string
          metadata?: Json | null
          tipo_medicion?: string
          unidad?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lecturas_iot_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos_iot"
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
      lista_espera_admision: {
        Row: {
          cama_asignada_id: string | null
          created_at: string | null
          estado: string | null
          fecha_solicitud: string | null
          id: string
          motivo: string | null
          paciente_id: string | null
          prioridad: string | null
          servicio_solicitado: string
          workspace_id: string | null
        }
        Insert: {
          cama_asignada_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_solicitud?: string | null
          id?: string
          motivo?: string | null
          paciente_id?: string | null
          prioridad?: string | null
          servicio_solicitado: string
          workspace_id?: string | null
        }
        Update: {
          cama_asignada_id?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_solicitud?: string | null
          id?: string
          motivo?: string | null
          paciente_id?: string | null
          prioridad?: string | null
          servicio_solicitado?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lista_espera_admision_cama_asignada_id_fkey"
            columns: ["cama_asignada_id"]
            isOneToOne: false
            referencedRelation: "mapa_camas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_admision_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_espera_admision_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      manifiestos_residuos: {
        Row: {
          conductor: string | null
          created_at: string
          destino: string
          fecha_entrega: string | null
          fecha_salida: string | null
          id: string
          numero: string
          observaciones: string | null
          peso_total_kg: number | null
          tipos_residuo: string[] | null
          transportista: string
          updated_at: string
          vehiculo_placa: string | null
          verificado: boolean | null
          verificado_por: string | null
          workspace_id: string
        }
        Insert: {
          conductor?: string | null
          created_at?: string
          destino: string
          fecha_entrega?: string | null
          fecha_salida?: string | null
          id?: string
          numero?: string
          observaciones?: string | null
          peso_total_kg?: number | null
          tipos_residuo?: string[] | null
          transportista: string
          updated_at?: string
          vehiculo_placa?: string | null
          verificado?: boolean | null
          verificado_por?: string | null
          workspace_id: string
        }
        Update: {
          conductor?: string | null
          created_at?: string
          destino?: string
          fecha_entrega?: string | null
          fecha_salida?: string | null
          id?: string
          numero?: string
          observaciones?: string | null
          peso_total_kg?: number | null
          tipos_residuo?: string[] | null
          transportista?: string
          updated_at?: string
          vehiculo_placa?: string | null
          verificado?: boolean | null
          verificado_por?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manifiestos_residuos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mapa_camas: {
        Row: {
          activo: boolean | null
          created_at: string | null
          estado: string | null
          fecha_ocupacion: string | null
          id: string
          notas: string | null
          numero_cama: string
          paciente_actual_id: string | null
          piso: string
          sala: string
          tipo: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          estado?: string | null
          fecha_ocupacion?: string | null
          id?: string
          notas?: string | null
          numero_cama: string
          paciente_actual_id?: string | null
          piso: string
          sala: string
          tipo?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          estado?: string | null
          fecha_ocupacion?: string | null
          id?: string
          notas?: string | null
          numero_cama?: string
          paciente_actual_id?: string | null
          piso?: string
          sala?: string
          tipo?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mapa_camas_paciente_actual_id_fkey"
            columns: ["paciente_actual_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mapa_camas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_bookings: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_deseada: string
          hora_deseada: string | null
          id: string
          notas: string | null
          paciente_email: string | null
          paciente_nombre: string
          paciente_telefono: string | null
          servicio_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_deseada: string
          hora_deseada?: string | null
          id?: string
          notas?: string | null
          paciente_email?: string | null
          paciente_nombre: string
          paciente_telefono?: string | null
          servicio_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_deseada?: string
          hora_deseada?: string | null
          id?: string
          notas?: string | null
          paciente_email?: string | null
          paciente_nombre?: string
          paciente_telefono?: string | null
          servicio_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_bookings_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "marketplace_servicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_bookings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          comentario: string | null
          created_at: string | null
          id: string
          paciente_id: string | null
          puntuacion: number
          servicio_id: string
          verificado: boolean | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          paciente_id?: string | null
          puntuacion: number
          servicio_id: string
          verificado?: boolean | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          id?: string
          paciente_id?: string | null
          puntuacion?: number
          servicio_id?: string
          verificado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_reviews_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "marketplace_servicios"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_servicios: {
        Row: {
          activo: boolean | null
          categoria: string | null
          created_at: string | null
          descripcion: string | null
          duracion_minutos: number | null
          id: string
          imagen_url: string | null
          nombre: string
          precio: number | null
          rating_promedio: number | null
          seo_descripcion: string | null
          seo_titulo: string | null
          slug: string | null
          total_reviews: number | null
          updated_at: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          duracion_minutos?: number | null
          id?: string
          imagen_url?: string | null
          nombre: string
          precio?: number | null
          rating_promedio?: number | null
          seo_descripcion?: string | null
          seo_titulo?: string | null
          slug?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string | null
          descripcion?: string | null
          duracion_minutos?: number | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          precio?: number | null
          rating_promedio?: number | null
          seo_descripcion?: string | null
          seo_titulo?: string | null
          slug?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_servicios_workspace_id_fkey"
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
      mediciones_indicadores: {
        Row: {
          created_at: string
          cumple_meta: boolean | null
          denominador: number
          id: string
          indicador_id: string
          numerador: number
          observaciones: string | null
          periodo_fin: string
          periodo_inicio: string
          registrado_por: string | null
          resultado: number | null
          sucursal_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          cumple_meta?: boolean | null
          denominador?: number
          id?: string
          indicador_id: string
          numerador?: number
          observaciones?: string | null
          periodo_fin: string
          periodo_inicio: string
          registrado_por?: string | null
          resultado?: number | null
          sucursal_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          cumple_meta?: boolean | null
          denominador?: number
          id?: string
          indicador_id?: string
          numerador?: number
          observaciones?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          registrado_por?: string | null
          resultado?: number | null
          sucursal_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mediciones_indicadores_indicador_id_fkey"
            columns: ["indicador_id"]
            isOneToOne: false
            referencedRelation: "indicadores_calidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mediciones_indicadores_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      membresias_estetica: {
        Row: {
          auto_renovar: boolean | null
          created_at: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          numero: string | null
          paciente_id: string | null
          plan_nombre: string
          precio: number | null
          sesiones_incluidas: number | null
          sesiones_usadas: number | null
          tipo: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          auto_renovar?: boolean | null
          created_at?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          numero?: string | null
          paciente_id?: string | null
          plan_nombre: string
          precio?: number | null
          sesiones_incluidas?: number | null
          sesiones_usadas?: number | null
          tipo?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          auto_renovar?: boolean | null
          created_at?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          numero?: string | null
          paciente_id?: string | null
          plan_nombre?: string
          precio?: number | null
          sesiones_incluidas?: number | null
          sesiones_usadas?: number | null
          tipo?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membresias_estetica_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membresias_estetica_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      mensajes_whatsapp_vertical: {
        Row: {
          campana_id: string | null
          created_at: string | null
          enviado_en: string | null
          estado: string | null
          id: string
          mensaje: string
          metadata: Json | null
          paciente_id: string | null
          telefono: string
          tipo: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          campana_id?: string | null
          created_at?: string | null
          enviado_en?: string | null
          estado?: string | null
          id?: string
          mensaje: string
          metadata?: Json | null
          paciente_id?: string | null
          telefono: string
          tipo: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          campana_id?: string | null
          created_at?: string | null
          enviado_en?: string | null
          estado?: string | null
          id?: string
          mensaje?: string
          metadata?: Json | null
          paciente_id?: string | null
          telefono?: string
          tipo?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_whatsapp_vertical_campana_id_fkey"
            columns: ["campana_id"]
            isOneToOne: false
            referencedRelation: "campanas_marketing_vertical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_whatsapp_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      metas_incentivos: {
        Row: {
          bono_monto: number | null
          created_at: string | null
          descripcion: string | null
          empleado_id: string
          estado: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          meta_valor: number | null
          metrica: string | null
          porcentaje_cumplimiento: number | null
          titulo: string
          unidad: string | null
          updated_at: string | null
          valor_actual: number | null
          workspace_id: string
        }
        Insert: {
          bono_monto?: number | null
          created_at?: string | null
          descripcion?: string | null
          empleado_id: string
          estado?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          meta_valor?: number | null
          metrica?: string | null
          porcentaje_cumplimiento?: number | null
          titulo: string
          unidad?: string | null
          updated_at?: string | null
          valor_actual?: number | null
          workspace_id: string
        }
        Update: {
          bono_monto?: number | null
          created_at?: string | null
          descripcion?: string | null
          empleado_id?: string
          estado?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          meta_valor?: number | null
          metrica?: string | null
          porcentaje_cumplimiento?: number | null
          titulo?: string
          unidad?: string | null
          updated_at?: string | null
          valor_actual?: number | null
          workspace_id?: string
        }
        Relationships: []
      }
      metricas_bi_vertical: {
        Row: {
          citas_completadas: number | null
          citas_totales: number | null
          created_at: string | null
          gastos: number | null
          id: string
          ingresos: number | null
          pacientes_nuevos: number | null
          periodo: string
          procedimientos_top: Json | null
          sucursal_id: string | null
          tasa_retencion: number | null
          ticket_promedio: number | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          citas_completadas?: number | null
          citas_totales?: number | null
          created_at?: string | null
          gastos?: number | null
          id?: string
          ingresos?: number | null
          pacientes_nuevos?: number | null
          periodo: string
          procedimientos_top?: Json | null
          sucursal_id?: string | null
          tasa_retencion?: number | null
          ticket_promedio?: number | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          citas_completadas?: number | null
          citas_totales?: number | null
          created_at?: string | null
          gastos?: number | null
          id?: string
          ingresos?: number | null
          pacientes_nuevos?: number | null
          periodo?: string
          procedimientos_top?: Json | null
          sucursal_id?: string | null
          tasa_retencion?: number | null
          ticket_promedio?: number | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metricas_bi_vertical_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales_vertical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metricas_bi_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      modulos_catalogo: {
        Row: {
          created_at: string
          descripcion: string | null
          key: string
          label: string
          orden: number
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          key: string
          label: string
          orden?: number
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          key?: string
          label?: string
          orden?: number
        }
        Relationships: []
      }
      movimientos_inventario_vertical: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          item_id: string
          motivo: string | null
          tipo: string
          usuario_id: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          id?: string
          item_id: string
          motivo?: string | null
          tipo: string
          usuario_id?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          item_id?: string
          motivo?: string | null
          tipo?: string
          usuario_id?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_vertical_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventario_vertical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      muestras_laboratorio: {
        Row: {
          codigo_barras: string | null
          created_at: string | null
          estado: string | null
          fecha_recepcion: string | null
          fecha_recoleccion: string | null
          flebotomista_id: string | null
          id: string
          motivo_rechazo: string | null
          observaciones: string | null
          orden_id: string
          paciente_id: string
          recipiente: string | null
          temperatura_transporte: string | null
          tipo_muestra: string
          updated_at: string | null
          volumen: string | null
        }
        Insert: {
          codigo_barras?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_recepcion?: string | null
          fecha_recoleccion?: string | null
          flebotomista_id?: string | null
          id?: string
          motivo_rechazo?: string | null
          observaciones?: string | null
          orden_id: string
          paciente_id: string
          recipiente?: string | null
          temperatura_transporte?: string | null
          tipo_muestra: string
          updated_at?: string | null
          volumen?: string | null
        }
        Update: {
          codigo_barras?: string | null
          created_at?: string | null
          estado?: string | null
          fecha_recepcion?: string | null
          fecha_recoleccion?: string | null
          flebotomista_id?: string | null
          id?: string
          motivo_rechazo?: string | null
          observaciones?: string | null
          orden_id?: string
          paciente_id?: string
          recipiente?: string | null
          temperatura_transporte?: string | null
          tipo_muestra?: string
          updated_at?: string | null
          volumen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "muestras_laboratorio_flebotomista_id_fkey"
            columns: ["flebotomista_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "muestras_laboratorio_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "muestras_laboratorio_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ncf_secuencias: {
        Row: {
          activo: boolean
          actual: number
          created_at: string
          fecha_vencimiento: string | null
          fin: number
          id: string
          inicio: number
          serie: string
          tipo_ncf: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          actual: number
          created_at?: string
          fecha_vencimiento?: string | null
          fin: number
          id?: string
          inicio: number
          serie?: string
          tipo_ncf: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          actual?: number
          created_at?: string
          fecha_vencimiento?: string | null
          fin?: number
          id?: string
          inicio?: number
          serie?: string
          tipo_ncf?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ncf_secuencias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      no_conformidades: {
        Row: {
          area: string
          auditoria_id: string | null
          codigo: string | null
          created_at: string
          descripcion: string
          estado: string
          evidencia_cierre: string | null
          fecha_cierre: string | null
          fecha_deteccion: string
          fecha_limite_cierre: string | null
          id: string
          requisito: string | null
          responsable_id: string | null
          severidad: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          area: string
          auditoria_id?: string | null
          codigo?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          evidencia_cierre?: string | null
          fecha_cierre?: string | null
          fecha_deteccion?: string
          fecha_limite_cierre?: string | null
          id?: string
          requisito?: string | null
          responsable_id?: string | null
          severidad: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          area?: string
          auditoria_id?: string | null
          codigo?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          evidencia_cierre?: string | null
          fecha_cierre?: string | null
          fecha_deteccion?: string
          fecha_limite_cierre?: string | null
          id?: string
          requisito?: string | null
          responsable_id?: string | null
          severidad?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "no_conformidades_auditoria_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "auditorias_calidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "no_conformidades_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      notas_psicologia: {
        Row: {
          bloqueada_supervisor: boolean | null
          contenido: string | null
          contenido_compartible: string | null
          created_at: string
          created_by: string | null
          es_privada: boolean | null
          id: string
          paciente_id: string
          sesion_id: string | null
          supervisor_id: string | null
          terapeuta_id: string | null
          tipo_nota: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          bloqueada_supervisor?: boolean | null
          contenido?: string | null
          contenido_compartible?: string | null
          created_at?: string
          created_by?: string | null
          es_privada?: boolean | null
          id?: string
          paciente_id: string
          sesion_id?: string | null
          supervisor_id?: string | null
          terapeuta_id?: string | null
          tipo_nota: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          bloqueada_supervisor?: boolean | null
          contenido?: string | null
          contenido_compartible?: string | null
          created_at?: string
          created_by?: string | null
          es_privada?: boolean | null
          id?: string
          paciente_id?: string
          sesion_id?: string | null
          supervisor_id?: string | null
          terapeuta_id?: string | null
          tipo_nota?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_psicologia_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones_psicologia"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_psicologia_accesos: {
        Row: {
          accion: string | null
          created_at: string
          id: string
          nota_id: string
          user_id: string | null
        }
        Insert: {
          accion?: string | null
          created_at?: string
          id?: string
          nota_id: string
          user_id?: string | null
        }
        Update: {
          accion?: string | null
          created_at?: string
          id?: string
          nota_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_psicologia_accesos_nota_id_fkey"
            columns: ["nota_id"]
            isOneToOne: false
            referencedRelation: "notas_psicologia"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_ultra_privadas: {
        Row: {
          contenido: string
          created_at: string
          id: string
          paciente_id: string | null
          sesion_id: string | null
          terapeuta_id: string
          titulo: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          contenido: string
          created_at?: string
          id?: string
          paciente_id?: string | null
          sesion_id?: string | null
          terapeuta_id: string
          titulo?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          contenido?: string
          created_at?: string
          id?: string
          paciente_id?: string | null
          sesion_id?: string | null
          terapeuta_id?: string
          titulo?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      notas_ultra_privadas_accesos: {
        Row: {
          accion: string
          created_at: string
          id: string
          nota_id: string
          user_id: string
        }
        Insert: {
          accion?: string
          created_at?: string
          id?: string
          nota_id: string
          user_id: string
        }
        Update: {
          accion?: string
          created_at?: string
          id?: string
          nota_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_ultra_privadas_accesos_nota_id_fkey"
            columns: ["nota_id"]
            isOneToOne: false
            referencedRelation: "notas_ultra_privadas"
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
      nps_encuestas: {
        Row: {
          categoria: string | null
          comentario: string | null
          created_at: string
          id: string
          paciente_id: string
          score: number
          vertical_tipo: string | null
          workspace_id: string
        }
        Insert: {
          categoria?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          paciente_id: string
          score: number
          vertical_tipo?: string | null
          workspace_id: string
        }
        Update: {
          categoria?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          paciente_id?: string
          score?: number
          vertical_tipo?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nps_encuestas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nps_encuestas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      observacion_urgencias: {
        Row: {
          created_at: string | null
          evolucion: string | null
          hora: string
          id: string
          registro_urgencia_id: string | null
          responsable_id: string | null
          signos_vitales: Json | null
        }
        Insert: {
          created_at?: string | null
          evolucion?: string | null
          hora: string
          id?: string
          registro_urgencia_id?: string | null
          responsable_id?: string | null
          signos_vitales?: Json | null
        }
        Update: {
          created_at?: string | null
          evolucion?: string | null
          hora?: string
          id?: string
          registro_urgencia_id?: string | null
          responsable_id?: string | null
          signos_vitales?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "observacion_urgencias_registro_urgencia_id_fkey"
            columns: ["registro_urgencia_id"]
            isOneToOne: false
            referencedRelation: "registros_urgencias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observacion_urgencias_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      ocupacion_camas_log: {
        Row: {
          cama_id: string
          created_at: string
          fecha_egreso: string | null
          fecha_ingreso: string
          id: string
          motivo_egreso: string | null
          paciente_id: string | null
          workspace_id: string
        }
        Insert: {
          cama_id: string
          created_at?: string
          fecha_egreso?: string | null
          fecha_ingreso?: string
          id?: string
          motivo_egreso?: string | null
          paciente_id?: string | null
          workspace_id: string
        }
        Update: {
          cama_id?: string
          created_at?: string
          fecha_egreso?: string | null
          fecha_ingreso?: string
          id?: string
          motivo_egreso?: string | null
          paciente_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocupacion_camas_log_cama_id_fkey"
            columns: ["cama_id"]
            isOneToOne: false
            referencedRelation: "camas_vertical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocupacion_camas_log_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocupacion_camas_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      offline_sync_queue: {
        Row: {
          client_timestamp: string
          created_at: string
          device_id: string | null
          error_message: string | null
          estado: string
          id: string
          intentos: number
          operation_type: string
          payload: Json
          record_id: string | null
          synced_at: string | null
          table_name: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          client_timestamp: string
          created_at?: string
          device_id?: string | null
          error_message?: string | null
          estado?: string
          id?: string
          intentos?: number
          operation_type: string
          payload: Json
          record_id?: string | null
          synced_at?: string | null
          table_name: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          client_timestamp?: string
          created_at?: string
          device_id?: string | null
          error_message?: string | null
          estado?: string
          id?: string
          intentos?: number
          operation_type?: string
          payload?: Json
          record_id?: string | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offline_sync_queue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_vertical: {
        Row: {
          completado: boolean | null
          created_at: string | null
          datos: Json | null
          id: string
          paso_actual: number | null
          plantilla_seleccionada: string | null
          updated_at: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          completado?: boolean | null
          created_at?: string | null
          datos?: Json | null
          id?: string
          paso_actual?: number | null
          plantilla_seleccionada?: string | null
          updated_at?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          completado?: boolean | null
          created_at?: string | null
          datos?: Json | null
          id?: string
          paso_actual?: number | null
          plantilla_seleccionada?: string | null
          updated_at?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_vertical_workspace_id_fkey"
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
      ordenes_laboratorio_dental: {
        Row: {
          color: string | null
          costo: number | null
          created_at: string
          diente: string | null
          estado: string
          fecha_entrega_estimada: string | null
          fecha_entrega_real: string | null
          fecha_envio: string | null
          id: string
          laboratorio: string | null
          material: string | null
          notas: string | null
          numero: string
          odontologo_id: string | null
          paciente_id: string | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          color?: string | null
          costo?: number | null
          created_at?: string
          diente?: string | null
          estado?: string
          fecha_entrega_estimada?: string | null
          fecha_entrega_real?: string | null
          fecha_envio?: string | null
          id?: string
          laboratorio?: string | null
          material?: string | null
          notas?: string | null
          numero?: string
          odontologo_id?: string | null
          paciente_id?: string | null
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          color?: string | null
          costo?: number | null
          created_at?: string
          diente?: string | null
          estado?: string
          fecha_entrega_estimada?: string | null
          fecha_entrega_real?: string | null
          fecha_envio?: string | null
          id?: string
          laboratorio?: string | null
          material?: string | null
          notas?: string | null
          numero?: string
          odontologo_id?: string | null
          paciente_id?: string | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_laboratorio_dental_odontologo_id_fkey"
            columns: ["odontologo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_laboratorio_dental_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_laboratorio_dental_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_lavanderia: {
        Row: {
          cantidad_piezas: number | null
          created_at: string
          entregado_a: string | null
          estado: string
          fecha_entrega: string | null
          fecha_recepcion: string | null
          id: string
          numero: string
          observaciones: string | null
          peso_kg: number | null
          prioridad: string
          recibido_por: string | null
          servicio_solicitante: string
          tipo_ropa: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          cantidad_piezas?: number | null
          created_at?: string
          entregado_a?: string | null
          estado?: string
          fecha_entrega?: string | null
          fecha_recepcion?: string | null
          id?: string
          numero?: string
          observaciones?: string | null
          peso_kg?: number | null
          prioridad?: string
          recibido_por?: string | null
          servicio_solicitante: string
          tipo_ropa?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          cantidad_piezas?: number | null
          created_at?: string
          entregado_a?: string | null
          estado?: string
          fecha_entrega?: string | null
          fecha_recepcion?: string | null
          id?: string
          numero?: string
          observaciones?: string | null
          peso_kg?: number | null
          prioridad?: string
          recibido_por?: string | null
          servicio_solicitante?: string
          tipo_ropa?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_lavanderia_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_mantenimiento: {
        Row: {
          costo: number | null
          created_at: string
          descripcion: string | null
          equipo_id: string
          estado: string
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_solicitud: string | null
          id: string
          numero: string
          prioridad: string
          repuestos_usados: Json | null
          resultado: string | null
          solicitado_por: string | null
          tecnico_asignado: string | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          costo?: number | null
          created_at?: string
          descripcion?: string | null
          equipo_id: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_solicitud?: string | null
          id?: string
          numero?: string
          prioridad?: string
          repuestos_usados?: Json | null
          resultado?: string | null
          solicitado_por?: string | null
          tecnico_asignado?: string | null
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          costo?: number | null
          created_at?: string
          descripcion?: string | null
          equipo_id?: string
          estado?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_solicitud?: string | null
          id?: string
          numero?: string
          prioridad?: string
          repuestos_usados?: Json | null
          resultado?: string | null
          solicitado_por?: string | null
          tecnico_asignado?: string | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_mantenimiento_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos_hospitalarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_mantenimiento_solicitado_por_fkey"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_mantenimiento_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_medicas: {
        Row: {
          created_at: string
          descripcion: string
          detalles: Json | null
          estado: string
          fecha_completada: string | null
          fecha_solicitud: string
          id: string
          ingreso_id: string | null
          modulo_destino: string | null
          motivo_cancelacion: string | null
          notas: string | null
          paciente_id: string | null
          prioridad: string
          profesional_solicitante_id: string | null
          recurso_destino_id: string | null
          tipo: string
          updated_at: string
          vertical: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          detalles?: Json | null
          estado?: string
          fecha_completada?: string | null
          fecha_solicitud?: string
          id?: string
          ingreso_id?: string | null
          modulo_destino?: string | null
          motivo_cancelacion?: string | null
          notas?: string | null
          paciente_id?: string | null
          prioridad?: string
          profesional_solicitante_id?: string | null
          recurso_destino_id?: string | null
          tipo: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          detalles?: Json | null
          estado?: string
          fecha_completada?: string | null
          fecha_solicitud?: string
          id?: string
          ingreso_id?: string | null
          modulo_destino?: string | null
          motivo_cancelacion?: string | null
          notas?: string | null
          paciente_id?: string | null
          prioridad?: string
          profesional_solicitante_id?: string | null
          recurso_destino_id?: string | null
          tipo?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_medicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_medicas_profesional_solicitante_id_fkey"
            columns: ["profesional_solicitante_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_medicas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_medicas_eventos: {
        Row: {
          created_at: string
          estado_anterior: string | null
          estado_nuevo: string
          id: string
          notas: string | null
          orden_id: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo: string
          id?: string
          notas?: string | null
          orden_id: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          estado_anterior?: string | null
          estado_nuevo?: string
          id?: string
          notas?: string | null
          orden_id?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_medicas_eventos_orden_id_fkey"
            columns: ["orden_id"]
            isOneToOne: false
            referencedRelation: "ordenes_medicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_medicas_eventos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_trabajo_optica: {
        Row: {
          costo_laboratorio: number | null
          created_at: string
          estado: string
          fecha_entrega_estimada: string | null
          fecha_entrega_real: string | null
          fecha_envio: string | null
          id: string
          laboratorio: string | null
          montura_id: string | null
          notas: string | null
          numero: string
          paciente_id: string | null
          precio_total: number | null
          receta_id: string | null
          tipo_lente: string | null
          tratamientos: string[] | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          costo_laboratorio?: number | null
          created_at?: string
          estado?: string
          fecha_entrega_estimada?: string | null
          fecha_entrega_real?: string | null
          fecha_envio?: string | null
          id?: string
          laboratorio?: string | null
          montura_id?: string | null
          notas?: string | null
          numero?: string
          paciente_id?: string | null
          precio_total?: number | null
          receta_id?: string | null
          tipo_lente?: string | null
          tratamientos?: string[] | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          costo_laboratorio?: number | null
          created_at?: string
          estado?: string
          fecha_entrega_estimada?: string | null
          fecha_entrega_real?: string | null
          fecha_envio?: string | null
          id?: string
          laboratorio?: string | null
          montura_id?: string | null
          notas?: string | null
          numero?: string
          paciente_id?: string | null
          precio_total?: number | null
          receta_id?: string | null
          tipo_lente?: string | null
          tratamientos?: string[] | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_trabajo_optica_montura_id_fkey"
            columns: ["montura_id"]
            isOneToOne: false
            referencedRelation: "inventario_optica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_optica_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_optica_receta_id_fkey"
            columns: ["receta_id"]
            isOneToOne: false
            referencedRelation: "recetas_oftalmicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordenes_trabajo_optica_workspace_id_fkey"
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
          vertical: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
      pacientes_psicologia: {
        Row: {
          alerta_interna_activa: boolean | null
          antecedentes_familiares: string | null
          consumo_sustancias: string | null
          contacto_emergencia_nombre: string | null
          contacto_emergencia_relacion: string | null
          contacto_emergencia_telefono: string | null
          created_at: string
          created_by: string | null
          diagnosticos_previos: string | null
          es_menor: boolean | null
          historia_trauma: string | null
          historia_trauma_restringida: boolean | null
          id: string
          medicacion_actual: string | null
          motivo_consulta: string | null
          notas_generales: string | null
          paciente_id: string | null
          riesgo_autolesion: string | null
          riesgo_suicida: string | null
          terapeuta_id: string | null
          tutor_nombre: string | null
          tutor_relacion: string | null
          tutor_telefono: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          alerta_interna_activa?: boolean | null
          antecedentes_familiares?: string | null
          consumo_sustancias?: string | null
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_relacion?: string | null
          contacto_emergencia_telefono?: string | null
          created_at?: string
          created_by?: string | null
          diagnosticos_previos?: string | null
          es_menor?: boolean | null
          historia_trauma?: string | null
          historia_trauma_restringida?: boolean | null
          id?: string
          medicacion_actual?: string | null
          motivo_consulta?: string | null
          notas_generales?: string | null
          paciente_id?: string | null
          riesgo_autolesion?: string | null
          riesgo_suicida?: string | null
          terapeuta_id?: string | null
          tutor_nombre?: string | null
          tutor_relacion?: string | null
          tutor_telefono?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          alerta_interna_activa?: boolean | null
          antecedentes_familiares?: string | null
          consumo_sustancias?: string | null
          contacto_emergencia_nombre?: string | null
          contacto_emergencia_relacion?: string | null
          contacto_emergencia_telefono?: string | null
          created_at?: string
          created_by?: string | null
          diagnosticos_previos?: string | null
          es_menor?: boolean | null
          historia_trauma?: string | null
          historia_trauma_restringida?: boolean | null
          id?: string
          medicacion_actual?: string | null
          motivo_consulta?: string | null
          notas_generales?: string | null
          paciente_id?: string | null
          riesgo_autolesion?: string | null
          riesgo_suicida?: string | null
          terapeuta_id?: string | null
          tutor_nombre?: string | null
          tutor_relacion?: string | null
          tutor_telefono?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_psicologia_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes_recovery: {
        Row: {
          acompanante_nombre: string | null
          acompanante_telefono: string | null
          alergias: string | null
          clinica_origen: string | null
          concierge_notas: string | null
          contacto_familiar: string | null
          created_at: string
          estado: string
          fecha_cirugia: string | null
          fecha_ingreso: string | null
          fecha_salida_estimada: string | null
          fecha_salida_real: string | null
          habitacion_id: string | null
          hotel_posterior: string | null
          hotel_previo: string | null
          id: string
          idioma: string | null
          medicacion_actual: string | null
          medico_tratante: string | null
          nombre_paciente: string | null
          numero: string
          observaciones: string | null
          paciente_id: string | null
          pais_origen: string | null
          plan_id: string | null
          recogida_aeropuerto: boolean | null
          riesgos_medicos: string | null
          telefono_familiar: string | null
          tipo_cirugia: string | null
          turismo_medico: boolean | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acompanante_nombre?: string | null
          acompanante_telefono?: string | null
          alergias?: string | null
          clinica_origen?: string | null
          concierge_notas?: string | null
          contacto_familiar?: string | null
          created_at?: string
          estado?: string
          fecha_cirugia?: string | null
          fecha_ingreso?: string | null
          fecha_salida_estimada?: string | null
          fecha_salida_real?: string | null
          habitacion_id?: string | null
          hotel_posterior?: string | null
          hotel_previo?: string | null
          id?: string
          idioma?: string | null
          medicacion_actual?: string | null
          medico_tratante?: string | null
          nombre_paciente?: string | null
          numero?: string
          observaciones?: string | null
          paciente_id?: string | null
          pais_origen?: string | null
          plan_id?: string | null
          recogida_aeropuerto?: boolean | null
          riesgos_medicos?: string | null
          telefono_familiar?: string | null
          tipo_cirugia?: string | null
          turismo_medico?: boolean | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acompanante_nombre?: string | null
          acompanante_telefono?: string | null
          alergias?: string | null
          clinica_origen?: string | null
          concierge_notas?: string | null
          contacto_familiar?: string | null
          created_at?: string
          estado?: string
          fecha_cirugia?: string | null
          fecha_ingreso?: string | null
          fecha_salida_estimada?: string | null
          fecha_salida_real?: string | null
          habitacion_id?: string | null
          hotel_posterior?: string | null
          hotel_previo?: string | null
          id?: string
          idioma?: string | null
          medicacion_actual?: string | null
          medico_tratante?: string | null
          nombre_paciente?: string | null
          numero?: string
          observaciones?: string | null
          paciente_id?: string | null
          pais_origen?: string | null
          plan_id?: string | null
          recogida_aeropuerto?: boolean | null
          riesgos_medicos?: string | null
          telefono_familiar?: string | null
          tipo_cirugia?: string | null
          turismo_medico?: boolean | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_recovery_habitacion_id_fkey"
            columns: ["habitacion_id"]
            isOneToOne: false
            referencedRelation: "habitaciones_recovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_recovery_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_recovery_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_recovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pacientes_recovery_workspace_id_fkey"
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
      pagos_online_vertical: {
        Row: {
          concepto: string | null
          created_at: string | null
          estado: string | null
          id: string
          metadata: Json | null
          metodo: string
          moneda: string | null
          monto: number
          paciente_id: string | null
          referencia_externa: string | null
          sucursal_id: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          concepto?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          metadata?: Json | null
          metodo: string
          moneda?: string | null
          monto: number
          paciente_id?: string | null
          referencia_externa?: string | null
          sucursal_id?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          concepto?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          metadata?: Json | null
          metodo?: string
          moneda?: string | null
          monto?: number
          paciente_id?: string | null
          referencia_externa?: string | null
          sucursal_id?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagos_online_vertical_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales_vertical"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagos_online_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      paquetes_esteticos: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          precio_paquete: number | null
          precio_regular: number | null
          procedimientos: Json | null
          updated_at: string
          vigencia_hasta: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          precio_paquete?: number | null
          precio_regular?: number | null
          procedimientos?: Json | null
          updated_at?: string
          vigencia_hasta?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          precio_paquete?: number | null
          precio_regular?: number | null
          procedimientos?: Json | null
          updated_at?: string
          vigencia_hasta?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paquetes_esteticos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      paquetes_quirurgicos: {
        Row: {
          codigo: string | null
          contenido: Json | null
          created_at: string
          estado: string
          fecha_vencimiento_esterilizacion: string | null
          id: string
          nombre: string
          ultimo_ciclo_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          codigo?: string | null
          contenido?: Json | null
          created_at?: string
          estado?: string
          fecha_vencimiento_esterilizacion?: string | null
          id?: string
          nombre: string
          ultimo_ciclo_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          codigo?: string | null
          contenido?: Json | null
          created_at?: string
          estado?: string
          fecha_vencimiento_esterilizacion?: string | null
          id?: string
          nombre?: string
          ultimo_ciclo_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paquetes_quirurgicos_ultimo_ciclo_id_fkey"
            columns: ["ultimo_ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos_esterilizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paquetes_quirurgicos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      paquetes_sesiones: {
        Row: {
          activo: boolean | null
          cobro_automatico: boolean | null
          created_at: string
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          fee_cancelacion_tardia: number | null
          id: string
          nombre: string
          notas: string | null
          paciente_id: string | null
          precio: number | null
          sesiones_usadas: number | null
          tipo: string | null
          total_sesiones: number | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          cobro_automatico?: boolean | null
          created_at?: string
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          fee_cancelacion_tardia?: number | null
          id?: string
          nombre: string
          notas?: string | null
          paciente_id?: string | null
          precio?: number | null
          sesiones_usadas?: number | null
          tipo?: string | null
          total_sesiones?: number | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          cobro_automatico?: boolean | null
          created_at?: string
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          fee_cancelacion_tardia?: number | null
          id?: string
          nombre?: string
          notas?: string | null
          paciente_id?: string | null
          precio?: number | null
          sesiones_usadas?: number | null
          tipo?: string | null
          total_sesiones?: number | null
          workspace_id?: string
        }
        Relationships: []
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
      partogramas: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_inicio_trabajo: string
          id: string
          paciente_id: string | null
          registros: Json | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_inicio_trabajo: string
          id?: string
          paciente_id?: string | null
          registros?: Json | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_inicio_trabajo?: string
          id?: string
          paciente_id?: string | null
          registros?: Json | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partogramas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partogramas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      perfil_valor_paciente: {
        Row: {
          frecuencia_dias: number | null
          ltv_anual: number
          ltv_total: number
          nivel_engagement: string | null
          nps_promedio: number | null
          paciente_id: string
          riesgo_churn: string | null
          ultima_visita: string | null
          updated_at: string
          visitas_totales: number
          workspace_id: string | null
        }
        Insert: {
          frecuencia_dias?: number | null
          ltv_anual?: number
          ltv_total?: number
          nivel_engagement?: string | null
          nps_promedio?: number | null
          paciente_id: string
          riesgo_churn?: string | null
          ultima_visita?: string | null
          updated_at?: string
          visitas_totales?: number
          workspace_id?: string | null
        }
        Update: {
          frecuencia_dias?: number | null
          ltv_anual?: number
          ltv_total?: number
          nivel_engagement?: string | null
          nps_promedio?: number | null
          paciente_id?: string
          riesgo_churn?: string | null
          ultima_visita?: string | null
          updated_at?: string
          visitas_totales?: number
          workspace_id?: string | null
        }
        Relationships: []
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
          vertical: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
      plan_cuidados_enfermeria: {
        Row: {
          admision_id: string
          created_at: string | null
          diagnostico_nanda: string
          enfermera_id: string | null
          estado: string | null
          fecha_evaluacion: string | null
          fecha_inicio: string | null
          id: string
          intervencion_nic: string | null
          observaciones: string | null
          paciente_id: string
          prioridad: string | null
          resultado_noc: string | null
          updated_at: string | null
        }
        Insert: {
          admision_id: string
          created_at?: string | null
          diagnostico_nanda: string
          enfermera_id?: string | null
          estado?: string | null
          fecha_evaluacion?: string | null
          fecha_inicio?: string | null
          id?: string
          intervencion_nic?: string | null
          observaciones?: string | null
          paciente_id: string
          prioridad?: string | null
          resultado_noc?: string | null
          updated_at?: string | null
        }
        Update: {
          admision_id?: string
          created_at?: string | null
          diagnostico_nanda?: string
          enfermera_id?: string | null
          estado?: string | null
          fecha_evaluacion?: string | null
          fecha_inicio?: string | null
          id?: string
          intervencion_nic?: string | null
          observaciones?: string | null
          paciente_id?: string
          prioridad?: string | null
          resultado_noc?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_cuidados_enfermeria_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_cuidados_enfermeria_enfermera_id_fkey"
            columns: ["enfermera_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_cuidados_enfermeria_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_module_access: {
        Row: {
          allowed: boolean
          modulo_key: string
          plan_codigo: string
        }
        Insert: {
          allowed?: boolean
          modulo_key: string
          plan_codigo: string
        }
        Update: {
          allowed?: boolean
          modulo_key?: string
          plan_codigo?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_module_access_modulo_key_fkey"
            columns: ["modulo_key"]
            isOneToOne: false
            referencedRelation: "modulos_catalogo"
            referencedColumns: ["key"]
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
      planes_recovery: {
        Row: {
          activo: boolean | null
          categoria: string | null
          created_at: string
          descripcion: string | null
          dias: number
          id: string
          moneda: string | null
          nombre: string
          precio: number | null
          servicios_incluidos: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          dias?: number
          id?: string
          moneda?: string | null
          nombre: string
          precio?: number | null
          servicios_incluidos?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          created_at?: string
          descripcion?: string | null
          dias?: number
          id?: string
          moneda?: string | null
          nombre?: string
          precio?: number | null
          servicios_incluidos?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_recovery_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      planes_tratamiento_dental: {
        Row: {
          aprobado: boolean | null
          created_at: string
          estado: string
          fases: Json | null
          fecha_aprobacion: string | null
          firma_digital: string | null
          id: string
          monto_cuota: number | null
          notas: string | null
          numero: string
          numero_cuotas: number | null
          odontologo_id: string | null
          paciente_id: string
          presupuesto_total: number | null
          procedimientos: Json | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          aprobado?: boolean | null
          created_at?: string
          estado?: string
          fases?: Json | null
          fecha_aprobacion?: string | null
          firma_digital?: string | null
          id?: string
          monto_cuota?: number | null
          notas?: string | null
          numero?: string
          numero_cuotas?: number | null
          odontologo_id?: string | null
          paciente_id: string
          presupuesto_total?: number | null
          procedimientos?: Json | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          aprobado?: boolean | null
          created_at?: string
          estado?: string
          fases?: Json | null
          fecha_aprobacion?: string | null
          firma_digital?: string | null
          id?: string
          monto_cuota?: number | null
          notas?: string | null
          numero?: string
          numero_cuotas?: number | null
          odontologo_id?: string | null
          paciente_id?: string
          presupuesto_total?: number | null
          procedimientos?: Json | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planes_tratamiento_dental_odontologo_id_fkey"
            columns: ["odontologo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_tratamiento_dental_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planes_tratamiento_dental_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_comunicacion: {
        Row: {
          activo: boolean
          asunto_template: string | null
          canal: string
          contenido_template: string
          created_at: string
          evento: string | null
          id: string
          nombre: string
          updated_at: string
          variables: Json | null
          vertical_tipo: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          asunto_template?: string | null
          canal?: string
          contenido_template: string
          created_at?: string
          evento?: string | null
          id?: string
          nombre: string
          updated_at?: string
          variables?: Json | null
          vertical_tipo?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean
          asunto_template?: string | null
          canal?: string
          contenido_template?: string
          created_at?: string
          evento?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          variables?: Json | null
          vertical_tipo?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_comunicacion_workspace_id_fkey"
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
      plantillas_servicio_vertical: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          duracion_minutos: number | null
          id: string
          nombre_servicio: string
          precio_sugerido: number | null
          subnicho: string
          vertical_tipo: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          duracion_minutos?: number | null
          id?: string
          nombre_servicio: string
          precio_sugerido?: number | null
          subnicho: string
          vertical_tipo: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          duracion_minutos?: number | null
          id?: string
          nombre_servicio?: string
          precio_sugerido?: number | null
          subnicho?: string
          vertical_tipo?: string
        }
        Relationships: []
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
      portal_paciente_vertical: {
        Row: {
          created_at: string | null
          datos_visibles: Json | null
          expira_en: string | null
          id: string
          paciente_id: string
          token: string
          usado: boolean | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          datos_visibles?: Json | null
          expira_en?: string | null
          id?: string
          paciente_id: string
          token?: string
          usado?: boolean | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          datos_visibles?: Json | null
          expira_en?: string | null
          id?: string
          paciente_id?: string
          token?: string
          usado?: boolean | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_paciente_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_psico_accesos: {
        Row: {
          created_at: string
          created_by: string | null
          expira_at: string
          id: string
          paciente_id: string
          revocado: boolean
          token: string
          ultimo_acceso_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expira_at: string
          id?: string
          paciente_id: string
          revocado?: boolean
          token: string
          ultimo_acceso_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expira_at?: string
          id?: string
          paciente_id?: string
          revocado?: boolean
          token?: string
          ultimo_acceso_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      portal_solicitudes: {
        Row: {
          atendida_at: string | null
          atendida_por: string | null
          cita_id: string | null
          created_at: string
          estado: string
          fecha_propuesta: string | null
          id: string
          mensaje: string | null
          paciente_id: string
          respuesta: string | null
          tipo: string
          workspace_id: string
        }
        Insert: {
          atendida_at?: string | null
          atendida_por?: string | null
          cita_id?: string | null
          created_at?: string
          estado?: string
          fecha_propuesta?: string | null
          id?: string
          mensaje?: string | null
          paciente_id: string
          respuesta?: string | null
          tipo: string
          workspace_id: string
        }
        Update: {
          atendida_at?: string | null
          atendida_por?: string | null
          cita_id?: string | null
          created_at?: string
          estado?: string
          fecha_propuesta?: string | null
          id?: string
          mensaje?: string | null
          paciente_id?: string
          respuesta?: string | null
          tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_solicitudes_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_solicitudes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_idioma: {
        Row: {
          created_at: string | null
          formato_fecha: string | null
          formato_moneda: string | null
          id: string
          idioma: string | null
          updated_at: string | null
          user_id: string
          zona_horaria: string | null
        }
        Insert: {
          created_at?: string | null
          formato_fecha?: string | null
          formato_moneda?: string | null
          id?: string
          idioma?: string | null
          updated_at?: string | null
          user_id: string
          zona_horaria?: string | null
        }
        Update: {
          created_at?: string | null
          formato_fecha?: string | null
          formato_moneda?: string | null
          id?: string
          idioma?: string | null
          updated_at?: string | null
          user_id?: string
          zona_horaria?: string | null
        }
        Relationships: []
      }
      prescripciones_psiquiatricas: {
        Row: {
          adherencia: number | null
          alerta_interaccion: boolean | null
          alerta_suspension_abrupta: boolean | null
          created_at: string
          dosis: string | null
          efectos_secundarios: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          firmada: boolean
          firmada_at: string | null
          frecuencia: string | null
          id: string
          medicamento: string
          notas: string | null
          paciente_id: string
          psiquiatra_id: string | null
          refill_pendiente: boolean | null
          updated_at: string
          via: string | null
          workspace_id: string
        }
        Insert: {
          adherencia?: number | null
          alerta_interaccion?: boolean | null
          alerta_suspension_abrupta?: boolean | null
          created_at?: string
          dosis?: string | null
          efectos_secundarios?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          firmada?: boolean
          firmada_at?: string | null
          frecuencia?: string | null
          id?: string
          medicamento: string
          notas?: string | null
          paciente_id: string
          psiquiatra_id?: string | null
          refill_pendiente?: boolean | null
          updated_at?: string
          via?: string | null
          workspace_id: string
        }
        Update: {
          adherencia?: number | null
          alerta_interaccion?: boolean | null
          alerta_suspension_abrupta?: boolean | null
          created_at?: string
          dosis?: string | null
          efectos_secundarios?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          firmada?: boolean
          firmada_at?: string | null
          frecuencia?: string | null
          id?: string
          medicamento?: string
          notas?: string | null
          paciente_id?: string
          psiquiatra_id?: string | null
          refill_pendiente?: boolean | null
          updated_at?: string
          via?: string | null
          workspace_id?: string
        }
        Relationships: []
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
      presupuestos_sonrisa: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_firma: string | null
          firma_digital_url: string | null
          foto_antes_url: string | null
          foto_despues_url: string | null
          id: string
          monto_total: number | null
          notas: string | null
          numero: string | null
          paciente_id: string | null
          procedimientos: Json | null
          profesional_id: string | null
          simulacion_ia_url: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_firma?: string | null
          firma_digital_url?: string | null
          foto_antes_url?: string | null
          foto_despues_url?: string | null
          id?: string
          monto_total?: number | null
          notas?: string | null
          numero?: string | null
          paciente_id?: string | null
          procedimientos?: Json | null
          profesional_id?: string | null
          simulacion_ia_url?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_firma?: string | null
          firma_digital_url?: string | null
          foto_antes_url?: string | null
          foto_despues_url?: string | null
          id?: string
          monto_total?: number | null
          notas?: string | null
          numero?: string | null
          paciente_id?: string | null
          procedimientos?: Json | null
          profesional_id?: string | null
          simulacion_ia_url?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_sonrisa_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_sonrisa_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_sonrisa_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimientos_enfermeria: {
        Row: {
          admision_id: string | null
          complicaciones: string | null
          created_at: string | null
          descripcion: string | null
          fecha_hora: string
          id: string
          insumos_usados: Json | null
          paciente_id: string
          realizado_por: string | null
          resultado: string | null
          tipo: string
        }
        Insert: {
          admision_id?: string | null
          complicaciones?: string | null
          created_at?: string | null
          descripcion?: string | null
          fecha_hora?: string
          id?: string
          insumos_usados?: Json | null
          paciente_id: string
          realizado_por?: string | null
          resultado?: string | null
          tipo: string
        }
        Update: {
          admision_id?: string | null
          complicaciones?: string | null
          created_at?: string | null
          descripcion?: string | null
          fecha_hora?: string
          id?: string
          insumos_usados?: Json | null
          paciente_id?: string
          realizado_por?: string | null
          resultado?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedimientos_enfermeria_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimientos_enfermeria_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procedimientos_enfermeria_realizado_por_fkey"
            columns: ["realizado_por"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      procedimientos_esteticos: {
        Row: {
          activo: boolean | null
          categoria: string
          created_at: string
          descripcion: string | null
          dias_recuperacion: number | null
          duracion_minutos: number | null
          id: string
          nombre: string
          precio_base: number | null
          requiere_anestesia: boolean | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          categoria?: string
          created_at?: string
          descripcion?: string | null
          dias_recuperacion?: number | null
          duracion_minutos?: number | null
          id?: string
          nombre: string
          precio_base?: number | null
          requiere_anestesia?: boolean | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          categoria?: string
          created_at?: string
          descripcion?: string | null
          dias_recuperacion?: number | null
          duracion_minutos?: number | null
          id?: string
          nombre?: string
          precio_base?: number | null
          requiere_anestesia?: boolean | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procedimientos_esteticos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      procesamiento_lab: {
        Row: {
          created_at: string | null
          critico: boolean | null
          equipo: string | null
          fecha_procesamiento: string | null
          fecha_validacion: string | null
          fuera_rango: boolean | null
          id: string
          muestra_id: string
          observaciones: string | null
          prueba_id: string | null
          resultado: string | null
          tecnico_id: string | null
          unidad: string | null
          validado_por: string | null
          valor_referencia: string | null
        }
        Insert: {
          created_at?: string | null
          critico?: boolean | null
          equipo?: string | null
          fecha_procesamiento?: string | null
          fecha_validacion?: string | null
          fuera_rango?: boolean | null
          id?: string
          muestra_id: string
          observaciones?: string | null
          prueba_id?: string | null
          resultado?: string | null
          tecnico_id?: string | null
          unidad?: string | null
          validado_por?: string | null
          valor_referencia?: string | null
        }
        Update: {
          created_at?: string | null
          critico?: boolean | null
          equipo?: string | null
          fecha_procesamiento?: string | null
          fecha_validacion?: string | null
          fuera_rango?: boolean | null
          id?: string
          muestra_id?: string
          observaciones?: string | null
          prueba_id?: string | null
          resultado?: string | null
          tecnico_id?: string | null
          unidad?: string | null
          validado_por?: string | null
          valor_referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procesamiento_lab_muestra_id_fkey"
            columns: ["muestra_id"]
            isOneToOne: false
            referencedRelation: "muestras_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procesamiento_lab_prueba_id_fkey"
            columns: ["prueba_id"]
            isOneToOne: false
            referencedRelation: "pruebas_laboratorio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procesamiento_lab_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "procesamiento_lab_validado_por_fkey"
            columns: ["validado_por"]
            isOneToOne: false
            referencedRelation: "personal_salud"
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
      profesional_servicios: {
        Row: {
          activo: boolean
          comision_pct: number | null
          created_at: string
          id: string
          precio: number | null
          profesional_id: string
          servicio_id: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          comision_pct?: number | null
          created_at?: string
          id?: string
          precio?: number | null
          profesional_id: string
          servicio_id: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          comision_pct?: number | null
          created_at?: string
          id?: string
          precio?: number | null
          profesional_id?: string
          servicio_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesional_servicios_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesional_servicios_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesional_servicios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profesional_ubicaciones: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          profesional_id: string
          sucursal_id: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          profesional_id: string
          sucursal_id?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          profesional_id?: string
          sucursal_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesional_ubicaciones_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profesional_ubicaciones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          vertical_asignada: Database["public"]["Enums"]["vertical_tipo"] | null
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
          vertical_asignada?:
            | Database["public"]["Enums"]["vertical_tipo"]
            | null
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
          vertical_asignada?:
            | Database["public"]["Enums"]["vertical_tipo"]
            | null
        }
        Relationships: []
      }
      programa_fidelizacion: {
        Row: {
          activo: boolean | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          puntos_por_unidad: number | null
          tipo: string
          updated_at: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          puntos_por_unidad?: number | null
          tipo?: string
          updated_at?: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          puntos_por_unidad?: number | null
          tipo?: string
          updated_at?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programa_fidelizacion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      programaciones_quirurgicas: {
        Row: {
          anestesiologo_id: string | null
          cirujano_principal_id: string | null
          created_at: string | null
          duracion_estimada_min: number | null
          estado: string | null
          fecha_programada: string
          hora_fin_real: string | null
          hora_inicio_real: string | null
          id: string
          instrumentista_id: string | null
          notas: string | null
          paciente_id: string | null
          prioridad: string | null
          procedimiento: string
          quirofano_id: string | null
          tipo_anestesia: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          anestesiologo_id?: string | null
          cirujano_principal_id?: string | null
          created_at?: string | null
          duracion_estimada_min?: number | null
          estado?: string | null
          fecha_programada: string
          hora_fin_real?: string | null
          hora_inicio_real?: string | null
          id?: string
          instrumentista_id?: string | null
          notas?: string | null
          paciente_id?: string | null
          prioridad?: string | null
          procedimiento: string
          quirofano_id?: string | null
          tipo_anestesia?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          anestesiologo_id?: string | null
          cirujano_principal_id?: string | null
          created_at?: string | null
          duracion_estimada_min?: number | null
          estado?: string | null
          fecha_programada?: string
          hora_fin_real?: string | null
          hora_inicio_real?: string | null
          id?: string
          instrumentista_id?: string | null
          notas?: string | null
          paciente_id?: string | null
          prioridad?: string | null
          procedimiento?: string
          quirofano_id?: string | null
          tipo_anestesia?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programaciones_quirurgicas_anestesiologo_id_fkey"
            columns: ["anestesiologo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programaciones_quirurgicas_cirujano_principal_id_fkey"
            columns: ["cirujano_principal_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programaciones_quirurgicas_instrumentista_id_fkey"
            columns: ["instrumentista_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programaciones_quirurgicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programaciones_quirurgicas_quirofano_id_fkey"
            columns: ["quirofano_id"]
            isOneToOne: false
            referencedRelation: "quirofanos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programaciones_quirurgicas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      programas_cronicos: {
        Row: {
          activo: boolean
          created_at: string
          enfermedad: string | null
          id: string
          nombre: string
          protocolo: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          enfermedad?: string | null
          id?: string
          nombre: string
          protocolo?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          enfermedad?: string | null
          id?: string
          nombre?: string
          protocolo?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programas_cronicos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      programas_docencia: {
        Row: {
          activo: boolean | null
          coordinador_id: string | null
          created_at: string
          cupo_maximo: number | null
          descripcion: string | null
          duracion_meses: number | null
          especialidad: string | null
          id: string
          nombre: string
          requisitos: string | null
          tipo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          coordinador_id?: string | null
          created_at?: string
          cupo_maximo?: number | null
          descripcion?: string | null
          duracion_meses?: number | null
          especialidad?: string | null
          id?: string
          nombre: string
          requisitos?: string | null
          tipo?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          coordinador_id?: string | null
          created_at?: string
          cupo_maximo?: number | null
          descripcion?: string | null
          duracion_meses?: number | null
          especialidad?: string | null
          id?: string
          nombre?: string
          requisitos?: string | null
          tipo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programas_docencia_coordinador_id_fkey"
            columns: ["coordinador_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_docencia_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      promociones_estetica: {
        Row: {
          activa: boolean | null
          codigo: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
          tipo_descuento: string | null
          updated_at: string | null
          usos_actuales: number | null
          usos_maximos: number | null
          valor_descuento: number | null
          vigencia_fin: string | null
          vigencia_inicio: string | null
          workspace_id: string
        }
        Insert: {
          activa?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
          tipo_descuento?: string | null
          updated_at?: string | null
          usos_actuales?: number | null
          usos_maximos?: number | null
          valor_descuento?: number | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          workspace_id: string
        }
        Update: {
          activa?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
          tipo_descuento?: string | null
          updated_at?: string | null
          usos_actuales?: number | null
          usos_maximos?: number | null
          valor_descuento?: number | null
          vigencia_fin?: string | null
          vigencia_inicio?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promociones_estetica_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_aplicaciones: {
        Row: {
          created_at: string | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          iniciado_por: string | null
          observaciones: string | null
          paciente_id: string
          paso_actual: number | null
          pasos_completados: Json | null
          protocolo_id: string
          resultado: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          iniciado_por?: string | null
          observaciones?: string | null
          paciente_id: string
          paso_actual?: number | null
          pasos_completados?: Json | null
          protocolo_id: string
          resultado?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          iniciado_por?: string | null
          observaciones?: string | null
          paciente_id?: string
          paso_actual?: number | null
          pasos_completados?: Json | null
          protocolo_id?: string
          resultado?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_aplicaciones_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos_clinicos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_clinicos: {
        Row: {
          activo: boolean | null
          categoria: string | null
          codigo: string
          created_at: string | null
          created_by: string | null
          criterios_exclusion: Json | null
          criterios_inclusion: Json | null
          descripcion: string | null
          duracion_estimada_horas: number | null
          es_global: boolean | null
          especialidad: string | null
          evidencia_nivel: string | null
          id: string
          medicamentos_sugeridos: Json | null
          nombre: string
          ordenes_sugeridas: Json | null
          pasos: Json | null
          referencia_bibliografica: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          codigo: string
          created_at?: string | null
          created_by?: string | null
          criterios_exclusion?: Json | null
          criterios_inclusion?: Json | null
          descripcion?: string | null
          duracion_estimada_horas?: number | null
          es_global?: boolean | null
          especialidad?: string | null
          evidencia_nivel?: string | null
          id?: string
          medicamentos_sugeridos?: Json | null
          nombre: string
          ordenes_sugeridas?: Json | null
          pasos?: Json | null
          referencia_bibliografica?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          criterios_exclusion?: Json | null
          criterios_inclusion?: Json | null
          descripcion?: string | null
          duracion_estimada_horas?: number | null
          es_global?: boolean | null
          especialidad?: string | null
          evidencia_nivel?: string | null
          id?: string
          medicamentos_sugeridos?: Json | null
          nombre?: string
          ordenes_sugeridas?: Json | null
          pasos?: Json | null
          referencia_bibliografica?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      protocolos_investigacion: {
        Row: {
          co_investigadores: Json | null
          comite_etica: string
          created_at: string
          estado: string
          fecha_aprobacion_etica: string | null
          fecha_fin_estimada: string | null
          fecha_inicio: string | null
          financiamiento: string | null
          id: string
          investigador_principal_id: string | null
          metodologia: string | null
          monto_financiamiento: number | null
          numero: string
          objetivo: string | null
          poblacion_estudio: string | null
          publicaciones: Json | null
          resultados: string | null
          resumen: string | null
          tamano_muestra: number | null
          titulo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          co_investigadores?: Json | null
          comite_etica?: string
          created_at?: string
          estado?: string
          fecha_aprobacion_etica?: string | null
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          financiamiento?: string | null
          id?: string
          investigador_principal_id?: string | null
          metodologia?: string | null
          monto_financiamiento?: number | null
          numero?: string
          objetivo?: string | null
          poblacion_estudio?: string | null
          publicaciones?: Json | null
          resultados?: string | null
          resumen?: string | null
          tamano_muestra?: number | null
          titulo: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          co_investigadores?: Json | null
          comite_etica?: string
          created_at?: string
          estado?: string
          fecha_aprobacion_etica?: string | null
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          financiamiento?: string | null
          id?: string
          investigador_principal_id?: string | null
          metodologia?: string | null
          monto_financiamiento?: number | null
          numero?: string
          objetivo?: string | null
          poblacion_estudio?: string | null
          publicaciones?: Json | null
          resultados?: string | null
          resumen?: string | null
          tamano_muestra?: number | null
          titulo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_investigacion_investigador_principal_id_fkey"
            columns: ["investigador_principal_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolos_investigacion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_quimio: {
        Row: {
          activo: boolean | null
          created_at: string | null
          duracion_ciclos: number | null
          id: string
          intencion: string | null
          intervalo_dias: number | null
          medicamentos: Json | null
          nombre: string
          notas: string | null
          premedicaciones: Json | null
          tipo_cancer: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          duracion_ciclos?: number | null
          id?: string
          intencion?: string | null
          intervalo_dias?: number | null
          medicamentos?: Json | null
          nombre: string
          notas?: string | null
          premedicaciones?: Json | null
          tipo_cancer?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          duracion_ciclos?: number | null
          id?: string
          intencion?: string | null
          intervalo_dias?: number | null
          medicamentos?: Json | null
          nombre?: string
          notas?: string | null
          premedicaciones?: Json | null
          tipo_cancer?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_quimio_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      proyecciones_financieras: {
        Row: {
          created_at: string
          generado_por: string | null
          id: string
          notas: string | null
          periodo: string
          supuestos: Json | null
          tipo: string
          valor_proyectado: number
          valor_real: number | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          generado_por?: string | null
          id?: string
          notas?: string | null
          periodo: string
          supuestos?: Json | null
          tipo?: string
          valor_proyectado?: number
          valor_real?: number | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          generado_por?: string | null
          id?: string
          notas?: string | null
          periodo?: string
          supuestos?: Json | null
          tipo?: string
          valor_proyectado?: number
          valor_real?: number | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecciones_financieras_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pruebas_cruzadas: {
        Row: {
          compatible: boolean | null
          created_at: string | null
          fecha_prueba: string | null
          id: string
          metodo: string | null
          observaciones: string | null
          paciente_id: string | null
          responsable_id: string | null
          unidad_id: string | null
          workspace_id: string | null
        }
        Insert: {
          compatible?: boolean | null
          created_at?: string | null
          fecha_prueba?: string | null
          id?: string
          metodo?: string | null
          observaciones?: string | null
          paciente_id?: string | null
          responsable_id?: string | null
          unidad_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          compatible?: boolean | null
          created_at?: string | null
          fecha_prueba?: string | null
          id?: string
          metodo?: string | null
          observaciones?: string | null
          paciente_id?: string | null
          responsable_id?: string | null
          unidad_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_cruzadas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pruebas_cruzadas_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pruebas_cruzadas_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "inventario_hemocomponentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pruebas_cruzadas_workspace_id_fkey"
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
      pruebas_sustancias: {
        Row: {
          caso_id: string | null
          created_at: string
          created_by: string | null
          detalles: string | null
          fecha: string
          id: string
          laboratorio: string | null
          paciente_id: string
          resultado: string | null
          sustancias_evaluadas: string[] | null
          tipo_prueba: string | null
          workspace_id: string
        }
        Insert: {
          caso_id?: string | null
          created_at?: string
          created_by?: string | null
          detalles?: string | null
          fecha?: string
          id?: string
          laboratorio?: string | null
          paciente_id: string
          resultado?: string | null
          sustancias_evaluadas?: string[] | null
          tipo_prueba?: string | null
          workspace_id: string
        }
        Update: {
          caso_id?: string | null
          created_at?: string
          created_by?: string | null
          detalles?: string | null
          fecha?: string
          id?: string
          laboratorio?: string | null
          paciente_id?: string
          resultado?: string | null
          sustancias_evaluadas?: string[] | null
          tipo_prueba?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pruebas_sustancias_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos_adicciones"
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
      puntos_paciente: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          paciente_id: string
          programa_id: string
          puntos: number
          tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          paciente_id: string
          programa_id: string
          puntos?: number
          tipo?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          paciente_id?: string
          programa_id?: string
          puntos?: number
          tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "puntos_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_paciente_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programa_fidelizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "puntos_paciente_workspace_id_fkey"
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
      quirofanos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          equipamiento: Json | null
          estado: string | null
          id: string
          nombre: string
          tipo: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          equipamiento?: Json | null
          estado?: string | null
          id?: string
          nombre: string
          tipo?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          equipamiento?: Json | null
          estado?: string | null
          id?: string
          nombre?: string
          tipo?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quirofanos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recaidas_adicciones: {
        Row: {
          caso_id: string
          created_at: string
          created_by: string | null
          desencadenante: string | null
          duracion: string | null
          fecha: string
          id: string
          intervencion: string | null
          notas: string | null
          paciente_id: string
          sustancia: string | null
          workspace_id: string
        }
        Insert: {
          caso_id: string
          created_at?: string
          created_by?: string | null
          desencadenante?: string | null
          duracion?: string | null
          fecha?: string
          id?: string
          intervencion?: string | null
          notas?: string | null
          paciente_id: string
          sustancia?: string | null
          workspace_id: string
        }
        Update: {
          caso_id?: string
          created_at?: string
          created_by?: string | null
          desencadenante?: string | null
          duracion?: string | null
          fecha?: string
          id?: string
          intervencion?: string | null
          notas?: string | null
          paciente_id?: string
          sustancia?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recaidas_adicciones_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos_adicciones"
            referencedColumns: ["id"]
          },
        ]
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
      recetas_digitales_vertical: {
        Row: {
          created_at: string
          estado: string
          fecha_emision: string
          firma_digital: string | null
          firmada: boolean | null
          id: string
          indicaciones: string | null
          medicamentos: Json
          numero: string | null
          paciente_id: string | null
          profesional_id: string | null
          updated_at: string
          vertical_tipo: string
          vigencia_dias: number | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          fecha_emision?: string
          firma_digital?: string | null
          firmada?: boolean | null
          id?: string
          indicaciones?: string | null
          medicamentos?: Json
          numero?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          updated_at?: string
          vertical_tipo: string
          vigencia_dias?: number | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          fecha_emision?: string
          firma_digital?: string | null
          firmada?: boolean | null
          id?: string
          indicaciones?: string | null
          medicamentos?: Json
          numero?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          updated_at?: string
          vertical_tipo?: string
          vigencia_dias?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recetas_digitales_vertical_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_digitales_vertical_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_digitales_vertical_workspace_id_fkey"
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
      recetas_oftalmicas: {
        Row: {
          created_at: string
          distancia_pupilar: number | null
          id: string
          numero: string
          observaciones: string | null
          od_add: number | null
          od_cilindro: number | null
          od_eje: number | null
          od_esfera: number | null
          od_prisma: number | null
          oftalmologo_id: string | null
          oi_add: number | null
          oi_cilindro: number | null
          oi_eje: number | null
          oi_esfera: number | null
          oi_prisma: number | null
          paciente_id: string
          tipo_lente_recomendado: string | null
          vigencia_hasta: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          distancia_pupilar?: number | null
          id?: string
          numero?: string
          observaciones?: string | null
          od_add?: number | null
          od_cilindro?: number | null
          od_eje?: number | null
          od_esfera?: number | null
          od_prisma?: number | null
          oftalmologo_id?: string | null
          oi_add?: number | null
          oi_cilindro?: number | null
          oi_eje?: number | null
          oi_esfera?: number | null
          oi_prisma?: number | null
          paciente_id: string
          tipo_lente_recomendado?: string | null
          vigencia_hasta?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          distancia_pupilar?: number | null
          id?: string
          numero?: string
          observaciones?: string | null
          od_add?: number | null
          od_cilindro?: number | null
          od_eje?: number | null
          od_esfera?: number | null
          od_prisma?: number | null
          oftalmologo_id?: string | null
          oi_add?: number | null
          oi_cilindro?: number | null
          oi_eje?: number | null
          oi_esfera?: number | null
          oi_prisma?: number | null
          paciente_id?: string
          tipo_lente_recomendado?: string | null
          vigencia_hasta?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recetas_oftalmicas_oftalmologo_id_fkey"
            columns: ["oftalmologo_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_oftalmicas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recetas_oftalmicas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recien_nacidos: {
        Row: {
          apgar_10min: number | null
          apgar_1min: number | null
          apgar_5min: number | null
          created_at: string | null
          destino: string | null
          edad_gestacional_semanas: number | null
          estado: string | null
          fecha_nacimiento: string
          id: string
          madre_paciente_id: string | null
          observaciones: string | null
          parto_id: string | null
          pediatra_id: string | null
          perimetro_cefalico_cm: number | null
          peso_g: number | null
          sexo: string | null
          talla_cm: number | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          apgar_10min?: number | null
          apgar_1min?: number | null
          apgar_5min?: number | null
          created_at?: string | null
          destino?: string | null
          edad_gestacional_semanas?: number | null
          estado?: string | null
          fecha_nacimiento: string
          id?: string
          madre_paciente_id?: string | null
          observaciones?: string | null
          parto_id?: string | null
          pediatra_id?: string | null
          perimetro_cefalico_cm?: number | null
          peso_g?: number | null
          sexo?: string | null
          talla_cm?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          apgar_10min?: number | null
          apgar_1min?: number | null
          apgar_5min?: number | null
          created_at?: string | null
          destino?: string | null
          edad_gestacional_semanas?: number | null
          estado?: string | null
          fecha_nacimiento?: string
          id?: string
          madre_paciente_id?: string | null
          observaciones?: string | null
          parto_id?: string | null
          pediatra_id?: string | null
          perimetro_cefalico_cm?: number | null
          peso_g?: number | null
          sexo?: string | null
          talla_cm?: number | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recien_nacidos_madre_paciente_id_fkey"
            columns: ["madre_paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recien_nacidos_parto_id_fkey"
            columns: ["parto_id"]
            isOneToOne: false
            referencedRelation: "registros_parto"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recien_nacidos_pediatra_id_fkey"
            columns: ["pediatra_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recien_nacidos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      recordatorios_fidelizacion: {
        Row: {
          canal: string | null
          created_at: string | null
          estado: string | null
          id: string
          notas: string | null
          paciente_id: string
          proxima_fecha: string
          tipo: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          canal?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          notas?: string | null
          paciente_id: string
          proxima_fecha: string
          tipo: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          canal?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string
          proxima_fecha?: string
          tipo?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordatorios_fidelizacion_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordatorios_fidelizacion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      recordatorios_sesiones_psico: {
        Row: {
          canal: string
          created_at: string
          enviado_at: string | null
          error_msg: string | null
          estado: string
          id: string
          paciente_id: string
          programado_para: string
          sesion_id: string
          workspace_id: string
        }
        Insert: {
          canal: string
          created_at?: string
          enviado_at?: string | null
          error_msg?: string | null
          estado?: string
          id?: string
          paciente_id: string
          programado_para: string
          sesion_id: string
          workspace_id: string
        }
        Update: {
          canal?: string
          created_at?: string
          enviado_at?: string | null
          error_msg?: string | null
          estado?: string
          id?: string
          paciente_id?: string
          programado_para?: string
          sesion_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      recuperacion_post_anestesica: {
        Row: {
          aldrete_actividad: number | null
          aldrete_circulacion: number | null
          aldrete_conciencia: number | null
          aldrete_respiracion: number | null
          aldrete_saturacion: number | null
          aldrete_total: number | null
          created_at: string | null
          destino: string | null
          hora_alta_urpa: string | null
          hora_ingreso_urpa: string | null
          id: string
          notas: string | null
          paciente_id: string | null
          programacion_id: string | null
          signos_vitales: Json | null
        }
        Insert: {
          aldrete_actividad?: number | null
          aldrete_circulacion?: number | null
          aldrete_conciencia?: number | null
          aldrete_respiracion?: number | null
          aldrete_saturacion?: number | null
          aldrete_total?: number | null
          created_at?: string | null
          destino?: string | null
          hora_alta_urpa?: string | null
          hora_ingreso_urpa?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string | null
          programacion_id?: string | null
          signos_vitales?: Json | null
        }
        Update: {
          aldrete_actividad?: number | null
          aldrete_circulacion?: number | null
          aldrete_conciencia?: number | null
          aldrete_respiracion?: number | null
          aldrete_saturacion?: number | null
          aldrete_total?: number | null
          created_at?: string | null
          destino?: string | null
          hora_alta_urpa?: string | null
          hora_ingreso_urpa?: string | null
          id?: string
          notas?: string | null
          paciente_id?: string | null
          programacion_id?: string | null
          signos_vitales?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "recuperacion_post_anestesica_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recuperacion_post_anestesica_programacion_id_fkey"
            columns: ["programacion_id"]
            isOneToOne: false
            referencedRelation: "programaciones_quirurgicas"
            referencedColumns: ["id"]
          },
        ]
      }
      referidos: {
        Row: {
          contacto_prospecto: string | null
          created_at: string
          estado: string
          fecha_conversion: string | null
          fecha_referido: string
          id: string
          nombre_prospecto: string | null
          notas: string | null
          paciente_referido_id: string | null
          recompensa_otorgada: boolean
          referidor_id: string
          referidor_tipo: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          contacto_prospecto?: string | null
          created_at?: string
          estado?: string
          fecha_conversion?: string | null
          fecha_referido?: string
          id?: string
          nombre_prospecto?: string | null
          notas?: string | null
          paciente_referido_id?: string | null
          recompensa_otorgada?: boolean
          referidor_id: string
          referidor_tipo: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          contacto_prospecto?: string | null
          created_at?: string
          estado?: string
          fecha_conversion?: string | null
          fecha_referido?: string
          id?: string
          nombre_prospecto?: string | null
          notas?: string | null
          paciente_referido_id?: string | null
          recompensa_otorgada?: boolean
          referidor_id?: string
          referidor_tipo?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      referidos_paciente: {
        Row: {
          created_at: string
          estado: string
          id: string
          programa_id: string | null
          puntos_otorgados: number | null
          referido_id: string
          referidor_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          estado?: string
          id?: string
          programa_id?: string | null
          puntos_otorgados?: number | null
          referido_id: string
          referidor_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          estado?: string
          id?: string
          programa_id?: string | null
          puntos_otorgados?: number | null
          referido_id?: string
          referidor_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referidos_paciente_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programa_fidelizacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_paciente_referido_id_fkey"
            columns: ["referido_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_paciente_referidor_id_fkey"
            columns: ["referidor_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referidos_paciente_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      referimientos_sociales: {
        Row: {
          caso_id: string
          contacto_institucion: string | null
          created_at: string
          documentos_enviados: string[] | null
          estado: string
          fecha_referimiento: string | null
          fecha_respuesta: string | null
          id: string
          institucion_destino: string
          motivo: string
          observaciones: string | null
          resultado: string | null
          telefono_institucion: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          caso_id: string
          contacto_institucion?: string | null
          created_at?: string
          documentos_enviados?: string[] | null
          estado?: string
          fecha_referimiento?: string | null
          fecha_respuesta?: string | null
          id?: string
          institucion_destino: string
          motivo: string
          observaciones?: string | null
          resultado?: string | null
          telefono_institucion?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          caso_id?: string
          contacto_institucion?: string | null
          created_at?: string
          documentos_enviados?: string[] | null
          estado?: string
          fecha_referimiento?: string | null
          fecha_respuesta?: string | null
          id?: string
          institucion_destino?: string
          motivo?: string
          observaciones?: string | null
          resultado?: string | null
          telefono_institucion?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referimientos_sociales_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos_trabajo_social"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referimientos_sociales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
          vertical: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
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
      registros_morgue: {
        Row: {
          autopsia: boolean | null
          causa_muerte: string | null
          cedula_receptor: string | null
          created_at: string
          estado: string
          familiar_receptor: string | null
          fecha_defuncion: string | null
          fecha_liberacion: string | null
          hora_defuncion: string | null
          id: string
          medico_certificante_id: string | null
          nombre_fallecido: string | null
          numero: string
          observaciones: string | null
          paciente_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          autopsia?: boolean | null
          causa_muerte?: string | null
          cedula_receptor?: string | null
          created_at?: string
          estado?: string
          familiar_receptor?: string | null
          fecha_defuncion?: string | null
          fecha_liberacion?: string | null
          hora_defuncion?: string | null
          id?: string
          medico_certificante_id?: string | null
          nombre_fallecido?: string | null
          numero?: string
          observaciones?: string | null
          paciente_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          autopsia?: boolean | null
          causa_muerte?: string | null
          cedula_receptor?: string | null
          created_at?: string
          estado?: string
          familiar_receptor?: string | null
          fecha_defuncion?: string | null
          fecha_liberacion?: string | null
          hora_defuncion?: string | null
          id?: string
          medico_certificante_id?: string | null
          nombre_fallecido?: string | null
          numero?: string
          observaciones?: string | null
          paciente_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_morgue_medico_certificante_id_fkey"
            columns: ["medico_certificante_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_morgue_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_morgue_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_parto: {
        Row: {
          complicaciones: string | null
          created_at: string | null
          desgarro: string | null
          duracion_alumbramiento_min: number | null
          duracion_dilatacion_min: number | null
          duracion_expulsivo_min: number | null
          episiotomia: boolean | null
          fecha_parto: string
          id: string
          observaciones: string | null
          obstetra_id: string | null
          paciente_id: string | null
          partograma_id: string | null
          sangrado_ml: number | null
          tipo_anestesia: string | null
          tipo_parto: string | null
          workspace_id: string | null
        }
        Insert: {
          complicaciones?: string | null
          created_at?: string | null
          desgarro?: string | null
          duracion_alumbramiento_min?: number | null
          duracion_dilatacion_min?: number | null
          duracion_expulsivo_min?: number | null
          episiotomia?: boolean | null
          fecha_parto: string
          id?: string
          observaciones?: string | null
          obstetra_id?: string | null
          paciente_id?: string | null
          partograma_id?: string | null
          sangrado_ml?: number | null
          tipo_anestesia?: string | null
          tipo_parto?: string | null
          workspace_id?: string | null
        }
        Update: {
          complicaciones?: string | null
          created_at?: string | null
          desgarro?: string | null
          duracion_alumbramiento_min?: number | null
          duracion_dilatacion_min?: number | null
          duracion_expulsivo_min?: number | null
          episiotomia?: boolean | null
          fecha_parto?: string
          id?: string
          observaciones?: string | null
          obstetra_id?: string | null
          paciente_id?: string | null
          partograma_id?: string | null
          sangrado_ml?: number | null
          tipo_anestesia?: string | null
          tipo_parto?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_parto_obstetra_id_fkey"
            columns: ["obstetra_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_parto_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_parto_partograma_id_fkey"
            columns: ["partograma_id"]
            isOneToOne: false
            referencedRelation: "partogramas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_parto_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_urgencias: {
        Row: {
          acompanante: string | null
          created_at: string | null
          estado: string | null
          hora_egreso: string | null
          hora_llegada: string
          id: string
          modo_llegada: string | null
          motivo_consulta: string
          paciente_id: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          acompanante?: string | null
          created_at?: string | null
          estado?: string | null
          hora_egreso?: string | null
          hora_llegada?: string
          id?: string
          modo_llegada?: string | null
          motivo_consulta: string
          paciente_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          acompanante?: string | null
          created_at?: string | null
          estado?: string | null
          hora_egreso?: string | null
          hora_llegada?: string
          id?: string
          modo_llegada?: string | null
          motivo_consulta?: string
          paciente_id?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_urgencias_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_urgencias_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reglas_clinicas: {
        Row: {
          acciones: Json
          activo: boolean | null
          categoria: string | null
          codigo: string
          condiciones: Json
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          es_global: boolean | null
          evento_disparador: string
          id: string
          nombre: string
          severidad: string | null
          ultima_ejecucion: string | null
          updated_at: string | null
          veces_disparada: number | null
          workspace_id: string | null
        }
        Insert: {
          acciones?: Json
          activo?: boolean | null
          categoria?: string | null
          codigo: string
          condiciones?: Json
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          es_global?: boolean | null
          evento_disparador: string
          id?: string
          nombre: string
          severidad?: string | null
          ultima_ejecucion?: string | null
          updated_at?: string | null
          veces_disparada?: number | null
          workspace_id?: string | null
        }
        Update: {
          acciones?: Json
          activo?: boolean | null
          categoria?: string | null
          codigo?: string
          condiciones?: Json
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          es_global?: boolean | null
          evento_disparador?: string
          id?: string
          nombre?: string
          severidad?: string | null
          ultima_ejecucion?: string | null
          updated_at?: string | null
          veces_disparada?: number | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      reglas_ejecuciones: {
        Row: {
          acciones_ejecutadas: Json | null
          contexto: Json | null
          fecha_ejecucion: string | null
          id: string
          paciente_id: string | null
          regla_id: string
          resultado: string | null
          workspace_id: string
        }
        Insert: {
          acciones_ejecutadas?: Json | null
          contexto?: Json | null
          fecha_ejecucion?: string | null
          id?: string
          paciente_id?: string | null
          regla_id: string
          resultado?: string | null
          workspace_id: string
        }
        Update: {
          acciones_ejecutadas?: Json | null
          contexto?: Json | null
          fecha_ejecucion?: string | null
          id?: string
          paciente_id?: string | null
          regla_id?: string
          resultado?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reglas_ejecuciones_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "reglas_clinicas"
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
      reportes_financieros_vertical: {
        Row: {
          created_at: string
          datos: Json
          generado_por: string | null
          id: string
          notas: string | null
          periodo_fin: string
          periodo_inicio: string
          tipo_reporte: string
          totales: Json | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          datos?: Json
          generado_por?: string | null
          id?: string
          notas?: string | null
          periodo_fin: string
          periodo_inicio: string
          tipo_reporte?: string
          totales?: Json | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          datos?: Json
          generado_por?: string | null
          id?: string
          notas?: string | null
          periodo_fin?: string
          periodo_inicio?: string
          tipo_reporte?: string
          totales?: Json | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_financieros_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_fiscales_vertical: {
        Row: {
          cantidad_registros: number | null
          created_at: string
          datos: Json | null
          estado: string
          generado_por: string | null
          id: string
          monto_total: number | null
          periodo: string
          tipo_reporte: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          cantidad_registros?: number | null
          created_at?: string
          datos?: Json | null
          estado?: string
          generado_por?: string | null
          id?: string
          monto_total?: number | null
          periodo: string
          tipo_reporte: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          cantidad_registros?: number | null
          created_at?: string
          datos?: Json | null
          estado?: string
          generado_por?: string | null
          id?: string
          monto_total?: number | null
          periodo?: string
          tipo_reporte?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_fiscales_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reportes_kpi_vertical: {
        Row: {
          created_at: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          metadata: Json | null
          periodo: string
          tipo_kpi: string
          valor: number | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          metadata?: Json | null
          periodo: string
          tipo_kpi: string
          valor?: number | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          metadata?: Json | null
          periodo?: string
          tipo_kpi?: string
          valor?: number | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_kpi_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      reportes_regulatorios: {
        Row: {
          created_at: string
          datos: Json | null
          entidad_destino: string
          enviado_at: string | null
          estado: string
          fecha_vencimiento: string | null
          generado_por: string | null
          id: string
          notas: string | null
          periodo_fin: string | null
          periodo_inicio: string | null
          tipo_reporte: string
          updated_at: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          datos?: Json | null
          entidad_destino?: string
          enviado_at?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          generado_por?: string | null
          id?: string
          notas?: string | null
          periodo_fin?: string | null
          periodo_inicio?: string | null
          tipo_reporte: string
          updated_at?: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          datos?: Json | null
          entidad_destino?: string
          enviado_at?: string | null
          estado?: string
          fecha_vencimiento?: string | null
          generado_por?: string | null
          id?: string
          notas?: string | null
          periodo_fin?: string | null
          periodo_inicio?: string | null
          tipo_reporte?: string
          updated_at?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportes_regulatorios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      reservas_recovery: {
        Row: {
          acompanante_nombre: string | null
          acompanante_telefono: string | null
          check_in: string
          check_out: string | null
          created_at: string | null
          deposito: number | null
          estado: string | null
          habitacion_id: string | null
          id: string
          idioma: string | null
          medico_tratante: string | null
          noches: number | null
          notas: string | null
          numero: string | null
          paciente_id: string | null
          pais_origen: string | null
          paquete: string | null
          requiere_traductor: boolean | null
          tipo_cirugia: string | null
          total: number | null
          traslado_aeropuerto: boolean | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          acompanante_nombre?: string | null
          acompanante_telefono?: string | null
          check_in: string
          check_out?: string | null
          created_at?: string | null
          deposito?: number | null
          estado?: string | null
          habitacion_id?: string | null
          id?: string
          idioma?: string | null
          medico_tratante?: string | null
          noches?: number | null
          notas?: string | null
          numero?: string | null
          paciente_id?: string | null
          pais_origen?: string | null
          paquete?: string | null
          requiere_traductor?: boolean | null
          tipo_cirugia?: string | null
          total?: number | null
          traslado_aeropuerto?: boolean | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          acompanante_nombre?: string | null
          acompanante_telefono?: string | null
          check_in?: string
          check_out?: string | null
          created_at?: string | null
          deposito?: number | null
          estado?: string | null
          habitacion_id?: string | null
          id?: string
          idioma?: string | null
          medico_tratante?: string | null
          noches?: number | null
          notas?: string | null
          numero?: string | null
          paciente_id?: string | null
          pais_origen?: string | null
          paquete?: string | null
          requiere_traductor?: boolean | null
          tipo_cirugia?: string | null
          total?: number | null
          traslado_aeropuerto?: boolean | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservas_recovery_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservas_recovery_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      residentes_rotaciones: {
        Row: {
          area_rotacion: string | null
          calificacion_final: number | null
          created_at: string
          estado: string
          evaluaciones: Json | null
          id: string
          nombre_residente: string | null
          observaciones: string | null
          periodo_fin: string | null
          periodo_inicio: string | null
          profesional_id: string | null
          programa_id: string
          supervisor_id: string | null
          universidad: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          area_rotacion?: string | null
          calificacion_final?: number | null
          created_at?: string
          estado?: string
          evaluaciones?: Json | null
          id?: string
          nombre_residente?: string | null
          observaciones?: string | null
          periodo_fin?: string | null
          periodo_inicio?: string | null
          profesional_id?: string | null
          programa_id: string
          supervisor_id?: string | null
          universidad?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          area_rotacion?: string | null
          calificacion_final?: number | null
          created_at?: string
          estado?: string
          evaluaciones?: Json | null
          id?: string
          nombre_residente?: string | null
          observaciones?: string | null
          periodo_fin?: string | null
          periodo_inicio?: string | null
          profesional_id?: string | null
          programa_id?: string
          supervisor_id?: string | null
          universidad?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "residentes_rotaciones_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residentes_rotaciones_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas_docencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residentes_rotaciones_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residentes_rotaciones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      residuos_hospitalarios: {
        Row: {
          area_generadora: string | null
          contenedor: string | null
          created_at: string
          estado: string
          fecha_generacion: string | null
          fecha_recoleccion: string | null
          id: string
          numero: string
          observaciones: string | null
          peso_kg: number | null
          responsable_id: string | null
          tipo: string
          updated_at: string
          volumen_litros: number | null
          workspace_id: string
        }
        Insert: {
          area_generadora?: string | null
          contenedor?: string | null
          created_at?: string
          estado?: string
          fecha_generacion?: string | null
          fecha_recoleccion?: string | null
          id?: string
          numero?: string
          observaciones?: string | null
          peso_kg?: number | null
          responsable_id?: string | null
          tipo?: string
          updated_at?: string
          volumen_litros?: number | null
          workspace_id: string
        }
        Update: {
          area_generadora?: string | null
          contenedor?: string | null
          created_at?: string
          estado?: string
          fecha_generacion?: string | null
          fecha_recoleccion?: string | null
          id?: string
          numero?: string
          observaciones?: string | null
          peso_kg?: number | null
          responsable_id?: string | null
          tipo?: string
          updated_at?: string
          volumen_litros?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "residuos_hospitalarios_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "residuos_hospitalarios_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
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
      reuniones_comite: {
        Row: {
          acta_url: string | null
          acuerdos: string | null
          agenda: string | null
          asistentes: Json | null
          comite_id: string
          created_at: string
          fecha_reunion: string
          id: string
          workspace_id: string | null
        }
        Insert: {
          acta_url?: string | null
          acuerdos?: string | null
          agenda?: string | null
          asistentes?: Json | null
          comite_id: string
          created_at?: string
          fecha_reunion: string
          id?: string
          workspace_id?: string | null
        }
        Update: {
          acta_url?: string | null
          acuerdos?: string | null
          agenda?: string | null
          asistentes?: Json | null
          comite_id?: string
          created_at?: string
          fecha_reunion?: string
          id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reuniones_comite_comite_id_fkey"
            columns: ["comite_id"]
            isOneToOne: false
            referencedRelation: "comites_calidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reuniones_comite_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      roles_vertical: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          permisos: Json
          updated_at: string
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          permisos?: Json
          updated_at?: string
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          permisos?: Json
          updated_at?: string
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ronda_paciente_notas: {
        Row: {
          admision_id: string | null
          cambios_plan: string | null
          created_at: string | null
          duracion_minutos: number | null
          estado_paciente: string | null
          evolucion: string | null
          id: string
          ordenes_nuevas: Json | null
          paciente_id: string
          ronda_id: string
        }
        Insert: {
          admision_id?: string | null
          cambios_plan?: string | null
          created_at?: string | null
          duracion_minutos?: number | null
          estado_paciente?: string | null
          evolucion?: string | null
          id?: string
          ordenes_nuevas?: Json | null
          paciente_id: string
          ronda_id: string
        }
        Update: {
          admision_id?: string | null
          cambios_plan?: string | null
          created_at?: string | null
          duracion_minutos?: number | null
          estado_paciente?: string | null
          evolucion?: string | null
          id?: string
          ordenes_nuevas?: Json | null
          paciente_id?: string
          ronda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ronda_paciente_notas_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ronda_paciente_notas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ronda_paciente_notas_ronda_id_fkey"
            columns: ["ronda_id"]
            isOneToOne: false
            referencedRelation: "rondas_medicas"
            referencedColumns: ["id"]
          },
        ]
      }
      rondas_medicas: {
        Row: {
          ala_id: string | null
          created_at: string | null
          created_by: string | null
          estado: string | null
          fecha_ronda: string
          id: string
          medico_lider_id: string | null
          observaciones_generales: string | null
          participantes: Json | null
          sucursal_id: string | null
          tipo: string
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          ala_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_ronda?: string
          id?: string
          medico_lider_id?: string | null
          observaciones_generales?: string | null
          participantes?: Json | null
          sucursal_id?: string | null
          tipo?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          ala_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado?: string | null
          fecha_ronda?: string
          id?: string
          medico_lider_id?: string | null
          observaciones_generales?: string | null
          participantes?: Json | null
          sucursal_id?: string | null
          tipo?: string
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rondas_medicas_medico_lider_id_fkey"
            columns: ["medico_lider_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rondas_medicas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      salud_ocupacional: {
        Row: {
          apto: boolean | null
          cargo: string | null
          conclusiones: string | null
          created_at: string
          documento_url: string | null
          empleado_paciente_id: string | null
          empresa: string | null
          fecha: string
          id: string
          riesgos: Json | null
          tipo: string
          workspace_id: string
        }
        Insert: {
          apto?: boolean | null
          cargo?: string | null
          conclusiones?: string | null
          created_at?: string
          documento_url?: string | null
          empleado_paciente_id?: string | null
          empresa?: string | null
          fecha?: string
          id?: string
          riesgos?: Json | null
          tipo: string
          workspace_id: string
        }
        Update: {
          apto?: boolean | null
          cargo?: string | null
          conclusiones?: string | null
          created_at?: string
          documento_url?: string | null
          empleado_paciente_id?: string | null
          empresa?: string | null
          fecha?: string
          id?: string
          riesgos?: Json | null
          tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salud_ocupacional_empleado_paciente_id_fkey"
            columns: ["empleado_paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salud_ocupacional_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      segmentos_pacientes: {
        Row: {
          activo: boolean
          created_at: string
          criterios: Json
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean
          created_at?: string
          criterios?: Json
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean
          created_at?: string
          criterios?: Json
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      seguimiento_diario_recovery: {
        Row: {
          alertas: string | null
          created_at: string
          curas_realizadas: string | null
          drenajes: string | null
          enfermera_id: string | null
          fecha: string
          fotos_evolucion: string[] | null
          frecuencia_cardiaca: number | null
          id: string
          inflamacion: string | null
          medicamentos_administrados: Json | null
          nivel_dolor: number | null
          notas_enfermeria: string | null
          paciente_recovery_id: string
          presion_diastolica: number | null
          presion_sistolica: number | null
          saturacion_o2: number | null
          temperatura: number | null
          turno: string | null
          workspace_id: string
        }
        Insert: {
          alertas?: string | null
          created_at?: string
          curas_realizadas?: string | null
          drenajes?: string | null
          enfermera_id?: string | null
          fecha?: string
          fotos_evolucion?: string[] | null
          frecuencia_cardiaca?: number | null
          id?: string
          inflamacion?: string | null
          medicamentos_administrados?: Json | null
          nivel_dolor?: number | null
          notas_enfermeria?: string | null
          paciente_recovery_id: string
          presion_diastolica?: number | null
          presion_sistolica?: number | null
          saturacion_o2?: number | null
          temperatura?: number | null
          turno?: string | null
          workspace_id: string
        }
        Update: {
          alertas?: string | null
          created_at?: string
          curas_realizadas?: string | null
          drenajes?: string | null
          enfermera_id?: string | null
          fecha?: string
          fotos_evolucion?: string[] | null
          frecuencia_cardiaca?: number | null
          id?: string
          inflamacion?: string | null
          medicamentos_administrados?: Json | null
          nivel_dolor?: number | null
          notas_enfermeria?: string | null
          paciente_recovery_id?: string
          presion_diastolica?: number | null
          presion_sistolica?: number | null
          saturacion_o2?: number | null
          temperatura?: number | null
          turno?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguimiento_diario_recovery_enfermera_id_fkey"
            columns: ["enfermera_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimiento_diario_recovery_paciente_recovery_id_fkey"
            columns: ["paciente_recovery_id"]
            isOneToOne: false
            referencedRelation: "pacientes_recovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguimiento_diario_recovery_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      seguimiento_emocional: {
        Row: {
          animo: number | null
          ansiedad: number | null
          created_at: string
          crisis_reciente: boolean | null
          disparadores: string | null
          estres: number | null
          fecha: string
          id: string
          notas: string | null
          objetivo_terapeutico: string | null
          paciente_id: string
          reportado_por_paciente: boolean | null
          sueno: number | null
          workspace_id: string
        }
        Insert: {
          animo?: number | null
          ansiedad?: number | null
          created_at?: string
          crisis_reciente?: boolean | null
          disparadores?: string | null
          estres?: number | null
          fecha?: string
          id?: string
          notas?: string | null
          objetivo_terapeutico?: string | null
          paciente_id: string
          reportado_por_paciente?: boolean | null
          sueno?: number | null
          workspace_id: string
        }
        Update: {
          animo?: number | null
          ansiedad?: number | null
          created_at?: string
          crisis_reciente?: boolean | null
          disparadores?: string | null
          estres?: number | null
          fecha?: string
          id?: string
          notas?: string | null
          objetivo_terapeutico?: string | null
          paciente_id?: string
          reportado_por_paciente?: boolean | null
          sueno?: number | null
          workspace_id?: string
        }
        Relationships: []
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
      servicios_catalogo: {
        Row: {
          activo: boolean
          codigo: string | null
          created_at: string
          descripcion: string | null
          duracion_min: number | null
          id: string
          modalidad: string
          nombre: string
          precio_referencia: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_min?: number | null
          id?: string
          modalidad?: string
          nombre: string
          precio_referencia?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_min?: number | null
          id?: string
          modalidad?: string
          nombre?: string
          precio_referencia?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_catalogo_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_concierge: {
        Row: {
          costo: number | null
          created_at: string | null
          detalles: string | null
          estado: string | null
          fecha: string
          hora: string | null
          id: string
          proveedor: string | null
          reserva_id: string
          tipo: string
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          costo?: number | null
          created_at?: string | null
          detalles?: string | null
          estado?: string | null
          fecha: string
          hora?: string | null
          id?: string
          proveedor?: string | null
          reserva_id: string
          tipo: string
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          costo?: number | null
          created_at?: string | null
          detalles?: string | null
          estado?: string | null
          fecha?: string
          hora?: string | null
          id?: string
          proveedor?: string | null
          reserva_id?: string
          tipo?: string
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_concierge_reserva_id_fkey"
            columns: ["reserva_id"]
            isOneToOne: false
            referencedRelation: "reservas_recovery"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicios_concierge_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_recovery: {
        Row: {
          activo: boolean | null
          costo: number | null
          created_at: string
          duracion_minutos: number | null
          id: string
          nombre: string
          tipo: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          costo?: number | null
          created_at?: string
          duracion_minutos?: number | null
          id?: string
          nombre: string
          tipo?: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          costo?: number | null
          created_at?: string
          duracion_minutos?: number | null
          id?: string
          nombre?: string
          tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servicios_recovery_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_cubiertas_eap: {
        Row: {
          created_at: string
          empleado_id: string
          facturada: boolean | null
          fecha: string
          id: string
          sesion_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          empleado_id: string
          facturada?: boolean | null
          fecha?: string
          id?: string
          sesion_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          empleado_id?: string
          facturada?: boolean | null
          fecha?: string
          id?: string
          sesion_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_cubiertas_eap_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados_eap"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones_psicologia: {
        Row: {
          created_at: string
          duracion_minutos: number | null
          estado: string | null
          fecha_hora: string
          id: string
          lista_espera: boolean | null
          modalidad: string | null
          motivo: string | null
          notas_previas: string | null
          paciente_id: string
          recurrencia_semanal: boolean | null
          sala_virtual_token: string | null
          terapeuta_id: string | null
          tipo_sesion: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duracion_minutos?: number | null
          estado?: string | null
          fecha_hora: string
          id?: string
          lista_espera?: boolean | null
          modalidad?: string | null
          motivo?: string | null
          notas_previas?: string | null
          paciente_id: string
          recurrencia_semanal?: boolean | null
          sala_virtual_token?: string | null
          terapeuta_id?: string | null
          tipo_sesion: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          duracion_minutos?: number | null
          estado?: string | null
          fecha_hora?: string
          id?: string
          lista_espera?: boolean | null
          modalidad?: string | null
          motivo?: string | null
          notas_previas?: string | null
          paciente_id?: string
          recurrencia_semanal?: boolean | null
          sala_virtual_token?: string | null
          terapeuta_id?: string | null
          tipo_sesion?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
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
      signos_vitales_turno: {
        Row: {
          admision_id: string | null
          created_at: string | null
          diuresis_ml: number | null
          dolor_eva: number | null
          enfermera_id: string | null
          fc: number | null
          fecha_registro: string
          fr: number | null
          glicemia: number | null
          id: string
          observaciones: string | null
          paciente_id: string
          saturacion: number | null
          ta_diastolica: number | null
          ta_sistolica: number | null
          temperatura: number | null
          turno: string | null
        }
        Insert: {
          admision_id?: string | null
          created_at?: string | null
          diuresis_ml?: number | null
          dolor_eva?: number | null
          enfermera_id?: string | null
          fc?: number | null
          fecha_registro?: string
          fr?: number | null
          glicemia?: number | null
          id?: string
          observaciones?: string | null
          paciente_id: string
          saturacion?: number | null
          ta_diastolica?: number | null
          ta_sistolica?: number | null
          temperatura?: number | null
          turno?: string | null
        }
        Update: {
          admision_id?: string | null
          created_at?: string | null
          diuresis_ml?: number | null
          dolor_eva?: number | null
          enfermera_id?: string | null
          fc?: number | null
          fecha_registro?: string
          fr?: number | null
          glicemia?: number | null
          id?: string
          observaciones?: string | null
          paciente_id?: string
          saturacion?: number | null
          ta_diastolica?: number | null
          ta_sistolica?: number | null
          temperatura?: number | null
          turno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signos_vitales_turno_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signos_vitales_turno_enfermera_id_fkey"
            columns: ["enfermera_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signos_vitales_turno_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
        ]
      }
      sillones_dentales: {
        Row: {
          activo: boolean | null
          created_at: string | null
          equipamiento: string[] | null
          id: string
          nombre: string
          ubicacion: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          equipamiento?: string[] | null
          id?: string
          nombre: string
          ubicacion?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          equipamiento?: string[] | null
          id?: string
          nombre?: string
          ubicacion?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sillones_dentales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sillones_infusion: {
        Row: {
          activo: boolean | null
          ciclo_actual_id: string | null
          created_at: string | null
          estado: string | null
          id: string
          numero: string
          ubicacion: string | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          activo?: boolean | null
          ciclo_actual_id?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          numero: string
          ubicacion?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          activo?: boolean | null
          ciclo_actual_id?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          numero?: string
          ubicacion?: string | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sillones_infusion_ciclo_actual_id_fkey"
            columns: ["ciclo_actual_id"]
            isOneToOne: false
            referencedRelation: "ciclos_quimio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sillones_infusion_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      sucursales_vertical: {
        Row: {
          activo: boolean | null
          configuracion: Json | null
          created_at: string | null
          dias_laborables: string[] | null
          direccion: string | null
          email: string | null
          horario_apertura: string | null
          horario_cierre: string | null
          id: string
          nombre: string
          telefono: string | null
          updated_at: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          configuracion?: Json | null
          created_at?: string | null
          dias_laborables?: string[] | null
          direccion?: string | null
          email?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          configuracion?: Json | null
          created_at?: string | null
          dias_laborables?: string[] | null
          direccion?: string | null
          email?: string | null
          horario_apertura?: string | null
          horario_cierre?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sucursales_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_calendario_vertical: {
        Row: {
          cita_id: string | null
          created_at: string
          error_detalle: string | null
          estado_sync: string
          external_event_id: string | null
          id: string
          provider: string
          ultimo_intento: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          cita_id?: string | null
          created_at?: string
          error_detalle?: string | null
          estado_sync?: string
          external_event_id?: string | null
          id?: string
          provider: string
          ultimo_intento?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          cita_id?: string | null
          created_at?: string
          error_detalle?: string | null
          estado_sync?: string
          external_event_id?: string | null
          id?: string
          provider?: string
          ultimo_intento?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_calendario_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_comentarios: {
        Row: {
          contenido: string
          created_at: string
          id: string
          tarea_id: string
          user_id: string
        }
        Insert: {
          contenido: string
          created_at?: string
          id?: string
          tarea_id: string
          user_id: string
        }
        Update: {
          contenido?: string
          created_at?: string
          id?: string
          tarea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_comentarios_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas_internas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_internas: {
        Row: {
          asignado_a: string | null
          completado_at: string | null
          created_at: string
          created_by: string | null
          departamento: string
          descripcion: string | null
          estado: string
          etiquetas: string[] | null
          fecha_limite: string | null
          id: string
          orden: number
          paciente_id: string | null
          prioridad: string
          titulo: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          asignado_a?: string | null
          completado_at?: string | null
          created_at?: string
          created_by?: string | null
          departamento?: string
          descripcion?: string | null
          estado?: string
          etiquetas?: string[] | null
          fecha_limite?: string | null
          id?: string
          orden?: number
          paciente_id?: string | null
          prioridad?: string
          titulo: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          asignado_a?: string | null
          completado_at?: string | null
          created_at?: string
          created_by?: string | null
          departamento?: string
          descripcion?: string | null
          estado?: string
          etiquetas?: string[] | null
          fecha_limite?: string | null
          id?: string
          orden?: number
          paciente_id?: string | null
          prioridad?: string
          titulo?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_internas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_internas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_terapeuticas: {
        Row: {
          comentario_paciente: string | null
          created_at: string
          cumplida: boolean | null
          descripcion: string | null
          fecha_asignacion: string | null
          fecha_cumplimiento: string | null
          fecha_limite: string | null
          id: string
          paciente_id: string
          sesion_id: string | null
          terapeuta_id: string | null
          titulo: string
          workspace_id: string
        }
        Insert: {
          comentario_paciente?: string | null
          created_at?: string
          cumplida?: boolean | null
          descripcion?: string | null
          fecha_asignacion?: string | null
          fecha_cumplimiento?: string | null
          fecha_limite?: string | null
          id?: string
          paciente_id: string
          sesion_id?: string | null
          terapeuta_id?: string | null
          titulo: string
          workspace_id: string
        }
        Update: {
          comentario_paciente?: string | null
          created_at?: string
          cumplida?: boolean | null
          descripcion?: string | null
          fecha_asignacion?: string | null
          fecha_cumplimiento?: string | null
          fecha_limite?: string | null
          id?: string
          paciente_id?: string
          sesion_id?: string | null
          terapeuta_id?: string | null
          titulo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_terapeuticas_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones_psicologia"
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
      tarifas_profesional_ars: {
        Row: {
          activo: boolean
          aseguradora_id: string | null
          comision_pct: number | null
          created_at: string
          id: string
          precio: number
          profesional_id: string
          servicio_id: string
          vigente_desde: string | null
          vigente_hasta: string | null
          workspace_id: string
        }
        Insert: {
          activo?: boolean
          aseguradora_id?: string | null
          comision_pct?: number | null
          created_at?: string
          id?: string
          precio?: number
          profesional_id: string
          servicio_id: string
          vigente_desde?: string | null
          vigente_hasta?: string | null
          workspace_id: string
        }
        Update: {
          activo?: boolean
          aseguradora_id?: string | null
          comision_pct?: number | null
          created_at?: string
          id?: string
          precio?: number
          profesional_id?: string
          servicio_id?: string
          vigente_desde?: string | null
          vigente_hasta?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarifas_profesional_ars_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarifas_profesional_ars_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarifas_profesional_ars_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultas: {
        Row: {
          consentimiento_id: string | null
          created_at: string
          duracion_min: number | null
          estado: string
          fin_at: string | null
          id: string
          inicio_at: string | null
          notas_post: string | null
          paciente_id: string
          pin_paciente: string
          sala_codigo: string
          sesion_id: string | null
          terapeuta_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          consentimiento_id?: string | null
          created_at?: string
          duracion_min?: number | null
          estado?: string
          fin_at?: string | null
          id?: string
          inicio_at?: string | null
          notas_post?: string | null
          paciente_id: string
          pin_paciente?: string
          sala_codigo?: string
          sesion_id?: string | null
          terapeuta_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          consentimiento_id?: string | null
          created_at?: string
          duracion_min?: number | null
          estado?: string
          fin_at?: string | null
          id?: string
          inicio_at?: string | null
          notas_post?: string | null
          paciente_id?: string
          pin_paciente?: string
          sala_codigo?: string
          sesion_id?: string | null
          terapeuta_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultas_consentimiento_id_fkey"
            columns: ["consentimiento_id"]
            isOneToOne: false
            referencedRelation: "consentimientos_teleconsulta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultas_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones_psicologia"
            referencedColumns: ["id"]
          },
        ]
      }
      teleconsultas_vertical: {
        Row: {
          consentimiento_grabacion: boolean | null
          created_at: string
          diagnostico: string | null
          duracion_minutos: number | null
          enlace_sala: string | null
          estado: string
          fecha_hora: string
          id: string
          notas_clinicas: string | null
          paciente_id: string | null
          profesional_id: string | null
          updated_at: string
          url_grabacion: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Insert: {
          consentimiento_grabacion?: boolean | null
          created_at?: string
          diagnostico?: string | null
          duracion_minutos?: number | null
          enlace_sala?: string | null
          estado?: string
          fecha_hora?: string
          id?: string
          notas_clinicas?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          updated_at?: string
          url_grabacion?: string | null
          vertical_tipo: string
          workspace_id: string
        }
        Update: {
          consentimiento_grabacion?: boolean | null
          created_at?: string
          diagnostico?: string | null
          duracion_minutos?: number | null
          enlace_sala?: string | null
          estado?: string
          fecha_hora?: string
          id?: string
          notas_clinicas?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          updated_at?: string
          url_grabacion?: string | null
          vertical_tipo?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teleconsultas_vertical_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultas_vertical_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teleconsultas_vertical_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicina_chat_mensajes: {
        Row: {
          archivo_url: string | null
          created_at: string
          id: string
          leido: boolean | null
          mensaje: string
          remitente_nombre: string | null
          remitente_tipo: string
          remitente_user_id: string | null
          sesion_id: string
          workspace_id: string | null
        }
        Insert: {
          archivo_url?: string | null
          created_at?: string
          id?: string
          leido?: boolean | null
          mensaje: string
          remitente_nombre?: string | null
          remitente_tipo: string
          remitente_user_id?: string | null
          sesion_id: string
          workspace_id?: string | null
        }
        Update: {
          archivo_url?: string | null
          created_at?: string
          id?: string
          leido?: boolean | null
          mensaje?: string
          remitente_nombre?: string | null
          remitente_tipo?: string
          remitente_user_id?: string | null
          sesion_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telemedicina_chat_mensajes_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "telemedicina_sesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicina_chat_mensajes_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicina_recetas_digitales: {
        Row: {
          created_at: string | null
          firma_digital: string | null
          id: string
          indicaciones: string | null
          medicamentos: Json | null
          paciente_id: string | null
          profesional_id: string | null
          qr_verificacion: string | null
          sesion_id: string | null
          valida_hasta: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          firma_digital?: string | null
          id?: string
          indicaciones?: string | null
          medicamentos?: Json | null
          paciente_id?: string | null
          profesional_id?: string | null
          qr_verificacion?: string | null
          sesion_id?: string | null
          valida_hasta?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          firma_digital?: string | null
          id?: string
          indicaciones?: string | null
          medicamentos?: Json | null
          paciente_id?: string | null
          profesional_id?: string | null
          qr_verificacion?: string | null
          sesion_id?: string | null
          valida_hasta?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemedicina_recetas_digitales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicina_recetas_digitales_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicina_recetas_digitales_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "telemedicina_sesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicina_recetas_digitales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      telemedicina_sesiones: {
        Row: {
          chat_log: Json | null
          compartir_pantalla: boolean | null
          created_at: string | null
          duracion_minutos: number | null
          estado: string | null
          fecha_fin: string | null
          fecha_inicio: string | null
          grabacion_url: string | null
          id: string
          notas_clinicas: string | null
          paciente_id: string | null
          profesional_id: string | null
          receta_generada: boolean | null
          workspace_id: string
        }
        Insert: {
          chat_log?: Json | null
          compartir_pantalla?: boolean | null
          created_at?: string | null
          duracion_minutos?: number | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          grabacion_url?: string | null
          id?: string
          notas_clinicas?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          receta_generada?: boolean | null
          workspace_id: string
        }
        Update: {
          chat_log?: Json | null
          compartir_pantalla?: boolean | null
          created_at?: string | null
          duracion_minutos?: number | null
          estado?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string | null
          grabacion_url?: string | null
          id?: string
          notas_clinicas?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          receta_generada?: boolean | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemedicina_sesiones_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicina_sesiones_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemedicina_sesiones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      toxicidades_oncologicas: {
        Row: {
          ciclo_id: string | null
          created_at: string | null
          evaluador_id: string | null
          fecha_evaluacion: string | null
          grado_ctcae: number | null
          id: string
          manejo: string | null
          notas: string | null
          requiere_ajuste_dosis: boolean | null
          tipo_toxicidad: string
        }
        Insert: {
          ciclo_id?: string | null
          created_at?: string | null
          evaluador_id?: string | null
          fecha_evaluacion?: string | null
          grado_ctcae?: number | null
          id?: string
          manejo?: string | null
          notas?: string | null
          requiere_ajuste_dosis?: boolean | null
          tipo_toxicidad: string
        }
        Update: {
          ciclo_id?: string | null
          created_at?: string | null
          evaluador_id?: string | null
          fecha_evaluacion?: string | null
          grado_ctcae?: number | null
          id?: string
          manejo?: string | null
          notas?: string | null
          requiere_ajuste_dosis?: boolean | null
          tipo_toxicidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "toxicidades_oncologicas_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "ciclos_quimio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "toxicidades_oncologicas_evaluador_id_fkey"
            columns: ["evaluador_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      transfusiones: {
        Row: {
          created_at: string | null
          enfermera_id: string | null
          hora_fin: string | null
          hora_inicio: string
          id: string
          manejo_reaccion: string | null
          medico_id: string | null
          paciente_id: string | null
          reaccion_adversa: boolean | null
          signos_vitales_post: Json | null
          signos_vitales_pre: Json | null
          tipo_reaccion: string | null
          unidad_id: string | null
          velocidad_infusion: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string | null
          enfermera_id?: string | null
          hora_fin?: string | null
          hora_inicio?: string
          id?: string
          manejo_reaccion?: string | null
          medico_id?: string | null
          paciente_id?: string | null
          reaccion_adversa?: boolean | null
          signos_vitales_post?: Json | null
          signos_vitales_pre?: Json | null
          tipo_reaccion?: string | null
          unidad_id?: string | null
          velocidad_infusion?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string | null
          enfermera_id?: string | null
          hora_fin?: string | null
          hora_inicio?: string
          id?: string
          manejo_reaccion?: string | null
          medico_id?: string | null
          paciente_id?: string | null
          reaccion_adversa?: boolean | null
          signos_vitales_post?: Json | null
          signos_vitales_pre?: Json | null
          tipo_reaccion?: string | null
          unidad_id?: string | null
          velocidad_infusion?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transfusiones_enfermera_id_fkey"
            columns: ["enfermera_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusiones_medico_id_fkey"
            columns: ["medico_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusiones_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusiones_unidad_id_fkey"
            columns: ["unidad_id"]
            isOneToOne: false
            referencedRelation: "inventario_hemocomponentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfusiones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      traslados_internos: {
        Row: {
          autorizado_por_id: string | null
          cama_destino_id: string | null
          cama_origen_id: string | null
          created_at: string | null
          fecha_traslado: string | null
          id: string
          motivo: string
          paciente_id: string | null
          solicitado_por_id: string | null
          workspace_id: string | null
        }
        Insert: {
          autorizado_por_id?: string | null
          cama_destino_id?: string | null
          cama_origen_id?: string | null
          created_at?: string | null
          fecha_traslado?: string | null
          id?: string
          motivo: string
          paciente_id?: string | null
          solicitado_por_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          autorizado_por_id?: string | null
          cama_destino_id?: string | null
          cama_origen_id?: string | null
          created_at?: string | null
          fecha_traslado?: string | null
          id?: string
          motivo?: string
          paciente_id?: string | null
          solicitado_por_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "traslados_internos_autorizado_por_id_fkey"
            columns: ["autorizado_por_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traslados_internos_cama_destino_id_fkey"
            columns: ["cama_destino_id"]
            isOneToOne: false
            referencedRelation: "mapa_camas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traslados_internos_cama_origen_id_fkey"
            columns: ["cama_origen_id"]
            isOneToOne: false
            referencedRelation: "mapa_camas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traslados_internos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traslados_internos_solicitado_por_id_fkey"
            columns: ["solicitado_por_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traslados_internos_workspace_id_fkey"
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
      triage_manchester: {
        Row: {
          created_at: string | null
          enfermera_id: string | null
          hora_triage: string | null
          id: string
          nivel: string
          registro_urgencia_id: string | null
          signos_vitales: Json | null
          sintomas: string | null
          tiempo_objetivo_min: number | null
        }
        Insert: {
          created_at?: string | null
          enfermera_id?: string | null
          hora_triage?: string | null
          id?: string
          nivel: string
          registro_urgencia_id?: string | null
          signos_vitales?: Json | null
          sintomas?: string | null
          tiempo_objetivo_min?: number | null
        }
        Update: {
          created_at?: string | null
          enfermera_id?: string | null
          hora_triage?: string | null
          id?: string
          nivel?: string
          registro_urgencia_id?: string | null
          signos_vitales?: Json | null
          sintomas?: string | null
          tiempo_objetivo_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "triage_manchester_enfermera_id_fkey"
            columns: ["enfermera_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_manchester_registro_urgencia_id_fkey"
            columns: ["registro_urgencia_id"]
            isOneToOne: false
            referencedRelation: "registros_urgencias"
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
      umbrales_alerta_iot: {
        Row: {
          accion: string | null
          activo: boolean | null
          created_at: string | null
          dispositivo_id: string
          id: string
          tipo_medicion: string
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          accion?: string | null
          activo?: boolean | null
          created_at?: string | null
          dispositivo_id: string
          id?: string
          tipo_medicion: string
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          accion?: string | null
          activo?: boolean | null
          created_at?: string | null
          dispositivo_id?: string
          id?: string
          tipo_medicion?: string
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "umbrales_alerta_iot_dispositivo_id_fkey"
            columns: ["dispositivo_id"]
            isOneToOne: false
            referencedRelation: "dispositivos_iot"
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
      vacunacion_neonatal: {
        Row: {
          created_at: string | null
          dosis: string | null
          fecha: string | null
          id: string
          lote: string | null
          observaciones: string | null
          recien_nacido_id: string | null
          responsable_id: string | null
          vacuna: string
          via: string | null
        }
        Insert: {
          created_at?: string | null
          dosis?: string | null
          fecha?: string | null
          id?: string
          lote?: string | null
          observaciones?: string | null
          recien_nacido_id?: string | null
          responsable_id?: string | null
          vacuna: string
          via?: string | null
        }
        Update: {
          created_at?: string | null
          dosis?: string | null
          fecha?: string | null
          id?: string
          lote?: string | null
          observaciones?: string | null
          recien_nacido_id?: string | null
          responsable_id?: string | null
          vacuna?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacunacion_neonatal_recien_nacido_id_fkey"
            columns: ["recien_nacido_id"]
            isOneToOne: false
            referencedRelation: "recien_nacidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacunacion_neonatal_responsable_id_fkey"
            columns: ["responsable_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
        ]
      }
      vacunas_catalogo: {
        Row: {
          activo: boolean
          edad_recomendada: string | null
          enfermedad: string | null
          esquema_dosis: number | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          edad_recomendada?: string | null
          enfermedad?: string | null
          esquema_dosis?: number | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          edad_recomendada?: string | null
          enfermedad?: string | null
          esquema_dosis?: number | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      vacunas_paciente: {
        Row: {
          aplicador: string | null
          created_at: string
          dosis: number
          fecha_aplicacion: string
          id: string
          lote: string | null
          observaciones: string | null
          paciente_id: string
          proxima_dosis: string | null
          sitio: string | null
          vacuna_id: string | null
          vacuna_nombre: string
          via: string | null
          workspace_id: string
        }
        Insert: {
          aplicador?: string | null
          created_at?: string
          dosis?: number
          fecha_aplicacion: string
          id?: string
          lote?: string | null
          observaciones?: string | null
          paciente_id: string
          proxima_dosis?: string | null
          sitio?: string | null
          vacuna_id?: string | null
          vacuna_nombre: string
          via?: string | null
          workspace_id: string
        }
        Update: {
          aplicador?: string | null
          created_at?: string
          dosis?: number
          fecha_aplicacion?: string
          id?: string
          lote?: string | null
          observaciones?: string | null
          paciente_id?: string
          proxima_dosis?: string | null
          sitio?: string | null
          vacuna_id?: string | null
          vacuna_nombre?: string
          via?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacunas_paciente_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacunas_paciente_vacuna_id_fkey"
            columns: ["vacuna_id"]
            isOneToOne: false
            referencedRelation: "vacunas_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacunas_paciente_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      valoracion_inicial_enfermeria: {
        Row: {
          admision_id: string
          alergias: string | null
          antecedentes: string | null
          created_at: string | null
          enfermera_id: string | null
          estado_emocional: string | null
          estado_nutricional: string | null
          fecha: string
          id: string
          medicacion_habitual: string | null
          motivo_ingreso: string | null
          observaciones: string | null
          paciente_id: string
          patrones_funcionales: Json | null
          red_apoyo: string | null
          riesgo_caidas: number | null
          riesgo_upp: number | null
        }
        Insert: {
          admision_id: string
          alergias?: string | null
          antecedentes?: string | null
          created_at?: string | null
          enfermera_id?: string | null
          estado_emocional?: string | null
          estado_nutricional?: string | null
          fecha?: string
          id?: string
          medicacion_habitual?: string | null
          motivo_ingreso?: string | null
          observaciones?: string | null
          paciente_id: string
          patrones_funcionales?: Json | null
          red_apoyo?: string | null
          riesgo_caidas?: number | null
          riesgo_upp?: number | null
        }
        Update: {
          admision_id?: string
          alergias?: string | null
          antecedentes?: string | null
          created_at?: string | null
          enfermera_id?: string | null
          estado_emocional?: string | null
          estado_nutricional?: string | null
          fecha?: string
          id?: string
          medicacion_habitual?: string | null
          motivo_ingreso?: string | null
          observaciones?: string | null
          paciente_id?: string
          patrones_funcionales?: Json | null
          red_apoyo?: string | null
          riesgo_caidas?: number | null
          riesgo_upp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "valoracion_inicial_enfermeria_admision_id_fkey"
            columns: ["admision_id"]
            isOneToOne: false
            referencedRelation: "admisiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valoracion_inicial_enfermeria_enfermera_id_fkey"
            columns: ["enfermera_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valoracion_inicial_enfermeria_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
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
      webhooks_config: {
        Row: {
          activo: boolean | null
          created_at: string
          eventos: string[]
          fallos_consecutivos: number | null
          id: string
          nombre: string
          secret: string | null
          ultimo_envio: string | null
          updated_at: string
          url: string
          workspace_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string
          eventos?: string[]
          fallos_consecutivos?: number | null
          id?: string
          nombre: string
          secret?: string | null
          ultimo_envio?: string | null
          updated_at?: string
          url: string
          workspace_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string
          eventos?: string[]
          fallos_consecutivos?: number | null
          id?: string
          nombre?: string
          secret?: string | null
          ultimo_envio?: string | null
          updated_at?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_config_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_log: {
        Row: {
          created_at: string
          duracion_ms: number | null
          evento: string
          exitoso: boolean | null
          id: string
          payload: Json | null
          response_body: string | null
          status_code: number | null
          webhook_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          duracion_ms?: number | null
          evento: string
          exitoso?: boolean | null
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          webhook_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          duracion_ms?: number | null
          evento?: string
          exitoso?: boolean | null
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          webhook_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_log_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_log_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_cadenas: {
        Row: {
          created_at: string | null
          estado: string | null
          id: string
          metadata: Json | null
          nombre: string
          paso_actual: number | null
          pasos: Json | null
          regla_id: string | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          id?: string
          metadata?: Json | null
          nombre: string
          paso_actual?: number | null
          pasos?: Json | null
          regla_id?: string | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          id?: string
          metadata?: Json | null
          nombre?: string
          paso_actual?: number | null
          pasos?: Json | null
          regla_id?: string | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_cadenas_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "workflow_reglas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_cadenas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_ejecuciones: {
        Row: {
          completado_at: string | null
          created_at: string | null
          error_mensaje: string | null
          estado: string | null
          evento_data: Json | null
          id: string
          iniciado_at: string | null
          regla_id: string
          resultado: Json | null
          workspace_id: string
        }
        Insert: {
          completado_at?: string | null
          created_at?: string | null
          error_mensaje?: string | null
          estado?: string | null
          evento_data?: Json | null
          id?: string
          iniciado_at?: string | null
          regla_id: string
          resultado?: Json | null
          workspace_id: string
        }
        Update: {
          completado_at?: string | null
          created_at?: string | null
          error_mensaje?: string | null
          estado?: string | null
          evento_data?: Json | null
          id?: string
          iniciado_at?: string | null
          regla_id?: string
          resultado?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_ejecuciones_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "workflow_reglas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_ejecuciones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_ejecuciones_globales: {
        Row: {
          completado_at: string | null
          contexto: Json
          created_at: string
          error_mensaje: string | null
          estado: string
          evento: Database["public"]["Enums"]["wf_evento"]
          id: string
          regla_id: string | null
          resultado: Json | null
          workspace_id: string
        }
        Insert: {
          completado_at?: string | null
          contexto?: Json
          created_at?: string
          error_mensaje?: string | null
          estado?: string
          evento: Database["public"]["Enums"]["wf_evento"]
          id?: string
          regla_id?: string | null
          resultado?: Json | null
          workspace_id: string
        }
        Update: {
          completado_at?: string | null
          contexto?: Json
          created_at?: string
          error_mensaje?: string | null
          estado?: string
          evento?: Database["public"]["Enums"]["wf_evento"]
          id?: string
          regla_id?: string | null
          resultado?: Json | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_ejecuciones_globales_regla_id_fkey"
            columns: ["regla_id"]
            isOneToOne: false
            referencedRelation: "workflow_reglas_globales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_ejecuciones_globales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_plantillas: {
        Row: {
          acciones: Json
          activo: boolean
          categoria: string | null
          codigo: string
          created_at: string
          created_by: string | null
          descripcion: string | null
          es_global: boolean
          evento_disparador: string
          id: string
          nombre: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          acciones?: Json
          activo?: boolean
          categoria?: string | null
          codigo: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          es_global?: boolean
          evento_disparador: string
          id?: string
          nombre: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          acciones?: Json
          activo?: boolean
          categoria?: string | null
          codigo?: string
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          es_global?: boolean
          evento_disparador?: string
          id?: string
          nombre?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_plantillas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_reglas: {
        Row: {
          acciones: Json | null
          activo: boolean | null
          condiciones: Json | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          evento_trigger: string
          id: string
          nombre: string
          prioridad: number | null
          updated_at: string | null
          vertical_tipo: string | null
          workspace_id: string
        }
        Insert: {
          acciones?: Json | null
          activo?: boolean | null
          condiciones?: Json | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          evento_trigger: string
          id?: string
          nombre: string
          prioridad?: number | null
          updated_at?: string | null
          vertical_tipo?: string | null
          workspace_id: string
        }
        Update: {
          acciones?: Json | null
          activo?: boolean | null
          condiciones?: Json | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          evento_trigger?: string
          id?: string
          nombre?: string
          prioridad?: number | null
          updated_at?: string | null
          vertical_tipo?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_reglas_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_reglas_globales: {
        Row: {
          acciones: Json
          activa: boolean
          condiciones: Json
          created_at: string
          created_by: string | null
          descripcion: string | null
          ejecuciones_exito: number
          ejecuciones_total: number
          evento: Database["public"]["Enums"]["wf_evento"]
          id: string
          nombre: string
          prioridad: number
          retraso_minutos: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          acciones?: Json
          activa?: boolean
          condiciones?: Json
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          ejecuciones_exito?: number
          ejecuciones_total?: number
          evento: Database["public"]["Enums"]["wf_evento"]
          id?: string
          nombre: string
          prioridad?: number
          retraso_minutos?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          acciones?: Json
          activa?: boolean
          condiciones?: Json
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          ejecuciones_exito?: number
          ejecuciones_total?: number
          evento?: Database["public"]["Enums"]["wf_evento"]
          id?: string
          nombre?: string
          prioridad?: number
          retraso_minutos?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_reglas_globales_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows_clinicos: {
        Row: {
          acciones: Json
          activo: boolean
          condiciones: Json | null
          created_at: string
          descripcion: string | null
          evento_disparador: string
          id: string
          nombre: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          acciones?: Json
          activo?: boolean
          condiciones?: Json | null
          created_at?: string
          descripcion?: string | null
          evento_disparador: string
          id?: string
          nombre: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          acciones?: Json
          activo?: boolean
          condiciones?: Json | null
          created_at?: string
          descripcion?: string | null
          evento_disparador?: string
          id?: string
          nombre?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_clinicos_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows_ejecuciones: {
        Row: {
          created_at: string
          error_mensaje: string | null
          evento: string
          id: string
          payload: Json | null
          resultado: string
          workflow_id: string | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          error_mensaje?: string | null
          evento: string
          id?: string
          payload?: Json | null
          resultado?: string
          workflow_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          error_mensaje?: string | null
          evento?: string
          id?: string
          payload?: Json | null
          resultado?: string
          workflow_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_ejecuciones_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows_clinicos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_ejecuciones_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
      workspace_verticales: {
        Row: {
          activa: boolean
          configuracion: Json
          created_at: string
          es_principal: boolean
          id: string
          updated_at: string
          vertical: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id: string
        }
        Insert: {
          activa?: boolean
          configuracion?: Json
          created_at?: string
          es_principal?: boolean
          id?: string
          updated_at?: string
          vertical: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id: string
        }
        Update: {
          activa?: boolean
          configuracion?: Json
          created_at?: string
          es_principal?: boolean
          id?: string
          updated_at?: string
          vertical?: Database["public"]["Enums"]["vertical_tipo"]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_verticales_workspace_id_fkey"
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
      calcular_ar_aging: {
        Args: { _workspace_id: string }
        Returns: {
          cantidad: number
          monto: number
          rango: string
        }[]
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
      centro_comando_metricas: {
        Args: { _workspace_id: string }
        Returns: Json
      }
      detectar_accesos_sospechosos: {
        Args: { _workspace_id?: string }
        Returns: number
      }
      es_miembro_canal: {
        Args: { _canal_id: string; _user_id: string }
        Returns: boolean
      }
      estadisticas_salud_sistema: { Args: never; Returns: Json }
      exportar_historia_clinica_psico: {
        Args: {
          _destinatario?: string
          _formato?: string
          _motivo: string
          _paciente_id: string
        }
        Returns: Json
      }
      firmar_prescripcion_psiquiatrica: {
        Args: {
          _firma_base64: string
          _hash_contenido: string
          _ip?: string
          _prescripcion_id: string
          _user_agent?: string
        }
        Returns: string
      }
      generar_codigo_ticket: { Args: never; Returns: string }
      generar_resumen_auditoria: {
        Args: { _periodo?: string; _workspace_id?: string }
        Returns: string
      }
      generar_token_portal_paciente: {
        Args: { _dias_validez?: number; _paciente_id: string }
        Returns: string
      }
      get_invitation_details: { Args: { _token: string }; Returns: Json }
      get_modulos_efectivos: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: {
          modulo_key: string
        }[]
      }
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
      leer_cuestionario_por_token: { Args: { _token: string }; Returns: Json }
      leer_nota_psicologia: {
        Args: { _nota_id: string }
        Returns: {
          bloqueada_supervisor: boolean | null
          contenido: string | null
          contenido_compartible: string | null
          created_at: string
          created_by: string | null
          es_privada: boolean | null
          id: string
          paciente_id: string
          sesion_id: string | null
          supervisor_id: string | null
          terapeuta_id: string | null
          tipo_nota: string
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notas_psicologia"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leer_nota_ultra_privada: {
        Args: { _nota_id: string }
        Returns: {
          contenido: string
          created_at: string
          id: string
          paciente_id: string | null
          sesion_id: string | null
          terapeuta_id: string
          titulo: string | null
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "notas_ultra_privadas"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      leer_portal_paciente_por_token: {
        Args: { _token: string }
        Returns: Json
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
      listar_recordatorios_psico_pendientes: {
        Args: { _ventana_min?: number }
        Returns: {
          canal: string
          id: string
          paciente_email: string
          paciente_id: string
          paciente_nombre: string
          paciente_telefono: string
          programado_para: string
          sesion_fecha_hora: string
          sesion_id: string
          workspace_id: string
        }[]
      }
      marcar_recordatorio_psico: {
        Args: { _error?: string; _estado: string; _id: string }
        Returns: undefined
      }
      paciente_timeline_360: {
        Args: { _limite?: number; _paciente_id: string }
        Returns: {
          estado: string
          fecha: string
          metadata: Json
          modulo: string
          ref_id: string
          tipo: string
          titulo: string
        }[]
      }
      portal_paciente_datos: { Args: { _token: string }; Returns: Json }
      portal_paciente_solicitar_accion: {
        Args: {
          _cita_id?: string
          _fecha_propuesta?: string
          _mensaje?: string
          _tipo: string
          _token: string
        }
        Returns: Json
      }
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
      reporte_asistencia_psicologia: {
        Args: { _desde?: string; _hasta?: string; _workspace_id: string }
        Returns: {
          asistidas: number
          canceladas: number
          no_show: number
          paciente_id: string
          paciente_nombre: string
          pct_asistencia: number
          total: number
        }[]
      }
      reporte_cancelaciones_psico: {
        Args: { _desde?: string; _hasta?: string; _workspace_id: string }
        Returns: {
          cantidad: number
          estado: string
        }[]
      }
      reporte_evolucion_escalas: {
        Args: { _paciente_id: string }
        Returns: {
          escala: string
          fecha: string
          puntaje: number
          severidad: string
        }[]
      }
      reporte_pacientes_inactivos_psico: {
        Args: { _meses?: number; _workspace_id: string }
        Returns: {
          dias_sin_sesion: number
          paciente_id: string
          paciente_nombre: string
          ultima_sesion: string
        }[]
      }
      reporte_retencion_terapeutica: {
        Args: { _desde?: string; _workspace_id: string }
        Returns: {
          activos_180d: number
          activos_30d: number
          activos_90d: number
          cohorte_mes: string
          total_nuevos: number
        }[]
      }
      responder_cuestionario_publico: {
        Args: {
          _alerta?: boolean
          _puntaje?: number
          _respuestas: Json
          _token: string
        }
        Returns: string
      }
      set_motivo_cambio: { Args: { _motivo: string }; Returns: undefined }
      workflow_ejecutar_plantilla: {
        Args: { _contexto?: Json; _paciente_id: string; _plantilla_id: string }
        Returns: Json
      }
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
      vertical_tipo:
        | "clinica"
        | "dental"
        | "aesthetic"
        | "recovery"
        | "vision"
        | "psicologia"
      wf_evento:
        | "cita_no_confirmada"
        | "cita_proxima_24h"
        | "cirugia_manana"
        | "balance_pendiente"
        | "lab_listo"
        | "paciente_sin_volver"
        | "no_show_detectado"
        | "medicamento_entregado"
        | "alta_firmada"
        | "triaje_critico"
        | "documento_subido"
        | "factura_vencida"
        | "manual"
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
      vertical_tipo: [
        "clinica",
        "dental",
        "aesthetic",
        "recovery",
        "vision",
        "psicologia",
      ],
      wf_evento: [
        "cita_no_confirmada",
        "cita_proxima_24h",
        "cirugia_manana",
        "balance_pendiente",
        "lab_listo",
        "paciente_sin_volver",
        "no_show_detectado",
        "medicamento_entregado",
        "alta_firmada",
        "triaje_critico",
        "documento_subido",
        "factura_vencida",
        "manual",
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
