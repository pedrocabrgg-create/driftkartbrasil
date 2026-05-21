'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { ReservaFormData } from '@/lib/schemas/reserva'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  form: UseFormReturn<ReservaFormData>
  onNext: () => void
}

const niveis = [
  {
    value: 'iniciante' as const,
    titulo: 'Iniciante',
    descricao: 'Para pessoas que nunca tiveram contato com drift',
  },
  {
    value: 'ja_tive_contato' as const,
    titulo: 'Já tive contato',
    descricao: 'Para pessoas que fizeram simulador, kart ou já andaram na drift kart',
  },
]

export function Step1Nivel({ form, onNext }: Props) {
  const nivel = form.watch('nivelExperiencia')
  const { errors } = form.formState

  function selecionar(value: 'iniciante' | 'ja_tive_contato') {
    form.setValue('nivelExperiencia', value, { shouldValidate: true })
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-black text-white">Nível de Experiência</h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Isso ajuda nossa equipe a se preparar para a sua sessão.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {niveis.map((n) => (
          <button
            key={n.value}
            type="button"
            onClick={() => selecionar(n.value)}
            className={cn(
              'rounded-xl border p-6 text-left transition-all',
              nivel === n.value
                ? 'border-brand bg-brand/10 ring-1 ring-brand'
                : 'border-white/10 bg-card hover:border-brand/40',
            )}
          >
            <p className="mb-1 font-bold text-white">{n.titulo}</p>
            <p className="text-sm text-muted-foreground">{n.descricao}</p>
          </button>
        ))}
      </div>

      {errors.nivelExperiencia && (
        <p className="mt-3 text-sm text-destructive">{errors.nivelExperiencia.message}</p>
      )}

      <div className="mt-8 flex justify-end">
        <Button
          onClick={() => {
            if (!nivel) {
              form.setError('nivelExperiencia', { message: 'Selecione seu nível de experiência' })
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
