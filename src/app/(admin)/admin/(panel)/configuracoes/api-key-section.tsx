'use client'

import { useState } from 'react'
import { Sparkles, Eye, EyeOff, CheckCircle2, AlertCircle, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { salvarAnthropicKey, removerAnthropicKey } from './actions'

export function ApiKeySection({ hasKey, keyFromEnv }: { hasKey: boolean; keyFromEnv: boolean }) {
  const [showing, setShowing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [saved, setSaved] = useState(hasKey)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(formData: FormData) {
    setError(null)
    setSaving(true)
    try {
      await salvarAnthropicKey(formData)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemover() {
    if (!confirm('Remover a API Key? O botão de gerar posts com IA deixará de funcionar.')) return
    setRemoving(true)
    try {
      await removerAnthropicKey()
      setSaved(false)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10">
          <Sparkles className="size-5 text-brand" />
        </div>
        <div>
          <h2 className="font-bold text-white">API da Inteligência Artificial</h2>
          <p className="text-xs text-white/40">Necessária para gerar sugestões de posts no Blog com IA</p>
        </div>
        {(saved || keyFromEnv) ? (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
            <CheckCircle2 className="size-3.5" />
            Configurada
          </span>
        ) : (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
            <AlertCircle className="size-3.5" />
            Não configurada
          </span>
        )}
      </div>

      {keyFromEnv ? (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
          <CheckCircle2 className="size-4 shrink-0" />
          Chave configurada via variável de ambiente pelo desenvolvedor.
        </div>
      ) : (
        <>
          {saved ? (
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-green-400" />
                <code className="text-sm text-white/70">
                  sk-ant-••••••••••••••••••••••••••••••••
                </code>
              </div>
              <button
                onClick={handleRemover}
                disabled={removing}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400/60 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                {removing ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                Remover
              </button>
            </div>
          ) : (
            <form action={handleSave} className="space-y-3">
              <div className="relative">
                <input
                  name="api_key"
                  type={showing ? 'text' : 'password'}
                  placeholder="sk-ant-api03-..."
                  autoComplete="off"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 pr-10 text-sm text-white placeholder:text-white/20 focus:border-brand/40 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowing((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                >
                  {showing ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="size-3.5" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Salvar chave
              </button>
            </form>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/3 p-4 text-xs text-white/30">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <div className="space-y-1">
              <p>Para obter a API Key:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Acesse <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-brand/60 hover:text-brand inline-flex items-center gap-0.5">console.anthropic.com <ExternalLink className="size-3" /></a></li>
                <li>Crie uma conta (gratuito) e compre $5 em créditos (dura meses)</li>
                <li>Vá em &quot;API Keys&quot; → &quot;Create Key&quot; e cole aqui</li>
              </ol>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
