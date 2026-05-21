'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { ReservaFormData } from '@/lib/schemas/reserva'
import type { Modalidade } from '@/lib/db/types'
import { Button } from '@/components/ui/button'
import { Clock, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCentsToBrl } from '@/lib/dates'

interface Props {
  form: UseFormReturn<ReservaFormData>
  modalidades: Modalidade[]
  onNext: () => void
  onPrev: () => void
}

export function Step2Modalidade({ form, modalidades, onNext, onPrev }: Props) {
  const modalidadeId = form.watch('modalidadeId')
  const { errors } = form.formState

  function selecionar(id: string) {
    form.setValue('modalidadeId', id, { shouldValidate: true })
    // Limpa data/hora ao mudar modalidade
    form.setValue('data', '')
    form.setValue('inicioAt', '')
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-black text-white">Escolha seu Serviço</h2>
      <p className="mb-8 text-sm text-muted-foreground">Selecione a modalidade desejada.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modalidades.map((mod) => {
          const preco = mod.preco_promo_cents ?? mod.preco_cheio_cents
          const temPromo = mod.preco_promo_cents !== null

          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => selecionar(mod.id)}
              className={cn(
                'relative rounded-xl border p-5 text-left transition-all',
                modalidadeId === mod.id
                  ? 'border-brand bg-brand/10 ring-1 ring-brand'
                  : 'border-white/10 bg-card hover:border-brand/40',
              )}
            >
              {temPromo && (
                <span className="absolute -top-2 right-3 rounded-full bg-brand px-2 py-0.5 text-xs font-bold text-brand-foreground">
                  PROMOÇÃO
                </span>
              )}

              <p className="mb-1 font-bold text-white">{mod.nome}</p>
              <p className="mb-3 text-2xl font-black text-brand">{formatCentsToBrl(preco)}</p>

              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Clock className="size-3.5 text-brand" />
                  {mod.duracao_min} minutos
                </li>
                <li className="flex items-center gap-2">
                  <Users className="size-3.5 text-brand" />
                  Máx. {mod.capacidade_max} pessoas
                </li>
              </ul>

              {mod.exclusiva && (
                <span className="mt-3 block rounded-md bg-purple-500/20 px-2 py-1 text-center text-xs text-purple-300">
                  Pista exclusiva
                </span>
              )}
            </button>
          )
        })}
      </div>

      {errors.modalidadeId && (
        <p className="mt-3 text-sm text-destructive">{errors.modalidadeId.message}</p>
      )}

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Voltar
        </Button>
        <Button
          onClick={() => {
            if (!modalidadeId) {
              form.setError('modalidadeId', { message: 'Selecione uma modalidade' })
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
