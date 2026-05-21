import type { Metadata } from 'next'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { formatDateBr } from '@/lib/dates'
import { Badge } from '@/components/ui/badge'
import { atualizarStatusLead } from './actions'
import type { LeadStatus } from '@/lib/db/types'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Leads — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<
  LeadStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  novo: { label: 'Novo', variant: 'default' },
  em_contato: { label: 'Em Contato', variant: 'secondary' },
  convertido: { label: 'Convertido', variant: 'outline' },
  perdido: { label: 'Perdido', variant: 'destructive' },
}

const TIPO_LABEL: Record<string, string> = {
  aula: 'Aula',
  aniversario: 'Aniversário',
  corporativo: 'Corporativo',
}

const NEXT_STATUS: Record<LeadStatus, LeadStatus | null> = {
  novo: 'em_contato',
  em_contato: 'convertido',
  convertido: null,
  perdido: null,
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const params = await searchParams
  const db = createSupabaseServiceClient()

  let query = db
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (params.status) {
    query = query.eq('status', params.status as LeadStatus)
  }

  const { data: leads } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Leads</h1>
        <span className="text-sm text-muted-foreground">{(leads ?? []).length} registros</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {(['', 'novo', 'em_contato', 'convertido', 'perdido'] satisfies Array<LeadStatus | ''>).map(
          (s) => (
            <Link
              key={s || 'todos'}
              href={s ? `/admin/leads?status=${s}` : '/admin/leads'}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                params.status === s || (!params.status && !s)
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-white/10 text-muted-foreground hover:border-white/30'
              }`}
            >
              {s ? (STATUS_BADGE[s as LeadStatus]?.label ?? s) : 'Todos'}
            </Link>
          ),
        )}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tipo</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contato</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Data Desejada</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
            {(leads ?? []).map((lead) => {
              const st = STATUS_BADGE[lead.status as LeadStatus]
              const nextStatus = NEXT_STATUS[lead.status as LeadStatus]

              const avancarAction = nextStatus
                ? atualizarStatusLead.bind(null, lead.id, nextStatus)
                : null
              const perderAction =
                lead.status !== 'convertido' && lead.status !== 'perdido'
                  ? atualizarStatusLead.bind(null, lead.id, 'perdido' as LeadStatus)
                  : null

              return (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{lead.nome}</p>
                    {lead.mensagem && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                        {lead.mensagem}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {TIPO_LABEL[lead.tipo] ?? lead.tipo}
                  </td>
                  <td className="px-4 py-3">
                    {lead.telefone && (
                      <a
                        href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-muted-foreground hover:text-brand"
                      >
                        {lead.telefone}
                      </a>
                    )}
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="block text-xs text-muted-foreground/70 hover:text-brand"
                      >
                        {lead.email}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {lead.data_desejada ? formatDateBr(lead.data_desejada) : '—'}
                    {lead.participantes && (
                      <span className="ml-1 text-xs">({lead.participantes} pax)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={st?.variant ?? 'secondary'}>{st?.label ?? lead.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {avancarAction && (
                        <form action={avancarAction}>
                          <button
                            type="submit"
                            className="rounded border border-brand/30 px-2 py-1 text-xs text-brand hover:bg-brand/10"
                          >
                            {nextStatus === 'em_contato' ? 'Contatar' : 'Converter'}
                          </button>
                        </form>
                      )}
                      {perderAction && (
                        <form action={perderAction}>
                          <button
                            type="submit"
                            className="rounded border border-white/10 px-2 py-1 text-xs text-muted-foreground hover:border-destructive/30 hover:text-destructive"
                          >
                            Perder
                          </button>
                        </form>
                      )}
                    </div>
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
