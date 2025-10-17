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
      control_visitas: {
        Row: {
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_visita"] | null
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
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_visita"] | null
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
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_visita"] | null
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
          fecha: string
        }
        Insert: {
          descripcion: string
          fecha: string
        }
        Update: {
          descripcion?: string
          fecha?: string
        }
        Relationships: []
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
      pacientes: {
        Row: {
          apellido: string
          cedula: string
          contacto_cuidador: string | null
          contacto_px: string | null
          created_at: string | null
          direccion_domicilio: string | null
          fecha_nacimiento: string | null
          grado_dificultad:
            | Database["public"]["Enums"]["grado_dificultad"]
            | null
          historia_medica_basica: string | null
          id: string
          nombre: string
          nombre_cuidador: string | null
          status_px: Database["public"]["Enums"]["status_paciente"] | null
          updated_at: string | null
        }
        Insert: {
          apellido: string
          cedula: string
          contacto_cuidador?: string | null
          contacto_px?: string | null
          created_at?: string | null
          direccion_domicilio?: string | null
          fecha_nacimiento?: string | null
          grado_dificultad?:
            | Database["public"]["Enums"]["grado_dificultad"]
            | null
          historia_medica_basica?: string | null
          id?: string
          nombre: string
          nombre_cuidador?: string | null
          status_px?: Database["public"]["Enums"]["status_paciente"] | null
          updated_at?: string | null
        }
        Update: {
          apellido?: string
          cedula?: string
          contacto_cuidador?: string | null
          contacto_px?: string | null
          created_at?: string | null
          direccion_domicilio?: string | null
          fecha_nacimiento?: string | null
          grado_dificultad?:
            | Database["public"]["Enums"]["grado_dificultad"]
            | null
          historia_medica_basica?: string | null
          id?: string
          nombre?: string
          nombre_cuidador?: string | null
          status_px?: Database["public"]["Enums"]["status_paciente"] | null
          updated_at?: string | null
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
          cedula: string
          contacto: string | null
          created_at: string | null
          email_contacto: string | null
          especialidad: string | null
          id: string
          nombre: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          cedula: string
          contacto?: string | null
          created_at?: string | null
          email_contacto?: string | null
          especialidad?: string | null
          id?: string
          nombre: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          cedula?: string
          contacto?: string | null
          created_at?: string | null
          email_contacto?: string | null
          especialidad?: string | null
          id?: string
          nombre?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string
          avatar_url: string | null
          cedula: string
          created_at: string | null
          email: string
          especialidad: string | null
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          apellido: string
          avatar_url?: string | null
          cedula: string
          created_at?: string | null
          email: string
          especialidad?: string | null
          id: string
          nombre: string
          rol?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          apellido?: string
          avatar_url?: string | null
          cedula?: string
          created_at?: string | null
          email?: string
          especialidad?: string | null
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
          comentarios_resultados: string | null
          created_at: string | null
          fecha_hora_realizada: string | null
          id: string
          motivo: string | null
          paciente_id: string | null
          profesional_id: string | null
          resultado_seguimiento:
            | Database["public"]["Enums"]["resultado_seguimiento"]
            | null
        }
        Insert: {
          comentarios_resultados?: string | null
          created_at?: string | null
          fecha_hora_realizada?: string | null
          id?: string
          motivo?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
          resultado_seguimiento?:
            | Database["public"]["Enums"]["resultado_seguimiento"]
            | null
        }
        Update: {
          comentarios_resultados?: string | null
          created_at?: string | null
          fecha_hora_realizada?: string | null
          id?: string
          motivo?: string | null
          paciente_id?: string | null
          profesional_id?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "coordinador" | "medico" | "enfermera"
      estado_visita:
        | "pendiente"
        | "realizada"
        | "cancelada"
        | "postpuesta"
        | "no_realizada"
      grado_dificultad: "bajo" | "medio" | "alto"
      resultado_seguimiento: "contactado" | "no_contestada" | "mensaje_dejado"
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
      estado_visita: [
        "pendiente",
        "realizada",
        "cancelada",
        "postpuesta",
        "no_realizada",
      ],
      grado_dificultad: ["bajo", "medio", "alto"],
      resultado_seguimiento: ["contactado", "no_contestada", "mensaje_dejado"],
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
    },
  },
} as const
