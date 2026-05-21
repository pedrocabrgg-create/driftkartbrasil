import type { Metadata } from 'next'
import Link from 'next/link'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { toBrTime, formatTimeBr, formatCentsToBrl } from '@/lib/dates'
import { Badge } from '@/components/ui/badge'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { addDays, format, parseISO } from 'date-fns'

export const metadata: Metadata = {
  title: 'Calendário — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const TZ = 'America/Sao_Paulo'

const STATUS_BADGE: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  aguardando_sinal: { label: 'Aguardando', variant: 'secondary' },
  confirmada: { label: 'Confirmada', variant: 'default' },
  cancelada: { label: 'Cancelada', variant: 'destructive' },
  no_show: { label: 'No-show', variant: 'destructive' },
  concluida: { label: 'Concluída', variant: 'outline' },
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type ReservaSlot = {
  id: string
  inicio_at: string
  status: string
  pilotos_count: number
  total_cents: number
  modalidades: { nome: string } | null
  clientes: { nome: string } | null
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ semana?: string }>
}) {
  const params = await searchParams

  // Monday of the current SP week
  const nowBr = toZonedTime(new Date(), TZ)
  const dowNow = nowBr.getDay() // 0=Sun … 6=Sat
  const daysToMon = dowNow === 0 ? -6 : 1 - dowNow
  const defaultMonday = new Date(nowBr)
  defaultMonday.setDate(nowBr.getDate() + daysToMon)
  defaultMonday.setHours(0, 0, 0, 0)

  // Parse week param or use default
  let weekStartBr: Date
  if (params.semana && /^\d{4}-\d{2}-\d{2}$/.test(params.semana)) {
    const [y, m, d] = params.semana.split('-').map(Number)
    weekStartBr = new Date(y!, m! - 1, d!, 0, 0, 0)
  } else {
    weekStartBr = defaultMonday
  }

  const weekEndBr = new Date(weekStartBr)
  weekEndBr.setDate(weekStartBr.getDate() + 6)
  weekEndBr.setHours(23, 59, 59, 999)

  const weekStartUTC = fromZonedTime(weekStartBr, TZ)
  const weekEndUTC = fromZonedTime(weekEndBr, TZ)

  const db = createSupabaseServiceClient()
  const { data: reservas } = await db
    .from('reservas')
    .select(`
      id, inicio_at, status, pilotos_count, total_cents,
      modalidades!modalidade_id ( nome ),
      clientes!cliente_organizador_id ( nome )
    `)
    .gte('inicio_at', weekStartUTC.toISOString())
    .lte('inicio_at', weekEndUTC.toISOString())
    .not('status', 'in', '("cancelada","no_show")')
    .order('inicio_at')

  const reservasData = (reservas ?? []) as unknown as ReservaSlot[]

  // Group reservas by SP day (yyyy-MM-dd)
  const byDay = new Map<string, ReservaSlot[]>()
  for (const r of reservasData) {
    const key = format(toZonedTime(parseISO(r.inicio_at), TZ), 'yyyy-MM-dd')
    const arr = byDay.get(key) ?? []
    arr.push(r)
    byDay.set(key, arr)
  }

  // Build array of 7 days Mon→Sun
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStartBr, i))

  const prevWeek = format(addDays(weekStartBr, -7), 'yyyy-MM-dd')
  const nextWeek = format(addDays(weekStartBr, 7), 'yyyy-MM-dd')
  const semanaLabel = `${format(weekStartBr, 'dd/MM')} – ${format(weekEndBr, 'dd/MM/yyyy')}`

  return (
    <div className="space-y-6">
      {/* Header + navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-white">Calendário</h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/calendario?semana=${prevWeek}`}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-muted-foreground hover:border-white/20 hover:text-white"
          >
            ← Anterior
          </Link>
          <span className="text-sm font-medium text-white">{semanaLabel}</span>
          <Link
            href={`/admin/calendario?semana=${nextWeek}`}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-muted-foreground hover:border-white/20 hover:text-white"
          >
            Próxima →
          </Link>
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayReservas = byDay.get(dayKey) ?? []
          const dow = day.getDay()
          const isToday = format(toZonedTime(new Date(), TZ), 'yyyy-MM-dd') === dayKey
          const isWeekend = dow === 0 || dow === 6

          return (
            <div
              key={dayKey}
              className={`min-h-32 rounded-xl border p-2 ${
                isToday ? 'border-brand/40 bg-brand/5' : 'border-white/10 bg-card'
              }`}
            >
              {/* Day header */}
              <div className="mb-2 text-center">
                <p
                  className={`text-xs font-medium ${isWeekend ? 'text-brand' : 'text-muted-foreground'}`}
                >
                  {DIAS_SEMANA[dow] ?? ''}
                </p>
                <p className={`text-lg font-black ${isToday ? 'text-brand' : 'text-white'}`}>
                  {format(day, 'd')}
                </p>
              </div>

              {/* Sessions */}
              <div className="space-y-1.5">
                {dayReservas.map((r) => {
                  const st = STATUS_BADGE[r.status]
                  const mod = r.modalidades as { nome: string } | null
                  const cli = r.clientes as { nome: string } | null
                  return (
                    <Link
                      key={r.id}
                      href={`/admin/reservas/${r.id}`}
                      className="block rounded-lg border border-white/10 bg-white/5 p-1.5 hover:border-white/20"
                    >
                      <p className="font-mono text-xs font-semibold text-brand">
                        {formatTimeBr(toBrTime(r.inicio_at))}
                      </p>
                      <p className="truncate text-xs text-white">{mod?.nome ?? '—'}</p>
                      <p className="truncate text-xs text-muted-foreground">{cli?.nome ?? '—'}</p>
                      <div className="mt-1 flex items-center justify-between gap-1">
                        <span className="text-xs text-muted-foreground">
                          {r.pilotos_count}p · {formatCentsToBrl(r.total_cents)}
                        </span>
                        <Badge variant={st?.variant ?? 'secondary'} className="px-1 py-0 text-[10px]">
                          {st?.label ?? r.status}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
                {dayReservas.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground/50">—</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Weekly summary */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span>
          Total:{' '}
          <strong className="text-white">{reservasData.length} sessões</strong>
        </span>
        <span>
          Pilotos:{' '}
          <strong className="text-white">
            {reservasData.reduce((s, r) => s + r.pilotos_count, 0)}
          </strong>
        </span>
        <span>
          Receita prevista:{' '}
          <strong className="text-brand">
            {formatCentsToBrl(reservasData.reduce((s, r) => s + r.total_cents, 0))}
          </strong>
        </span>
      </div>
    </div>
  )
}
