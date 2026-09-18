export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          autor: string | null;
          created_at: string;
          dados: Json | null;
          id: string;
          operacao: string;
          registro_id: string | null;
          tabela: string;
        };
        Insert: {
          autor?: string | null;
          created_at?: string;
          dados?: Json | null;
          id?: string;
          operacao: string;
          registro_id?: string | null;
          tabela: string;
        };
        Update: {
          autor?: string | null;
          created_at?: string;
          dados?: Json | null;
          id?: string;
          operacao?: string;
          registro_id?: string | null;
          tabela?: string;
        };
        Relationships: [];
      };
      bloco_arquivos: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          nome_arquivo: string;
          tamanho: number | null;
          tipo: Database['public']['Enums']['arquivo_tipo'];
          url: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          nome_arquivo: string;
          tamanho?: number | null;
          tipo: Database['public']['Enums']['arquivo_tipo'];
          url: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          nome_arquivo?: string;
          tamanho?: number | null;
          tipo?: Database['public']['Enums']['arquivo_tipo'];
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bloco_arquivos_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'bloco_itens';
            referencedColumns: ['id'];
          },
        ];
      };
      bloco_itens: {
        Row: {
          bloco_id: string;
          created_at: string;
          hashtags: string | null;
          id: string;
          ordem: number;
          texto_conteudo: string | null;
          titulo: string | null;
          updated_at: string;
        };
        Insert: {
          bloco_id: string;
          created_at?: string;
          hashtags?: string | null;
          id?: string;
          ordem?: number;
          texto_conteudo?: string | null;
          titulo?: string | null;
          updated_at?: string;
        };
        Update: {
          bloco_id?: string;
          created_at?: string;
          hashtags?: string | null;
          id?: string;
          ordem?: number;
          texto_conteudo?: string | null;
          titulo?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bloco_itens_bloco_id_fkey';
            columns: ['bloco_id'];
            isOneToOne: false;
            referencedRelation: 'blocos_material';
            referencedColumns: ['id'];
          },
        ];
      };
      blocos_material: {
        Row: {
          created_at: string;
          data_postagem: string | null;
          decisao_em: string | null;
          decisao_nota: string | null;
          decisao_por: string | null;
          decisao_status: Database['public']['Enums']['decisao_cliente'];
          id: string;
          ordem: number;
          origem_peca_id: string | null;
          origem_version: string | null;
          status: Database['public']['Enums']['bloco_status'];
          tipo_material: Database['public']['Enums']['material_tipo'];
          updated_at: string;
          versao_id: string;
        };
        Insert: {
          created_at?: string;
          data_postagem?: string | null;
          decisao_em?: string | null;
          decisao_nota?: string | null;
          decisao_por?: string | null;
          decisao_status?: Database['public']['Enums']['decisao_cliente'];
          id?: string;
          ordem?: number;
          origem_peca_id?: string | null;
          origem_version?: string | null;
          status?: Database['public']['Enums']['bloco_status'];
          tipo_material: Database['public']['Enums']['material_tipo'];
          updated_at?: string;
          versao_id: string;
        };
        Update: {
          created_at?: string;
          data_postagem?: string | null;
          decisao_em?: string | null;
          decisao_nota?: string | null;
          decisao_por?: string | null;
          decisao_status?: Database['public']['Enums']['decisao_cliente'];
          id?: string;
          ordem?: number;
          origem_peca_id?: string | null;
          origem_version?: string | null;
          status?: Database['public']['Enums']['bloco_status'];
          tipo_material?: Database['public']['Enums']['material_tipo'];
          updated_at?: string;
          versao_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blocos_material_versao_id_fkey';
            columns: ['versao_id'];
            isOneToOne: false;
            referencedRelation: 'pauta_versoes';
            referencedColumns: ['id'];
          },
        ];
      };
      clientes: {
        Row: {
          ativo: boolean;
          created_at: string;
          criado_por: string | null;
          email: string | null;
          empresa: string | null;
          id: string;
          nome: string;
          observacoes: string | null;
          telefone: string | null;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          created_at?: string;
          criado_por?: string | null;
          email?: string | null;
          empresa?: string | null;
          id?: string;
          nome: string;
          observacoes?: string | null;
          telefone?: string | null;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          created_at?: string;
          criado_por?: string | null;
          email?: string | null;
          empresa?: string | null;
          id?: string;
          nome?: string;
          observacoes?: string | null;
          telefone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      comentarios_pontuais: {
        Row: {
          arquivo_id: string | null;
          autor_nome: string | null;
          bloco_id: string | null;
          comentario: string;
          created_at: string;
          criado_por: string | null;
          data_resposta: string | null;
          id: string;
          pauta_id: string;
          resolvido: boolean;
          respondido_por: string | null;
          resposta: string | null;
          updated_at: string;
          x_coordenada: number;
          y_coordenada: number;
        };
        Insert: {
          arquivo_id?: string | null;
          autor_nome?: string | null;
          bloco_id?: string | null;
          comentario: string;
          created_at?: string;
          criado_por?: string | null;
          data_resposta?: string | null;
          id?: string;
          pauta_id: string;
          resolvido?: boolean;
          respondido_por?: string | null;
          resposta?: string | null;
          updated_at?: string;
          x_coordenada?: number;
          y_coordenada?: number;
        };
        Update: {
          arquivo_id?: string | null;
          autor_nome?: string | null;
          bloco_id?: string | null;
          comentario?: string;
          created_at?: string;
          criado_por?: string | null;
          data_resposta?: string | null;
          id?: string;
          pauta_id?: string;
          resolvido?: boolean;
          respondido_por?: string | null;
          resposta?: string | null;
          updated_at?: string;
          x_coordenada?: number;
          y_coordenada?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'comentarios_pontuais_arquivo_id_fkey';
            columns: ['arquivo_id'];
            isOneToOne: false;
            referencedRelation: 'bloco_arquivos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comentarios_pontuais_bloco_id_fkey';
            columns: ['bloco_id'];
            isOneToOne: false;
            referencedRelation: 'blocos_material';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'comentarios_pontuais_pauta_id_fkey';
            columns: ['pauta_id'];
            isOneToOne: false;
            referencedRelation: 'pautas';
            referencedColumns: ['id'];
          },
        ];
      };
      historico_aprovacoes: {
        Row: {
          comentario: string | null;
          created_at: string;
          id: string;
          pauta_id: string;
          status_anterior: Database['public']['Enums']['pauta_status'] | null;
          status_novo: Database['public']['Enums']['pauta_status'];
          usuario_id: string | null;
        };
        Insert: {
          comentario?: string | null;
          created_at?: string;
          id?: string;
          pauta_id: string;
          status_anterior?: Database['public']['Enums']['pauta_status'] | null;
          status_novo: Database['public']['Enums']['pauta_status'];
          usuario_id?: string | null;
        };
        Update: {
          comentario?: string | null;
          created_at?: string;
          id?: string;
          pauta_id?: string;
          status_anterior?: Database['public']['Enums']['pauta_status'] | null;
          status_novo?: Database['public']['Enums']['pauta_status'];
          usuario_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'historico_aprovacoes_pauta_id_fkey';
            columns: ['pauta_id'];
            isOneToOne: false;
            referencedRelation: 'pautas';
            referencedColumns: ['id'];
          },
        ];
      };
      pauta_versoes: {
        Row: {
          ativa: boolean;
          briefing_url: string | null;
          created_at: string;
          id: string;
          numero_versao: number;
          origem_revision: number | null;
          pauta_id: string;
          updated_at: string;
        };
        Insert: {
          ativa?: boolean;
          briefing_url?: string | null;
          created_at?: string;
          id?: string;
          numero_versao?: number;
          origem_revision?: number | null;
          pauta_id: string;
          updated_at?: string;
        };
        Update: {
          ativa?: boolean;
          briefing_url?: string | null;
          created_at?: string;
          id?: string;
          numero_versao?: number;
          origem_revision?: number | null;
          pauta_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pauta_versoes_pauta_id_fkey';
            columns: ['pauta_id'];
            isOneToOne: false;
            referencedRelation: 'pautas';
            referencedColumns: ['id'];
          },
        ];
      };
      pautas: {
        Row: {
          aprovado_por: string | null;
          cliente: string;
          cliente_id: string | null;
          created_at: string;
          criado_por: string | null;
          data_aprovacao: string | null;
          data_prazo: string | null;
          descricao: string | null;
          id: string;
          observacoes: string | null;
          origem_run_id: string | null;
          publicado_em: string | null;
          revisao_enviada_em: string | null;
          revisao_enviada_por: string | null;
          status: Database['public']['Enums']['pauta_status'];
          titulo: string;
          token_publico: string | null;
          updated_at: string;
        };
        Insert: {
          aprovado_por?: string | null;
          cliente: string;
          cliente_id?: string | null;
          created_at?: string;
          criado_por?: string | null;
          data_aprovacao?: string | null;
          data_prazo?: string | null;
          descricao?: string | null;
          id?: string;
          observacoes?: string | null;
          origem_run_id?: string | null;
          publicado_em?: string | null;
          revisao_enviada_em?: string | null;
          revisao_enviada_por?: string | null;
          status?: Database['public']['Enums']['pauta_status'];
          titulo: string;
          token_publico?: string | null;
          updated_at?: string;
        };
        Update: {
          aprovado_por?: string | null;
          cliente?: string;
          cliente_id?: string | null;
          created_at?: string;
          criado_por?: string | null;
          data_aprovacao?: string | null;
          data_prazo?: string | null;
          descricao?: string | null;
          id?: string;
          observacoes?: string | null;
          origem_run_id?: string | null;
          publicado_em?: string | null;
          revisao_enviada_em?: string | null;
          revisao_enviada_por?: string | null;
          status?: Database['public']['Enums']['pauta_status'];
          titulo?: string;
          token_publico?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pautas_cliente_id_fkey';
            columns: ['cliente_id'];
            isOneToOne: false;
            referencedRelation: 'clientes';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          ativo: boolean;
          auth_user_id: string | null;
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          id: string;
          nome: string;
          papel: Database['public']['Enums']['papel_usuario'];
          senha_provisoria: boolean;
          updated_at: string;
        };
        Insert: {
          ativo?: boolean;
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          nome: string;
          papel?: Database['public']['Enums']['papel_usuario'];
          senha_provisoria?: boolean;
          updated_at?: string;
        };
        Update: {
          ativo?: boolean;
          auth_user_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          nome?: string;
          papel?: Database['public']['Enums']['papel_usuario'];
          senha_provisoria?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      comentar_bloco: {
        Args: {
          p_arquivo_id: string;
          p_bloco_id: string;
          p_por: string;
          p_texto: string;
          p_token: string;
          p_x: number;
          p_y: number;
        };
        Returns: Json;
      };
      decidir_bloco: {
        Args: {
          p_bloco_id: string;
          p_nota: string;
          p_por: string;
          p_status: string;
          p_token: string;
        };
        Returns: Json;
      };
      enviar_revisao: {
        Args: { p_por: string; p_token: string };
        Returns: Json;
      };
      is_admin: { Args: never; Returns: boolean };
      is_membro: { Args: never; Returns: boolean };
      pauta_publica: { Args: { p_token: string }; Returns: Json };
    };
    Enums: {
      arquivo_tipo: 'imagem' | 'video' | 'documento';
      bloco_status: 'aguardando_midia' | 'pronto' | 'enviado_aprovacao' | 'em_revisao' | 'aprovado';
      decisao_cliente: 'pendente' | 'aprovada' | 'reprovada';
      material_tipo:
        | 'carrossel'
        | 'story'
        | 'reels'
        | 'estatico'
        | 'linkedin_artigo'
        | 'email'
        | 'whatsapp';
      papel_usuario: 'admin' | 'membro';
      pauta_status: 'rascunho' | 'aguardando_aprovacao' | 'aprovada' | 'rejeitada';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      arquivo_tipo: ['imagem', 'video', 'documento'],
      bloco_status: ['aguardando_midia', 'pronto', 'enviado_aprovacao', 'em_revisao', 'aprovado'],
      decisao_cliente: ['pendente', 'aprovada', 'reprovada'],
      material_tipo: [
        'carrossel',
        'story',
        'reels',
        'estatico',
        'linkedin_artigo',
        'email',
        'whatsapp',
      ],
      papel_usuario: ['admin', 'membro'],
      pauta_status: ['rascunho', 'aguardando_aprovacao', 'aprovada', 'rejeitada'],
    },
  },
} as const;
