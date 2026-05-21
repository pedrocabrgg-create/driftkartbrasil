import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { formatDateTimeBr, formatCentsToBrl, toBrTime } from '@/lib/dates'
import { Badge } from '@/components/ui/badge'
import {
  marcarSinalPago,
  cancelarReserva,
  marcarConcluida,
  marcarPresenca,
  reenviarEmail,
} from './actions'

export const metadata: Metadata = {
  title: 'Detalhes da Reserva — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  aguardando_sinal: { label: 'Aguardando Sinal', variant: 'secondary' },
  confirmada: { label: 'Confirmada', variant: 'default' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  no_show: { label: 'No-show', variant: 'destructive' },
  concluida: { label: 'Concluída', variant: 'outline' },
}

const PRESENCA_CLS: Record<string, string> = {
  pendente: 'text-muted-foreground',
  presente: 'text-brand',
  no_show: 'text-destructive',
}

const PRESENCA_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  presente: 'Presente',
  no_show: 'No-show',
}

type Piloto = {
  id: string
  presenca: string
  clientes: { nome: string; telefone: string } | null
}

type ReservaDetalhes = {
  id: string
  inicio_at: string
  fim_at: string
  status: string
  pilotos_count: number
  total_cents: number
  sinal_cents: number
  sinal_pago_at: string | null
  motivo_cancelamento: string | null
  expires_at: string | null
  created_at: string
  modalidades: { nome: string; duracao_min: number } | null
  clientes: { nome: string; telefone: string; email: string | null } | null
  reserva_pilotos: Piloto[]
}

export default async function ReservaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const db = createSupabaseServiceClient()

  const [{ data }, { data: auditLogs }] = await Promise.all([
    db
      .from('reservas')
      .select(`
        id, inicio_at, fim_at, status, pilotos_count,
        total_cents, sinal_cents, sinal_pago_at,
        motivo_cancelamento, expires_at, created_at,
        modalidades!modalidade_id ( nome, duracao_min ),
        clientes!cliente_organizador_id ( nome, telefone, email ),
        reserva_pilotos ( id, presenca, clientes!cliente_id ( nome, telefone ) )
      `)
      .eq('id', id)
      .single(),
    db
      .from('audit_log')
      .select('id, action, diff, created_at')
      .eq('entity', 'reservas')
      .eq('entity_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!data) notFound()

  const reserva = data as unknown as ReservaDetalhes
  const st = STATUS_BADGE[reserva.status]
  const idCurto = id.slice(0, 8).toUpperCase()
  const isActive = ['aguardando_sinal', 'confirmada'].includes(reserva.status)

  const sinalPagoAction = marcarSinalPago.bind(null, id)
  const concluidaAction = marcarConcluida.bind(null, id)
  const cancelAction = cancelarReserva.bind(null, id)
  const reenviarAction = reenviarEmail.bind(null, id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4">
        <Link href="/admin/reservas" className="mt-1 text-sm text-muted-foreground hover:text-white">
          ← Reservas
        </Link>
        <div className="flex flex-1 items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">
              Reserva{' '}
              <span className="font-mono text-brand">#{idCurto}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Criada em {formatDateTimeBr(toBrTime(reserva.created_at))}
            </p>
          </div>
          <Badge variant={st?.variant ?? 'secondary'} className="text-sm">
            {st?.label ?? reserva.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Organizador */}
          <section className="rounded-xl border border-white/10 bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Organizador
            </h2>
            {reserva.clientes ? (
              <div className="space-y-1">
                <p className="font-semibold text-white">{reserva.clientes.nome}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <a
                    href={`https://wa.me/55${reserva.clientes.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand"
                  >
                    📱 {reserva.clientes.telefone}
                  </a>
                  {reserva.clientes.email && (
                    <a href={`mailto:${reserva.clientes.email}`} className="hover:text-brand">
                      ✉️ {reserva.clientes.email}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </section>

          {/* Sessão */}
          <section className="rounded-xl border border-white/10 bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sessão
            </h2>
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Modalidade</dt>
                <dd className="mt-0.5 font-medium text-white">{reserva.modalidades?.nome ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Data e Hora</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {formatDateTimeBr(toBrTime(reserva.inicio_at))}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Duração</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {reserva.modalidades?.duracao_min ?? '—'} min
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Pilotos</dt>
                <dd className="mt-0.5 font-medium text-white">{reserva.pilotos_count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Valor Total</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {formatCentsToBrl(reserva.total_cents)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  Sinal {reserva.sinal_pago_at ? '✓ pago' : '— pendente'}
                </dt>
                <dd
                  className={`mt-0.5 font-medium ${reserva.sinal_pago_at ? 'text-brand' : 'text-yellow-400'}`}
                >
                  {formatCentsToBrl(reserva.sinal_cents)}
                  {reserva.sinal_pago_at && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      em {formatDateTimeBr(toBrTime(reserva.sinal_pago_at))}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">A pagar no local</dt>
                <dd className="mt-0.5 font-medium text-white">
                  {formatCentsToBrl(reserva.total_cents - reserva.sinal_cents)}
                </dd>
              </div>
              {reserva.expires_at && reserva.status === 'aguardando_sinal' && (
                <div>
                  <dt className="text-xs text-muted-foreground">Expira em</dt>
                  <dd className="mt-0.5 font-medium text-yellow-400">
                    {formatDateTimeBr(toBrTime(reserva.expires_at))}
                  </dd>
                </div>
              )}
            </dl>
            {reserva.motivo_cancelamento && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <p className="text-xs font-semibold text-destructive">Motivo do cancelamento</p>
                <p className="mt-1 text-sm text-muted-foreground">{reserva.motivo_cancelamento}</p>
              </div>
            )}
          </section>

          {/* Pilotos */}
          <section className="rounded-xl border border-white/10 bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pilotos ({reserva.reserva_pilotos.length})
            </h2>
            <div className="space-y-2">
              {reserva.reserva_pilotos.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{p.clientes?.nome ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{p.clientes?.telefone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${PRESENCA_CLS[p.presenca] ?? 'text-muted-foreground'}`}>
                      {PRESENCA_LABEL[p.presenca] ?? p.presenca}
                    </span>
                    {reserva.status === 'confirmada' && p.presenca !== 'presente' && (
                      <form action={marcarPresenca}>
                        <input type="hidden" name="pilotoId" value={p.id} />
                        <input type="hidden" name="presenca" value="presente" />
                        <input type="hidden" name="reservaId" value={id} />
                        <button
                          type="submit"
                          className="rounded border border-brand/30 px-2 py-1 text-xs text-brand hover:bg-brand/10"
                        >
                          Presente
                        </button>
                      </form>
                    )}
                    {reserva.status === 'confirmada' && p.presenca !== 'no_show' && (
                      <form action={marcarPresenca}>
                        <input type="hidden" name="pilotoId" value={p.id} />
                        <input type="hidden" name="presenca" value="no_show" />
                        <input type="hidden" name="reservaId" value={id} />
                        <button
                          type="submit"
                          className="rounded border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          No-show
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
              {reserva.reserva_pilotos.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum piloto registrado.</p>
              )}
            </div>
          </section>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Ações */}
          <section className="rounded-xl border border-white/10 bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ações
            </h2>
            <div className="space-y-3">
              {reserva.status === 'aguardando_sinal' && (
                <form action={sinalPagoAction}>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-black hover:bg-brand/90"
                  >
                    ✓ Confirmar pagamento do sinal
                  </button>
                </form>
              )}

              {reserva.status === 'confirmada' && (
                <form action={concluidaAction}>
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-brand/30 bg-brand/10 px-4 py-2.5 text-sm font-bold text-brand hover:bg-brand/20"
                  >
                    ✓ Marcar como concluída
                  </button>
                </form>
              )}

              {isActive && (
                <form action={cancelAction} className="space-y-2">
                  <textarea
                    name="motivo"
                    placeholder="Motivo do cancelamento (opcional)..."
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white/20 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20"
                  >
                    Cancelar reserva
                  </button>
                </form>
              )}

              {reserva.clientes?.email && isActive && (
                <form action={reenviarAction}>
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm text-muted-foreground hover:border-white/20 hover:text-white"
                  >
                    ✉️ Reenviar e-mail
                  </button>
                </form>
              )}

              {!isActive && (
                <p className="text-center text-xs text-muted-foreground">
                  Reserva encerrada — sem ações disponíveis.
                </p>
              )}
            </div>
          </section>

          {/* Histórico */}
          <section className="rounded-xl border border-white/10 bg-card p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Histórico
            </h2>
            <div className="space-y-3">
              {(auditLogs ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Sem registros.</p>
              )}
              {(auditLogs ?? []).map((log) => (
                <div key={log.id} className="border-l-2 border-white/10 pl-3 text-xs">
                  <p className="font-medium capitalize text-white">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-muted-foreground">
                    {formatDateTimeBr(toBrTime(log.created_at))}
                  </p>
                  {log.diff && (
                    <p className="mt-0.5 font-mono text-muted-foreground/60">
                      {JSON.stringify(log.diff)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
