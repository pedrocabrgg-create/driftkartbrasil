'use server'

import { createSupabaseServiceClient } from '@/lib/db/server'
import { cpfRaw } from '@/lib/schemas/reserva'

export interface ReservaConsulta {
  id: string
  inicio_at: string
  fim_at: string
  status: string
  pilotos_count: number
  total_cents: number
  sinal_cents: number
  sinal_pago_at: string | null
  modalidade_nome: string
  modalidade_duracao: number
}

export interface ConsultaResult {
  ok: boolean
  nome?: string
  reservas?: ReservaConsulta[]
  error?: string
}

export async function consultarReservasPorCpf(cpf: string): Promise<ConsultaResult> {
  const cpfNorm = cpfRaw(cpf)
  if (cpfNorm.length !== 11) {
    return { ok: false, error: 'CPF inválido. Use o formato 000.000.000-00.' }
  }

  const db = createSupabaseServiceClient()

  const { data: cliente } = await db
    .from('clientes')
    .select('id, nome')
    .eq('cpf', cpfNorm)
    .single()

  if (!cliente) {
    return { ok: false, error: 'Nenhum agendamento encontrado para este CPF.' }
  }

  const { data: rows, error } = await db
    .from('reservas')
    .select(`
      id,
      inicio_at,
      fim_at,
      status,
      pilotos_count,
      total_cents,
      sinal_cents,
      sinal_pago_at,
      modalidades ( nome, duracao_min )
    `)
    .eq('cliente_organizador_id', cliente.id)
    .order('inicio_at', { ascending: false })

  if (error) {
    return { ok: false, error: 'Erro ao buscar agendamentos. Tente novamente.' }
  }

  const reservas: ReservaConsulta[] = (rows ?? []).map((r) => {
    const mod = Array.isArray(r.modalidades) ? r.modalidades[0] : r.modalidades
    return {
      id: r.id,
      inicio_at: r.inicio_at,
      fim_at: r.fim_at,
      status: r.status,
      pilotos_count: r.pilotos_count,
      total_cents: r.total_cents,
      sinal_cents: r.sinal_cents,
      sinal_pago_at: r.sinal_pago_at,
      modalidade_nome: mod?.nome ?? '—',
      modalidade_duracao: mod?.duracao_min ?? 0,
    }
  })

  return { ok: true, nome: cliente.nome, reservas }
}
