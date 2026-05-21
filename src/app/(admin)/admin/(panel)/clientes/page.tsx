import type { Metadata } from 'next'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { formatCentsToBrl, formatDateBr, toBrTime } from '@/lib/dates'

export const metadata: Metadata = {
  title: 'Clientes — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type ClienteRow = {
  id: string
  nome: string
  telefone: string
  email: string | null
  created_at: string
  reservas: Array<{ total_cents: number; status: string }>
}

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const params = await searchParams
  const db = createSupabaseServiceClient()

  const { data } = await db
    .from('clientes')
    .select(`
      id, nome, telefone, email, created_at,
      reservas!cliente_organizador_id ( total_cents, status )
    `)
    .order('created_at', { ascending: false })
    .limit(200)
  const clientes = (data ?? []) as unknown as ClienteRow[]

  const filtrado = params.q
    ? clientes.filter(
        (c) =>
          c.nome.toLowerCase().includes(params.q!.toLowerCase()) ||
          c.telefone.includes(params.q!),
      )
    : clientes

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Clientes</h1>
        <span className="text-sm text-muted-foreground">{filtrado.length} registros</span>
      </div>

      {/* Busca */}
      <form method="GET" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          placeholder="Buscar por nome ou telefone..."
          className="w-full max-w-sm rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white/20 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-muted-foreground hover:border-white/20 hover:text-white"
        >
          Buscar
        </button>
      </form>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-card">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contato</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reservas</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ticket Médio</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {filtrado.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {filtrado.map((c) => {
              const reservasConfirmadas = c.reservas.filter((r) =>
                ['confirmada', 'concluida'].includes(r.status),
              )
              const totalGasto = reservasConfirmadas.reduce((s, r) => s + r.total_cents, 0)
              const ticketMedio =
                reservasConfirmadas.length > 0
                  ? Math.round(totalGasto / reservasConfirmadas.length)
                  : 0

              return (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{c.nome}</p>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`https://wa.me/55${c.telefone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-muted-foreground hover:text-brand"
                    >
                      {c.telefone}
                    </a>
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="block text-xs text-muted-foreground/70 hover:text-brand"
                      >
                        {c.email}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white">{c.reservas.length}</td>
                  <td className="px-4 py-3 text-white">
                    {ticketMedio > 0 ? formatCentsToBrl(ticketMedio) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateBr(toBrTime(c.created_at))}
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
