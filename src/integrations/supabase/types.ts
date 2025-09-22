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
      activity_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          id: string
          integration_type: string
          is_enabled: boolean | null
          last_sync: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          integration_type: string
          is_enabled?: boolean | null
          last_sync?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          integration_type?: string
          is_enabled?: boolean | null
          last_sync?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      justifications: {
        Row: {
          amount: number | null
          approved_at: string | null
          approved_by: string | null
          attachments: Json | null
          created_at: string
          description: string
          employee_id: string
          end_date: string | null
          id: string
          rejection_reason: string | null
          request_type: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          created_at?: string
          description: string
          employee_id: string
          end_date?: string | null
          id?: string
          rejection_reason?: string | null
          request_type: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          approved_at?: string | null
          approved_by?: string | null
          attachments?: Json | null
          created_at?: string
          description?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          rejection_reason?: string | null
          request_type?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "justifications_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justifications_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operations: {
        Row: {
          active: boolean | null
          created_at: string
          description: string
          display_order: number | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_name: string
          section_name: string
          updated_at: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          page_name: string
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_name?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          employee_id: string | null
          full_name: string
          id: string
          is_active: boolean | null
          position: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          employee_id?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          position?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          created_at: string
          created_by: string
          data: Json
          description: string | null
          id: string
          registration_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data?: Json
          description?: string | null
          id?: string
          registration_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data?: Json
          description?: string | null
          id?: string
          registration_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string
          description: string
          display_order: number | null
          features: Json | null
          icon: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description: string
          display_order?: number | null
          features?: Json | null
          icon?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string
          display_order?: number | null
          features?: Json | null
          icon?: string | null
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      team_members: {
        Row: {
          active: boolean | null
          bio: string | null
          created_at: string
          display_order: number | null
          id: string
          image_url: string | null
          name: string
          position: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          bio?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          name: string
          position: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          bio?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string | null
          name?: string
          position?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          punch_time: string
          punch_type: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          punch_time?: string
          punch_type: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          punch_time?: string
          punch_type?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
