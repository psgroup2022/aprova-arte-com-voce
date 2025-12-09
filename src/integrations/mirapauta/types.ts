/**
 * Tipos do banco de dados do MiraPauta
 * Baseado na documentação fornecida
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type MirapautaDatabase = {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string;
          nome: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      pautas: {
        Row: {
          id: string;
          cliente_id: string | null;
          briefing_status: string | null;
          layout_status: string | null;
          revisao_interna_status: string | null;
          revisao_cliente_status: string | null;
          enviado_cliente_status: string | null;
          pauta_aprovada_status: string | null;
          agendamento_posts_status: string | null;
          pauta_status: string | null;
          last_updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id?: string | null;
          briefing_status?: string | null;
          layout_status?: string | null;
          revisao_interna_status?: string | null;
          revisao_cliente_status?: string | null;
          enviado_cliente_status?: string | null;
          pauta_aprovada_status?: string | null;
          agendamento_posts_status?: string | null;
          pauta_status?: string | null;
          last_updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string | null;
          briefing_status?: string | null;
          layout_status?: string | null;
          revisao_interna_status?: string | null;
          revisao_cliente_status?: string | null;
          enviado_cliente_status?: string | null;
          pauta_aprovada_status?: string | null;
          agendamento_posts_status?: string | null;
          pauta_status?: string | null;
          last_updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assignee: string | null;
          cliente_id: string | null;
          prazo_entrega: string | null;
          data_inicio: string | null;
          display_order: number | null;
          peso: number | null;
          status: string | null;
          tempo_gasto: number | null;
          ticket_number: string | null;
          material_type_id: string | null;
          material_quantity: number | null;
          is_out_of_quota: boolean | null;
          next_assignee: string | null;
          linked_from_user: string | null;
          trilha_eeduca_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assignee?: string | null;
          cliente_id?: string | null;
          prazo_entrega?: string | null;
          data_inicio?: string | null;
          display_order?: number | null;
          peso?: number | null;
          status?: string | null;
          tempo_gasto?: number | null;
          ticket_number?: string | null;
          material_type_id?: string | null;
          material_quantity?: number | null;
          is_out_of_quota?: boolean | null;
          next_assignee?: string | null;
          linked_from_user?: string | null;
          trilha_eeduca_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          assignee?: string | null;
          cliente_id?: string | null;
          prazo_entrega?: string | null;
          data_inicio?: string | null;
          display_order?: number | null;
          peso?: number | null;
          status?: string | null;
          tempo_gasto?: number | null;
          ticket_number?: string | null;
          material_type_id?: string | null;
          material_quantity?: number | null;
          is_out_of_quota?: boolean | null;
          next_assignee?: string | null;
          linked_from_user?: string | null;
          trilha_eeduca_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          nome: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          nome?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          nome?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Tipos auxiliares para uso na aplicação
export type MirapautaCliente = MirapautaDatabase['public']['Tables']['clientes']['Row'];
export type MirapautaPauta = MirapautaDatabase['public']['Tables']['pautas']['Row'];
export type MirapautaTask = MirapautaDatabase['public']['Tables']['tasks']['Row'];
export type MirapautaProfile = MirapautaDatabase['public']['Tables']['profiles']['Row'];

// Tipo combinado de pauta com cliente
export type MirapautaPautaWithCliente = MirapautaPauta & {
  clientes: MirapautaCliente | null;
};

// Tipo combinado de task com cliente
export type MirapautaTaskWithCliente = MirapautaTask & {
  clientes: MirapautaCliente | null;
};
