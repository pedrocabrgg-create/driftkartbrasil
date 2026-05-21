import type { Metadata } from 'next'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { Badge } from '@/components/ui/badge'
import { toggleKartAtivo, atualizarKart } from './actions'

export const metadata: Metadata = {
  title: 'Karts — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function KartsPage() {
  const db = createSupabaseServiceClient()
  const { data: karts } = await db.from('karts').select('*').order('id')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Karts</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(karts ?? []).map((k) => {
          const toggleAction = toggleKartAtivo.bind(null, k.id, !k.ativo)
          return (
            <div key={k.id} className="rounded-xl border border-white/10 bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-4xl font-black text-white">#{k.id}</p>
                <Badge variant={k.ativo ? 'default' : 'secondary'}>
                  {k.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <form action={atualizarKart} className="space-y-3">
                <input type="hidden" name="id" value={k.id} />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Apelido</label>
                  <input
                    name="apelido"
                    defaultValue={k.apelido ?? ''}
                    placeholder="ex: Relâmpago"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white/20 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Observação</label>
                  <input
                    name="observacao"
                    defaultValue={k.observacao ?? ''}
                    placeholder="ex: Amortecedor trocado"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white/20 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-muted-foreground hover:border-white/20 hover:text-white"
                >
                  Salvar
                </button>
              </form>

              <form action={toggleAction}>
                <button
                  type="submit"
                  className={`w-full rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                    k.ativo
                      ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                      : 'border-brand/30 text-brand hover:bg-brand/10'
                  }`}
                >
                  {k.ativo ? 'Desativar' : 'Ativar'}
                </button>
              </form>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Karts inativos não recebem novas alocações. Alocações existentes não são afetadas.
      </p>
    </div>
  )
}
