// Gerado manualmente — substituir por `supabase gen types typescript` após migrations aplicadas
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PostStatus = 'sugestao' | 'rascunho' | 'publicado'

export type ReservaStatus =
  | 'aguardando_sinal'
  | 'confirmada'
  | 'cancelada'
  | 'no_show'
  | 'concluida'
export type NivelExperiencia = 'iniciante' | 'ja_tive_contato'
export type PresencaStatus = 'pendente' | 'presente' | 'no_show'
export type LeadTipo = 'aula' | 'aniversario' | 'corporativo'
export type LeadStatus = 'novo' | 'em_contato' | 'convertido' | 'perdido'

export type Database = {
  public: {
    Tables: {
      modalidades: {
        Row: {
          id: string
          nome: string
          duracao_min: number
          capacidade_max: number
          preco_cheio_cents: number
          preco_promo_cents: number | null
          sinal_percent: number
          exclusiva: boolean
          ativa: boolean
          descricao: string
          destaque: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          duracao_min: number
          capacidade_max: number
          preco_cheio_cents: number
          preco_promo_cents?: number | null
          sinal_percent?: number
          exclusiva?: boolean
          ativa?: boolean
          descricao?: string
          destaque?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          duracao_min?: number
          capacidade_max?: number
          preco_cheio_cents?: number
          preco_promo_cents?: number | null
          sinal_percent?: number
          exclusiva?: boolean
          ativa?: boolean
          descricao?: string
          destaque?: string | null
          created_at?: string
        }
        Relationships: []
      }
      grade_horarios: {
        Row: {
          id: string
          dia_semana: number | null
          data_excecao: string | null
          hora_inicio: string
          hora_fim: string
          ativo: boolean
        }
        Insert: {
          id?: string
          dia_semana?: number | null
          data_excecao?: string | null
          hora_inicio: string
          hora_fim: string
          ativo?: boolean
        }
        Update: {
          id?: string
          dia_semana?: number | null
          data_excecao?: string | null
          hora_inicio?: string
          hora_fim?: string
          ativo?: boolean
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: string
          nome: string
          telefone: string
          email: string | null
          cpf: string | null
          is_organizador: boolean
          observacoes_internas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          telefone: string
          email?: string | null
          cpf?: string | null
          is_organizador?: boolean
          observacoes_internas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string
          email?: string | null
          cpf?: string | null
          is_organizador?: boolean
          observacoes_internas?: string | null
          created_at?: string
        }
        Relationships: []
      }
      karts: {
        Row: {
          id: number
          apelido: string | null
          ativo: boolean
          observacao: string | null
          updated_at: string
        }
        Insert: {
          id: number
          apelido?: string | null
          ativo?: boolean
          observacao?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          apelido?: string | null
          ativo?: boolean
          observacao?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reservas: {
        Row: {
          id: string
          modalidade_id: string
          cliente_organizador_id: string
          inicio_at: string
          fim_at: string
          status: ReservaStatus
          nivel_experiencia: NivelExperiencia | null
          exclusiva: boolean
          pilotos_count: number
          total_cents: number
          sinal_cents: number
          sinal_pago_at: string | null
          pagamento_id: string | null
          termo_aceito_em: string | null
          ciente_sinal_nao_reembolsavel_em: string | null
          expires_at: string | null
          motivo_cancelamento: string | null
          cancelado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          modalidade_id: string
          cliente_organizador_id: string
          inicio_at: string
          fim_at: string
          status: ReservaStatus
          nivel_experiencia?: NivelExperiencia | null
          exclusiva?: boolean
          pilotos_count: number
          total_cents: number
          sinal_cents: number
          sinal_pago_at?: string | null
          pagamento_id?: string | null
          termo_aceito_em?: string | null
          ciente_sinal_nao_reembolsavel_em?: string | null
          expires_at?: string | null
          motivo_cancelamento?: string | null
          cancelado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          modalidade_id?: string
          cliente_organizador_id?: string
          inicio_at?: string
          fim_at?: string
          status?: ReservaStatus
          nivel_experiencia?: NivelExperiencia | null
          exclusiva?: boolean
          pilotos_count?: number
          total_cents?: number
          sinal_cents?: number
          sinal_pago_at?: string | null
          pagamento_id?: string | null
          termo_aceito_em?: string | null
          ciente_sinal_nao_reembolsavel_em?: string | null
          expires_at?: string | null
          motivo_cancelamento?: string | null
          cancelado_por?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reservas_modalidade_id_fkey'
            columns: ['modalidade_id']
            referencedRelation: 'modalidades'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'reservas_cliente_organizador_id_fkey'
            columns: ['cliente_organizador_id']
            referencedRelation: 'clientes'
            referencedColumns: ['id']
          },
        ]
      }
      reserva_pilotos: {
        Row: {
          id: string
          reserva_id: string
          cliente_id: string
          presenca: PresencaStatus
        }
        Insert: {
          id?: string
          reserva_id: string
          cliente_id: string
          presenca?: PresencaStatus
        }
        Update: {
          id?: string
          reserva_id?: string
          cliente_id?: string
          presenca?: PresencaStatus
        }
        Relationships: [
          {
            foreignKeyName: 'reserva_pilotos_reserva_id_fkey'
            columns: ['reserva_id']
            referencedRelation: 'reservas'
            referencedColumns: ['id']
          },
        ]
      }
      kart_alocacoes: {
        Row: {
          id: string
          reserva_id: string
          kart_id: number
          janela: string
          status_reserva: ReservaStatus
        }
        Insert: {
          id?: string
          reserva_id: string
          kart_id: number
          janela: string
          status_reserva: ReservaStatus
        }
        Update: {
          id?: string
          reserva_id?: string
          kart_id?: number
          janela?: string
          status_reserva?: ReservaStatus
        }
        Relationships: [
          {
            foreignKeyName: 'kart_alocacoes_reserva_id_fkey'
            columns: ['reserva_id']
            referencedRelation: 'reservas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kart_alocacoes_kart_id_fkey'
            columns: ['kart_id']
            referencedRelation: 'karts'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          id: string
          tipo: LeadTipo
          nome: string
          telefone: string | null
          email: string | null
          data_desejada: string | null
          participantes: number | null
          mensagem: string | null
          status: LeadStatus
          created_at: string
        }
        Insert: {
          id?: string
          tipo: LeadTipo
          nome: string
          telefone?: string | null
          email?: string | null
          data_desejada?: string | null
          participantes?: number | null
          mensagem?: string | null
          status?: LeadStatus
          created_at?: string
        }
        Update: {
          id?: string
          tipo?: LeadTipo
          nome?: string
          telefone?: string | null
          email?: string | null
          data_desejada?: string | null
          participantes?: number | null
          mensagem?: string | null
          status?: LeadStatus
          created_at?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          valor: string
          descricao: string | null
        }
        Insert: {
          chave: string
          valor: string
          descricao?: string | null
        }
        Update: {
          chave?: string
          valor?: string
          descricao?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: number
          actor_user_id: string | null
          action: string
          entity: string
          entity_id: string | null
          diff: Json | null
          created_at: string
        }
        Insert: {
          id?: number
          actor_user_id?: string | null
          action: string
          entity: string
          entity_id?: string | null
          diff?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          actor_user_id?: string | null
          action?: string
          entity?: string
          entity_id?: string | null
          diff?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          titulo: string
          slug: string
          resumo: string
          conteudo: string
          capa_url: string | null
          status: PostStatus
          meta_title: string | null
          meta_description: string | null
          carrossel_urls: string[]
          instagram_post_id: string | null
          instagram_publicado_at: string | null
          publicado_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          titulo: string
          slug: string
          resumo: string
          conteudo: string
          capa_url?: string | null
          status?: PostStatus
          meta_title?: string | null
          meta_description?: string | null
          carrossel_urls?: string[]
          instagram_post_id?: string | null
          instagram_publicado_at?: string | null
          publicado_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          titulo?: string
          slug?: string
          resumo?: string
          conteudo?: string
          capa_url?: string | null
          status?: PostStatus
          meta_title?: string | null
          meta_description?: string | null
          carrossel_urls?: string[]
          instagram_post_id?: string | null
          instagram_publicado_at?: string | null
          publicado_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          id: string
          nome: string
          tipo: 'imagem' | 'video'
          url: string
          storage_path: string | null
          alt: string
          categoria: 'galeria' | 'hero' | 'video_intro' | 'outro'
          posicao: number
          ativo: boolean
          tamanho_bytes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          tipo: 'imagem' | 'video'
          url: string
          storage_path?: string | null
          alt?: string
          categoria?: 'galeria' | 'hero' | 'video_intro' | 'outro'
          posicao?: number
          ativo?: boolean
          tamanho_bytes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          tipo?: 'imagem' | 'video'
          url?: string
          storage_path?: string | null
          alt?: string
          categoria?: 'galeria' | 'hero' | 'video_intro' | 'outro'
          posicao?: number
          ativo?: boolean
          tamanho_bytes?: number | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Row type aliases para uso direto
export type Modalidade = Database['public']['Tables']['modalidades']['Row']
export type GradeHorario = Database['public']['Tables']['grade_horarios']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type Kart = Database['public']['Tables']['karts']['Row']
export type Reserva = Database['public']['Tables']['reservas']['Row']
export type ReservaPiloto = Database['public']['Tables']['reserva_pilotos']['Row']
export type KartAlocacao = Database['public']['Tables']['kart_alocacoes']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type Configuracao = Database['public']['Tables']['configuracoes']['Row']
export type Media = Database['public']['Tables']['media']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
