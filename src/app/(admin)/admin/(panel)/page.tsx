import type { Metadata } from 'next'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { formatCentsToBrl, formatDateBr, toBrTime } from '@/lib/dates'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'Dashboard — Admin',
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

export default async function AdminDashboard() {
  const db = createSupabaseServiceClient()
  const agora = new Date()
  const inicioHoje = new Date(agora)
  inicioHoje.setHours(0, 0, 0, 0)
  const fimHoje = new Date(agora)
  fimHoje.setHours(23, 59, 59, 999)

  const inicioSemana = new Date(agora)
  inicioSemana.setDate(agora.getDate() - agora.getDay())
  inicioSemana.setHours(0, 0, 0, 0)

  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)

  const [
    { data: sessoesHoje },
    { data: leadsNovos },
    { data: receitaMes },
    { data: receitaSemana },
    { data: receitaHoje },
    { data: reservasPendentes },
  ] = await Promise.all([
    db
      .from('reservas')
      .select('id, inicio_at, status, pilotos_count, modalidades!modalidade_id(nome)')
      .gte('inicio_at', inicioHoje.toISOString())
      .lte('inicio_at', fimHoje.toISOString())
      .in('status', ['confirmada', 'aguardando_sinal'])
      .order('inicio_at'),
    db.from('leads').select('id').eq('status', 'novo'),
    db
      .from('reservas')
      .select('total_cents')
      .in('status', ['confirmada', 'concluida'])
      .gte('created_at', inicioMes.toISOString()),
    db
      .from('reservas')
      .select('total_cents')
      .in('status', ['confirmada', 'concluida'])
      .gte('created_at', inicioSemana.toISOString()),
    db
      .from('reservas')
      .select('total_cents')
      .in('status', ['confirmada', 'concluida'])
      .gte('created_at', inicioHoje.toISOString()),
    db
      .from('reservas')
      .select('id, inicio_at, status, pilotos_count, clientes!cliente_organizador_id(nome), modalidades!modalidade_id(nome)')
      .eq('status', 'aguardando_sinal')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalMes = (receitaMes ?? []).reduce((s, r) => s + r.total_cents, 0)
  const totalSemana = (receitaSemana ?? []).reduce((s, r) => s + r.total_cents, 0)
  const totalHoje = (receitaHoje ?? []).reduce((s, r) => s + r.total_cents, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{formatDateBr(agora)}</p>
      </div>

      {/* Cards de receita */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Receita Hoje" value={formatCentsToBrl(totalHoje)} />
        <StatCard label="Receita Semana" value={formatCentsToBrl(totalSemana)} />
        <StatCard label="Receita Mês" value={formatCentsToBrl(totalMes)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Sessões Hoje"
          value={String(sessoesHoje?.length ?? 0)}
          small
        />
        <StatCard
          label="Leads Novos"
          value={String(leadsNovos?.length ?? 0)}
          small
          href="/admin/leads"
        />
      </div>

      {/* Sessões de hoje */}
      <section>
        <h2 className="mb-4 font-semibold text-white">Sessões de Hoje</h2>
        {(!sessoesHoje || sessoesHoje.length === 0) ? (
          <p className="text-sm text-muted-foreground">Nenhuma sessão agendada para hoje.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-card">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Horário</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Modalidade</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pilotos</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {sessoesHoje.map((s) => {
                  const mod = s.modalidades as { nome: string } | null
                  const st = STATUS_BADGE[s.status]
                  return (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="px-4 py-3 font-mono text-white">
                        {toBrTime(s.inicio_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-white">{mod?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-white">{s.pilotos_count}</td>
                      <td className="px-4 py-3">
                        <Badge variant={st?.variant ?? 'secondary'}>{st?.label ?? s.status}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Reservas aguardando sinal */}
      <section>
        <h2 className="mb-4 font-semibold text-white">Aguardando Confirmação do Sinal</h2>
        {(!reservasPendentes || reservasPendentes.length === 0) ? (
          <p className="text-sm text-muted-foreground">Nenhuma reserva aguardando sinal.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-card">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Modalidade</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reservasPendentes.map((r) => {
                  const cliente = r.clientes as { nome: string } | null
                  const mod = r.modalidades as { nome: string } | null
                  return (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-white">{cliente?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-white">{mod?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateBr(toBrTime(r.inicio_at))}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/admin/reservas/${r.id}`}
                          className="text-xs text-brand hover:underline"
                        >
                          Ver reserva →
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  small = false,
  href,
}: {
  label: string
  value: string
  small?: boolean
  href?: string
}) {
  const content = (
    <div className="rounded-xl border border-white/10 bg-card p-5">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={`font-black text-white ${small ? 'text-3xl' : 'text-4xl'}`}>{value}</p>
    </div>
  )

  return href ? <a href={href}>{content}</a> : content
}
