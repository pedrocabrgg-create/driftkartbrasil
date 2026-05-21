'use client'

import { useState, useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { ReservaFormData } from '@/lib/schemas/reserva'
import type { Modalidade } from '@/lib/db/types'
import { Button } from '@/components/ui/button'
import { buscarSlotsDisponiveis } from '@/app/(public)/agendar/actions'
import { Minus, Plus } from 'lucide-react'

interface Props {
  form: UseFormReturn<ReservaFormData>
  modalidade: Modalidade | null
  onNext: () => void
  onPrev: () => void
}

export function Step4Pilotos({ form, modalidade, onNext, onPrev }: Props) {
  const [vagasLivres, setVagasLivres] = useState<number | null>(null)
  const pilotosCount = form.watch('pilotosCount')
  const data = form.watch('data')
  const inicioAt = form.watch('inicioAt')

  const capacidadeMax = modalidade?.capacidade_max ?? 4
  const limite = vagasLivres !== null ? Math.min(capacidadeMax, vagasLivres) : capacidadeMax

  useEffect(() => {
    if (!modalidade || !data || !inicioAt) return
    buscarSlotsDisponiveis(data, modalidade.id).then(({ slots }) => {
      const slot = slots.find((s) => s.inicioAt === inicioAt)
      if (slot) setVagasLivres(slot.kartsLivres)
    })
  }, [modalidade, data, inicioAt])

  function setCount(n: number) {
    const clamped = Math.max(1, Math.min(n, limite))
    form.setValue('pilotosCount', clamped, { shouldValidate: true })

    // Ajusta o array de pilotos ao novo count (mantém dados já preenchidos)
    const pilotos = form.getValues('pilotos')
    if (clamped > pilotos.length) {
      form.setValue('pilotos', [
        ...pilotos,
        ...Array.from({ length: clamped - pilotos.length }, () => ({ nome: '', telefone: '' })),
      ])
    } else if (clamped < pilotos.length) {
      form.setValue('pilotos', pilotos.slice(0, clamped))
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-black text-white">Quantas pessoas vão participar?</h2>
      <p className="mb-8 text-sm text-muted-foreground">Máximo: {limite} pessoa(s) neste horário.</p>

      {vagasLivres !== null && vagasLivres < capacidadeMax && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-300">
          {vagasLivres} vaga(s) restante(s) para este horário.
        </div>
      )}

      <div className="flex items-center justify-center gap-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setCount(pilotosCount - 1)}
          disabled={pilotosCount <= 1}
          className="size-12 rounded-full border-white/20"
        >
          <Minus className="size-5" />
        </Button>

        <span className="w-16 text-center text-5xl font-black text-white">{pilotosCount}</span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setCount(pilotosCount + 1)}
          disabled={pilotosCount >= limite}
          className="size-12 rounded-full border-white/20"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        {pilotosCount === 1 ? '1 pessoa' : `${pilotosCount} pessoas`}
      </p>

      <div className="mt-10 flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Voltar
        </Button>
        <Button
          onClick={onNext}
          className="bg-brand font-bold text-brand-foreground hover:bg-brand/90"
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}
