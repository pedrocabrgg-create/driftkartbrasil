import type { ReservaStatus } from '@/lib/db/types'

export interface Janela {
  inicio: string // ISO 8601 com timezone
  fim: string
}

export interface KartSimples {
  id: number
  ativo: boolean
}

export interface AlocacaoSimples {
  kartId: number
  inicio: string
  fim: string
  statusReserva: ReservaStatus
}

/** Status que efetivamente bloqueiam uma vaga */
const STATUS_ATIVOS: ReadonlySet<ReservaStatus> = new Set(['aguardando_sinal', 'confirmada'])

/**
 * Verifica se duas janelas se sobrepõem usando a lógica [inicio, fim).
 * Equivale ao operador && do tstzrange no Postgres.
 *
 * Conflito: novaInicio < existenteFim AND novaFim > existenteInicio
 */
export function calcularJanelaConflita(nova: Janela, existente: Janela): boolean {
  const novaInicio = new Date(nova.inicio).getTime()
  const novaFim = new Date(nova.fim).getTime()
  const existenteInicio = new Date(existente.inicio).getTime()
  const existenteFim = new Date(existente.fim).getTime()

  return novaInicio < existenteFim && novaFim > existenteInicio
}

/**
 * Retorna os karts ativos que NÃO têm alocação conflitante com a janela candidata.
 * Ignora alocações de reservas canceladas/no_show/concluidas.
 */
export function kartsLivresParaJanela(
  janela: Janela,
  karts: KartSimples[],
  alocacoes: AlocacaoSimples[],
): KartSimples[] {
  const kartsAtivos = karts.filter((k) => k.ativo)

  const kartsOcupados = new Set(
    alocacoes
      .filter(
        (a) =>
          STATUS_ATIVOS.has(a.statusReserva) &&
          calcularJanelaConflita(janela, { inicio: a.inicio, fim: a.fim }),
      )
      .map((a) => a.kartId),
  )

  return kartsAtivos.filter((k) => !kartsOcupados.has(k.id))
}

/**
 * Verifica se há capacidade para N pilotos no horário candidato.
 * Retorna { disponivel: boolean, kartsLivres: KartSimples[] }
 */
export function verificarDisponibilidade(
  janela: Janela,
  pilotosCount: number,
  karts: KartSimples[],
  alocacoes: AlocacaoSimples[],
  hasReservaExclusiva: boolean,
): { disponivel: boolean; kartsLivres: KartSimples[] } {
  if (hasReservaExclusiva) {
    return { disponivel: false, kartsLivres: [] }
  }

  const kartsLivres = kartsLivresParaJanela(janela, karts, alocacoes)

  return {
    disponivel: kartsLivres.length >= pilotosCount,
    kartsLivres,
  }
}

/**
 * Dado um horário de início e duração (minutos), calcula o fim com buffer de limpeza.
 * O fim retornado JÁ inclui o buffer — é a janela real bloqueada no banco.
 */
export function calcularJanelaComBuffer(
  inicioAt: Date,
  duracaoMin: number,
  bufferMin: number,
): Janela {
  const fimMs = inicioAt.getTime() + (duracaoMin + bufferMin) * 60_000
  return {
    inicio: inicioAt.toISOString(),
    fim: new Date(fimMs).toISOString(),
  }
}
