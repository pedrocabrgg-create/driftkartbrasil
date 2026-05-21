'use client'

import { useState, useTransition } from 'react'
import { Search, Calendar, Users, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { consultarReservasPorCpf, type ReservaConsulta } from './actions'

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  aguardando_sinal: {
    label: 'Aguardando sinal',
    color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    icon: <Clock className="size-3.5" />,
  },
  confirmada: {
    label: 'Confirmada',
    color: 'text-brand border-brand/30 bg-brand/10',
    icon: <CheckCircle className="size-3.5" />,
  },
  cancelada: {
    label: 'Cancelada',
    color: 'text-red-400 border-red-400/30 bg-red-400/10',
    icon: <XCircle className="size-3.5" />,
  },
  no_show: {
    label: 'Não compareceu',
    color: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    icon: <AlertCircle className="size-3.5" />,
  },
  concluida: {
    label: 'Concluída',
    color: 'text-white/40 border-white/10 bg-white/5',
    icon: <CheckCircle className="size-3.5" />,
  },
}

function formatData(isoString: string) {
  return new Date(isoString).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })
}

function formatHora(isoString: string) {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function formatReais(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ReservaCard({ reserva }: { reserva: ReservaConsulta }) {
  const status = STATUS_CONFIG[reserva.status] ?? STATUS_CONFIG['aguardando_sinal']!
  const isPast = new Date(reserva.inicio_at) < new Date()

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/5 p-5 transition-opacity ${isPast && reserva.status === 'concluida' ? 'opacity-60' : ''}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-bebas text-lg tracking-wide text-white">{reserva.modalidade_nome}</p>
          <p className="text-xs text-white/40">{reserva.modalidade_duracao} minutos</p>
        </div>
        <span className={`font-bebas flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs tracking-wider ${status.color}`}>
          {status.icon}
          {status.label}
        </span>
      </div>

      <div className="mb-4 grid gap-2 text-sm">
        <div className="flex items-center gap-2 text-white/70">
          <Calendar className="size-4 shrink-0 text-brand" />
          <span className="capitalize">{formatData(reserva.inicio_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Clock className="size-4 shrink-0 text-brand" />
          <span>{formatHora(reserva.inicio_at)} — {formatHora(reserva.fim_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-white/70">
          <Users className="size-4 shrink-0 text-brand" />
          <span>{reserva.pilotos_count} piloto{reserva.pilotos_count !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/8 pt-4 text-sm">
        <div>
          <p className="text-white/40">Sinal</p>
          <p className={`font-semibold ${reserva.sinal_pago_at ? 'text-brand' : 'text-yellow-400'}`}>
            {formatReais(reserva.sinal_cents)}
            {reserva.sinal_pago_at ? ' · pago' : ' · pendente'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/40">Total</p>
          <p className="font-semibold text-white">{formatReais(reserva.total_cents)}</p>
        </div>
      </div>
    </div>
  )
}

export function ConsultarClient() {
  const [cpf, setCpf] = useState('')
  const [resultado, setResultado] = useState<{ nome?: string; reservas?: ReservaConsulta[]; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await consultarReservasPorCpf(cpf)
      setResultado(res.ok ? { nome: res.nome, reservas: res.reservas } : { error: res.error })
    })
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <div className="mb-10 text-center">
        <span className="font-bebas mb-3 block text-sm tracking-[0.25em] text-brand">
          Seus agendamentos
        </span>
        <h1 className="mb-2 text-4xl text-white">Consultar Reserva</h1>
        <p className="text-sm text-white/40">
          Digite seu CPF para localizar seus agendamentos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <label className="mb-1.5 block text-sm font-medium text-white/70">
          CPF *
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={cpf}
          onChange={(e) => setCpf(maskCpf(e.target.value))}
          className="mb-5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/25 focus:border-brand/50 focus:outline-none focus:ring-1 focus:ring-brand/30"
          required
        />
        <button
          type="submit"
          disabled={isPending || cpf.length < 14}
          className="font-bebas flex w-full items-center justify-center gap-2 bg-brand py-4 text-base tracking-widest text-black transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="size-4" />
          {isPending ? 'Buscando...' : 'Consultar Agendamentos'}
        </button>
      </form>

      {resultado && (
        <div className="mt-8">
          {resultado.error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 px-5 py-4 text-center text-sm text-red-400">
              {resultado.error}
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-white/50">
                Olá, <span className="text-white">{resultado.nome}</span> —{' '}
                {resultado.reservas?.length === 0
                  ? 'nenhum agendamento encontrado.'
                  : `${resultado.reservas?.length} agendamento(s) encontrado(s).`}
              </p>
              <div className="space-y-4">
                {resultado.reservas?.map((r) => (
                  <ReservaCard key={r.id} reserva={r} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
