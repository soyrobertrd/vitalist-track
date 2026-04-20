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
          motivo_visita: string | null
          notas_visita: string | null
          paciente_id: string | null
          profesional_id: string | null
          tipo_visita: Database["public"]["Enums"]["tipo_visita"]
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          confirmado_por_recordatorio?: boolean | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_visita"] | null
          fecha_confirmacion?: string | null
          fecha_hora_visita: string
          id?: string
          motivo_visita?: string | null
          notas_visita?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          tipo_visita: Database["public"]["Enums"]["tipo_visita"]
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          confirmado_por_recordatorio?: boolean | null
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_visita"] | null
          fecha_confirmacion?: string | null
          fecha_hora_visita?: string
          id?: string
          motivo_visita?: string | null
          notas_visita?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          tipo_visita?: Database["public"]["Enums"]["tipo_visita"]
          updated_at?: string | null
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
      pacientes: {
        Row: {
          apellido: string
          barrio: string | null
          cedula: string
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
          nombre: string
          nombre_cuidador: string | null
          notificaciones_activas: boolean | null
          numero_principal: string | null
          parentesco_cuidador: string | null
          profesional_asignado_id: string | null
          sexo: string | null
          status_px: Database["public"]["Enums"]["status_paciente"] | null
          tipo_atencion: string | null
          updated_at: string | null
          whatsapp_cuidador: boolean | null
          whatsapp_px: boolean | null
          workspace_id: string | null
          zona: Database["public"]["Enums"]["zona_distrito"] | null
        }
        Insert: {
          apellido: string
          barrio?: string | null
          cedula: string
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
          nombre: string
          nombre_cuidador?: string | null
          notificaciones_activas?: boolean | null
          numero_principal?: string | null
          parentesco_cuidador?: string | null
          profesional_asignado_id?: string | null
          sexo?: string | null
          status_px?: Database["public"]["Enums"]["status_paciente"] | null
          tipo_atencion?: string | null
          updated_at?: string | null
          whatsapp_cuidador?: boolean | null
          whatsapp_px?: boolean | null
          workspace_id?: string | null
          zona?: Database["public"]["Enums"]["zona_distrito"] | null
        }
        Update: {
          apellido?: string
          barrio?: string | null
          cedula?: string
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
          nombre?: string
          nombre_cuidador?: string | null
          notificaciones_activas?: boolean | null
          numero_principal?: string | null
          parentesco_cuidador?: string | null
          profesional_asignado_id?: string | null
          sexo?: string | null
          status_px?: Database["public"]["Enums"]["status_paciente"] | null
          tipo_atencion?: string | null
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
          updated_at?: string | null
          user_id?: string | null
          workspace_id?: string | null
          zona?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "personal_salud_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
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
            foreignKeyName: "registro_llamadas_workspace_id_fkey"
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
      generar_codigo_ticket: { Args: never; Returns: string }
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
    }
    Enums: {
      app_role: "admin" | "coordinador" | "medico" | "enfermera" | "recepcion"
      estado_llamada:
        | "agendada"
        | "realizada"
        | "pospuesta"
        | "cancelada"
        | "pendiente"
        | "reagendada"
        | "no_contesta"
      estado_visita:
        | "pendiente"
        | "realizada"
        | "cancelada"
        | "postpuesta"
        | "no_realizada"
      grado_dificultad: "bajo" | "medio" | "alto"
      resultado_seguimiento:
        | "contactado"
        | "no_contestada"
        | "mensaje_dejado"
        | "llamada_fallida"
        | "requiere_seguimiento"
        | "visita_agendada"
        | "paciente_decline"
        | "no_disponible"
      status_paciente:
        | "activo"
        | "inactivo"
        | "fallecido"
        | "renuncio"
        | "cambio_ars"
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
      estado_llamada: [
        "agendada",
        "realizada",
        "pospuesta",
        "cancelada",
        "pendiente",
        "reagendada",
        "no_contesta",
      ],
      estado_visita: [
        "pendiente",
        "realizada",
        "cancelada",
        "postpuesta",
        "no_realizada",
      ],
      grado_dificultad: ["bajo", "medio", "alto"],
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
      status_paciente: [
        "activo",
        "inactivo",
        "fallecido",
        "renuncio",
        "cambio_ars",
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
