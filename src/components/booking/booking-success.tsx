'use client'

import Link from 'next/link'
import { CheckCircle2, MessageCircle } from 'lucide-react'
import type { ReservaFormData } from '@/lib/schemas/reserva'
import type { Modalidade } from '@/lib/db/types'
import { Button } from '@/components/ui/button'
import { formatDateTimeBr, formatCentsToBrl, toBrTime } from '@/lib/dates'

const WHATSAPP = process.env['NEXT_PUBLIC_WHATSAPP_NUMBER'] ?? '5511976626414'

interface Props {
  reservaId: string
  formData: ReservaFormData
  modalidade: Modalidade | null
}

export function BookingSuccess({ reservaId, formData, modalidade }: Props) {
  const preco = modalidade
    ? (modalidade.preco_promo_cents ?? modalidade.preco_cheio_cents) * formData.pilotosCount
    : 0
  const sinal = Math.ceil(preco * ((modalidade?.sinal_percent ?? 30) / 100))

  const whatsappMsg = encodeURIComponent(
    `Olá! Acabei de realizar uma reserva na Drift Kart Brasil.\nID: ${reservaId.slice(0, 8).toUpperCase()}\nModalidade: ${modalidade?.nome ?? ''}\nData: ${formData.inicioAt ? formatDateTimeBr(toBrTime(formData.inicioAt)) : ''}\nNome: ${formData.organizador.nome}\n\nGostaria de confirmar o sinal de ${formatCentsToBrl(sinal)}.`,
  )

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto mb-4 size-16 text-brand" />

      <h1 className="mb-2 text-3xl font-black text-white">Reserva Solicitada!</h1>
      <p className="mb-1 text-muted-foreground">
        ID da reserva:{' '}
        <span className="font-mono font-medium text-white">
          {reservaId.slice(0, 8).toUpperCase()}
        </span>
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        Enviamos um e-mail de confirmação para {formData.organizador.email}.
      </p>

      {/* Resumo */}
      <div className="mb-8 rounded-xl border border-white/10 bg-card p-5 text-left">
        <p className="mb-3 font-semibold text-white">Resumo</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Modalidade</span>
            <span className="text-white">{modalidade?.nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data e Hora</span>
            <span className="text-white">
              {formData.inicioAt ? formatDateTimeBr(toBrTime(formData.inicioAt)) : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Participantes</span>
            <span className="text-white">{formData.pilotosCount} pessoa(s)</span>
          </div>
        </div>
      </div>

      {/* Instruções de pagamento */}
      <div className="mb-8 rounded-xl border border-brand/30 bg-brand/5 p-6 text-left">
        <h2 className="mb-4 font-bold text-white">Próximo passo: pague o sinal</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Para confirmar sua reserva, pague o sinal de{' '}
          <span className="font-bold text-white">{formatCentsToBrl(sinal)}</span> via Pix ou
          WhatsApp.
        </p>
        <div className="rounded-lg border border-white/10 bg-background/50 p-4 text-sm">
          <p className="mb-1 font-medium text-white">Pix:</p>
          <p className="text-muted-foreground">
            Chave Pix será informada em breve. Entre em contato pelo WhatsApp para receber os dados.
          </p>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Sua vaga fica reservada por 24 horas. Após esse prazo sem confirmação do sinal, a reserva
          será cancelada automaticamente.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          asChild
          className="bg-brand font-bold text-brand-foreground hover:bg-brand/90"
          size="lg"
        >
          <a
            href={`https://wa.me/${WHATSAPP}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="mr-2 size-4" />
            Falar no WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}
