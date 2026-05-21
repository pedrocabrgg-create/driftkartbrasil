import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db/types'
import { calcularJanelaConflita, calcularJanelaComBuffer } from './index'

type DB = SupabaseClient<Database>

/**
 * Busca karts ativos e suas alocações ativas para uma janela candidata.
 * Retorna { kartsAtivos, kartsLivresIds }.
 *
 * Esta função roda no servidor e usa o service client para não depender de RLS.
 */
export async function buscarKartsLivres(
  db: DB,
  inicioAt: Date,
  fimAtComBuffer: Date,
): Promise<{ kartsAtivos: number[]; kartsLivresIds: number[] }> {
  const [{ data: karts }, { data: alocacoes }] = await Promise.all([
    db.from('karts').select('id').eq('ativo', true).order('id'),
    db
      .from('kart_alocacoes')
      .select('kart_id, janela, status_reserva')
      .in('status_reserva', ['aguardando_sinal', 'confirmada']),
  ])

  if (!karts) return { kartsAtivos: [], kartsLivresIds: [] }

  const kartsAtivos = karts.map((k) => k.id)

  const janelaNova = {
    inicio: inicioAt.toISOString(),
    fim: fimAtComBuffer.toISOString(),
  }

  const kartsOcupados = new Set(
    (alocacoes ?? [])
      .filter((a) => {
        const [inicioStr, fimStr] = parsePostgresRange(a.janela)
        if (!inicioStr || !fimStr) return false
        return calcularJanelaConflita(janelaNova, { inicio: inicioStr, fim: fimStr })
      })
      .map((a) => a.kart_id),
  )

  const kartsLivresIds = kartsAtivos.filter((id) => !kartsOcupados.has(id))

  return { kartsAtivos, kartsLivresIds }
}

/**
 * Verifica se existe reserva exclusiva que conflite com a janela candidata.
 */
export async function hasReservaExclusivaConflitante(
  db: DB,
  inicioAt: Date,
  fimAt: Date,
): Promise<boolean> {
  const { data } = await db
    .from('reservas')
    .select('id')
    .eq('exclusiva', true)
    .in('status', ['aguardando_sinal', 'confirmada'])
    .lt('inicio_at', fimAt.toISOString())
    .gt('fim_at', inicioAt.toISOString())
    .limit(1)

  return (data?.length ?? 0) > 0
}

/**
 * Parseia o formato tstzrange do Postgres: "[2026-01-01T10:00:00+00,2026-01-01T10:25:00+00)"
 */
function parsePostgresRange(range: string): [string | null, string | null] {
  const match = range.match(/^[\[(]"?([^",]+)"?,\s*"?([^",\])]+)"?[\])]$/)
  if (!match) return [null, null]
  return [match[1] ?? null, match[2] ?? null]
}

export { calcularJanelaComBuffer }
