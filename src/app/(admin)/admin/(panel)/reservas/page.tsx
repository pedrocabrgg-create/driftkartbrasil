import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { formatDateTimeBr, formatCentsToBrl, toBrTime } from '@/lib/dates'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Reservas — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  aguardando_sinal: { label: 'Aguardando Sinal', variant: 'secondary' },
  confirmada: { label: 'Confirmada', variant: 'default' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  no_show: { label: 'No-show', variant: 'destructive' },
  concluida: { label: 'Concluída', variant: 'outline' },
}

export default async function ReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const params = await searchParams
  const db = createSupabaseServiceClient()

  let query = db
    .from('reservas')
    .select(`
      id, inicio_at, status, pilotos_count, total_cents, sinal_cents, sinal_pago_at,
      modalidades!modalidade_id ( nome ),
      clientes!cliente_organizador_id ( nome, telefone, email )
    `)
    .order('inicio_at', { ascending: false })
    .limit(100)

  if (params.status) {
    query = query.eq('status', params.status as import('@/lib/db/types').ReservaStatus)
  }

  const { data: reservas } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Reservas</h1>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {['', 'aguardando_sinal', 'confirmada', 'cancelada', 'no_show', 'concluida'].map(
          (status) => (
            <Link
              key={status || 'todos'}
              href={status ? `/admin/reservas?status=${status}` : '/admin/reservas'}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                params.status === status || (!params.status && !status)
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-white/10 text-muted-foreground hover:border-white/30'
              }`}
            >
              {status ? STATUS_BADGE[status]?.label ?? status : 'Todos'}
            </Link>
          ),
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Modalidade</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data e Hora</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Valor</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(reservas ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma reserva encontrada.
                </td>
              </tr>
            )}
            {(reservas ?? []).map((r) => {
              const cliente = r.clientes as { nome: string; telefone: string; email: string | null } | null
              const mod = r.modalidades as { nome: string } | null
              const st = STATUS_BADGE[r.status]
              return (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{cliente?.nome ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{cliente?.telefone}</p>
                  </td>
                  <td className="px-4 py-3 text-white">{mod?.nome ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTimeBr(toBrTime(r.inicio_at))}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white">{formatCentsToBrl(r.total_cents)}</p>
                    <p className="text-xs text-muted-foreground">
                      Sinal: {formatCentsToBrl(r.sinal_cents)}{' '}
                      {r.sinal_pago_at ? '✓' : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={st?.variant ?? 'secondary'}>{st?.label ?? r.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/reservas/${r.id}`}
                      className="text-xs text-brand hover:underline"
                    >
                      Detalhes →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
