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
        }
        Relationships: [
          {
            foreignKeyName: "automatizaciones_plantilla_correo_id_fkey"
            columns: ["plantilla_correo_id"]
            isOneToOne: false
            referencedRelation: "plantillas_correo"
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
        }
        Relationships: [
          {
            foreignKeyName: "encuestas_profesional_id_fkey"
            columns: ["profesional_id"]
            isOneToOne: false
            referencedRelation: "personal_salud"
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
          zona?: string | null
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
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activo: boolean | null
          apellido: string
          approved: boolean | null
          avatar_url: string | null
          cedula: string
          created_at: string | null
          created_by: string | null
          email: string
          especialidad: string | null
          foto_url: string | null
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          approved?: boolean | null
          avatar_url?: string | null
          cedula: string
          created_at?: string | null
          created_by?: string | null
          email: string
          especialidad?: string | null
          foto_url?: string | null
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          approved?: boolean | null
          avatar_url?: string | null
          cedula?: string
          created_at?: string | null
          created_by?: string | null
          email?: string
          especialidad?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
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
    }
    Enums: {
      app_role: "admin" | "coordinador" | "medico" | "enfermera"
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
      app_role: ["admin", "coordinador", "medico", "enfermera"],
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
      ],
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
