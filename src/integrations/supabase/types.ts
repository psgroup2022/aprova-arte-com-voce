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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      comentarios_pontuais: {
        Row: {
          arquivo_id: string
          comentario: string
          created_at: string
          criado_por: string | null
          data_resposta: string | null
          id: string
          pauta_id: string
          resolvido: boolean
          respondido_por: string | null
          resposta: string | null
          updated_at: string
          x_coordenada: number
          y_coordenada: number
        }
        Insert: {
          arquivo_id: string
          comentario: string
          created_at?: string
          criado_por?: string | null
          data_resposta?: string | null
          id?: string
          pauta_id: string
          resolvido?: boolean
          respondido_por?: string | null
          resposta?: string | null
          updated_at?: string
          x_coordenada: number
          y_coordenada: number
        }
        Update: {
          arquivo_id?: string
          comentario?: string
          created_at?: string
          criado_por?: string | null
          data_resposta?: string | null
          id?: string
          pauta_id?: string
          resolvido?: boolean
          respondido_por?: string | null
          resposta?: string | null
          updated_at?: string
          x_coordenada?: number
          y_coordenada?: number
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_pontuais_arquivo_id_fkey"
            columns: ["arquivo_id"]
            isOneToOne: false
            referencedRelation: "pauta_arquivos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_pontuais_pauta_id_fkey"
            columns: ["pauta_id"]
            isOneToOne: false
            referencedRelation: "pautas"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_aprovacoes: {
        Row: {
          comentario: string | null
          created_at: string
          id: string
          pauta_id: string
          status_anterior: Database["public"]["Enums"]["pauta_status"] | null
          status_novo: Database["public"]["Enums"]["pauta_status"]
          usuario_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          id?: string
          pauta_id: string
          status_anterior?: Database["public"]["Enums"]["pauta_status"] | null
          status_novo: Database["public"]["Enums"]["pauta_status"]
          usuario_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string
          id?: string
          pauta_id?: string
          status_anterior?: Database["public"]["Enums"]["pauta_status"] | null
          status_novo?: Database["public"]["Enums"]["pauta_status"]
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_aprovacoes_pauta_id_fkey"
            columns: ["pauta_id"]
            isOneToOne: false
            referencedRelation: "pautas"
            referencedColumns: ["id"]
          },
        ]
      }
      pauta_arquivos: {
        Row: {
          created_at: string
          id: string
          nome_arquivo: string
          ordem: number | null
          pauta_id: string
          tamanho: number | null
          tipo: Database["public"]["Enums"]["arquivo_tipo"]
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_arquivo: string
          ordem?: number | null
          pauta_id: string
          tamanho?: number | null
          tipo: Database["public"]["Enums"]["arquivo_tipo"]
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_arquivo?: string
          ordem?: number | null
          pauta_id?: string
          tamanho?: number | null
          tipo?: Database["public"]["Enums"]["arquivo_tipo"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pauta_arquivos_pauta_id_fkey"
            columns: ["pauta_id"]
            isOneToOne: false
            referencedRelation: "pautas"
            referencedColumns: ["id"]
          },
        ]
      }
      pautas: {
        Row: {
          aprovado_por: string | null
          cliente: string
          created_at: string
          criado_por: string | null
          data_aprovacao: string | null
          data_prazo: string | null
          descricao: string | null
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["pauta_status"]
          titulo: string
          updated_at: string
        }
        Insert: {
          aprovado_por?: string | null
          cliente: string
          created_at?: string
          criado_por?: string | null
          data_aprovacao?: string | null
          data_prazo?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["pauta_status"]
          titulo: string
          updated_at?: string
        }
        Update: {
          aprovado_por?: string | null
          cliente?: string
          created_at?: string
          criado_por?: string | null
          data_aprovacao?: string | null
          data_prazo?: string | null
          descricao?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["pauta_status"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      arquivo_tipo: "imagem" | "video" | "documento"
      pauta_status:
        | "rascunho"
        | "aguardando_aprovacao"
        | "aprovada"
        | "rejeitada"
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
      arquivo_tipo: ["imagem", "video", "documento"],
      pauta_status: [
        "rascunho",
        "aguardando_aprovacao",
        "aprovada",
        "rejeitada",
      ],
    },
  },
} as const
