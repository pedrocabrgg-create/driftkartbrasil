import type { Metadata } from 'next'
import { createSupabaseServiceClient } from '@/lib/db/server'
import { DominioSection } from './dominio-section'
import { ApiKeySection } from './api-key-section'
import { AjudaSection } from './ajuda-section'
import { atualizarConfiguracao } from './actions'

export const metadata: Metadata = {
  title: 'Configurações — Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const SYSTEM_CONFIG: Record<string, { label: string; desc: string; type: 'number' | 'text' | 'boolean' }> = {
  altura_min_cm:          { label: 'Altura mínima (cm)',             desc: 'Altura mínima para pilotar.',                                    type: 'number' },
  buffer_entre_sessoes:   { label: 'Buffer entre sessões (min)',      desc: 'Intervalo mínimo entre fim e início de sessões.',                 type: 'number' },
  granularidade_slot:     { label: 'Granularidade de slots (min)',    desc: 'Intervalos para geração de horários disponíveis.',               type: 'number' },
  sinal_pct:              { label: 'Percentual do sinal (%)',         desc: 'Percentual do total cobrado como sinal.',                        type: 'number' },
  sinal_reembolsavel:     { label: 'Sinal reembolsável?',            desc: 'Define se o sinal pode ser devolvido ao cancelar.',              type: 'boolean' },
  ttl_aguardando_sinal:   { label: 'TTL aguardando sinal (min)',      desc: 'Minutos até reserva aguardando sinal ser cancelada.',            type: 'number' },
}

// Chaves que ficam em outras seções (não mostrar na tabela de sistema)
const HIDDEN_KEYS = new Set(['anthropic_api_key', 'dominio_proprio'])

export default async function ConfiguracoesPage() {
  const db = createSupabaseServiceClient()
  const { data: configs } = await db.from('configuracoes').select('*').order('chave')

  const domainRow  = configs?.find((c) => c.chave === 'dominio_proprio')
  const apiKeyRow  = configs?.find((c) => c.chave === 'anthropic_api_key')
  const keyFromEnv = !!process.env.ANTHROPIC_API_KEY
  const hasKey     = keyFromEnv || !!apiKeyRow?.valor

  const systemConfigs = (configs ?? []).filter((c) => !HIDDEN_KEYS.has(c.chave))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Domínio, inteligência artificial e guia de uso do painel.
        </p>
      </div>

      {/* ── Domínio Próprio ── */}
      <DominioSection savedDomain={domainRow?.valor ?? null} />

      {/* ── API Key da IA ── */}
      <ApiKeySection hasKey={hasKey} keyFromEnv={keyFromEnv} />

      {/* ── Guia de Uso ── */}
      <AjudaSection />

      {/* ── Configurações do sistema (técnicas) ── */}
      {systemConfigs.length > 0 && (
        <div className="space-y-3">
          <div className="border-t border-white/5 pt-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-white/30">
              Configurações do Sistema
            </h2>
            <p className="mt-1 text-xs text-white/20">Parâmetros técnicos do sistema de reservas.</p>
          </div>

          {systemConfigs.map((cfg) => {
            const meta = SYSTEM_CONFIG[cfg.chave]
            const saveAction = atualizarConfiguracao.bind(null, cfg.chave)
            return (
              <div key={cfg.chave} className="rounded-xl border border-white/8 bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{meta?.label ?? cfg.chave}</p>
                    {meta?.desc && <p className="text-xs text-muted-foreground">{meta.desc}</p>}
                  </div>
                  <form action={saveAction} className="flex items-center gap-2">
                    {meta?.type === 'boolean' ? (
                      <select
                        name="valor"
                        defaultValue={cfg.valor}
                        className="rounded-lg border border-white/10 bg-card px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
                      >
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                      </select>
                    ) : (
                      <input
                        name="valor"
                        type={meta?.type ?? 'text'}
                        defaultValue={cfg.valor}
                        className="w-28 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
                      />
                    )}
                    <button
                      type="submit"
                      className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-black hover:bg-brand/90"
                    >
                      Salvar
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
