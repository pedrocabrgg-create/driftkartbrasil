import type { Metadata } from 'next'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { formatCentsToBrl } from '@/lib/dates'
import { Badge } from '@/components/ui/badge'
import { toggleModalidadeAtiva, salvarModalidade } from './actions'

export const metadata: Metadata = {
  title: 'Modalidades — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function ModalidadesPage() {
  const db = createSupabaseServiceClient()
  const { data: modalidades } = await db
    .from('modalidades')
    .select('*')
    .order('duracao_min')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">Modalidades</h1>

      {/* Lista */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(modalidades ?? []).map((m) => {
          const ativarAction = toggleModalidadeAtiva.bind(null, m.id, !m.ativa)
          const editarAction = salvarModalidade.bind(null)
          return (
            <div key={m.id} className="rounded-xl border border-white/10 bg-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-white">{m.nome}</p>
                  <p className="text-xs text-muted-foreground">{m.duracao_min} min</p>
                </div>
                <Badge variant={m.ativa ? 'default' : 'secondary'}>
                  {m.ativa ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Preço</dt>
                  <dd className="font-medium text-white">{formatCentsToBrl(m.preco_cheio_cents)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Sinal</dt>
                  <dd className="font-medium text-white">{m.sinal_percent}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Capacidade</dt>
                  <dd className="font-medium text-white">{m.capacidade_max} pilotos</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Tipo</dt>
                  <dd className="font-medium text-white">{m.exclusiva ? 'Exclusiva' : 'Aberta'}</dd>
                </div>
              </dl>

              {/* Edição de descrição e destaque (visíveis no site) */}
              <form action={editarAction} className="space-y-2 border-t border-white/10 pt-3">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="nome" value={m.nome} />
                <input type="hidden" name="duracao_min" value={m.duracao_min} />
                <input type="hidden" name="capacidade_max" value={m.capacidade_max} />
                <input type="hidden" name="preco_cheio" value={(m.preco_cheio_cents / 100).toFixed(2)} />
                <input type="hidden" name="sinal_percent" value={m.sinal_percent} />
                <input type="hidden" name="exclusiva" value={String(m.exclusiva)} />
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Descrição (exibida no site)</label>
                  <textarea
                    name="descricao"
                    rows={2}
                    defaultValue={(m as typeof m & { descricao?: string }).descricao ?? ''}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white/20 focus:outline-none resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Badge destaque (ex: MAIS ESCOLHIDO)</label>
                  <input
                    name="destaque"
                    defaultValue={(m as typeof m & { destaque?: string }).destaque ?? ''}
                    placeholder="Deixe em branco para nenhum"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white/20 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg border border-brand/30 px-4 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10 transition-colors"
                >
                  Salvar descrição
                </button>
              </form>

              <form action={ativarAction}>
                <button
                  type="submit"
                  className={`w-full rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
                    m.ativa
                      ? 'border-destructive/30 text-destructive hover:bg-destructive/10'
                      : 'border-brand/30 text-brand hover:bg-brand/10'
                  }`}
                >
                  {m.ativa ? 'Desativar' : 'Ativar'}
                </button>
              </form>
            </div>
          )
        })}
      </div>

      {/* Nova modalidade */}
      <section className="rounded-xl border border-white/10 bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Nova Modalidade</h2>
        <form action={salvarModalidade} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nome</label>
            <input
              name="nome"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white/20 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Duração (min)</label>
            <input
              name="duracao_min"
              type="number"
              min="10"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Capacidade máx.</label>
            <input
              name="capacidade_max"
              type="number"
              min="1"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Preço (R$)</label>
            <input
              name="preco_cheio"
              type="number"
              step="0.01"
              min="0"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">% Sinal</label>
            <input
              name="sinal_percent"
              type="number"
              min="0"
              max="100"
              defaultValue="30"
              required
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Exclusiva?</label>
            <select
              name="exclusiva"
              className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
            >
              <option value="false">Não</option>
              <option value="true">Sim</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-brand px-6 py-2 text-sm font-bold text-black hover:bg-brand/90"
            >
              Criar modalidade
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
