import { describe, it, expect } from 'vitest'
import { calcularJanelaConflita, kartsLivresParaJanela } from '@/lib/availability'

/**
 * Testes unitários de lógica de disponibilidade.
 * Os testes de integração com banco (EXCLUDE constraint) ficam em src/test/e2e/booking.spec.ts
 * e requerem Supabase local rodando.
 */

describe('calcularJanelaConflita', () => {
  it('detecta conflito quando nova janela começa antes e termina dentro da existente', () => {
    // existente: [10:00, 11:00)
    // nova:      [09:30, 10:30) → conflita
    expect(
      calcularJanelaConflita(
        { inicio: '2026-01-01T09:30:00Z', fim: '2026-01-01T10:30:00Z' },
        { inicio: '2026-01-01T10:00:00Z', fim: '2026-01-01T11:00:00Z' },
      ),
    ).toBe(true)
  })

  it('detecta conflito quando nova janela engloba a existente', () => {
    // existente: [10:00, 10:25)
    // nova:      [09:00, 11:00) → conflita
    expect(
      calcularJanelaConflita(
        { inicio: '2026-01-01T09:00:00Z', fim: '2026-01-01T11:00:00Z' },
        { inicio: '2026-01-01T10:00:00Z', fim: '2026-01-01T10:25:00Z' },
      ),
    ).toBe(true)
  })

  it('detecta conflito quando nova janela começa dentro da existente', () => {
    // existente: [10:00, 10:40)
    // nova:      [10:20, 11:00) → conflita
    expect(
      calcularJanelaConflita(
        { inicio: '2026-01-01T10:20:00Z', fim: '2026-01-01T11:00:00Z' },
        { inicio: '2026-01-01T10:00:00Z', fim: '2026-01-01T10:40:00Z' },
      ),
    ).toBe(true)
  })

  it('NÃO conflita quando nova janela começa exatamente onde a existente termina', () => {
    // existente: [10:00, 10:25)
    // nova:      [10:25, 11:05) → sem conflito (janela é [)
    expect(
      calcularJanelaConflita(
        { inicio: '2026-01-01T10:25:00Z', fim: '2026-01-01T11:05:00Z' },
        { inicio: '2026-01-01T10:00:00Z', fim: '2026-01-01T10:25:00Z' },
      ),
    ).toBe(false)
  })

  it('NÃO conflita quando as janelas são sequenciais sem sobreposição', () => {
    // existente: [10:00, 10:25)  + buffer 10min → efetivo até 10:35
    // nova:      [11:00, 11:25)
    expect(
      calcularJanelaConflita(
        { inicio: '2026-01-01T11:00:00Z', fim: '2026-01-01T11:25:00Z' },
        { inicio: '2026-01-01T10:00:00Z', fim: '2026-01-01T10:25:00Z' },
      ),
    ).toBe(false)
  })

  it('detecta conflito no cenário do bug original: 20:00 por 40min e 20:15', () => {
    // O bug antigo: reserva às 20:00 (40min) liberava 20:15 pra nova reserva
    // Novo comportamento correto: 20:15 está DENTRO de [20:00, 20:40) → conflita
    expect(
      calcularJanelaConflita(
        { inicio: '2026-01-01T20:15:00Z', fim: '2026-01-01T21:15:00Z' },
        { inicio: '2026-01-01T20:00:00Z', fim: '2026-01-01T20:40:00Z' },
      ),
    ).toBe(true)
  })
})

describe('kartsLivresParaJanela', () => {
  const karts = [
    { id: 1, ativo: true },
    { id: 2, ativo: true },
    { id: 3, ativo: true },
    { id: 4, ativo: false }, // inativo: em manutenção
  ]

  const alocacoesExistentes = [
    {
      kartId: 1,
      inicio: '2026-01-01T10:00:00Z',
      fim: '2026-01-01T10:40:00Z',
      statusReserva: 'confirmada' as const,
    },
    {
      kartId: 2,
      inicio: '2026-01-01T10:00:00Z',
      fim: '2026-01-01T10:40:00Z',
      statusReserva: 'aguardando_sinal' as const,
    },
  ]

  it('retorna karts ativos sem conflito de janela', () => {
    const livres = kartsLivresParaJanela(
      { inicio: '2026-01-01T10:00:00Z', fim: '2026-01-01T10:25:00Z' },
      karts,
      alocacoesExistentes,
    )
    // Kart 1 e 2 ocupados, Kart 4 inativo → só Kart 3 livre
    expect(livres.map((k) => k.id)).toEqual([3])
    expect(livres).toHaveLength(1)
  })

  it('retorna todos os karts ativos quando não há alocações conflitantes', () => {
    const livres = kartsLivresParaJanela(
      { inicio: '2026-01-01T11:00:00Z', fim: '2026-01-01T11:25:00Z' },
      karts,
      alocacoesExistentes,
    )
    // Alocações são em 10:00-10:40, nova janela é 11:00 → sem conflito
    expect(livres.map((k) => k.id)).toEqual([1, 2, 3])
  })

  it('ignora alocações de reservas canceladas', () => {
    const alocacoesComCancelada = [
      ...alocacoesExistentes,
      {
        kartId: 3,
        inicio: '2026-01-01T10:00:00Z',
        fim: '2026-01-01T10:25:00Z',
        statusReserva: 'cancelada' as const,
      },
    ]
    const livres = kartsLivresParaJanela(
      { inicio: '2026-01-01T10:00:00Z', fim: '2026-01-01T10:25:00Z' },
      karts,
      alocacoesComCancelada,
    )
    // Cancelada não bloqueia → Kart 3 ainda livre
    expect(livres.map((k) => k.id)).toEqual([3])
  })
})
