'use server'

import { createSupabaseServiceClient } from '@/lib/db/server'
import { buscarKartsLivres, hasReservaExclusivaConflitante, calcularJanelaComBuffer } from '@/lib/availability/server'
import { telefoneRaw, cpfRaw } from '@/lib/schemas/reserva'
import type { ReservaFormData } from '@/lib/schemas/reserva'
import type { Modalidade } from '@/lib/db/types'
import { enviarEmailReservaRecebida } from '@/lib/email'
import { formatDateTimeBr, toBrTime } from '@/lib/dates'

type CriarReservaResult =
  | { ok: true; reservaId: string }
  | { ok: false; error: string }

/**
 * Cria uma reserva completa em uma única transação via RPC do Supabase.
 *
 * Fluxo:
 * 1. Valida modalidade e busca configurações
 * 2. Verifica disponibilidade de karts na janela [inicio, fim+buffer)
 * 3. Cria cliente organizador (upsert por telefone)
 * 4. Cria clientes dos demais pilotos
 * 5. Cria reserva com status aguardando_sinal
 * 6. Cria reserva_pilotos
 * 7. Insere kart_alocacoes — se constraint EXCLUDE recusar, devolve erro de conflito
 */
export async function criarReserva(data: ReservaFormData): Promise<CriarReservaResult> {
  const db = createSupabaseServiceClient()

  try {
    // 1. Busca modalidade e configurações
    const [{ data: modalidade }, { data: configs }] = await Promise.all([
      db.from('modalidades').select('*').eq('id', data.modalidadeId).eq('ativa', true).single(),
      db.from('configuracoes').select('chave, valor').in('chave', ['buffer_entre_sessoes', 'sinal_pct', 'ttl_aguardando_sinal']),
    ])

    if (!modalidade) return { ok: false, error: 'Modalidade não encontrada ou inativa' }

    const bufferMin = parseInt(configs?.find((c) => c.chave === 'buffer_entre_sessoes')?.valor ?? '10')
    const sinalPct = parseInt(configs?.find((c) => c.chave === 'sinal_pct')?.valor ?? '30')
    const ttlMin = parseInt(configs?.find((c) => c.chave === 'ttl_aguardando_sinal')?.valor ?? '1440')

    // 2. Calcula janelas
    const inicioAt = new Date(data.inicioAt)
    const fimAt = new Date(inicioAt.getTime() + modalidade.duracao_min * 60_000)
    const janelaComBuffer = calcularJanelaComBuffer(inicioAt, modalidade.duracao_min, bufferMin)
    const fimAtComBuffer = new Date(janelaComBuffer.fim)

    // 3. Verifica disponibilidade
    const [temExclusiva, { kartsLivresIds }] = await Promise.all([
      hasReservaExclusivaConflitante(db, inicioAt, fimAtComBuffer),
      buscarKartsLivres(db, inicioAt, fimAtComBuffer),
    ])

    if (temExclusiva) {
      return { ok: false, error: 'Este horário está bloqueado por uma sessão exclusiva. Por favor, escolha outro horário.' }
    }

    if (kartsLivresIds.length < data.pilotosCount) {
      return {
        ok: false,
        error: `Este horário tem apenas ${kartsLivresIds.length} vaga(s) disponível(is). Por favor, reduza o número de pessoas ou escolha outro horário.`,
      }
    }

    // Seleciona os karts que vamos alocar (primeiros N disponíveis)
    const kartsParaAlocar = kartsLivresIds.slice(0, data.pilotosCount)

    // 4. Upsert cliente organizador
    const telefoneOrg = telefoneRaw(data.organizador.telefone)
    const cpfOrg = data.organizador.cpf ? cpfRaw(data.organizador.cpf) : undefined
    const { data: clienteOrg, error: errOrg } = await db
      .from('clientes')
      .upsert(
        {
          nome: data.organizador.nome,
          telefone: telefoneOrg,
          email: data.organizador.email,
          is_organizador: true,
          ...(cpfOrg ? { cpf: cpfOrg } : {}),
        },
        { onConflict: 'telefone' },
      )
      .select('id')
      .single()

    if (errOrg || !clienteOrg) {
      return { ok: false, error: 'Erro ao salvar dados do organizador' }
    }

    // 5. Upsert clientes dos pilotos adicionais
    const clienteIds: string[] = [clienteOrg.id]

    for (const piloto of data.pilotos.slice(1)) {
      const telefone = telefoneRaw(piloto.telefone)
      const { data: clientePiloto, error: errPiloto } = await db
        .from('clientes')
        .upsert({ nome: piloto.nome, telefone }, { onConflict: 'telefone' })
        .select('id')
        .single()

      if (errPiloto || !clientePiloto) {
        return { ok: false, error: 'Erro ao salvar dados de um piloto' }
      }
      clienteIds.push(clientePiloto.id)
    }

    // 6. Calcula valores financeiros
    const precoUnitario = modalidade.preco_promo_cents ?? modalidade.preco_cheio_cents
    const totalCents = precoUnitario * data.pilotosCount
    const sinalCents = Math.ceil(totalCents * (sinalPct / 100))
    const expiresAt = new Date(Date.now() + ttlMin * 60_000)

    // 7. Cria reserva
    const { data: reserva, error: errReserva } = await db
      .from('reservas')
      .insert({
        modalidade_id: data.modalidadeId,
        cliente_organizador_id: clienteOrg.id,
        inicio_at: inicioAt.toISOString(),
        fim_at: fimAt.toISOString(),
        status: 'aguardando_sinal',
        nivel_experiencia: data.nivelExperiencia,
        exclusiva: (modalidade as Modalidade).exclusiva,
        pilotos_count: data.pilotosCount,
        total_cents: totalCents,
        sinal_cents: sinalCents,
        termo_aceito_em: new Date().toISOString(),
        ciente_sinal_nao_reembolsavel_em: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single()

    if (errReserva || !reserva) {
      return { ok: false, error: 'Erro ao criar reserva. Tente novamente.' }
    }

    // 8. Cria reserva_pilotos
    const pilotos = clienteIds.map((clienteId) => ({
      reserva_id: reserva.id,
      cliente_id: clienteId,
      presenca: 'pendente' as const,
    }))

    const { error: errPilotos } = await db.from('reserva_pilotos').insert(pilotos)
    if (errPilotos) {
      // Cleanup: remove reserva criada
      await db.from('reservas').delete().eq('id', reserva.id)
      return { ok: false, error: 'Erro ao registrar pilotos. Tente novamente.' }
    }

    // 9. Insere kart_alocacoes — constraint EXCLUDE vai recusar se houve race condition
    const alocacoes = kartsParaAlocar.map((kartId) => ({
      reserva_id: reserva.id,
      kart_id: kartId,
      janela: `[${inicioAt.toISOString()},${fimAtComBuffer.toISOString()})`,
      status_reserva: 'aguardando_sinal' as const,
    }))

    const { error: errAlocacoes } = await db.from('kart_alocacoes').insert(alocacoes)

    if (errAlocacoes) {
      // Cleanup
      await db.from('reservas').delete().eq('id', reserva.id)

      if (errAlocacoes.code === '23P01') {
        // Exclusion constraint violation — race condition
        return {
          ok: false,
          error: 'Este horário acabou de ficar indisponível. Por favor, escolha outro horário.',
        }
      }
      return { ok: false, error: 'Erro ao alocar karts. Tente novamente.' }
    }

    // 10. Dispara e-mail de confirmação (fire-and-forget; falha não impede a reserva)
    if (data.organizador.email) {
      void enviarEmailReservaRecebida({
        toEmail: data.organizador.email,
        toNome: data.organizador.nome,
        reservaId: reserva.id,
        modalidade: modalidade.nome,
        dataHora: formatDateTimeBr(toBrTime(inicioAt)),
        pilotos: data.pilotosCount,
        totalCents,
        sinalCents,
        sinalPct,
      }).catch((e: unknown) => {
        console.error('[criarReserva] email error:', e instanceof Error ? e.message : e)
      })
    }

    return { ok: true, reservaId: reserva.id }
  } catch (err) {
    console.error('[criarReserva] erro inesperado:', err instanceof Error ? err.message : 'unknown')
    return { ok: false, error: 'Erro interno. Tente novamente em instantes.' }
  }
}

/**
 * Retorna os slots disponíveis para uma data e modalidade.
 * Cada slot tem: horario (ISO), kartsLivres (count), esgotado (bool).
 */
export async function buscarSlotsDisponiveis(
  data: string, // YYYY-MM-DD
  modalidadeId: string,
): Promise<{ slots: SlotDisponivel[] }> {
  const db = createSupabaseServiceClient()

  const [{ data: modalidade }, { data: grade }, { data: configs }] = await Promise.all([
    db.from('modalidades').select('*').eq('id', modalidadeId).single(),
    db.from('grade_horarios').select('*').eq('ativo', true),
    db.from('configuracoes').select('chave, valor').in('chave', ['buffer_entre_sessoes', 'granularidade_slot']),
  ])

  if (!modalidade || !grade) return { slots: [] }

  const bufferMin = parseInt(configs?.find((c) => c.chave === 'buffer_entre_sessoes')?.valor ?? '10')
  const granularidade = parseInt(configs?.find((c) => c.chave === 'granularidade_slot')?.valor ?? '15')

  // Descobre o dia da semana da data (0=dom..6=sab)
  const dataObj = new Date(data + 'T12:00:00Z') // meio-dia UTC pra evitar problemas de tz
  const diaSemana = dataObj.getUTCDay()

  // Filtra as grades recorrentes do dia + exceções da data
  const gradesDia = grade.filter(
    (g) =>
      (g.dia_semana === diaSemana && g.data_excecao === null) ||
      g.data_excecao === data,
  )

  if (gradesDia.length === 0) return { slots: [] }

  // Para cada grade do dia, gera os slots
  const slots: SlotDisponivel[] = []

  for (const g of gradesDia) {
    const [hIni, mIni] = g.hora_inicio.split(':').map(Number)
    const [hFim, mFim] = g.hora_fim.split(':').map(Number)

    let cursor = (hIni ?? 0) * 60 + (mIni ?? 0)
    const limiteMin = (hFim ?? 0) * 60 + (mFim ?? 0)

    while (cursor + modalidade.duracao_min <= limiteMin) {
      const hh = Math.floor(cursor / 60)
      const mm = cursor % 60
      const inicioISO = `${data}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00-03:00`
      const inicioAt = new Date(inicioISO)
      const fimAtComBuffer = new Date(inicioAt.getTime() + (modalidade.duracao_min + bufferMin) * 60_000)

      const [temExclusiva, { kartsLivresIds, kartsAtivos }] = await Promise.all([
        hasReservaExclusivaConflitante(db, inicioAt, fimAtComBuffer),
        buscarKartsLivres(db, inicioAt, fimAtComBuffer),
      ])

      slots.push({
        inicioAt: inicioISO,
        kartsLivres: temExclusiva ? 0 : kartsLivresIds.length,
        totalKarts: kartsAtivos.length,
        esgotado: temExclusiva || kartsLivresIds.length === 0,
        periodo: hh < 18 ? 'tarde' : 'noite',
      })

      cursor += granularidade
    }
  }

  return { slots }
}

export interface SlotDisponivel {
  inicioAt: string
  kartsLivres: number
  totalKarts: number
  esgotado: boolean
  periodo: 'tarde' | 'noite'
}
