'use client'

import { useState, useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { ReservaFormData } from '@/lib/schemas/reserva'
import type { Modalidade } from '@/lib/db/types'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatTimeBr, toBrTime } from '@/lib/dates'
import { buscarSlotsDisponiveis, type SlotDisponivel } from '@/app/(public)/agendar/actions'
import { ptBR } from 'date-fns/locale'

// Dias da semana com grade operacional: Qui(4), Sex(5), Sáb(6), Dom(0)
const DIAS_OPERACIONAIS = new Set([0, 4, 5, 6])

interface Props {
  form: UseFormReturn<ReservaFormData>
  modalidade: Modalidade | null
  onNext: () => void
  onPrev: () => void
}

export function Step3DataHorario({ form, modalidade, onNext, onPrev }: Props) {
  const [slots, setSlots] = useState<SlotDisponivel[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const dataSelecionada = form.watch('data')
  const inicioAt = form.watch('inicioAt')

  useEffect(() => {
    if (!dataSelecionada || !modalidade) return

    let cancelled = false

    const load = async () => {
      setLoadingSlots(true)
      setSlots([])
      form.setValue('inicioAt', '')

      const { slots: novosSlots } = await buscarSlotsDisponiveis(dataSelecionada, modalidade.id)

      if (!cancelled) {
        setSlots(novosSlots)
        setLoadingSlots(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada, modalidade?.id])

  function selecionarData(date: Date | undefined) {
    if (!date) return
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    form.setValue('data', iso, { shouldValidate: true })
  }

  function selecionarSlot(slot: SlotDisponivel) {
    if (slot.esgotado) return
    form.setValue('inicioAt', slot.inicioAt, { shouldValidate: true })
  }

  const slotsTarde = slots.filter((s) => s.periodo === 'tarde')
  const slotsNoite = slots.filter((s) => s.periodo === 'noite')

  return (
    <div>
      <h2 className="mb-2 text-2xl font-black text-white">Data e Horário</h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Selecione uma data e um horário disponível.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Calendário */}
        <div>
          <p className="mb-3 text-sm font-medium text-white">Escolha a data</p>
          <Calendar
            mode="single"
            locale={ptBR}
            selected={dataSelecionada ? new Date(dataSelecionada + 'T12:00:00Z') : undefined}
            onSelect={selecionarData}
            disabled={(date) => {
              const now = new Date()
              now.setHours(0, 0, 0, 0)
              if (date < now) return true
              return !DIAS_OPERACIONAIS.has(date.getDay())
            }}
            className="rounded-xl border border-white/10 bg-card p-4"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Funcionamos qui/sex/sáb/dom.
          </p>
        </div>

        {/* Horários */}
        <div>
          <p className="mb-3 text-sm font-medium text-white">Escolha o horário</p>

          {!dataSelecionada && (
            <p className="text-sm text-muted-foreground">Selecione uma data primeiro.</p>
          )}

          {loadingSlots && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          )}

          {!loadingSlots && dataSelecionada && slots.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Sem horários disponíveis para esta data.
            </p>
          )}

          {!loadingSlots && slotsTarde.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tarde
              </p>
              <div className="grid grid-cols-3 gap-2">
                {slotsTarde.map((slot) => (
                  <SlotButton
                    key={slot.inicioAt}
                    slot={slot}
                    selected={inicioAt === slot.inicioAt}
                    onSelect={selecionarSlot}
                  />
                ))}
              </div>
            </div>
          )}

          {!loadingSlots && slotsNoite.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Noite
              </p>
              <div className="grid grid-cols-3 gap-2">
                {slotsNoite.map((slot) => (
                  <SlotButton
                    key={slot.inicioAt}
                    slot={slot}
                    selected={inicioAt === slot.inicioAt}
                    onSelect={selecionarSlot}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Voltar
        </Button>
        <Button
          onClick={() => {
            if (!dataSelecionada || !inicioAt) {
              if (!dataSelecionada) form.setError('data', { message: 'Selecione uma data' })
              if (!inicioAt) form.setError('inicioAt', { message: 'Selecione um horário' })
              return
            }
            onNext()
          }}
          className="bg-brand font-bold text-brand-foreground hover:bg-brand/90"
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}

function SlotButton({
  slot,
  selected,
  onSelect,
}: {
  slot: SlotDisponivel
  selected: boolean
  onSelect: (s: SlotDisponivel) => void
}) {
  const hora = formatTimeBr(toBrTime(slot.inicioAt))

  return (
    <button
      type="button"
      disabled={slot.esgotado}
      onClick={() => onSelect(slot)}
      title={slot.esgotado ? 'Esgotado' : `${slot.kartsLivres} vaga(s)`}
      className={cn(
        'rounded-lg border p-2 text-center text-sm font-medium transition-all',
        selected
          ? 'border-brand bg-brand text-brand-foreground'
          : slot.esgotado
            ? 'cursor-not-allowed border-white/5 bg-white/5 text-muted-foreground/40 line-through'
            : 'border-white/10 bg-card text-white hover:border-brand/40',
      )}
    >
      {hora}
      {!slot.esgotado && slot.kartsLivres < slot.totalKarts && (
        <span className="block text-[10px] text-brand">{slot.kartsLivres}v</span>
      )}
    </button>
  )
}

