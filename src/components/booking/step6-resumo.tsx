'use client'

import type { UseFormReturn } from 'react-hook-form'
import type { ReservaFormData } from '@/lib/schemas/reserva'
import type { Modalidade } from '@/lib/db/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { REGRAS, RODAPE_REGRAS } from '@/lib/content/regras'
import { formatDateTimeBr, formatCentsToBrl, toBrTime } from '@/lib/dates'

interface Props {
  form: UseFormReturn<ReservaFormData>
  modalidade: Modalidade | null
  onSubmit: () => void
  onPrev: () => void
  isSubmitting: boolean
  submitError: string | null
}

export function Step6Resumo({ form, modalidade, onSubmit, onPrev, isSubmitting, submitError }: Props) {
  const values = form.watch()
  const termoAceito = form.watch('termoAceito')
  const ciente = form.watch('cienteSinalNaoReembolsavel')

  const preco = modalidade
    ? (modalidade.preco_promo_cents ?? modalidade.preco_cheio_cents) * values.pilotosCount
    : 0
  const sinal = Math.ceil(preco * ((modalidade?.sinal_percent ?? 30) / 100))

  return (
    <div>
      <h2 className="mb-2 text-2xl font-black text-white">Resumo da Reserva</h2>
      <p className="mb-8 text-sm text-muted-foreground">
        Revise as informações e aceite as regras para solicitar sua reserva.
      </p>

      {/* Resumo */}
      <div className="mb-8 space-y-3 rounded-xl border border-white/10 bg-card p-5">
        <ResumoRow label="Modalidade" value={modalidade?.nome ?? '—'} />
        <ResumoRow
          label="Data e Hora"
          value={values.inicioAt ? formatDateTimeBr(toBrTime(values.inicioAt)) : '—'}
        />
        <ResumoRow
          label="Participantes"
          value={`${values.pilotosCount} pessoa(s)`}
        />
        <div className="border-t border-white/10 pt-3">
          {values.organizador.nome && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-white">Organizador:</span>{' '}
              {values.organizador.nome} — {values.organizador.telefone}
            </p>
          )}
          {values.pilotos.slice(1).map((p, i) => (
            p.nome && (
              <p key={i} className="text-sm text-muted-foreground">
                <span className="font-medium text-white">Participante {i + 2}:</span>{' '}
                {p.nome} — {p.telefone}
              </p>
            )
          ))}
        </div>
        <div className="border-t border-white/10 pt-3">
          <ResumoRow label="Valor total" value={formatCentsToBrl(preco)} destaque />
          <ResumoRow label={`Sinal ${modalidade?.sinal_percent ?? 30}% (não reembolsável)`} value={formatCentsToBrl(sinal)} destaque />
          <p className="mt-1 text-xs text-muted-foreground">
            O restante ({formatCentsToBrl(preco - sinal)}) é pago no local antes da sessão.
          </p>
        </div>
      </div>

      {/* Regras */}
      <div className="mb-6 rounded-xl border border-white/10 bg-card p-5">
        <h3 className="mb-4 font-semibold text-white">Regras e Orientações</h3>
        <ol className="space-y-2">
          {REGRAS.map((regra, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand">
                {i + 1}
              </span>
              {regra}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs font-semibold text-destructive">{RODAPE_REGRAS}</p>
      </div>

      {/* Checkboxes de aceite */}
      <div className="mb-6 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="termo"
            checked={termoAceito === true}
            onCheckedChange={(v) =>
              form.setValue('termoAceito', v === true ? true : (undefined as unknown as true), {
                shouldValidate: true,
              })
            }
          />
          <label htmlFor="termo" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
            Li e aceito as <span className="font-medium text-white">Regras e Orientações</span> da
            Drift Kart Brasil.
          </label>
        </div>
        {form.formState.errors.termoAceito && (
          <p className="text-sm text-destructive">{form.formState.errors.termoAceito.message}</p>
        )}

        <div className="flex items-start gap-3">
          <Checkbox
            id="ciente"
            checked={ciente === true}
            onCheckedChange={(v) =>
              form.setValue(
                'cienteSinalNaoReembolsavel',
                v === true ? true : (undefined as unknown as true),
                { shouldValidate: true },
              )
            }
          />
          <label htmlFor="ciente" className="cursor-pointer text-sm leading-relaxed text-muted-foreground">
            Estou ciente de que o{' '}
            <span className="font-medium text-white">sinal de {modalidade?.sinal_percent ?? 30}% não é reembolsável</span>{' '}
            e que o restante (
            {100 - (modalidade?.sinal_percent ?? 30)}%) deverá ser pago no local antes da sessão.
          </label>
        </div>
        {form.formState.errors.cienteSinalNaoReembolsavel && (
          <p className="text-sm text-destructive">
            {form.formState.errors.cienteSinalNaoReembolsavel.message}
          </p>
        )}
      </div>

      {submitError && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {submitError}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev} disabled={isSubmitting}>
          Voltar
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !termoAceito || !ciente}
          className="min-w-[160px] bg-brand font-bold text-brand-foreground hover:bg-brand/90"
        >
          {isSubmitting ? 'Aguarde...' : 'Solicitar Reserva'}
        </Button>
      </div>
    </div>
  )
}

function ResumoRow({
  label,
  value,
  destaque = false,
}: {
  label: string
  value: string
  destaque?: boolean
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={destaque ? 'font-semibold text-white' : 'text-white'}>{value}</span>
    </div>
  )
}
