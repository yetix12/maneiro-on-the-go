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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bus_routes: {
        Row: {
          arrival_time: string | null
          color: string | null
          created_at: string | null
          departure_time: string | null
          description: string | null
          frequency_minutes: number | null
          id: string
          is_active: boolean | null
          long_route: string | null
          name: string
          parroquia_id: string | null
          route_identification: string | null
          short_route: string | null
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          color?: string | null
          created_at?: string | null
          departure_time?: string | null
          description?: string | null
          frequency_minutes?: number | null
          id?: string
          is_active?: boolean | null
          long_route?: string | null
          name: string
          parroquia_id?: string | null
          route_identification?: string | null
          short_route?: string | null
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          color?: string | null
          created_at?: string | null
          departure_time?: string | null
          description?: string | null
          frequency_minutes?: number | null
          id?: string
          is_active?: boolean | null
          long_route?: string | null
          name?: string
          parroquia_id?: string | null
          route_identification?: string | null
          short_route?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_routes_parroquia_id_fkey"
            columns: ["parroquia_id"]
            isOneToOne: false
            referencedRelation: "parroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_stop_info: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bus_stops: {
        Row: {
          created_at: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          route_id: string | null
          stop_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          route_id?: string | null
          stop_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          route_id?: string | null
          stop_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "bus_routes"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_payments: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          payment_method: string
          pm_banco: string | null
          pm_cedula: string | null
          pm_telefono: string | null
          tf_banco: string | null
          tf_cedula: string | null
          tf_numero_cuenta: string | null
          tf_tipo_cuenta: string | null
          tf_titular: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          payment_method: string
          pm_banco?: string | null
          pm_cedula?: string | null
          pm_telefono?: string | null
          tf_banco?: string | null
          tf_cedula?: string | null
          tf_numero_cuenta?: string | null
          tf_tipo_cuenta?: string | null
          tf_titular?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          payment_method?: string
          pm_banco?: string | null
          pm_cedula?: string | null
          pm_telefono?: string | null
          tf_banco?: string | null
          tf_cedula?: string | null
          tf_numero_cuenta?: string | null
          tf_tipo_cuenta?: string | null
          tf_titular?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      galeria_maneiro: {
        Row: {
          bus_stop_ids: string[] | null
          categoria: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          id: string
          imagen_url: string | null
          parroquia_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          bus_stop_ids?: string[] | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          parroquia_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          bus_stop_ids?: string[] | null
          categoria?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          parroquia_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "galeria_maneiro_parroquia_id_fkey"
            columns: ["parroquia_id"]
            isOneToOne: false
            referencedRelation: "parroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      paradas: {
        Row: {
          accessibility: boolean | null
          address: string | null
          created_at: string | null
          description: string | null
          facilities: string[] | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          route_id: string | null
          stop_order: number | null
          updated_at: string | null
        }
        Insert: {
          accessibility?: boolean | null
          address?: string | null
          created_at?: string | null
          description?: string | null
          facilities?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          route_id?: string | null
          stop_order?: number | null
          updated_at?: string | null
        }
        Update: {
          accessibility?: boolean | null
          address?: string | null
          created_at?: string | null
          description?: string | null
          facilities?: string[] | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          route_id?: string | null
          stop_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      parroquias: {
        Row: {
          created_at: string | null
          descripcion: string | null
          estado: string | null
          id: string
          is_active: boolean | null
          municipio: string | null
          nombre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          id?: string
          is_active?: boolean | null
          municipio?: string | null
          nombre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          id?: string
          is_active?: boolean | null
          municipio?: string | null
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      points_of_interest: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          parroquia_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          parroquia_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          parroquia_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "points_of_interest_parroquia_id_fkey"
            columns: ["parroquia_id"]
            isOneToOne: false
            referencedRelation: "parroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          calle: string | null
          created_at: string | null
          direccion: string | null
          fecha_nacimiento: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          parroquia_id: string | null
          phone: string | null
          sector: string | null
          updated_at: string | null
          user_type: string | null
          username: string | null
        }
        Insert: {
          calle?: string | null
          created_at?: string | null
          direccion?: string | null
          fecha_nacimiento?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          parroquia_id?: string | null
          phone?: string | null
          sector?: string | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Update: {
          calle?: string | null
          created_at?: string | null
          direccion?: string | null
          fecha_nacimiento?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          parroquia_id?: string | null
          phone?: string | null
          sector?: string | null
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parroquia_id_fkey"
            columns: ["parroquia_id"]
            isOneToOne: false
            referencedRelation: "parroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          parroquia_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          parroquia_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          parroquia_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_parroquia_id_fkey"
            columns: ["parroquia_id"]
            isOneToOne: false
            referencedRelation: "parroquias"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number | null
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          driver_id: string | null
          id: string
          last_updated: string | null
          license_plate: string
          model: string | null
          route_id: string | null
          status: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          driver_id?: string | null
          id?: string
          last_updated?: string | null
          license_plate: string
          model?: string | null
          route_id?: string | null
          status?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          driver_id?: string | null
          id?: string
          last_updated?: string | null
          license_plate?: string
          model?: string | null
          route_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "bus_routes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_parroquia_id: { Args: never; Returns: string }
      get_parroquia_statistics: {
        Args: { _parroquia_id: string }
        Returns: {
          total_conductores: number
          total_paradas: number
          total_pasajeros: number
          total_rutas: number
          total_usuarios: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_general: { Args: never; Returns: boolean }
      is_admin_parroquia: { Args: { _parroquia_id: string }; Returns: boolean }
      is_any_admin_parroquia: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin_general" | "admin_parroquia" | "driver" | "passenger"
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
      app_role: ["admin_general", "admin_parroquia", "driver", "passenger"],
    },
  },
} as const
