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
      biometric_access_log: {
        Row: {
          access_type: string
          accessed_by: string
          accessed_profile_id: string | null
          audit_record_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          justification: string | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_by: string
          accessed_profile_id?: string | null
          audit_record_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          justification?: string | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string
          accessed_profile_id?: string | null
          audit_record_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          justification?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "biometric_access_log_accessed_profile_id_fkey"
            columns: ["accessed_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biometric_access_log_audit_record_id_fkey"
            columns: ["audit_record_id"]
            isOneToOne: false
            referencedRelation: "facial_recognition_audit"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          email: string
          envio_resumo: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email: string
          envio_resumo?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string
          envio_resumo?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      facial_recognition_audit: {
        Row: {
          attempt_image_url: string
          confidence_score: number | null
          created_at: string
          id: string
          ip_address: unknown | null
          liveness_passed: boolean | null
          location_data: Json | null
          profile_id: string | null
          recognition_result: Json
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          time_entry_id: string | null
          user_agent: string | null
        }
        Insert: {
          attempt_image_url: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          liveness_passed?: boolean | null
          location_data?: Json | null
          profile_id?: string | null
          recognition_result: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          time_entry_id?: string | null
          user_agent?: string | null
        }
        Update: {
          attempt_image_url?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          liveness_passed?: boolean | null
          location_data?: Json | null
          profile_id?: string | null
          recognition_result?: Json
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          time_entry_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facial_recognition_audit_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      facial_recognition_config: {
        Row: {
          created_at: string
          id: string
          liveness_required: boolean | null
          max_images_per_user: number | null
          min_confidence_score: number | null
          require_manual_approval: boolean | null
          similarity_threshold: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          liveness_required?: boolean | null
          max_images_per_user?: number | null
          min_confidence_score?: number | null
          require_manual_approval?: boolean | null
          similarity_threshold?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          liveness_required?: boolean | null
          max_images_per_user?: number | null
          min_confidence_score?: number | null
          require_manual_approval?: boolean | null
          similarity_threshold?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      facial_references: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          image_metadata: Json | null
          image_url: string
          is_primary: boolean | null
          profile_id: string
          quality_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          image_metadata?: Json | null
          image_url: string
          is_primary?: boolean | null
          profile_id: string
          quality_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          image_metadata?: Json | null
          image_url?: string
          is_primary?: boolean | null
          profile_id?: string
          quality_score?: number | null
          updated_at?: string
        }
        Relationships: []
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
      logs_sistema: {
        Row: {
          criado_em: string
          dados: Json | null
          id: string
          mensagem: string | null
          payload: Json | null
          referencia_id: string | null
          status: string
          tipo: string
        }
        Insert: {
          criado_em?: string
          dados?: Json | null
          id?: string
          mensagem?: string | null
          payload?: Json | null
          referencia_id?: string | null
          status: string
          tipo: string
        }
        Update: {
          criado_em?: string
          dados?: Json | null
          id?: string
          mensagem?: string | null
          payload?: Json | null
          referencia_id?: string | null
          status?: string
          tipo?: string
        }
        Relationships: []
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
      pontos: {
        Row: {
          colaborador_id: string
          comprovante_pdf: string | null
          criado_em: string
          data_hora: string
          email_enviado: boolean
          id: string
          localizacao: string | null
          tipo: string
        }
        Insert: {
          colaborador_id: string
          comprovante_pdf?: string | null
          criado_em?: string
          data_hora?: string
          email_enviado?: boolean
          id?: string
          localizacao?: string | null
          tipo: string
        }
        Update: {
          colaborador_id?: string
          comprovante_pdf?: string | null
          criado_em?: string
          data_hora?: string
          email_enviado?: boolean
          id?: string
          localizacao?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pontos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          employee_id: string | null
          envio_resumo: string
          face_embedding: string | null
          facial_reference_url: string | null
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
          envio_resumo?: string
          face_embedding?: string | null
          facial_reference_url?: string | null
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
          envio_resumo?: string
          face_embedding?: string | null
          facial_reference_url?: string | null
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
          comprovante_pdf: string | null
          created_at: string | null
          email_enviado: boolean
          employee_id: string
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          punch_time: string
          punch_type: string
          status: string
          updated_at: string | null
          work_location_id: string | null
        }
        Insert: {
          comprovante_pdf?: string | null
          created_at?: string | null
          email_enviado?: boolean
          employee_id: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          punch_time?: string
          punch_type: string
          status?: string
          updated_at?: string | null
          work_location_id?: string | null
        }
        Update: {
          comprovante_pdf?: string | null
          created_at?: string | null
          email_enviado?: boolean
          employee_id?: string
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          punch_time?: string
          punch_type?: string
          status?: string
          updated_at?: string | null
          work_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_work_location_id_fkey"
            columns: ["work_location_id"]
            isOneToOne: false
            referencedRelation: "work_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          latitude: number | null
          longitude: number | null
          name: string
          radius_meters: number | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name: string
          radius_meters?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          latitude?: number | null
          longitude?: number | null
          name?: string
          radius_meters?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          break_end_time: string
          break_start_time: string
          clock_in_time: string
          clock_out_time: string
          created_at: string
          id: string
          is_active: boolean
          profile_id: string
          tolerance_minutes: number
          updated_at: string
        }
        Insert: {
          break_end_time?: string
          break_start_time?: string
          clock_in_time?: string
          clock_out_time?: string
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id: string
          tolerance_minutes?: number
          updated_at?: string
        }
        Update: {
          break_end_time?: string
          break_start_time?: string
          clock_in_time?: string
          clock_out_time?: string
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id?: string
          tolerance_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_daily_summary: {
        Row: {
          break_ins: number | null
          break_outs: number | null
          clock_ins: number | null
          clock_outs: number | null
          date: string | null
          employee_id: string | null
          employee_name: string | null
          first_entry: string | null
          last_entry: string | null
          total_entries: number | null
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
      v_pontos_completo: {
        Row: {
          colaborador_email: string | null
          colaborador_id: string | null
          colaborador_nome: string | null
          comprovante_pdf: string | null
          data_hora: string | null
          email_enviado: boolean | null
          envio_resumo: string | null
          id: string | null
          localizacao: string | null
          tipo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pontos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      v_resumo_diario: {
        Row: {
          colaborador_id: string | null
          colaborador_nome: string | null
          data: string | null
          entradas: number | null
          pausas: number | null
          primeiro_registro: string | null
          retornos: number | null
          saidas: number | null
          total_registros: number | null
          ultimo_registro: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pontos_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
        ]
      }
      v_time_entries_completo: {
        Row: {
          comprovante_pdf: string | null
          email_enviado: boolean | null
          employee_email: string | null
          employee_id: string | null
          employee_name: string | null
          envio_resumo: string | null
          id: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          punch_time: string | null
          punch_type: string | null
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
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_and_log_biometric_access: {
        Args: {
          _access_type?: string
          _audit_record_id?: string
          _profile_id: string
        }
        Returns: boolean
      }
      compare_face_embeddings: {
        Args: { embedding1: string; embedding2: string; threshold?: number }
        Returns: boolean
      }
      create_facial_references_bucket: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_user_by_face_embedding: {
        Args: { face_embedding: string; similarity_threshold?: number }
        Returns: {
          email: string
          full_name: string
          profile_id: string
          similarity_score: number
        }[]
      }
      find_user_by_face_embedding_advanced: {
        Args: { face_embedding: string; similarity_threshold?: number }
        Returns: {
          confidence_level: string
          email: string
          full_name: string
          matched_reference_id: string
          profile_id: string
          similarity_score: number
        }[]
      }
      get_current_user_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      limpar_logs_antigos: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      link_audit_to_time_entry: {
        Args: { _audit_id: string; _time_entry_id: string }
        Returns: Json
      }
      promote_user_to_admin: {
        Args: { user_email: string }
        Returns: Json
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
